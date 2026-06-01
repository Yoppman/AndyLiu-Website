import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PLACEHOLDER_ONLY, cldFull, cldSet, cldPlaceholder, Photo } from './cloudinaryUtils';

interface Props {
  photos: Photo[];
  title: string;
  lightboxIdx: number | null;
  setLightboxIdx: (idx: number | null) => void;
}

const GalleryLightbox: React.FC<Props> = ({ photos, title, lightboxIdx, setLightboxIdx }) => {
  if (lightboxIdx === null) return null;
  const photo = photos[lightboxIdx];

  // Images are delivered upright from Cloudinary, so the lightbox just fits to viewport.
  const orientClass = 'max-w-[92vw] max-h-[90vh]';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
        onClick={() => setLightboxIdx(null)}
      >
        <button
          onClick={() => setLightboxIdx(null)}
          className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10"
        >
          <X size={32} />
        </button>

        {lightboxIdx > 0 && (
          <button
            className="absolute left-4 md:left-8 text-white/50 hover:text-white transition-colors z-10"
            onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
          >
            <ChevronLeft size={40} />
          </button>
        )}

        {lightboxIdx < photos.length - 1 && (
          <button
            className="absolute right-4 md:right-8 text-white/50 hover:text-white transition-colors z-10"
            onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
          >
            <ChevronRight size={40} />
          </button>
        )}

        <motion.img
          key={lightboxIdx}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          src={PLACEHOLDER_ONLY ? cldPlaceholder(photo.src) : cldFull(photo.src, 1200)}
          srcSet={PLACEHOLDER_ONLY ? undefined : cldSet(photo.src, [600, 1200, 1800])}
          sizes={PLACEHOLDER_ONLY ? undefined : '(max-width:600px) 100vw, (max-width:1200px) 100vw, 1200px'}
          alt={`${title} shot ${lightboxIdx + 1}`}
          onClick={(e) => e.stopPropagation()}
          className={`transform origin-center ${orientClass} object-contain ${PLACEHOLDER_ONLY ? 'blur-xl scale-105' : ''}`}
          loading="eager"
          style={{ backgroundColor: photo.dominantColor }}
        />

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 font-cormorant text-sm tracking-widest">
          {lightboxIdx + 1} / {photos.length}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GalleryLightbox;
