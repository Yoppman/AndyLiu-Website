import React from 'react';
import { Link } from 'react-router-dom';
import { galleries } from '../data/galleries';

const GalleryPreview: React.FC = () => {
  const recentGalleries = [...galleries].slice(0, 4);

  return (
    <section className="py-16 bg-[#f4f4f3]">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-center font-cormorant italic text-xl mb-12">
          Recent Work
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {recentGalleries.map((g) => (
            <Link
              key={g.slug}
              to={`/photography/${g.slug}`}
              className="
                relative 
                overflow-hidden 
                group 
                aspect-[3/2] 
              "
            >
              {/* Underlying image */}
              <img
                src={g.photos[0].src}
                alt={g.title}
                className="
                  w-full h-full object-cover 
                  transition-all duration-500 
                  group-hover:scale-95 
                  group-hover:opacity-0
                "
              />

              {/* White overlay + text */}
              <div
                className="
                  absolute inset-0 
                  bg-[#f4f4f3] 
                  opacity-0 
                  group-hover:opacity-100 
                  transition-opacity duration-300 
                  flex items-center justify-center
                "
              >
                <span className="text-black font-cormorant text-3xl">
                  {g.title}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GalleryPreview;