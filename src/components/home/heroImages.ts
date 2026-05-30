import { galleries } from '../../data/galleries';
import type { Photo } from '../gallery/shared/cloudinaryUtils';

/**
 * Curated full-bleed images for the cinematic slice + liquid acts.
 * These are just my picks — swap any URL freely. The last two are the
 * "seeded extras" (a coastline and a Laguna sunset); change them anytime.
 */
export const HERO_IMAGES: string[] = [
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1748512319/joshuatree/dsc04025.jpg', // high desert
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1751189805/sanfrancisco/dsc06577.jpg', // san francisco
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1751191521/pachecopass/dsc05989.jpg', // golden hills
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1751190522/halfmoonbay/dsc06220.jpg', // coast (seeded extra)
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747703401/LagunaBeach/dsc03805.jpg', // laguna sunset (seeded extra)
];

/** Deterministic shuffle so the mosaic is stable across reloads. */
function shuffle<T>(arr: T[], seed = 7): T[] {
  const a = arr.slice();
  let s = seed;
  const rng = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A diverse sample of real gallery photos for the living mosaic wall. */
export function mosaicPhotos(limit = 45): Photo[] {
  // one pass to gather, then spread across galleries so no single place dominates
  const buckets = galleries.map((g) => g.photos);
  const out: Photo[] = [];
  let round = 0;
  while (out.length < limit * 2) {
    let added = false;
    for (const b of buckets) {
      if (b[round]) {
        out.push(b[round]);
        added = true;
      }
    }
    if (!added) break;
    round++;
  }
  return shuffle(out).slice(0, limit);
}
