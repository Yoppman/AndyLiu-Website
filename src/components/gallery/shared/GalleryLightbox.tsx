import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from 'motion/react';
import { PLACEHOLDER_ONLY, cldFull, cldPlaceholder, aspectOf, Photo } from './cloudinaryUtils';
import FilmFrameLoader from './FilmFrameLoader';

interface Props {
  photos: Photo[];
  title: string;
  lightboxIdx: number | null;
  setLightboxIdx: (idx: number | null) => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Pull "r, g, b" out of a stored dominantColor (e.g. "rgba(196,203,193,0.6)"). */
const rgbOf = (rgba: string): string => {
  const m = rgba.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  return m ? `${m[1]}, ${m[2]}, ${m[3]}` : '255, 255, 255';
};

// A snappy-but-soft settle, tuned to feel like the macOS Photos page turn.
const SPRING = { type: 'spring', stiffness: 680, damping: 52, restDelta: 0.4 } as const;

const GalleryLightbox: React.FC<Props> = ({ photos, title, lightboxIdx, setLightboxIdx }) => {
  if (lightboxIdx === null) return null;
  return (
    <GalleryCarousel
      key={lightboxIdx}
      photos={photos}
      title={title}
      startIdx={lightboxIdx}
      onClose={() => setLightboxIdx(null)}
    />
  );
};

const GalleryCarousel: React.FC<{
  photos: Photo[];
  title: string;
  startIdx: number;
  onClose: () => void;
}> = ({ photos, title, startIdx, onClose }) => {
  const n = photos.length;
  const [cur, setCur] = useState(startIdx);
  const [decoded, setDecoded] = useState<Set<number>>(() => new Set());

  // ── Viewport ───────────────────────────────────────────────────────────
  const [vp, setVp] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Photos sit a touch inside the viewport so every frame leaves room for the
  // neighbour's edge to peek — including full-width horizontals.
  const SLOT_W = vp.w * 0.84;
  const SLOT_H = vp.h * 0.82;
  const GAP = Math.max(14, vp.w * 0.018);

  const sizeOf = useCallback(
    (i: number) => {
      const a = aspectOf(photos[i]); // width / height
      const w = Math.min(SLOT_W, SLOT_H * a);
      return { w, h: w / a };
    },
    [photos, SLOT_W, SLOT_H],
  );

  // ── Absolute carousel axis ────────────────────────────────────────────
  // Every photo gets a fixed centre coordinate C[i] (normalised so the photo
  // we opened on sits at 0). The track is translated by trackX; a photo is
  // centred when trackX === -C[i]. Because positions are absolute, committing to
  // a new index
  // never needs a coordinate "reframe" — so neighbours never jump on snap.
  const C = useMemo(() => {
    const arr = new Array<number>(n).fill(0);
    for (let i = 1; i < n; i++) {
      arr[i] = arr[i - 1] + sizeOf(i - 1).w / 2 + sizeOf(i).w / 2 + GAP;
    }
    const base = arr[startIdx] ?? 0;
    for (let i = 0; i < n; i++) arr[i] -= base;
    return arr;
  }, [n, sizeOf, GAP, startIdx]);

  const trackX = useMotionValue(0);
  // Re-centre on the current photo after a resize (not on navigation — that is
  // driven by the animation below).
  useEffect(() => {
    trackX.set(-C[cur]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vp.w, vp.h]);

  const restX = -C[cur];

  // ── Dimming: neighbours sit darkened, brightening to full as they centre ─
  const refDist =
    (C[Math.min(cur + 1, n - 1)] - C[cur]) || (C[cur] - C[Math.max(cur - 1, 0)]) || vp.w;
  const dimAt = (j: number, x: number) => {
    if (j < 0 || j >= n) return 0;
    return clamp(Math.abs(C[j] + x) / (refDist || vp.w), 0, 1) * 0.5;
  };
  const dimPrev = useTransform(trackX, (x) => dimAt(cur - 1, x));
  const dimCur = useTransform(trackX, (x) => dimAt(cur, x));
  const dimNext = useTransform(trackX, (x) => dimAt(cur + 1, x));
  const dims = [dimPrev, dimCur, dimNext];

  // ── Source + predictive warming ───────────────────────────────────────
  const targetW = useMemo(() => {
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
    return Math.min(1800, Math.max(800, Math.round((vp.w * dpr) / 200) * 200));
  }, [vp.w]);
  const srcOf = useCallback(
    (i: number) =>
      PLACEHOLDER_ONLY ? cldPlaceholder(photos[i].src) : cldFull(photos[i].src, targetW),
    [photos, targetW],
  );

  const markDecoded = useCallback((i: number) => {
    setDecoded((prev) => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  }, []);

  const warmedRef = useRef<Set<string>>(new Set());
  const warm = useCallback(
    (i: number) => {
      if (i < 0 || i >= n || PLACEHOLDER_ONLY) return;
      const url = srcOf(i);
      if (warmedRef.current.has(url)) return;
      warmedRef.current.add(url);
      const img = new Image();
      img.decoding = 'async';
      (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = 'high';
      img.src = url;
      img.decode?.().then(() => markDecoded(i)).catch(() => {});
    },
    [n, srcOf, markDecoded],
  );
  // Warm a neighbourhood, nearest first, so the frames most likely to be swiped
  // to are already decoding (at high priority) before a gesture even commits.
  const warmRange = useCallback(
    (center: number, radius: number) => {
      warm(center);
      for (let r = 1; r <= radius; r++) {
        warm(center + r);
        warm(center - r);
      }
    },
    [warm],
  );

  // Warm the current frame + its neighbourhood whenever the index settles.
  useEffect(() => {
    warmRange(cur, 2);
  }, [cur, warmRange]);

  // ── Navigation ────────────────────────────────────────────────────────
  const animRef = useRef<ReturnType<typeof animate> | null>(null);
  const stopAnim = () => {
    animRef.current?.stop();
    animRef.current = null;
  };
  const goTo = useCallback(
    (target: number) => {
      const t = clamp(target, 0, n - 1);
      stopAnim();
      if (t !== cur) {
        setCur(t);
        warmRange(t, 3); // landed — push the lookahead three deep both ways
      }
      animRef.current = animate(trackX, -C[t], SPRING);
    },
    [cur, n, C, trackX, warmRange],
  );

  // ── Drag resistance ───────────────────────────────────────────────────
  // Allow the track to be pulled at most one neighbour in either direction
  // (further pulls, and pulls past the first/last frame, rubber-band).
  const clampDelta = useCallback(
    (delta: number) => {
      const maxRight = cur > 0 ? C[cur] - C[cur - 1] : 0; // pulling right reveals the previous
      const maxLeft = cur < n - 1 ? -(C[cur + 1] - C[cur]) : 0; // pulling left reveals the next
      if (delta > maxRight) return maxRight + (delta - maxRight) * 0.16;
      if (delta < maxLeft) return maxLeft + (delta - maxLeft) * 0.16;
      return delta;
    },
    [cur, n, C],
  );

  // ── Velocity sampling (shared by pointer + wheel) ─────────────────────
  const samplesRef = useRef<{ t: number; x: number }[]>([]);
  const pushSample = (x: number) => {
    const s = samplesRef.current;
    s.push({ t: performance.now(), x });
    while (s.length > 6) s.shift();
  };
  const velocity = () => {
    const s = samplesRef.current;
    if (s.length < 2) return 0;
    const a = s[0];
    const b = s[s.length - 1];
    const dt = (b.t - a.t) / 1000;
    return dt > 0 ? (b.x - a.x) / dt : 0;
  };

  const settle = useCallback(() => {
    const delta = trackX.get() - restX;
    const v = velocity();
    const towardNext = delta < 0;
    const ref = towardNext
      ? C[Math.min(cur + 1, n - 1)] - C[cur]
      : C[cur] - C[Math.max(cur - 1, 0)];
    const passed = Math.abs(delta) > (ref || vp.w) * 0.22;
    const flick = towardNext ? v < -480 : v > 480;
    let d = 0;
    if (passed || flick) d = towardNext ? 1 : -1;
    if (d === 1 && cur >= n - 1) d = 0;
    if (d === -1 && cur <= 0) d = 0;
    goTo(cur + d);
  }, [trackX, restX, C, cur, n, vp.w, goTo]);

  // ── Pointer drag (touch + mouse) ──────────────────────────────────────
  const draggingRef = useRef(false);
  const movedRef = useRef(0);
  const startClientXRef = useRef(0);
  const baseDeltaRef = useRef(0);
  const downOnBackdropRef = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    stopAnim();
    draggingRef.current = true;
    movedRef.current = 0;
    startClientXRef.current = e.clientX;
    baseDeltaRef.current = trackX.get() - restX;
    downOnBackdropRef.current = (e.target as HTMLElement)?.dataset?.backdrop === '1';
    samplesRef.current = [];
    pushSample(baseDeltaRef.current);
    warmRange(cur, 2); // touch down = intent: both neighbours, two deep, now
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const raw = e.clientX - startClientXRef.current;
    movedRef.current = Math.max(movedRef.current, Math.abs(raw));
    const delta = clampDelta(baseDeltaRef.current + raw);
    trackX.set(restX + delta);
    pushSample(delta);
    // The instant a direction shows, race the next two frames that way in.
    if (raw < -8) {
      warm(cur + 2);
      warm(cur + 3);
    } else if (raw > 8) {
      warm(cur - 2);
      warm(cur - 3);
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (movedRef.current < 6) {
      if (downOnBackdropRef.current) onClose();
      return;
    }
    settle();
  };

  // ── Trackpad two-finger swipe (arrives as horizontal wheel) ───────────
  const rootRef = useRef<HTMLDivElement>(null);
  const wheelActiveRef = useRef(false);
  const wheelDeltaRef = useRef(0);
  const wheelTimerRef = useRef<number | null>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return; // let vertical intent pass
      e.preventDefault(); // own the gesture; block browser back/forward swipe
      if (!wheelActiveRef.current) {
        wheelActiveRef.current = true;
        stopAnim();
        wheelDeltaRef.current = trackX.get() - restX;
        samplesRef.current = [];
        pushSample(wheelDeltaRef.current);
        warmRange(cur, 2);
      }
      wheelDeltaRef.current = clampDelta(wheelDeltaRef.current - e.deltaX);
      trackX.set(restX + wheelDeltaRef.current);
      pushSample(wheelDeltaRef.current);
      if (wheelDeltaRef.current < -8) {
        warm(cur + 2);
        warm(cur + 3);
      } else if (wheelDeltaRef.current > 8) {
        warm(cur - 2);
        warm(cur - 3);
      }
      if (wheelTimerRef.current) window.clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = window.setTimeout(() => {
        wheelActiveRef.current = false;
        settle();
      }, 90);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [cur, C, restX, trackX, clampDelta, settle, warm, warmRange]);

  // ── Keyboard + scroll lock ────────────────────────────────────────────
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goTo(cur + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo(cur - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      if (wheelTimerRef.current) window.clearTimeout(wheelTimerRef.current);
    };
  }, [cur, goTo]);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        ref={rootRef}
        data-backdrop="1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 select-none touch-none overflow-hidden bg-black/95 cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Ambient glow — the current photograph softly lights the dark room.
            Crossfades gently as you move between frames. */}
        <AnimatePresence>
          <motion.div
            key={cur}
            aria-hidden
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{
              background: `radial-gradient(110% 95% at 50% 46%, rgba(${rgbOf(
                photos[cur].dominantColor,
              )}, 0.26) 0%, rgba(${rgbOf(photos[cur].dominantColor)}, 0.08) 50%, transparent 80%)`,
            }}
          />
        </AnimatePresence>

