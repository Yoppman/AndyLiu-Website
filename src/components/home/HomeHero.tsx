import React, { useMemo } from 'react';
import LivingMosaic from './LivingMosaic';
import WallOpening from './openings/WallOpening';
import FrameOpening from './openings/FrameOpening';
import FloatingGallery from './FloatingGallery';
import ComicGrid from './ComicGrid';
import LiquidShader from './LiquidShader';
import { mosaicPhotos, HERO_IMAGES } from './heroImages';

/** Which opening act greets the visitor (see the in-page preview switcher). */
export type HeroOpening = 'wall' | 'frame' | 'classic';

/**
 * The home title sequence:
 *   I.   Opening         — "The Wall" / "The Frame" / the original Living Mosaic
 *   II.  Selected Frames — fly through a constellation of landscape photographs,
 *        then a nostalgic comic-grid collage + an invitation
 *   III. Liquid          — a flowing WebGL surface two photographs dissolve through
 */
const HomeHero: React.FC<{ opening?: HeroOpening }> = ({ opening = 'wall' }) => {
  const photos = useMemo(() => mosaicPhotos(45), []);

  return (
    <div className="relative bg-[#0a0a0b] text-white">
      {opening === 'classic' ? (
        <LivingMosaic photos={photos} />
      ) : opening === 'frame' ? (
        <FrameOpening />
      ) : (
        <WallOpening photos={photos} />
      )}
      <FloatingGallery />
      <ComicGrid />
      <LiquidShader images={[HERO_IMAGES[1], HERO_IMAGES[2]]} />
    </div>
  );
};

export default HomeHero;
