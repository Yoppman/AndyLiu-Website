import React, { useState } from 'react';
import { motion } from 'motion/react';
import EagerImage from '../shared/EagerImage';
import LazyImage from '../shared/LazyImage';
import type { GalleryTemplateProps } from '../templateConfig';

const PAGE_SIZE = 40;

const MosaicWall: React.FC<GalleryTemplateProps> = ({
  photos,
  title,
  description,
  onPhotoClick,
  imgRefs,
  renderDeferredGrid,
}) => {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const displayPhotos = renderDeferredGrid
    ? photos.slice(0, visibleCount)
    : photos.slice(0, Math.min(4, visibleCount));

  const getSpan = (index: number, orientation: string) => {
    if (index % 7 === 0) return 'md:col-span-2 md:row-span-2';
    if (orientation === 'vertical') return 'md:row-span-2';
    if (index % 5 === 0) return 'md:col-span-2';
    return '';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto mb-12 text-center">
        <p className="font-cormorant text-xl leading-relaxed opacity-80">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[200px] md:auto-rows-[220px] gap-3">
        {displayPhotos.map((photo, i) => {
          const span = getSpan(i, photo.orientation);
          const delay = (i % 4) * 0.08;

          return (
            <motion.div
              key={photo.src}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay }}
              className={`overflow-hidden relative group ${span}`}
            >
              <button
                onClick={() => onPhotoClick(i)}
                className="block w-full h-full overflow-hidden"
              >
                <div className="w-full h-full transition-transform duration-500 group-hover:scale-[1.03]">
                  {i < 4 ? (
                    <EagerImage ref={(el) => (imgRefs.current[i] = el)} photo={photo} alt={`${title} ${i + 1}`} />
                  ) : (
                    <LazyImage ref={(el) => (imgRefs.current[i] = el)} photo={photo} alt={`${title} ${i + 1}`} />
                  )}
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {visibleCount < photos.length && renderDeferredGrid && (
        <div className="flex justify-center mt-12">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="font-cormorant text-lg tracking-wider border border-current px-8 py-3 hover:bg-black hover:text-white transition-colors duration-300"
          >
            Load More ({photos.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
};

export default MosaicWall;
