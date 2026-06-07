import { motion, AnimatePresence } from 'motion/react';
import { useTransition } from '../context/TransitionContext';
import { useEffect, useState } from 'react';

const SharedMorphOverlay = () => {
  const { morphSource, clearMorph } = useTransition();
  const [targetRect, setTargetRect] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (morphSource) {
      setTargetRect({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
  }, [morphSource]);

  return (
    <AnimatePresence>
      {morphSource && (
        <motion.div
          className="fixed z-50 overflow-hidden"
          initial={{
            top: morphSource.rect.top,
            left: morphSource.rect.left,
            width: morphSource.rect.width,
            height: morphSource.rect.height,
            borderRadius: 4,
          }}
          animate={{
            top: 0,
            left: 0,
            width: targetRect.width,
            height: targetRect.height,
            borderRadius: 0,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.6,
            ease: [0.32, 0.72, 0, 1],
          }}
          onAnimationComplete={() => {
            clearMorph();
          }}
        >
          <img
            src={morphSource.imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SharedMorphOverlay;
