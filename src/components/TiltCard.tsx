import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * Wraps its children in a real 3D-perspective tilt that follows the cursor.
 * The transform is GPU-cheap (CSS 3D), spring-smoothed, and resets on leave.
 */
const TiltCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  /** maximum tilt in degrees */
  max?: number;
}> = ({ children, className, max = 9 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [max, -max]), { stiffness: 150, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-max, max]), { stiffness: 150, damping: 18 });

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const handleLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={className}
      style={{ perspective: 1000 }}
    >
      <motion.div className="w-full h-full" style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}>
        {children}
      </motion.div>
    </div>
  );
};

export default TiltCard;
