import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Images, ArrowRight } from 'lucide-react';
import type { Gallery } from '../../data/types/galleries';

/* ── Cloudinary helpers ── */
const isCloudinary = (url: string) =>
  /res\.cloudinary\.com\/[^/]+\/image\/(upload|fetch)\//.test(url);
const withTx = (src: string, tx: string) =>
  isCloudinary(src) ? src.replace(/(\/image\/(?:upload|fetch)\/)/, `$1${tx}/`) : src;

/** Full cover (crisp). */
const buildCover = (src: string) =>
  isCloudinary(src) ? withTx(src, 'c_fill,g_auto,w_480,h_320,q_auto,f_auto') : src;
/** Tiny blurred placeholder that loads almost instantly (LQIP). */
const buildLQIP = (src: string) =>
  isCloudinary(src) ? withTx(src, 'c_fill,g_auto,w_32,h_22,q_30,f_auto') : src;
/** Small square for the "more photos" filmstrip. */
const buildTile = (src: string) =>
  isCloudinary(src) ? withTx(src, 'c_fill,g_auto,w_160,h_160,q_auto,f_auto') : src;

interface GalleryFlyoutProps {
  gallery: Gallery | null;
  onClose: () => void;
}

const GalleryFlyout: React.FC<GalleryFlyoutProps> = ({ gallery, onClose }) => {
  const [coverLoaded, setCoverLoaded] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Reset the cover's load state whenever a different gallery is opened
  useEffect(() => {
    setCoverLoaded(false);
  }, [gallery?.slug]);

  const hero = gallery ? gallery.hero || gallery.photos[0] : null;

  // A few more frames for the strip — skip the cover so it stays the star
  const morePhotos = useMemo(() => {
    if (!gallery || !hero) return [];
    return gallery.photos.filter((p) => p.src !== hero.src).slice(0, 6);
  }, [gallery, hero]);

  return (
    <AnimatePresence>
      {gallery && hero && (
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

            {/* Hero image — "developing photo" load */}
            <div
              className="relative w-full aspect-[3/2] overflow-hidden"
              style={{ backgroundColor: hero.dominantColor }}
            >
              {/* Blurred low-res placeholder, fades out as the full image arrives */}
              <img
                src={buildLQIP(hero.src)}
                aria-hidden
                className={`absolute inset-0 w-full h-full object-cover scale-110 blur-2xl transition-opacity duration-700 ${
                  coverLoaded ? 'opacity-0' : 'opacity-100'
                }`}
              />
              {/* Full-resolution cover */}
              <img
                key={hero.src}
                src={buildCover(hero.src)}
                alt={gallery.title}
                onLoad={() => setCoverLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                  coverLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
              {/* Refined loading ring (dissolves on load) */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
                  coverLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              >
                <span
                  className="h-8 w-8 rounded-full border-[1.5px] border-white/20 border-t-amber-400 animate-spin"
                  style={{ boxShadow: '0 0 14px rgba(245,158,11,0.18)' }}
                />
              </div>
              {/* Gradient fade into panel */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-neutral-950 to-transparent" />
            </div>

            {/* Info */}
            <div className="px-6 pb-8 -mt-6 relative">
              <h2 className="font-cormorant text-2xl text-white font-bold mb-1">{gallery.title}</h2>
              <p className="font-cormorant text-neutral-400 text-sm leading-relaxed mb-5">
                {gallery.description}
              </p>

              {/* Meta chips */}
              <div className="flex flex-wrap gap-3 mb-7">
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

              {/* Quiet filmstrip of more frames — present, but dimmer than the cover */}
              {morePhotos.length > 0 && (
                <div className="mt-8 pt-6 border-t border-neutral-800/70">
                  <p className="font-cormorant italic text-neutral-500 text-sm tracking-wide mb-3">
                    More from this collection
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {morePhotos.map((p, i) => (
                      <Link
                        key={p.src + i}
                        to={`/photography/${gallery.slug}`}
                        className="group relative aspect-square overflow-hidden rounded-md bg-neutral-900"
                      >
                        <img
                          src={buildTile(p.src)}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover opacity-65 saturate-[0.85] transition duration-500 group-hover:opacity-100 group-hover:saturate-100 group-hover:scale-[1.06]"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default GalleryFlyout;
