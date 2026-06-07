import React from 'react';
import { cldFull, cldSet } from './gallery/shared/cloudinaryUtils';

interface QuoteProps {
  /** URL of the full-bleed background image */
  imageSrc: string;
  /** The line, set over the image */
  text: string;
  /** Optional attribution */
  author?: string;
  /** Optional height (defaults to 80vh) */
  heightClassName?: string;
}

/**
 * A cinematic full-bleed photograph with a single literary line set over it,
 * lower-left, behind a soft gradient. A quiet "breath" between the cinematic
 * hero and the gallery grid.
 */
const Quote: React.FC<QuoteProps> = ({ imageSrc, text, author, heightClassName = 'h-[80vh]' }) => {
  return (
    <section className={`relative w-full overflow-hidden bg-black ${heightClassName}`}>
      <img
        src={cldFull(imageSrc, 2000)}
        srcSet={cldSet(imageSrc, [1280, 2000, 2600])}
        sizes="100vw"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Legibility gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/25" />

      {/* The line */}
      <div className="absolute inset-0 flex items-end">
        <div className="w-full max-w-4xl px-8 pb-16 md:px-16 md:pb-24">
          <p className="font-cormorant text-3xl font-light italic leading-[1.3] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.55)] md:text-[2.75rem]">
            {text}
          </p>
          {author && (
            <p className="mt-5 font-cormorant text-sm uppercase tracking-[0.3em] text-white/60">
              {author}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Quote;
