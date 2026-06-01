import { galleries } from '../../data/galleries';
import type { Photo } from '../gallery/shared/cloudinaryUtils';

/**
 * Curated full-bleed images for the cinematic slice + liquid acts.
 * These are just my picks — swap any URL freely. The last two are the
 * "seeded extras" (a coastline and a Laguna sunset); change them anytime.
 */
export const HERO_IMAGES: string[] = [
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1748512319/joshuatree/dsc04025.jpg', // high desert
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1755241827/santacruz/dsc08427.jpg',
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747730934/berlinstreet/dsc01849.jpg',
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1751189805/sanfrancisco/dsc06577.jpg', // san francisco
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1751191521/pachecopass/dsc05989.jpg', // golden hills
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1751190522/halfmoonbay/dsc06220.jpg', // coast (seeded extra)
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747703401/LagunaBeach/dsc03805.jpg', // laguna sunset (seeded extra)
];

/** Place names shown as kinetic captions, parallel to HERO_IMAGES. */
export const HERO_PLACES: string[] = [
  'Joshua Tree',
  'San Francisco',
  'Pacheco Pass',
  'Half Moon Bay',
  'Laguna Beach',
];

/**
 * ★ EDIT ME ★ — the exact photographs the home "Selected Frames" fly-through
 * threads through, in order. Frame 0 sits nearest at the top of the section;
 * the camera flies past them toward the last one as you scroll.
 *
 * This is the single source of truth for that section — change a URL, reorder,
 * add, or remove lines freely. Notes:
 *   • Any Cloudinary image URL works (these are pulled from your galleries).
 *   • Wide / landscape frames read best — they're sized ~3:2. Verticals render
 *     but look narrow in the flight.
 *   • The count is flexible: 16 is just the current set. More URLs = a longer
 *     fly-through; fewer = shorter. No other code needs to change.
 *   • Aspect ratio is read automatically from galleryDimensions for gallery
 *     photos; any unknown URL falls back to 3:2.
 */
export const SELECTED_FRAMES: string[] = [
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1751189663/sanfrancisco/dsc06488.jpg', // San Francisco
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1755241827/santacruz/dsc08427.jpg', // Santa Cruz (vertical)
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1751189731/sanfrancisco/dsc06543.jpg', // San Francisco
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747730931/berlinstreet/dsc01842.jpg', // Berlin Street (vertical)
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747730871/berlinstreet/dsc01491.jpg', // Berlin Street (vertical)
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747703419/LagunaBeach/dsc03871.jpg', // Laguna Beach
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1755241880/santacruz/dsc08323.jpg', // Santa Cruz (vertical)
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1751190568/halfmoonbay/dsc06293.jpg', // Half Moon Bay
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1751189857/sanfrancisco/dsc06597.jpg', // San Francisco
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747812497/sachsenhausenconcentration/dsc02162.jpg', // Sachsenhausen
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747730869/berlinstreet/dsc01486.jpg', // Berlin Street
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747730865/berlinstreet/dsc01479.jpg', // Berlin Street
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747703408/LagunaBeach/dsc03822.jpg', // Laguna Beach
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

/** Landscape (horizontal) photos across galleries — used for the fly-through,
 *  where wide frames read best. Shuffled for variety, stable across reloads. */
export function landscapePhotos(limit = 16): Photo[] {
  const out: Photo[] = [];
  for (const g of galleries) {
    for (const p of g.photos) {
      if (p.orientation === 'horizontal') out.push(p);
    }
  }
  return shuffle(out).slice(0, limit);
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
