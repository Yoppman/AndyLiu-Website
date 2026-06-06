import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Pause } from 'lucide-react';
import { cldFull, Photo } from './cloudinaryUtils';

interface Props {
  photos: Photo[];
  title: string;
  captions?: Record<number, string>;
  intro?: string;
  signoff?: string;
  startIdx?: number;
  onClose: () => void;
}

const DWELL = 5000; // ms each photograph holds before the dissolve

/** "r, g, b" from a stored dominantColor string. */
const rgbOf = (rgba: string): string => {
  const m = rgba.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  return m ? `${m[1]}, ${m[2]}, ${m[3]}` : '255, 255, 255';
};

type Phase = 'intro' | 'playing' | 'end';

/**
 * "Screening" — a gallery played as a short film. Each photograph is shown
 * whole (letterboxed, lit by its own ambient color), slowly cross-dissolving;
 * the written intro opens it, captions are subtitles, the signoff closes it.
 * No WebGL — images + transforms only.
 */
const GalleryScreening: React.FC<Props> = ({
  photos,
  title,
  captions,
  intro,
  signoff,
  startIdx = 0,
  onClose,
}) => {
  const reduce = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const [phase, setPhase] = useState<Phase>(intro ? 'intro' : 'playing');
  const [i, setI] = useState(startIdx);
  const [paused, setPaused] = useState(false);
  const [chrome, setChrome] = useState(true);

  // Opening title card → first frame.
  useEffect(() => {
    if (phase !== 'intro') return;
    const id = window.setTimeout(() => setPhase('playing'), 4200);
    return () => window.clearTimeout(id);
  }, [phase]);

  // Auto-advance through the frames; the last one rolls into the closing card.
  useEffect(() => {
    if (phase !== 'playing' || paused) return;
    const id = window.setTimeout(() => {
      if (i >= photos.length - 1) setPhase('end');
      else setI(i + 1);
    }, DWELL);
    return () => window.clearTimeout(id);
  }, [phase, paused, i, photos.length]);

  // Warm the next couple of frames so the dissolve never waits.
  useEffect(() => {
    [i + 1, i + 2].forEach((k) => {
      if (photos[k]) {
        const img = new Image();
        img.decoding = 'async';
        img.src = cldFull(photos[k].src, 2200);
      }
    });
  }, [i, photos]);

  // Keyboard: Esc closes, Space pauses, arrows step.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.code === 'Space') {
        e.preventDefault();
        if (phase === 'playing') setPaused((p) => !p);
      } else if (e.key === 'ArrowRight' && phase === 'playing') {
        setI((p) => Math.min(photos.length - 1, p + 1));
      } else if (e.key === 'ArrowLeft' && phase === 'playing') {
        setI((p) => Math.max(0, p - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, onClose, photos.length]);

  // Lock scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Chrome (and cursor) fade away when the pointer rests.
  useEffect(() => {
    let t: number | undefined;
    const wake = () => {
      setChrome(true);
      window.clearTimeout(t);
      t = window.setTimeout(() => setChrome(false), 2600);
    };
    wake();
    window.addEventListener('mousemove', wake);
    return () => {
      window.removeEventListener('mousemove', wake);
      window.clearTimeout(t);
    };
  }, []);

  const photo = photos[i];

  return (
    <motion.div
      className={`fixed inset-0 z-[80] overflow-hidden bg-black ${chrome ? '' : 'cursor-none'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      onClick={() => phase === 'playing' && setPaused((p) => !p)}
    >
      {/* Ambient color of the current frame */}
      {phase === 'playing' && (
        <AnimatePresence>
          <motion.div
            key={`glow-${i}`}
            aria-hidden
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              background: `radial-gradient(120% 100% at 50% 50%, rgba(${rgbOf(
                photo.dominantColor,
              )}, 0.20) 0%, rgba(${rgbOf(photo.dominantColor)}, 0.05) 50%, transparent 78%)`,
            }}
          />
        </AnimatePresence>
      )}

      {/* Opening title card */}
      <AnimatePresence>
        {phase === 'intro' && (
          <motion.div
            key="intro"
            className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1 }}
          >
            <span className="mb-7 font-cormorant text-xs uppercase tracking-[0.45em] text-white/55">
              {title}
            </span>
            {intro && (
              <p className="max-w-3xl font-cormorant text-2xl italic leading-relaxed text-white/90 [text-wrap:balance] md:text-4xl">
                {intro}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The frame */}
      {phase === 'playing' && (
        <AnimatePresence>
          <motion.img
            key={photo.src}
            src={cldFull(photo.src, 2200)}
            alt={`${title} — ${i + 1}`}
            draggable={false}
            className="absolute left-1/2 top-1/2 max-h-[86vh] max-w-[90vw] object-contain shadow-[0_40px_120px_rgba(0,0,0,0.6)]"
            style={{ x: '-50%', y: '-50%' }}
            initial={{ opacity: 0, scale: reduce ? 1 : 1.0 }}
            animate={{ opacity: 1, scale: reduce ? 1 : 1.05 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.4, ease: 'easeInOut' },
              scale: { duration: (DWELL + 1400) / 1000, ease: 'linear' },
            }}
          />
        </AnimatePresence>
      )}

      {/* Caption subtitle */}
      <AnimatePresence>
        {phase === 'playing' && captions?.[i] && (
          <motion.div
            key={`cap-${i}`}
            className="pointer-events-none absolute inset-x-0 bottom-[11vh] flex justify-center px-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
          >
            <p className="max-w-2xl text-center font-cormorant text-lg italic leading-relaxed text-white/90 drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)] [text-wrap:balance] md:text-2xl">
              {captions[i]}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Closing card */}
      <AnimatePresence>
        {phase === 'end' && (
          <motion.div
            key="end"
            className="absolute inset-0 flex flex-col items-center justify-center gap-10 px-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.1, delay: 0.3 }}
          >
            {signoff && (
              <p className="max-w-2xl font-cormorant text-2xl italic leading-relaxed text-white/90 [text-wrap:balance] md:text-3xl">
                {signoff}
              </p>
            )}
            <div className="flex items-center gap-8">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setI(startIdx);
                  setPhase(intro ? 'intro' : 'playing');
                }}
                className="font-cormorant text-sm uppercase tracking-[0.35em] text-white/60 transition-colors hover:text-white"
              >
                Replay
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="font-cormorant text-sm uppercase tracking-[0.35em] text-white/60 transition-colors hover:text-white"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chrome — fades out when the pointer rests */}
      <motion.div animate={{ opacity: chrome ? 1 : 0 }} transition={{ duration: 0.4 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
          className="absolute right-6 top-6 z-10 text-white/60 transition-colors hover:text-white"
        >
          <X size={28} />
        </button>
        {phase === 'playing' && (
          <div className="absolute left-6 top-6 font-cormorant text-sm uppercase tracking-[0.25em] text-white/55">
            {title} · {i + 1}/{photos.length}
          </div>
        )}
      </motion.div>

      {/* Paused glyph */}
      <AnimatePresence>
        {phase === 'playing' && paused && (
          <motion.div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/70"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Pause size={48} strokeWidth={1} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GalleryScreening;
