import React from 'react';
import { Link } from 'react-router-dom';
import { galleries } from '../data/galleries';
import { DirectionAwareHover } from '../components/ui/direction-aware-hover';

// Optimized Cloudinary URL builder
const buildSrc = (src: string, width: number) => {
  return `${src}?f_auto,q_80,w_${width},c_fill,g_auto`;
};

const Photography: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16 pt-24">
      <h1 className="font-cormorant font-bold text-4xl mb-12 text-center">
        Photography Collections
      </h1>

      {/* Optimized Grid with better performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
        {galleries.map((gallery, index) => {
          const preview = gallery.hero || gallery.photos[0];
          const imageUrl = buildSrc(preview.src, 500); // Reduced size for better performance

          return (
            <Link
              key={gallery.slug}
              to={`/photography/${gallery.slug}`}
              className="block"
            >
              <DirectionAwareHover
                imageUrl={imageUrl}
                className="h-80 w-80 md:h-96 md:w-96"
                childrenClassName="font-cormorant"
                imageClassName={index < 6 ? "" : "will-change-transform"} // Optimize first 6 images
              >
                <p className="font-bold text-xl mb-2">{gallery.title}</p>
                <p className="font-normal text-sm opacity-90 line-clamp-2">{gallery.description}</p>
              </DirectionAwareHover>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Photography;