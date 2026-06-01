import { useState, useEffect, useCallback } from 'react';

export function useScrollTop() {
  const [showTopArrow, setShowTopArrow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTopArrow(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    if ('scrollBehavior' in document.documentElement.style) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const startY = window.scrollY;
    const durationMs = 500;
    const startTs = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - startTs) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      window.scrollTo(0, Math.round(startY * (1 - eased)));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, []);

  return { showTopArrow, scrollToTop };
}
