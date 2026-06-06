import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { galleries } from '../data/galleries';
import { cldSquare } from '../components/gallery/shared/cloudinaryUtils';
import PageTransition from '../components/PageTransition';

/** RGB (0–255) → HSL with hue in degrees, s/l in 0–1. */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

/** Sort position for a stored dominantColor: near-greys form a dark→light band
 *  ahead of the chromatic frames, which then flow around the hue wheel. */
function sortKey(rgba: string): number {
  const m = rgba.match(/(\d+)\D+(\d+)\D+(\d+)/);
  if (!m) return 1000;
  const [h, s, l] = rgbToHsl(+m[1], +m[2], +m[3]);
  if (s < 0.12) return -100 + l * 50; // neutrals: -100 (dark) .. -50 (light)
  return h; // chromatics: 0..360 by hue
}

interface Tile {
  src: string;
  color: string;
  slug: string;
  title: string;
}

/**
 * "Spectrum" — the whole archive arranged by color into one flowing tapestry.
 * A dense grid of square crops on black; hover to zoom a frame, click to jump
 * to its gallery. Offscreen tiles are skipped via CSS content-visibility
 * (.spectrum-tile) so even the full set stays smooth.
 */
const Spectrum: React.FC = () => {
  const tiles = useMemo<Tile[]>(() => {
    const all: Tile[] = [];
    for (const g of galleries) {
      for (const p of g.photos) {
        all.push({ src: p.src, color: p.dominantColor, slug: g.slug, title: g.title });
      }
    }
    return all.sort((a, b) => sortKey(a.color) - sortKey(b.color));
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0a0a0b] text-white">
        <header className="px-6 pb-10 pt-24 text-center md:pt-28">
          <div className="mb-4 flex items-center justify-center gap-4">
            <span className="h-px w-10 bg-white/30" />
            <span className="font-cormorant text-xs uppercase tracking-[0.4em] text-white/50">
              {tiles.length.toLocaleString()} frames · sorted by color
            </span>
            <span className="h-px w-10 bg-white/30" />
          </div>
          <h1 className="font-cormorant text-5xl font-light md:text-6xl">Spectrum</h1>
          <p className="mx-auto mt-4 max-w-xl font-cormorant text-lg italic text-white/60 [text-wrap:balance]">
            Every frame I&rsquo;ve made, laid end to end by its color — a river from shadow
            through the whole wheel of light.
          </p>
        </header>

        <div
          className="grid gap-[3px] px-[3px] pb-20"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))' }}
        >
          {tiles.map((t, i) => (
            <Link
              key={t.src + i}
              to={`/photography/${t.slug}`}
              title={t.title}
              className="spectrum-tile group relative block aspect-square overflow-hidden"
            >
              <img
                src={cldSquare(t.src, 200)}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                style={{ backgroundColor: t.color }}
              />
              <span className="pointer-events-none absolute inset-0 ring-inset ring-white/0 transition-all duration-300 group-hover:ring-2 group-hover:ring-white/80" />
            </Link>
          ))}
        </div>
      </div>
    </PageTransition>
  );
};

export default Spectrum;
