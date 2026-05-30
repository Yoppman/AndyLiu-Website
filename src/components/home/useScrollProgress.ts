import { useEffect, RefObject } from 'react';
import { useMotionValue, type MotionValue } from 'framer-motion';

/**
 * Progress (0→1) of scrolling through a tall section whose inner content is
 * `position: sticky`. 0 when the section's top reaches the viewport top, 1 when
 * its bottom reaches the viewport bottom.
 *
 * Driven by a rAF loop reading the element's live rect rather than scroll
 * events, so it stays correct regardless of how the page is scrolled and never
 * sticks on a bad mount-time measurement.
 */
export function useScrollProgress(ref: RefObject<HTMLElement>): MotionValue<number> {
  const progress = useMotionValue(0);
  useEffect(() => {
    let raf = 0;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const el = ref.current;
      if (el && !document.hidden) {
        const rect = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const next = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
        if (Math.abs(next - progress.get()) > 0.0001) progress.set(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [ref, progress]);
  return progress;
}
