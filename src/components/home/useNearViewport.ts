import { useEffect, useState } from 'react';

/**
 * True while the referenced element is within `rootMargin` of the viewport.
 *
 * Used to mount a heavy WebGL scene only when its section is near view, and to
 * unmount it once scrolled away — unmounting lets react-three-fiber dispose the
 * renderer and release the WebGL context, so the home page never holds more than
 * roughly one live context at a time. (Multiple simultaneous always-on contexts
 * were causing GPU context-loss and scroll jank.)
 */
export function useNearViewport(
  ref: { current: Element | null },
  rootMargin = '400px',
): boolean {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setNear(true); // no IntersectionObserver support → just mount (safe default)
      return;
    }
    const io = new IntersectionObserver(
      (entries) => setNear(entries[0]?.isIntersecting ?? false),
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);

  return near;
}
