import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Images, ArrowRight } from 'lucide-react';
import type { Gallery } from '../../data/types/galleries';

/* ── Cloudinary helpers (same logic as Photography page) ── */
const isCloudinary = (url: string) =>
  /res\.cloudinary\.com\/[^/]+\/image\/(upload|fetch)\//.test(url);

const withTx = (src: string, tx: string) =>
  isCloudinary(src)
    ? src.replace(/(\/image\/(?:upload|fetch)\/)/, `$1${tx}/`)
    : src;

const buildThumb = (src: string) =>
  isCloudinary(src)
    ? withTx(src, 'c_fill,g_auto,w_480,h_320,q_auto,f_auto')
    : src;

interface GalleryFlyoutProps {
  gallery: Gallery | null;
  onClose: () => void;
}

const GalleryFlyout: React.FC<GalleryFlyoutProps> = ({ gallery, onClose }) => {
  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {gallery && (
        <>
          {/* Backdrop — click to dismiss */}
          <motion.div
            key="flyout-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[1000] bg-black/30"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            key="flyout-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 z-[1001] h-full w-[360px] max-w-[90vw] bg-neutral-950 border-l border-neutral-800 shadow-2xl overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-neutral-800/80 hover:bg-neutral-700 transition-colors text-neutral-300 z-10"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {/* Hero image */}
            <div className="relative w-full aspect-[3/2] overflow-hidden">
              <img
                src={buildThumb((gallery.hero || gallery.photos[0]).src)}
                alt={gallery.title}
                className="w-full h-full object-cover"
              />
              {/* Gradient fade into panel */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-neutral-950 to-transparent" />
            </div>

            {/* Info */}
            <div className="px-6 pb-8 -mt-6 relative">
              <h2 className="font-cormorant text-2xl text-white font-bold mb-1">
                {gallery.title}
              </h2>
              <p className="font-cormorant text-neutral-400 text-sm leading-relaxed mb-5">
                {gallery.description}
              </p>

              {/* Meta chips */}
              <div className="flex flex-wrap gap-3 mb-8">
                {gallery.location && (
                  <span className="flex items-center gap-1.5 text-xs text-neutral-400 bg-neutral-800/60 px-3 py-1.5 rounded-full">
                    <MapPin size={12} />
                    {gallery.location.region}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs text-neutral-400 bg-neutral-800/60 px-3 py-1.5 rounded-full">
                  <Images size={12} />
                  {gallery.photos.length} photos
                </span>
              </div>

              {/* CTA */}
              <Link
                to={`/photography/${gallery.slug}`}
                className="group flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-amber-600/90 hover:bg-amber-500 text-white font-cormorant text-lg transition-colors"
              >
                View Gallery
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default GalleryFlyout;
