import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import LazyImage from '../shared/LazyImage';
import EagerImage from '../shared/EagerImage';
import type { GalleryTemplateProps } from '../templateConfig';

const CinematicSlide: React.FC<{
  photo: GalleryTemplateProps['photos'][0];
  index: number;
  total: number;
  title: string;
  onClick: () => void;
  imgRef: (el: HTMLImageElement | null) => void;
  eager?: boolean;
}> = ({ photo, index, total, title, onClick, imgRef, eager }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [1.15, 1, 1, 1.05]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [60, 0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);

  return (
    <div ref={ref} className="h-screen flex items-center justify-center relative" style={{ marginBottom: 80 }}>
      <motion.div
        style={{ scale, y, opacity }}
        className="relative w-full h-[85vh] overflow-hidden cursor-pointer"
        onClick={onClick}
      >
        {eager ? (
          <EagerImage ref={imgRef} photo={photo} alt={`${title} ${index + 1}`} />
        ) : (
          <LazyImage ref={imgRef} photo={photo} alt={`${title} ${index + 1}`} />
        )}
      </motion.div>
      <motion.div
        style={{ opacity }}
        className="absolute bottom-8 right-8 font-cormorant text-sm tracking-[0.3em] text-white/50 mix-blend-difference"
      >
        {index + 1} / {total}
      </motion.div>
    </div>
  );
};

const CinematicScroll: React.FC<GalleryTemplateProps> = ({
  photos,
  title,
  description,
  onPhotoClick,
  imgRefs,
  renderDeferredGrid,
}) => {
  const visiblePhotos = renderDeferredGrid ? photos : photos.slice(0, 4);

  return (
    <div>
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="font-cormorant text-xl leading-relaxed opacity-80">{description}</p>
      </div>
      <div className="relative">
        {visiblePhotos.map((photo, i) => (
          <CinematicSlide
            key={photo.src}
            photo={photo}
            index={i}
            total={photos.length}
            title={title}
            onClick={() => onPhotoClick(i)}
            imgRef={(el) => (imgRefs.current[i] = el)}
            eager={i < 4}
          />
        ))}
      </div>
    </div>
  );
};

export default CinematicScroll;
