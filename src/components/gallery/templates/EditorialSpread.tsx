import React from 'react';
import { motion } from 'motion/react';
import EagerImage from '../shared/EagerImage';
import LazyImage from '../shared/LazyImage';
import type { GalleryTemplateProps } from '../templateConfig';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

const EditorialSpread: React.FC<GalleryTemplateProps> = ({
  photos,
  title,
  description,
  onPhotoClick,
  imgRefs,
  renderDeferredGrid,
}) => {
  const cycles: React.ReactNode[] = [];
  let i = 0;
  let cycleNum = 0;

  while (i < photos.length) {
    const isDeferred = i >= 4;
    if (isDeferred && !renderDeferredGrid) break;

    const cyclePhotos: React.ReactNode[] = [];
    const cycleStart = i;

    // Pattern: full-width → side-by-side pair → offset single → triptych
    // 1. Full-width
    if (i < photos.length) {
      const idx = i;
      const photo = photos[idx];
      cyclePhotos.push(
        <motion.div key={`full-${idx}`} variants={fadeUp} className="col-span-2">
          <button
            onClick={() => onPhotoClick(idx)}
            className={`block w-full overflow-hidden ${photo.orientation === 'vertical' ? 'aspect-[2/3] max-w-2xl mx-auto' : 'aspect-[16/9]'}`}
          >
            {idx < 4 ? (
              <EagerImage ref={(el) => (imgRefs.current[idx] = el)} photo={photo} alt={`${title} ${idx + 1}`} />
            ) : (
              <LazyImage ref={(el) => (imgRefs.current[idx] = el)} photo={photo} alt={`${title} ${idx + 1}`} />
            )}
          </button>
        </motion.div>
      );
      i++;
    }

    // 2. Side-by-side pair
    if (i + 1 < photos.length) {
      const idx1 = i, idx2 = i + 1;
      cyclePhotos.push(
        <motion.div key={`pair-${idx1}`} variants={fadeUp} className="col-span-1">
          <button
            onClick={() => onPhotoClick(idx1)}
            className={`block w-full overflow-hidden ${photos[idx1].orientation === 'vertical' ? 'aspect-[2/3]' : 'aspect-[3/2]'}`}
          >
            <LazyImage ref={(el) => (imgRefs.current[idx1] = el)} photo={photos[idx1]} alt={`${title} ${idx1 + 1}`} />
          </button>
        </motion.div>
      );
      cyclePhotos.push(
        <motion.div key={`pair-${idx2}`} variants={fadeUp} className="col-span-1">
          <button
            onClick={() => onPhotoClick(idx2)}
            className={`block w-full overflow-hidden ${photos[idx2].orientation === 'vertical' ? 'aspect-[2/3]' : 'aspect-[3/2]'}`}
          >
            <LazyImage ref={(el) => (imgRefs.current[idx2] = el)} photo={photos[idx2]} alt={`${title} ${idx2 + 1}`} />
          </button>
        </motion.div>
      );
      i += 2;
    } else if (i < photos.length) {
      const idx = i;
      cyclePhotos.push(
        <motion.div key={`single-${idx}`} variants={fadeUp} className="col-span-2">
          <button
            onClick={() => onPhotoClick(idx)}
            className={`block w-full max-w-2xl mx-auto overflow-hidden ${photos[idx].orientation === 'vertical' ? 'aspect-[2/3]' : 'aspect-[3/2]'}`}
          >
            <LazyImage ref={(el) => (imgRefs.current[idx] = el)} photo={photos[idx]} alt={`${title} ${idx + 1}`} />
          </button>
        </motion.div>
      );
      i++;
    }

    // 3. Offset single (65% width)
    if (i < photos.length) {
      const idx = i;
      const offsetLeft = cycleNum % 2 === 0;
      cyclePhotos.push(
        <motion.div
          key={`offset-${idx}`}
          variants={fadeUp}
          className={`col-span-2 ${offsetLeft ? 'pr-[35%]' : 'pl-[35%]'}`}
        >
          <button
            onClick={() => onPhotoClick(idx)}
            className={`block w-full overflow-hidden ${photos[idx].orientation === 'vertical' ? 'aspect-[2/3]' : 'aspect-[3/2]'}`}
          >
            <LazyImage ref={(el) => (imgRefs.current[idx] = el)} photo={photos[idx]} alt={`${title} ${idx + 1}`} />
          </button>
        </motion.div>
      );
      i++;
    }

    // 4. Triptych (3-col)
    const triptychCount = Math.min(3, photos.length - i);
    if (triptychCount > 0) {
      const triptychItems: React.ReactNode[] = [];
      for (let t = 0; t < triptychCount; t++) {
        const idx = i + t;
        triptychItems.push(
          <motion.div key={`tri-${idx}`} variants={fadeUp}>
            <button
              onClick={() => onPhotoClick(idx)}
              className={`block w-full overflow-hidden ${photos[idx].orientation === 'vertical' ? 'aspect-[2/3]' : 'aspect-[4/5]'}`}
            >
              <LazyImage ref={(el) => (imgRefs.current[idx] = el)} photo={photos[idx]} alt={`${title} ${idx + 1}`} />
            </button>
          </motion.div>
        );
      }
      cyclePhotos.push(
        <div key={`triptych-${i}`} className="col-span-2 grid grid-cols-3 gap-4">
          {triptychItems}
        </div>
      );
      i += triptychCount;
    }

    // Photo counter between cycles
    cycles.push(
      <motion.div
        key={`cycle-${cycleNum}`}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="grid grid-cols-2 gap-x-8 gap-y-12"
      >
        {cyclePhotos}
      </motion.div>
    );

    if (i < photos.length) {
      cycles.push(
        <div key={`counter-${cycleNum}`} className="text-center py-8">
          <span className="font-cormorant text-sm tracking-[0.3em] opacity-40 uppercase">
            {i} of {photos.length}
          </span>
        </div>
      );
    }

    cycleNum++;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="max-w-3xl mx-auto mb-16">
        <p className="font-cormorant text-xl leading-relaxed opacity-80">{description}</p>
      </div>
      <div className="space-y-16">{cycles}</div>
    </div>
  );
};

export default EditorialSpread;
