import { useState, useEffect, useCallback } from 'react';

/**
 * Owns just the open/closed state for the lightbox. Navigation, prefetching and
 * gesture handling now live inside <GalleryLightbox> (the carousel manages its
 * own current index while open), so this hook only tracks which photo opened it
 * and closes on Escape.
 */
export function useLightbox() {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setLightboxIdx(null);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onKey]);

  return { lightboxIdx, setLightboxIdx };
}
