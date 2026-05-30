import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import EagerImage from '../shared/EagerImage';
import LazyImage from '../shared/LazyImage';
import type { GalleryTemplateProps } from '../templateConfig';

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const ScatteredExhibition: React.FC<GalleryTemplateProps> = ({
  photos,
  title,
  description,
  onPhotoClick,
  imgRefs,
  renderDeferredGrid,
}) => {
  const visiblePhotos = renderDeferredGrid ? photos : photos.slice(0, 4);

  const transforms = useMemo(() => {
    const rng = seededRandom(title.length * 7 + 42);
    return photos.map((_, i) => ({
      rotation: (rng() - 0.5) * 6,
      xOffset: (rng() - 0.5) * 8,
      scale: 0.9 + rng() * 0.2,
      zIndex: Math.floor(rng() * 10),
    }));
  }, [photos, title]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="max-w-3xl mx-auto mb-16 text-center">
        <p className="font-cormorant text-xl leading-relaxed opacity-80">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        {visiblePhotos.map((photo, i) => {
          const t = transforms[i];
          const isVertical = photo.orientation === 'vertical';

          return (
            <motion.div
              key={photo.src}
              initial={{
                opacity: 0,
                rotate: t.rotation + (Math.random() > 0.5 ? 5 : -5),
                scale: 0.8,
              }}
              whileInView={{
                opacity: 1,
                rotate: t.rotation,
                scale: t.scale,
              }}
              whileHover={{
                rotate: 0,
                scale: 1.08,
                zIndex: 20,
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 20,
                mass: 0.8,
              }}
              style={{
                zIndex: t.zIndex,
                x: `${t.xOffset}%`,
              }}
              className="relative cursor-pointer"
            >
              <button
                onClick={() => onPhotoClick(i)}
                className={`block w-full overflow-hidden rounded-sm bg-white p-2 shadow-lg ${
                  isVertical ? 'aspect-[2/3]' : 'aspect-[3/2]'
                }`}
              >
                {i < 4 ? (
                  <EagerImage ref={(el) => (imgRefs.current[i] = el)} photo={photo} alt={`${title} ${i + 1}`} />
                ) : (
                  <LazyImage ref={(el) => (imgRefs.current[i] = el)} photo={photo} alt={`${title} ${i + 1}`} />
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ScatteredExhibition;
