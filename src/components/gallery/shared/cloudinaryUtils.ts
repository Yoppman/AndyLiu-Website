import { galleryDimensions } from '../../../data/galleryDimensions';

export const PLACEHOLDER_ONLY =
  (typeof import.meta !== 'undefined') && (
    // @ts-ignore
    String(import.meta.env.VITE_PLACEHOLDER_ONLY) === '1');

/**
 * Cloudinary transforms must live in the URL PATH, not a query string.
 * We insert them right after `/upload/`, and prepend a per-photo rotation
 * (e.g. `a_270`) so sideways-stored verticals are delivered upright.
 */
const splitUpload = (src: string): [string, string] | null => {
  const marker = '/upload/';
  const i = src.indexOf(marker);
  if (i === -1) return null;
  const head = src.slice(0, i + marker.length);
  // Drop any stray query string the data may carry.
  const tail = src.slice(i + marker.length).split('?')[0];
  return [head, tail];
};

const rotateOf = (src: string): number | undefined => galleryDimensions[src]?.rotate;

const build = (src: string, ops: string): string => {
  const parts = splitUpload(src);
  if (!parts) return src;
  const [head, tail] = parts;
  const rot = rotateOf(src);
  const chain = rot ? `a_${rot}/${ops}` : ops;
  return `${head}${chain}/${tail}`;
};

export const cldFull = (src: string, w: number) => build(src, `q_auto,f_auto,w_${w}`);

export const cldSet = (src: string, widths: number[]) =>
  widths.map((w) => `${cldFull(src, w)} ${w}w`).join(', ');

export const cldPlaceholder = (src: string) => build(src, `w_24,q_10,f_auto,e_blur:1000`);

export interface Photo {
  src: string;
  orientation: 'vertical' | 'horizontal';
  dominantColor: string;
  lightroom?: boolean | 0 | 1;
}

export interface Gallery {
  slug: string;
  title: string;
  description: string;
  hero?: Photo;
  photos: Photo[];
}

/** Upright display dimensions for a photo (falls back to canonical 3:2 / 2:3). */
export const dimOf = (photo: Pick<Photo, 'src' | 'orientation'>): { w: number; h: number } => {
  const d = galleryDimensions[photo.src];
  if (d) return { w: d.w, h: d.h };
  return photo.orientation === 'vertical' ? { w: 2, h: 3 } : { w: 3, h: 2 };
};

/** Width / height ratio of a photo as it should be displayed. */
export const aspectOf = (photo: Pick<Photo, 'src' | 'orientation'>): number => {
  const { w, h } = dimOf(photo);
  return w / h;
};
