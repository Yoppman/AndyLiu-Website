import { useEffect, useRef, useLayoutEffect } from 'react';
import { PLACEHOLDER_ONLY, cldFull, Photo } from './cloudinaryUtils';

export function usePrefetch(photos: Photo[], heroSrc: string) {
  const prefetchedUrlSetRef = useRef<Set<string>>(new Set());
  const prefetchImageElementsRef = useRef<HTMLImageElement[]>([]);

  useLayoutEffect(() => {
    if (PLACEHOLDER_ONLY) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = cldFull(heroSrc, 1200);
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, [heroSrc]);

  useLayoutEffect(() => {
    if (PLACEHOLDER_ONLY) return;
    const links: HTMLLinkElement[] = [];
    photos.slice(0, 2).forEach((p) => {
      [600, 900].forEach((w) => {
        const l = document.createElement('link');
        l.rel = 'preload';
        l.as = 'image';
        l.href = cldFull(p.src, w);
        (l as any).fetchpriority = 'high';
        document.head.appendChild(l);
        links.push(l);
      });
    });
    return () => { links.forEach((l) => l.remove()); };
  }, [photos]);

  useEffect(() => {
    if (!photos?.length || PLACEHOLDER_ONLY) return;
    const idle = (cb: () => void) =>
      (window as any).requestIdleCallback
        ? (window as any).requestIdleCallback(cb, { timeout: 2000 })
        : setTimeout(cb, 150);

    let cancelled = false;
    idle(() => {
      if (cancelled) return;
      let delayMs = 0;
      photos.forEach((p) => {
        [300, 600, 900].forEach((w) => {
          const url = cldFull(p.src, w);
          if (prefetchedUrlSetRef.current.has(url)) return;
          prefetchedUrlSetRef.current.add(url);
          setTimeout(() => {
            if (cancelled) return;
            const img = new Image();
            img.decoding = 'async';
            img.loading = 'eager';
            img.referrerPolicy = 'no-referrer';
            img.src = url;
            prefetchImageElementsRef.current.push(img);
          }, delayMs);
          delayMs += 40;
        });
      });
    });
    return () => {
      cancelled = true;
      prefetchImageElementsRef.current = [];
    };
  }, [photos]);
}
