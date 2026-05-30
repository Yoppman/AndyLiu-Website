export const PLACEHOLDER_ONLY =
  (typeof import.meta !== 'undefined') && (
    // @ts-ignore
    String(import.meta.env.VITE_PLACEHOLDER_ONLY) === '1');

export const cldFull = (src: string, w: number) => `${src}?a_auto,q_auto,f_auto,w_${w}`;

export const cldSet = (src: string, widths: number[]) =>
  widths.map((w) => `${src}?a_auto,q_auto,f_auto,w_${w} ${w}w`).join(', ');

export const cldPlaceholder = (src: string) => `${src}?a_auto,w_24,q_10,f_auto,e_blur:1000`;

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
