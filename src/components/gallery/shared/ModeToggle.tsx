import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, LayoutGrid, Check } from 'lucide-react';

export type GalleryViewMode = 'story' | 'compact';

interface ModeToggleProps {
  mode: GalleryViewMode;
  onSelect: (m: GalleryViewMode) => void;
}

const OPTIONS: { id: GalleryViewMode; label: string; Icon: typeof BookOpen }[] = [
  { id: 'story', label: 'Story', Icon: BookOpen },
  { id: 'compact', label: 'Grid', Icon: LayoutGrid },
];

/**
 * A small floating "Mode" control, fixed bottom-right and present in both views,
 * so there's one consistent place to toggle. Clicking unfurls a frosted-glass
 * menu upward (Story / Grid) with a springy, iOS-ish "liquid" feel; the active
 * one is checked. z-40 keeps it under the lightbox.
 */
const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onSelect }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (m: GalleryViewMode) => {
    setOpen(false);
    if (m !== mode) onSelect(m);
  };

  return (
    <div ref={rootRef} className="fixed bottom-6 right-4 z-40 flex flex-col items-end">
      {/* Menu — unfurls upward from the button corner */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ height: 0, opacity: 0, scale: 0.9 }}
            animate={{ height: 'auto', opacity: 1, scale: 1 }}
            exit={{
              height: 0,
              opacity: 0,
              scale: 0.95,
              transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
            }}
            transition={{
              height: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.18 },
              scale: { type: 'spring', stiffness: 360, damping: 22, mass: 0.8 },
            }}
            style={{ transformOrigin: 'bottom right' }}
            className="relative mb-2 w-40 overflow-hidden rounded-[1.25rem] border border-white/15 bg-black/45 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          >
            {/* glassy top sheen */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/12 to-transparent" />
            {OPTIONS.map((o, i) => {
              const active = o.id === mode;
              return (
                <motion.button
                  key={o.id}
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => choose(o.id)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 + i * 0.06, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={{ scale: 0.96 }}
                  className={`relative flex w-full items-center gap-2.5 px-4 py-3 font-cormorant text-base transition-colors ${
                    active ? 'text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <o.Icon size={17} strokeWidth={1.75} className="shrink-0" />
                  <span className="flex-1 text-left">{o.label}</span>
                  {active && <Check size={16} strokeWidth={2} className="shrink-0 text-amber-300" />}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The trigger */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change view mode"
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-4 py-2.5 font-cormorant text-sm text-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-colors hover:bg-black/70"
      >
        {mode === 'compact' ? (
          <LayoutGrid size={16} strokeWidth={1.75} />
        ) : (
          <BookOpen size={16} strokeWidth={1.75} />
        )}
        Mode
      </motion.button>
    </div>
  );
};

export default ModeToggle;
