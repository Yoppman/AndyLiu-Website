import React, { useMemo } from 'react';
import LivingMosaic from './LivingMosaic';
import FloatingGallery from './FloatingGallery';
import ComicGrid from './ComicGrid';
import LiquidShader from './LiquidShader';
import { mosaicPhotos, HERO_IMAGES } from './heroImages';

/**
 * The home title sequence:
 *   I.   Living Mosaic   — a wall of real photographs that resolves to the title
 *   II.  Selected Frames — fly through a constellation of landscape photographs,
 *        then a nostalgic comic-grid collage + an invitation to artists
 *   III. Liquid          — a flowing WebGL surface two photographs dissolve through
 */
const HomeHero: React.FC = () => {
  const photos = useMemo(() => mosaicPhotos(45), []);

  return (
    <div className="relative bg-[#0a0a0b] text-white">
      <LivingMosaic photos={photos} />
      <FloatingGallery />
      <ComicGrid />
      <LiquidShader images={[HERO_IMAGES[1], HERO_IMAGES[2]]} />
    </div>
  );
};

export default HomeHero;
