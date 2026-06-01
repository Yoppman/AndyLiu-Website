import { useState, useEffect, useCallback, useRef } from 'react';
import { PLACEHOLDER_ONLY, cldFull, Photo } from './cloudinaryUtils';

export function useLightbox(photos: Photo[]) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const prefetchedRef = useRef<Set<string>>(new Set());
  const prefetchImgsRef = useRef<HTMLImageElement[]>([]);

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setLightboxIdx(null);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onKey]);

  useEffect(() => {
    if (lightboxIdx === null || PLACEHOLDER_ONLY) return;
    const targets = [lightboxIdx - 1, lightboxIdx + 1].filter(
      (i) => i >= 0 && i < photos.length
    );
    targets.forEach((i) => {
      const url = cldFull(photos[i].src, 1200);
      if (prefetchedRef.current.has(url)) return;
      prefetchedRef.current.add(url);
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = url;
      prefetchImgsRef.current.push(img);
    });
  }, [lightboxIdx, photos]);

  return { lightboxIdx, setLightboxIdx };
}
