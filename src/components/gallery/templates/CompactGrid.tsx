import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, BookOpen } from 'lucide-react';
import { cldFull, cldSet, aspectOf } from '../shared/cloudinaryUtils';
import { packRows } from '../shared/packRows';
import { useGridZoom } from '../shared/useGridZoom';
import type { GalleryTemplateProps } from '../templateConfig';

// Cache-friendly width ladder; `sizes`/`srcSet` pick within it.
const WIDTHS = [200, 400, 600, 900, 1300];
const nearestWidth = (w: number) => WIDTHS.find((x) => x >= w) ?? WIDTHS[WIDTHS.length - 1];

/** Track the live pixel width of an element. */
function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

interface CompactGridProps extends GalleryTemplateProps {
  /** Text colour chosen for contrast against the dynamic bg. */
  storyColor?: string;
  /** The page's dynamic background colour — used to back the sticky bar. */
  bgColor?: string;
  /** Switch back to Story mode. */
  onExit: () => void;
}

/**
 * Compact mode — a gapless, justified-rows grid of the whole collection. No
 * crops, no captions. Zoom changes the row height: buttons/keyboard step the
 * ladder; pinch (touch) and trackpad pinch (ctrl+wheel) scale continuously and
 * snap on release, anchored on the pinch point. Tapping a photo opens the shared
 * lightbox at that index.
 */
