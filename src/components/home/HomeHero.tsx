import React, { useMemo } from 'react';
import LivingMosaic from './LivingMosaic';
import CinematicSlices from './CinematicSlices';
import LiquidShader from './LiquidShader';
import { mosaicPhotos, HERO_IMAGES } from './heroImages';

/**
 * The home title sequence — three scroll-driven acts that play like the
 * opening of a film about the work:
 *   I.  Living Mosaic   — a wall of real photographs that resolves to the title
 *   II. Slice Reveal    — (next)
 *   III. Liquid          — (next)
 */
const HomeHero: React.FC = () => {
  const photos = useMemo(() => mosaicPhotos(45), []);

  return (
    <div className="relative bg-[#0a0a0b] text-white">
      <LivingMosaic photos={photos} />
      <CinematicSlices images={HERO_IMAGES} />
      <LiquidShader images={[HERO_IMAGES[1], HERO_IMAGES[3]]} />
    </div>
  );
};

export default HomeHero;
