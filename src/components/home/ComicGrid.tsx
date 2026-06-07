import React from 'react';
import { cldFull, cldSet } from '../gallery/shared/cloudinaryUtils';

/**
 * A nostalgic, edge-to-edge collage — a comic/mosaic wall of portraits and
 * people, graded to high-contrast black & white with film grain. Sits inside
 * the "Selected Frames" act, before the closing invitation. Photos are
 * `object-cover`, so some intentional cropping keeps the tiles flush.
 */

// 12-column × 5-row layout (mirrors the reference collage). Top band = two
// short rows; bottom band = three taller rows with a dominant centre portrait.
const AREAS = `
  "a a a a b b c c e e e e"
  "a a a a b b d d e e e e"
  "f f f h h h h i i i i i"
  "f f f h h h h i i i i i"
  "g g g h h h h j j k k k"
`;

interface Tile {
  area: string;
  src: string;
}

// Curated from the street & café galleries (people-forward, high contrast).
const TILES: Tile[] = [
  { area: 'a', src: 'https://res.cloudinary.com/duo70zkqx/image/upload/v1755388376/sanfranciscostreet/dsc06996.jpg' },
  { area: 'b', src: 'https://res.cloudinary.com/duo70zkqx/image/upload/v1755388150/sanfranciscostreet/dsc06796.jpg' },
  { area: 'c', src: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747808968/coffee/dsc01853.jpg' },
  { area: 'd', src: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747808974/coffee/dsc01875.jpg' },
  { area: 'e', src: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747730763/berlinstreet/dsc00725.jpg' },
  { area: 'f', src: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747730771/berlinstreet/dsc00817.jpg' },
  { area: 'g', src: 'https://res.cloudinary.com/duo70zkqx/image/upload/v1755388167/sanfranciscostreet/dsc06813.jpg' },
  { area: 'h', src: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747730772/berlinstreet/dsc00827.jpg' },
  { area: 'i', src: 'https://res.cloudinary.com/duo70zkqx/image/upload/v1755388282/sanfranciscostreet/dsc06921.jpg' },
  { area: 'j', src: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747808970/coffee/dsc01858.jpg' },
  { area: 'k', src: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747730784/berlinstreet/dsc01255.jpg' },
];

// Static film grain (inline SVG turbulence) laid over the whole collage.
const GRAIN =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>";

const ComicGrid: React.FC = () => {
  return (
    <section className="relative w-full bg-black">
      <div className="relative w-full">
        <div
          className="grid w-full"
          style={{
            gridTemplateColumns: 'repeat(12, 1fr)',
            gridTemplateAreas: AREAS,
            gridTemplateRows: '17vh 17vh 19vh 19vh 19vh',
            gap: '4px',
          }}
        >
          {TILES.map((t) => (
            <div key={t.area} className="relative overflow-hidden bg-neutral-900" style={{ gridArea: t.area }}>
              <img
                src={cldFull(t.src, 1100)}
                srcSet={cldSet(t.src, [700, 1100, 1500])}
                sizes="(max-width: 768px) 50vw, 33vw"
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                className="w-full h-full object-cover select-none"
                style={{ filter: 'grayscale(1) contrast(1.2) brightness(0.95)' }}
              />
            </div>
          ))}
        </div>

        {/* film grain */}
        <div
          className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.16]"
          style={{ backgroundImage: `url("${GRAIN}")`, backgroundSize: '170px 170px' }}
        />
        {/* classic edge vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ boxShadow: 'inset 0 0 220px 50px rgba(0,0,0,0.65)' }}
        />
      </div>

      {/* Closing invitation — aimed at artists & collaborators */}
      <div className="relative bg-black px-6 py-24 md:py-32 text-center">
        <p className="font-cormorant italic text-white text-2xl md:text-4xl max-w-2xl mx-auto leading-relaxed mb-8">
          I take on a few commissions each year&mdash;portraits, travel,
          and the quiet stories in between.
        </p>
        <a href="/contact" className="group inline-flex items-center gap-3 text-white">
          <span className="font-cormorant tracking-[0.4em] text-sm uppercase pl-[0.4em]">
            Let&rsquo;s make something
          </span>
          <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
        </a>
      </div>
    </section>
  );
};

export default ComicGrid;