        {/* the sliding track of frames */}
        <motion.div className="absolute left-1/2 top-0 h-full" style={{ x: trackX }}>
          {[-1, 0, 1].map((role) => {
            const j = cur + role;
            if (j < 0 || j >= n) return null;
            const { w, h } = sizeOf(j);
            const isDecoded = decoded.has(j) || PLACEHOLDER_ONLY;
            return (
              <div
                key={photos[j].src}
                className="absolute top-1/2"
                style={{ transform: `translate(calc(-50% + ${C[j]}px), -50%)`, width: w, height: h }}
              >
                <div
                  className="relative h-full w-full overflow-hidden shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
                  style={{ backgroundColor: photos[j].dominantColor }}
                >
                  {!PLACEHOLDER_ONLY && !decoded.has(j) && (
                    <FilmFrameLoader color={photos[j].dominantColor} />
                  )}
                  <img
                    src={srcOf(j)}
                    alt={`${title} — frame ${j + 1}`}
                    draggable={false}
                    onLoad={() => markDecoded(j)}
                    onPointerDown={(e) => e.preventDefault()}
                    className={`h-full w-full object-cover ${PLACEHOLDER_ONLY ? 'blur-lg' : ''}`}
                    style={{ opacity: isDecoded ? 1 : 0, transition: 'opacity 0.45s ease' }}
                  />
                  <motion.div
                    className="pointer-events-none absolute inset-0 bg-black"
                    style={{ opacity: dims[role + 1] }}
                  />
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* close */}
        <button
          onClick={onClose}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Close"
          className="absolute right-6 top-6 z-20 text-white/60 transition-colors hover:text-white"
        >
          <X size={30} />
        </button>

        {/* arrows — kept, but quieter (they fade up on hover) */}
        {cur > 0 && (
          <button
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation();
              goTo(cur - 1);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 text-white/25 transition-colors hover:text-white/80 md:left-6"
          >
            <ChevronLeft size={42} />
          </button>
        )}
        {cur < n - 1 && (
          <button
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation();
              goTo(cur + 1);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 text-white/25 transition-colors hover:text-white/80 md:right-6"
          >
            <ChevronRight size={42} />
          </button>
        )}

        {/* counter */}
        <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 font-cormorant text-sm tracking-[0.3em] text-white/50">
          {cur + 1} / {n}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GalleryLightbox;
