import React, { lazy, Suspense, useMemo } from 'react';
import WallOpening from './openings/WallOpening';
import { mosaicPhotos, HERO_IMAGES } from './heroImages';

// The WebGL acts (three.js / react-three-fiber) are the heaviest modules on the
// site. Loading them eagerly forces the browser to fetch and compile the whole
// three.js graph before the landing page can paint — slow in dev, and a stall
// risk on slow connections. They each already wait until they near the viewport
// to spin up a WebGL context, so code-split them too: the wall hero shows
// instantly and each act's bundle streams in as you scroll toward it. The
// alternate openings only render for non-default `opening` values, so they're
// never fetched on the standard home page.
const LivingMosaic = lazy(() => import('./LivingMosaic'));
const FrameOpening = lazy(() => import('./openings/FrameOpening'));
const FloatingGallery = lazy(() => import('./FloatingGallery'));
const ComicGrid = lazy(() => import('./ComicGrid'));
const LiquidShader = lazy(() => import('./LiquidShader'));

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
      {/* Per-act Suspense boundaries: the eager wall hero paints immediately and
          each lazy act streams in on its own, so a slow one never blocks the rest. */}
      {opening === 'classic' ? (
        <Suspense fallback={null}><LivingMosaic photos={photos} /></Suspense>
      ) : opening === 'frame' ? (
        <Suspense fallback={null}><FrameOpening /></Suspense>
      ) : (
        <WallOpening />
      )}
      <Suspense fallback={null}><FloatingGallery /></Suspense>
      <Suspense fallback={null}><ComicGrid /></Suspense>
      <Suspense fallback={null}><LiquidShader images={[HERO_IMAGES[1], HERO_IMAGES[2]]} /></Suspense>
    </div>
  );
};

export default HomeHero;
