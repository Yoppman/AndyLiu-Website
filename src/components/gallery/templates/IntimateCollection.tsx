import React from 'react';
import { motion } from 'motion/react';
import EagerImage from '../shared/EagerImage';
import LazyImage from '../shared/LazyImage';
import type { GalleryTemplateProps } from '../templateConfig';

const IntimateCollection: React.FC<GalleryTemplateProps> = ({
  photos,
  title,
  description,
  onPhotoClick,
  imgRefs,
  renderDeferredGrid,
}) => {
  const visiblePhotos = renderDeferredGrid ? photos : photos.slice(0, 4);

  return (
    <div className="px-[8vw] md:px-[12vw] py-12">
      <div className="max-w-2xl mx-auto mb-20 text-center">
        <p className="font-cormorant text-xl leading-relaxed opacity-70">{description}</p>
      </div>

      <div className="space-y-24 md:space-y-32">
        {visiblePhotos.map((photo, i) => {
          const isFeature = i % 3 === 2;
          const isVertical = photo.orientation === 'vertical';

          const widthClass = isFeature
            ? 'max-w-4xl'
            : isVertical
              ? 'max-w-md'
              : 'max-w-3xl';

          return (
            <React.Fragment key={photo.src}>
              {i > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="flex items-center justify-center py-4"
                >
                  <span className="font-cormorant text-xs tracking-[0.5em] text-neutral-300">
                    {String(i).padStart(2, '0')}
                  </span>
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                className={`mx-auto ${widthClass}`}
              >
                <button
                  onClick={() => onPhotoClick(i)}
                  className={`block w-full overflow-hidden ${isVertical ? 'aspect-[2/3]' : 'aspect-[3/2]'}`}
                >
                  {i < 4 ? (
                    <EagerImage ref={(el) => (imgRefs.current[i] = el)} photo={photo} alt={`${title} ${i + 1}`} />
                  ) : (
                    <LazyImage ref={(el) => (imgRefs.current[i] = el)} photo={photo} alt={`${title} ${i + 1}`} />
                  )}
                </button>
              </motion.div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default IntimateCollection;