const CompactGrid: React.FC<CompactGridProps> = ({
  photos,
  title,
  onPhotoClick,
  imgRefs,
  storyColor,
  bgColor,
  onExit,
}) => {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const { targetH, minHeight, maxHeight, canZoomIn, canZoomOut, zoomIn, zoomOut, nearestHeight, setHeight } =
    useGridZoom();

  const aspects = useMemo(() => photos.map((p) => aspectOf(p)), [photos]);
  const rows = useMemo(() => packRows(aspects, width, targetH), [aspects, width, targetH]);
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  // Keep the latest committed height available to the imperative gesture code.
  const targetHRef = useRef(targetH);
  targetHRef.current = targetH;

  // Set after a pinch commits; applied (scroll + transform reset) in a layout
  // effect once the new row height has re-packed.
  const pendingScrollRef = useRef<number | null>(null);
  // Timestamp of the last pinch end, to suppress the click it would otherwise fire.
  const lastPinchEndRef = useRef(0);

  // Keyboard zoom.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomOut();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomIn, zoomOut]);

  // ── Pinch: touch + trackpad (ctrl+wheel) ──────────────────────────────────
  // During the gesture we scale the grid with a transform (cheap, 60fps), origin
  // at the pinch point so it stays put. On release we map the accumulated scale
  // to the nearest ladder height, briefly animate to it, then re-pack and correct
  // scroll so the focal point holds.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let active = false;
    let startDist = 0;
    let origin = { x: 0, y: 0 }; // focal in the grid's own coords
    let scrollYStart = 0;
    let gridDocTop = 0; // grid's top in document coords (constant while mounted)
    let oldH = 0;
    let scale = 1;
    let wheelTimer = 0;
    let settleTimer = 0;

    const resetGrid = () => {
      el.style.transition = '';
      el.style.transform = '';
      el.style.transformOrigin = '';
      el.style.willChange = '';
      document.body.style.overflowX = '';
    };

    const apply = (s: number) => {
      el.style.transformOrigin = `${origin.x}px ${origin.y}px`;
      el.style.transform = `scale(${s})`;
    };

    const begin = (fx: number, fy: number) => {
      active = true;
      window.clearTimeout(settleTimer);
      oldH = targetHRef.current;
      const rect = el.getBoundingClientRect();
      origin = { x: fx - rect.left, y: fy - rect.top };
      scrollYStart = window.scrollY;
      gridDocTop = rect.top + window.scrollY;
      scale = 1;
      el.style.transition = '';
      el.style.willChange = 'transform';
      // Stop a transient horizontal scrollbar while the grid is scaled up.
      document.body.style.overflowX = 'hidden';
    };

    const clampScale = (s: number) => Math.max(minHeight / oldH, Math.min(maxHeight / oldH, s));

    const end = () => {
      if (!active) return;
      active = false;
      lastPinchEndRef.current = Date.now();

      const desiredH = oldH * scale;
      const snappedH = nearestHeight(desiredH);
      const c = snappedH / oldH;

      // Focal point's viewport Y, and where to scroll so it holds after re-pack.
      const fy = origin.y + gridDocTop - scrollYStart;
      const newScrollY = Math.max(0, c * (scrollYStart + fy - gridDocTop) + gridDocTop - fy);

      // Briefly settle from the live scale to the snapped scale, then commit: at
      // that instant the scaled visual equals the re-packed layout, so no pop.
      el.style.transition = 'transform 0.18s ease-out';
      el.style.transform = `scale(${c})`;
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        if (snappedH !== oldH) {
          // Level changed → re-pack; the layout effect clears the transform and
          // applies the focal scroll once the new height renders.
          pendingScrollRef.current = newScrollY;
          setHeight(snappedH);
        } else {
          // No level change (no re-render would fire) → snap back to identity here.
          resetGrid();
        }
      }, 185);
    };

    const dist = (a: Touch, b: Touch) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const [a, b] = [e.touches[0], e.touches[1]];
        startDist = dist(a, b) || 1;
        begin((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (active && e.touches.length === 2) {
        e.preventDefault(); // block the page's own pinch-zoom / scroll
        const [a, b] = [e.touches[0], e.touches[1]];
        scale = clampScale((dist(a, b) || 1) / startDist);
        apply(scale);
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (active && e.touches.length < 2) end();
    };

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return; // only trackpad pinch, not normal scroll
      e.preventDefault();
      if (!active) begin(e.clientX, e.clientY);
      scale = clampScale(scale * Math.exp(-e.deltaY * 0.01));
      apply(scale);
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(end, 140);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
      window.clearTimeout(wheelTimer);
      window.clearTimeout(settleTimer);
    };
  }, [ref, minHeight, maxHeight, nearestHeight, setHeight]);

  // After a pinch commits (targetH changed): clear the transform and apply the
  // focal scroll, both before paint so the swap is seamless.
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.transition = '';
      el.style.transform = '';
      el.style.transformOrigin = '';
      el.style.willChange = '';
    }
    document.body.style.overflowX = '';
    if (pendingScrollRef.current != null) {
      window.scrollTo(0, pendingScrollRef.current);
      pendingScrollRef.current = null;
    }
  }, [targetH, ref]);

  return (
    <div className="min-h-screen w-full">
      {/* Top bar — the only chrome in Compact (the global header is hidden via
          body[data-immersive]). z-40 keeps it above the grid but below the
          lightbox (z-50). A taller, comfortable height with a soft separator. */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between gap-4 px-5 py-4 backdrop-blur-md"
        style={{ color: storyColor, backgroundColor: bgColor, boxShadow: '0 1px 16px rgba(0,0,0,0.12)' }}
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <Link
            to="/photography"
            aria-label="Back to collections"
            className="shrink-0 opacity-75 transition-opacity hover:opacity-100"
          >
            <ArrowLeft size={22} strokeWidth={1.75} />
          </Link>
          <span className="truncate font-cormorant text-base tracking-wide">
            <span className="font-medium">{title}</span>
            <span className="opacity-55"> · {photos.length} frames</span>
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={zoomOut}
            disabled={!canZoomOut}
            aria-label="Zoom out — more photos per row"
            className="rounded-full p-2 opacity-75 transition-opacity hover:opacity-100 disabled:opacity-25"
          >
            <Minus size={20} />
          </button>
          <button
            onClick={zoomIn}
            disabled={!canZoomIn}
            aria-label="Zoom in — fewer, larger photos per row"
            className="rounded-full p-2 opacity-75 transition-opacity hover:opacity-100 disabled:opacity-25"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={onExit}
            aria-label="Switch to Story view"
            className="ml-1.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-cormorant text-base opacity-75 transition-opacity hover:opacity-100"
          >
            <BookOpen size={17} strokeWidth={1.75} />
            Story
          </button>
        </div>
      </div>

      {/* Justified rows */}
      <div ref={ref} className="w-full">
        {width > 0 &&
          rows.map((row, r) => {
            // Full rows fill the width exactly (flex-grow by aspect, basis 0 → the
            // browser distributes every pixel, no rounding seams). The trailing
            // partial row keeps natural widths, left-aligned, bg filling the rest.
            const isLast = r === rows.length - 1;
            return (
              <div key={r} className="flex w-full" style={{ height: row.height }}>
                {row.idxs.map((idx) => {
                  const w = Math.round(row.height * aspects[idx]);
                  const tileStyle: React.CSSProperties = isLast
                    ? { width: w, height: row.height, backgroundColor: photos[idx].dominantColor }
                    : {
                        flexGrow: aspects[idx],
                        flexBasis: 0,
                        height: row.height,
                        backgroundColor: photos[idx].dominantColor,
                      };
                  return (
                    <button
                      key={photos[idx].src}
                      onClick={() => {
                        // Ignore the click a pinch's final lift would synthesise.
                        if (Date.now() - lastPinchEndRef.current < 350) return;
                        onPhotoClick(idx);
                      }}
                      title={`${title} ${idx + 1}`}
                      aria-label={`Open ${title}, photo ${idx + 1} of ${photos.length}`}
                      className="compact-tile group relative block overflow-hidden"
                      style={tileStyle}
                    >
                      <img
                        ref={(el) => (imgRefs.current[idx] = el)}
                        src={cldFull(photos[idx].src, nearestWidth(w * dpr))}
                        srcSet={cldSet(photos[idx].src, WIDTHS)}
                        sizes={`${w}px`}
                        alt={`${title} ${idx + 1}`}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                      <span className="pointer-events-none absolute inset-0 ring-inset ring-white/0 transition-all duration-300 group-hover:ring-2 group-hover:ring-white/70" />
                    </button>
                  );
                })}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default CompactGrid;
