import React, { Suspense, useEffect, useRef, useState } from 'react';
import { motion, useTransform } from 'framer-motion';
import { useScrollProgress } from './useScrollProgress';
import { useNearViewport } from './useNearViewport';
import { cldFull } from '../gallery/shared/cloudinaryUtils';
import { SELECTED_FRAMES } from './heroImages';
import SceneErrorBoundary from '../webgl/SceneErrorBoundary';

const FloatingGalleryScene = React.lazy(() => import('./FloatingGalleryScene'));

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * "Selected Frames" — a constellation of landscape photographs the camera flies
 * through as you scroll, drifting toward the cursor. Opens with a title; the
 * comic grid + invitation that follow it live in ComicGrid.
 */
const FloatingGallery: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(sectionRef);
  const active = useNearViewport(sectionRef);
  const [ok, setOk] = useState(true);
  const [spawned, setSpawned] = useState(false);
  // The fixed, hand-curated set the fly-through threads through (edit the list
  // in heroImages.ts). A stable module constant, so the warm-up and scene below
  // see the same 16 every render — deterministic across reloads.
  const photos = SELECTED_FRAMES;

  useEffect(() => {
    setOk(webglAvailable());
  }, []);

  // Mount the WebGL scene the first time it nears the viewport, then KEEP it
  // mounted and merely pause its render loop when it scrolls away (the `active`
  // prop drives frameloop). Tearing the canvas down and rebuilding it on every
  // scroll leaks WebGL contexts faster than Safari frees them; they pile up
  // until the browser starts killing the LIVE one ("THREE.WebGLRenderer: Context
  // Lost." with no restore), which froze the fly-through on ~5 photos with the
  // rest black until a scroll-away-and-back handed it a fresh context.
  useEffect(() => {
    if (active) setSpawned(true);
  }, [active]);

  // Warm the 16 constellation textures from the moment the home hero mounts, so
  // their bytes are already cached (and decoded) by the time the visibility-gated
  // scene mounts on approach. The scene now loads each texture independently, so a
  // cold cache no longer blanks the whole fly-through — but warming here still means
  // the very first downward pass shows real photos instead of frames that only fill
  // in once you've scrolled down and back. crossOrigin matches three's TextureLoader
  // so the browser reuses the cached bytes; no fetchpriority hint, because
  // deprioritizing this prefetch is what let the scroll outrun the download.
  useEffect(() => {
    const warm = photos.map((src) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.src = cldFull(src, 1280);
      img.decode?.().catch(() => {});
      return img;
    });
    return () => {
      warm.forEach((img) => {
        img.src = '';
      });
    };
  }, [photos]);

  const introOpacity = useTransform(progress, [0, 0.16], [1, 0]);
  const introY = useTransform(progress, [0, 0.16], [0, -30]);

  return (
    <section ref={sectionRef} className="relative" style={{ height: '340vh' }}>
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ background: 'radial-gradient(120% 100% at 50% 30%, #16161a 0%, #0a0a0b 70%)' }}
      >
        {ok && spawned && (
          <SceneErrorBoundary>
            <Suspense fallback={null}>
              <FloatingGalleryScene images={photos} progress={progress} active={active} />
            </Suspense>
          </SceneErrorBoundary>
        )}

        {/* cinematic edge framing over the scene */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(115% 95% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)' }}
        />

        {/* Opening title */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none"
          style={{ opacity: introOpacity, y: introY }}
        >
          <span className="font-cormorant tracking-[0.5em] text-[0.7rem] md:text-sm text-white/70 uppercase mb-4 pl-[0.5em]">
            Selected Frames
          </span>
          <h2 className="font-cormorant text-white text-5xl md:text-7xl lg:text-8xl leading-[0.95] drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
            A space
            <span className="block italic font-light">for the work</span>
          </h2>
        </motion.div>
      </div>
    </section>
  );
};

export default FloatingGallery;
