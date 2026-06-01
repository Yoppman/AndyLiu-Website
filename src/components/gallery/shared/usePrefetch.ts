import { useLayoutEffect } from 'react';
import { PLACEHOLDER_ONLY, cldFull, Photo } from './cloudinaryUtils';

/**
 * Preloads only what helps the Largest Contentful Paint: the hero image and the
 * first couple of photos. The grid itself is loaded just-in-time by <LazyImage>
 * (IntersectionObserver, rootMargin 200px), so there is intentionally NO bulk
 * prefetch — eagerly fetching three widths of every photo (366 requests for a
 * 122-photo gallery) saturated the connection and competed with the images the
 * user was actually scrolling to.
 */
export function usePrefetch(photos: Photo[], heroSrc: string) {
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
}
