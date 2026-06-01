import React, { Suspense, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';

const AboutHeroScene = React.lazy(() => import('./AboutHeroScene'));

// Cut-out portrait (bg removed), upright (a_270).
const PORTRAIT =
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/a_270,e_background_removal,f_png,w_900/v1754866979/asset/dscf4602.jpg';
// Second layer ("I love water"), upright vertical frame (a_270).
const WATER =
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/a_270,f_auto,q_auto,w_900/v1747703413/LagunaBeach/dsc03853.jpg';

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const PILL = 'w-[clamp(200px,22vw,320px)] h-[clamp(320px,48vh,500px)] rounded-full overflow-hidden';

/**
 * About hero — a tall sticky stage. Two capsule photographs chase the cursor:
 * the portrait catches up quickly, the water trails behind, then merges back
 * behind the portrait when the cursor rests (so it vanishes at rest). As you
 * scroll the stage, the layers stop following and fade out, dissolving the hero
 * smoothly into the next section instead of cutting it off.
 */
const AboutHero: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [ok, setOk] = useState(false);

  const initX = typeof window !== 'undefined' ? window.innerWidth * 0.62 : 600;
  const initY = typeof window !== 'undefined' ? window.innerHeight * 0.5 : 400;
  const tx = useMotionValue(initX);
  const ty = useMotionValue(initY);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });

  // Follow weakens as the stage scrolls away — the target eases back to rest.
  const targetX = useTransform(() => {
    const p = clamp01(scrollYProgress.get());
    return tx.get() * (1 - p) + initX * p;
  });
  const targetY = useTransform(() => {
    const p = clamp01(scrollYProgress.get());
    return ty.get() * (1 - p) + initY * p;
  });

  // Front layer: gentle spring → leads. Back layer: heavier → trails, then merges.
  const fx = useSpring(targetX, { stiffness: 130, damping: 26, mass: 0.7 });
  const fy = useSpring(targetY, { stiffness: 130, damping: 26, mass: 0.7 });
  const bx = useSpring(targetX, { stiffness: 48, damping: 22, mass: 1.2 });
  const by = useSpring(targetY, { stiffness: 48, damping: 22, mass: 1.2 });

  const stageOpacity = useTransform(scrollYProgress, [0.08, 0.94], [1, 0]);

  useEffect(() => {
    setOk(webglAvailable());
    const onMove = (e: MouseEvent) => {
      tx.set(e.clientX);
      ty.set(e.clientY);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [tx, ty]);

  return (
    <section ref={sectionRef} className="relative" style={{ height: '128vh' }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#e7e5e0] text-white">
        {/* iridescent orb, on the right, behind everything */}
        {ok && (
          <motion.div className="absolute inset-0" style={{ opacity: stageOpacity }}>
            <Suspense fallback={null}>
              <AboutHeroScene />
            </Suspense>
          </motion.div>
        )}

        {/* back layer — water — trails the cursor, merges behind the portrait at rest */}
        <motion.div className="absolute left-0 top-0 z-10" style={{ x: bx, y: by, opacity: stageOpacity }} aria-hidden>
          <div style={{ transform: 'translate(-50%, -50%)' }}>
            <div className={PILL}>
              <img src={WATER} alt="" draggable={false} className="w-full h-full object-cover" style={{ filter: 'saturate(0.95) contrast(1.03)' }} />
            </div>
          </div>
        </motion.div>

        {/* front layer, part 1 — the portrait's dark pill, below the title */}
        <motion.div className="absolute left-0 top-0 z-20" style={{ x: fx, y: fy, opacity: stageOpacity }} aria-hidden>
          <div style={{ transform: 'translate(-50%, -50%)' }}>
            <div className={`${PILL} bg-[#0c0c0e]`} />
          </div>
        </motion.div>

        {/* the title — flips colour across whatever sits beneath it */}
        <motion.div
          className="absolute inset-0 z-30 flex items-center pointer-events-none"
          style={{ mixBlendMode: 'difference', opacity: stageOpacity }}
        >
          <h1 className="pl-[5vw] font-cormorant leading-none whitespace-nowrap text-[14vw] md:text-[15vw] text-white">
            Andy <span className="italic">Liu</span>
          </h1>
        </motion.div>

        {/* front layer, part 2 — the cut-out subject, ABOVE the title */}
        <motion.div className="absolute left-0 top-0 z-40 pointer-events-none" style={{ x: fx, y: fy, opacity: stageOpacity }}>
          <div style={{ transform: 'translate(-50%, -50%)' }}>
            <div className={PILL}>
              <img
                src={PORTRAIT}
                alt="Andy Liu"
                draggable={false}
                className="w-full h-full object-cover object-top"
                style={{ filter: 'grayscale(1) contrast(1.06)' }}
              />
            </div>
          </div>
        </motion.div>

        {/* eyebrow + scroll cue */}
        <motion.div className="absolute inset-x-0 bottom-7 z-30 flex flex-col items-center gap-2" style={{ mixBlendMode: 'difference', opacity: stageOpacity }}>
          <span className="font-cormorant tracking-[0.4em] text-[0.6rem] md:text-xs uppercase text-white pl-[0.4em]">
            Photographer · Software Engineer
          </span>
          <span className="block h-9 w-px bg-gradient-to-b from-white to-transparent" />
        </motion.div>
      </div>
    </section>
  );
};

export default AboutHero;
