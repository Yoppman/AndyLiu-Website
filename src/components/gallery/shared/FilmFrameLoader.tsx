import React from 'react';
import { motion } from 'motion/react';

/**
 * Cinematic "film frame" loading state, shown over a photo's dominant colour
 * while its full-resolution frame decodes. Corner brackets frame the slot and a
 * soft exposure line sweeps down it, so a not-yet-loaded neighbour reads as a
 * frame being exposed rather than a generic spinner.
 */
const FilmFrameLoader: React.FC<{ color: string }> = ({ color }) => {
  const corner = 'absolute h-6 w-6 border-[#f1efe9]/35 md:h-8 md:w-8';
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: color || '#171717' }}
    >
      {/* keeps the brackets legible on any dominant colour */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35" />

      {/* corner brackets framing the slot */}
      <div className={`${corner} left-3 top-3 border-l border-t md:left-4 md:top-4`} />
      <div className={`${corner} right-3 top-3 border-r border-t md:right-4 md:top-4`} />
      <div className={`${corner} bottom-3 left-3 border-b border-l md:bottom-4 md:left-4`} />
      <div className={`${corner} bottom-3 right-3 border-b border-r md:bottom-4 md:right-4`} />

      {/* exposure line sweeping down the frame */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 h-24"
        style={{
          background:
            'linear-gradient(to bottom, transparent, rgba(241,239,233,0.05) 42%, rgba(241,239,233,0.14) 50%, rgba(241,239,233,0.05) 58%, transparent)',
        }}
        initial={{ top: '-25%' }}
        animate={{ top: ['-25%', '115%'] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* faint frame number, in the same cormorant voice as the counter */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 font-cormorant text-[10px] tracking-[0.35em] text-[#f1efe9]/30">
        ◦ ◦ ◦
      </div>
    </div>
  );
};

export default FilmFrameLoader;
