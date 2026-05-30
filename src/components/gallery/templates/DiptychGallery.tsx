import React from 'react';
import { motion } from 'motion/react';
import EagerImage from '../shared/EagerImage';
import LazyImage from '../shared/LazyImage';
import type { GalleryTemplateProps } from '../templateConfig';

const toRoman = (n: number): string => {
  const map: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let result = '';
  let remaining = n;
  for (const [value, numeral] of map) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }
  return result;
};

const DiptychGallery: React.FC<GalleryTemplateProps> = ({
  photos,
  title,
  description,
  onPhotoClick,
  imgRefs,
  renderDeferredGrid,
}) => {
  const visiblePhotos = renderDeferredGrid ? photos : photos.slice(0, 4);

  // Group into pairs
  const groups: { photos: typeof visiblePhotos; indices: number[] }[] = [];
  let i = 0;
  while (i < visiblePhotos.length) {
    if (i + 1 < visiblePhotos.length) {
      groups.push({ photos: [visiblePhotos[i], visiblePhotos[i + 1]], indices: [i, i + 1] });
      i += 2;
    } else {
      groups.push({ photos: [visiblePhotos[i]], indices: [i] });
      i++;
    }
  }

  const ImgComponent = ({ idx, photo }: { idx: number; photo: typeof photos[0] }) =>
    idx < 4 ? (
      <EagerImage ref={(el) => (imgRefs.current[idx] = el)} photo={photo} alt={`${title} ${idx + 1}`} />
    ) : (
      <LazyImage ref={(el) => (imgRefs.current[idx] = el)} photo={photo} alt={`${title} ${idx + 1}`} />
    );

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="max-w-3xl mx-auto mb-16 text-center">
        <p className="font-cormorant text-xl leading-relaxed opacity-80">{description}</p>
      </div>

      <div className="space-y-20">
        {groups.map((group, gi) => (
          <div key={gi}>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-6"
            >
              <span className="font-cormorant text-xs tracking-[0.5em] text-neutral-300 uppercase">
                {toRoman(gi + 1)}
              </span>
            </motion.div>

            {group.photos.length === 2 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <button
                    onClick={() => onPhotoClick(group.indices[0])}
                    className={`block w-full overflow-hidden ${
                      group.photos[0].orientation === 'vertical' ? 'aspect-[2/3]' : 'aspect-[3/2]'
                    }`}
                  >
                    <ImgComponent idx={group.indices[0]} photo={group.photos[0]} />
                  </button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
                >
                  <button
                    onClick={() => onPhotoClick(group.indices[1])}
                    className={`block w-full overflow-hidden ${
                      group.photos[1].orientation === 'vertical' ? 'aspect-[2/3]' : 'aspect-[3/2]'
                    }`}
                  >
                    <ImgComponent idx={group.indices[1]} photo={group.photos[1]} />
                  </button>
                </motion.div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.7 }}
                className="max-w-[60%] mx-auto"
              >
                <button
                  onClick={() => onPhotoClick(group.indices[0])}
                  className={`block w-full overflow-hidden ${
                    group.photos[0].orientation === 'vertical' ? 'aspect-[2/3]' : 'aspect-[3/2]'
                  }`}
                >
                  <ImgComponent idx={group.indices[0]} photo={group.photos[0]} />
                </button>
              </motion.div>
            )}

            {gi < groups.length - 1 && (
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mt-12 h-px bg-neutral-200 origin-left"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiptychGallery;
