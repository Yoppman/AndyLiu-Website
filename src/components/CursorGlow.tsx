import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * A single soft, warm light that trails the cursor — like a lantern carried
 * through the dark. Screen-blended, so it gently lights the cinematic dark
 * sections and recedes to almost nothing over the light editorial ones. On a
 * warm candlelight gold (kin to the site's amber accent), spring-lagged for a
 * graceful trail. Desktop + non-reduced-motion only. Replaces the old
 * multi-color particle trail.
 */
const CursorGlow: React.FC = () => {
  const [on, setOn] = useState(false);
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const x = useSpring(mx, { stiffness: 170, damping: 26, mass: 0.6 });
  const y = useSpring(my, { stiffness: 170, damping: 26, mass: 0.6 });

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return; // no cursor light on touch / reduced motion
    setOn(true);
    const move = (e: PointerEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [mx, my]);

  if (!on) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-40"
      style={{ x, y, mixBlendMode: 'screen' }}
    >
      <div
        className="h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(244,208,150,0.3), rgba(244,208,150,0.1) 42%, transparent 72%)',
        }}
      />
    </motion.div>
  );
};

export default CursorGlow;
