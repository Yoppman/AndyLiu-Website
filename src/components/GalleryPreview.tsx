import React from 'react';
import { Link } from 'react-router-dom';
import { galleries } from '../data/galleries';
import TiltCard from './TiltCard';
import { cldFull, cldSet } from './gallery/shared/cloudinaryUtils';

const GalleryPreview: React.FC = () => {
  const recentGalleries = [...galleries].slice(0, 4);

  return (
    <section className="relative bg-white py-24 md:py-28 z-30">
      <div className="max-w-7xl mx-auto px-6">
        {/* Editorial header */}
        <div className="mb-12 flex items-end justify-between md:mb-16">
          <div>
            <div className="mb-4 flex items-center gap-4">
              <span className="h-px w-10 bg-amber-500/70" />
              <span className="font-cormorant text-xs uppercase tracking-[0.35em] text-neutral-400">
                Selected work
              </span>
            </div>
            <h2 className="font-cormorant text-4xl text-neutral-900 md:text-5xl">Recent galleries</h2>
          </div>
          <Link
            to="/photography"
            className="group hidden items-center gap-2 font-cormorant text-lg text-neutral-500 transition-colors hover:text-neutral-900 sm:inline-flex"
          >
            <span>All galleries</span>
            <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
          </Link>
        </div>

        {/* Photo-forward cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8">
          {recentGalleries.map((g) => {
            const preview = g.hero || g.photos[0];
            return (
              <Link key={g.slug} to={`/photography/${g.slug}`} className="block">
                <TiltCard className="w-full">
                  <article className="group relative aspect-[4/3] w-full overflow-hidden rounded-[3px] shadow-lg transition-shadow duration-500 hover:shadow-2xl">
                    <img
                      src={cldFull(preview.src, 1200)}
                      srcSet={cldSet(preview.src, [800, 1200, 1600])}
                      sizes="(max-width: 640px) 100vw, 50vw"
                      alt={g.title}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                      style={{ backgroundColor: preview.dominantColor }}
                    />
                    {/* Legibility gradient */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/0 to-black/0" />
                    {/* Title + description */}
                    <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
                      <h3 className="font-cormorant text-2xl leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] md:text-3xl">
                        {g.title}
                      </h3>
                      <p className="mt-1 line-clamp-1 translate-y-1 font-cormorant text-sm text-white/75 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 md:text-base">
                        {g.description}
                      </p>
                    </div>
                  </article>
                </TiltCard>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default GalleryPreview;
