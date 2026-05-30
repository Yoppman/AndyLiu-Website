import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { PLACEHOLDER_ONLY, cldFull, cldSet, cldPlaceholder, Photo } from './cloudinaryUtils';

type HeroVariant = 'standard' | 'cinematic' | 'minimal' | 'split';

interface Props {
  photo: Photo;
  title: string;
  isMorphing: boolean;
  variant?: HeroVariant;
  description?: string;
}

/* ---- Helper: shared hero image ---- */
const HeroImg: React.FC<{ photo: Photo; title: string; className?: string; sizes?: string }> = ({
  photo, title, className = '', sizes = '100vw',
}) =>
  PLACEHOLDER_ONLY ? (
    <img
      src={cldPlaceholder(photo.src)}
      alt={title}
      className={`blur-xl scale-105 ${className}`}
      style={{ backgroundColor: photo.dominantColor }}
    />
  ) : (
    <img
      src={cldFull(photo.src, 1200)}
      srcSet={cldSet(photo.src, [600, 1200, 1800])}
      sizes={sizes}
      alt={title}
      className={className}
      loading="eager"
      decoding="async"
      style={{ backgroundColor: photo.dominantColor }}
    />
  );

/* ---- Cinematic hero (uses scroll hooks – must be its own component) ---- */
const CinematicHero: React.FC<Props> = ({ photo, title, isMorphing, description }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.15, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.2, 0.4, 0.7]);

  return (
    <div
      ref={ref}
      className="relative w-full h-screen overflow-hidden"
      style={{ opacity: isMorphing ? 0 : 1 }}
    >
      <motion.div className="absolute inset-0" style={{ scale, y }}>
        <HeroImg photo={photo} title={title} className="w-full h-full object-cover" />
      </motion.div>
      <motion.div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <h1 className="font-cormorant text-5xl md:text-7xl lg:text-8xl tracking-wide">{title}</h1>
        {description && (
          <p className="font-cormorant text-lg md:text-xl mt-4 max-w-xl text-center opacity-80">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

/* ---- Main GalleryHero ---- */
const GalleryHero: React.FC<Props> = (props) => {
  const { photo, title, isMorphing, variant = 'standard', description } = props;

  if (variant === 'cinematic') return <CinematicHero {...props} />;

  if (variant === 'minimal') {
    return (
      <div
        className="relative w-full h-[35vh] overflow-hidden"
        style={{ opacity: isMorphing ? 0 : 1 }}
      >
        <HeroImg photo={photo} title={title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <h1 className="absolute bottom-6 left-8 text-white font-cormorant text-3xl md:text-4xl tracking-wider uppercase">
          {title}
        </h1>
      </div>
    );
  }

  if (variant === 'split') {
    return (
      <div
        className="relative w-full h-[60vh] md:h-[50vh] flex flex-col md:flex-row overflow-hidden"
        style={{ opacity: isMorphing ? 0 : 1 }}
      >
        <div className="md:w-1/2 h-1/2 md:h-full relative">
          <HeroImg photo={photo} title={title} className="w-full h-full object-cover" sizes="50vw" />
        </div>
        <div className="md:w-1/2 h-1/2 md:h-full flex flex-col justify-center px-8 md:px-16 bg-neutral-950">
          <h1 className="font-cormorant text-4xl md:text-6xl text-white mb-4">{title}</h1>
          {description && (
            <p className="font-cormorant text-lg text-neutral-400 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
    );
  }

  // standard
  return (
    <div
      className={`relative w-full h-[50vh] overflow-hidden ${
        photo.orientation === 'vertical' ? 'aspect-[2/3]' : 'aspect-[3/2]'
      }`}
      style={{ opacity: isMorphing ? 0 : 1 }}
    >
      <HeroImg photo={photo} title={title} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/30" />
      <h1 className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white font-cormorant text-4xl md:text-5xl lg:text-6xl">
        {title}
      </h1>
    </div>
  );
};

export default GalleryHero;
