import React, { Suspense, useEffect, useRef, useState } from 'react';
import { motion, useTransform } from 'framer-motion';
import { cldFull } from '../gallery/shared/cloudinaryUtils';
import { useScrollProgress } from './useScrollProgress';
import { useNearViewport } from './useNearViewport';

// three.js lives in its own chunk — only fetched when this act mounts.
const LiquidScene = React.lazy(() => import('./LiquidScene'));

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
 * Act III — a liquid WebGL surface built on three.js / react-three-fiber. Two
 * photographs flow under animated noise, warp toward the cursor with a soft RGB
 * split, and cross-dissolve as you scroll. A static photo shows while the scene
 * (and its textures) load, and a plain image stands in if WebGL is unavailable.
 */
const LiquidShader: React.FC<{ images: string[] }> = ({ images }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(sectionRef);
  const active = useNearViewport(sectionRef);
  const [ok, setOk] = useState(true);
  const [spawned, setSpawned] = useState(false);
  const imgA = images[0];

  // The liquid genie-unfurls from a small window at the bottom over the first
  // ~30% of the section (see uReveal in LiquidScene). The closing invitation then
  // fades in once it has filled the screen.
  const inviteOpacity = useTransform(progress, [0.32, 0.5], [0, 1]);

  useEffect(() => {
    setOk(webglAvailable());
  }, []);

  // Mount once on approach, then pause (never unmount) — see FloatingGallery:
  // churning this canvas leaks WebGL contexts on Safari and can starve the
  // fly-through's live context, since the per-page context budget is shared.
  useEffect(() => {
    if (active) setSpawned(true);
  }, [active]);

  // Warm the two shader textures up front (same reason as FloatingGallery) so the
  // liquid resolves immediately on approach instead of holding the still poster
  // through the first pass on a cold cache.
  useEffect(() => {
    const warm = [images[0], images[1] ?? images[0]].map((src) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.setAttribute('fetchpriority', 'low');
      img.src = cldFull(src, 1440);
      return img;
    });
    return () => {
      warm.forEach((img) => {
        img.src = '';
      });
    };
  }, [images]);

  const Still = (
    <img src={cldFull(imgA, 1920)} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
  );

  return (
    <section ref={sectionRef} className="relative" style={{ height: '180vh' }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        {ok && spawned ? (
          <Suspense fallback={Still}>
            <LiquidScene images={images} progress={progress} active={active} />
          </Suspense>
        ) : ok ? null : (
          Still
        )}

        {/* closing invitation into the work — fades in once the liquid has unfurled */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-end pb-[14vh] pointer-events-none"
          style={{ opacity: inviteOpacity }}
        >
          <a
            href="/photography"
            className="pointer-events-auto group inline-flex flex-col items-center gap-3 text-white mix-blend-difference"
          >
            <span className="font-cormorant tracking-[0.45em] text-[0.7rem] md:text-sm uppercase pl-[0.45em] opacity-80">
              Enter the work
            </span>
            <span className="font-cormorant italic text-3xl md:text-5xl transition-transform duration-500 group-hover:translate-y-1">
              View the Galleries
            </span>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default LiquidShader;
