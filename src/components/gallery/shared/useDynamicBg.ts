import { useEffect, useRef, useState, MutableRefObject } from 'react';
import { Photo } from './cloudinaryUtils';

export function useDynamicBg(
  photos: Photo[],
  imgRefs: MutableRefObject<(HTMLImageElement | null)[]>,
  deps: unknown[] = []
) {
  const [bgColor, setBgColor] = useState(photos[0]?.dominantColor ?? '#000');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const setup = () => {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const img = entry.target as HTMLImageElement;
            if (!img.complete) continue;
            const i = imgRefs.current.indexOf(img);
            if (i >= 0) setBgColor(photos[i].dominantColor);
            break;
          }
        },
        { threshold: 0.4 }
      );
      imgRefs.current.forEach((img) => img && observerRef.current!.observe(img));
    };

    const idle = (cb: () => void) =>
      (window as any).requestIdleCallback
        ? (window as any).requestIdleCallback(cb, { timeout: 800 })
        : setTimeout(cb, 60);

    idle(setup);
    return () => observerRef.current?.disconnect();
  }, [photos, ...deps]);

  return bgColor;
}
