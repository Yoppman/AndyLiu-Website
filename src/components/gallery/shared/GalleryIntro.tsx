import React from 'react';
import { motion } from 'motion/react';

interface Props {
  meta?: string;
  intro?: string;
  color?: string;
}

/** Poetic opener shown between the hero and the photo grid. */
const GalleryIntro: React.FC<Props> = ({ meta, intro, color }) => {
  if (!meta && !intro) return null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      style={{ color }}
      className="max-w-3xl mx-auto px-6 pt-16 pb-8 md:pt-24 md:pb-12 text-center"
    >
      {meta && (
        <p className="font-cormorant text-xs md:text-sm tracking-[0.35em] uppercase opacity-50 mb-6">
          {meta}
        </p>
      )}
      {intro && (
        <p className="font-cormorant italic text-2xl md:text-3xl lg:text-[2rem] leading-relaxed [text-wrap:balance]">
          {intro}
        </p>
      )}
      <div className="mx-auto mt-10 h-px w-16 bg-current opacity-20" />
    </motion.section>
  );
};

export default GalleryIntro;
