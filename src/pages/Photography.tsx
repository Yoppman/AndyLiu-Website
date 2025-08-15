import React from 'react';
import { Link } from 'react-router-dom';
import { galleries } from '../data/galleries';
import { DirectionAwareHover } from '../components/ui/direction-aware-hover';

// Vite env flag
const PLACEHOLDER_ONLY = String(import.meta.env.VITE_PLACEHOLDER_ONLY) === '1';

// --- Cloudinary helpers: transforms belong in the PATH, not the query ---
const isCloudinary = (url: string) =>
  /res\.cloudinary\.com\/[^/]+\/image\/(upload|fetch)\//.test(url);

/** Insert transform string right after /image/upload/ or /image/fetch/ */
const withTx = (src: string, tx: string) =>
  isCloudinary(src) ? src.replace(/(\/image\/(?:upload|fetch)\/)/, `$1${tx}/`) : src;

// Optimized full image (grid)
const buildSrc = (src: string, width: number) =>
  isCloudinary(src)
    ? withTx(src, `c_fill,g_auto,w_${width},q_80,f_auto`)
    : `${src}?f_auto,q_80,w_${width},c_fill,g_auto`; // non-Cloudinary fallback

// Tiny blurred placeholder
const buildPlaceholderSrc = (src: string) =>
  isCloudinary(src)
    ? withTx(src, 'w_24,q_10,f_auto,e_blur:1000')
    : `${src}?w_24,q_10,f_auto,e_blur:1000`; // fallback for non-Cloudinary

const Photography: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16 pt-24">
      <h1 className="font-cormorant font-bold text-4xl mb-12 text-center">
        Photography Collections
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
        {galleries.map((gallery, index) => {
          const preview = gallery.hero || gallery.photos[0];

          const imageUrl = PLACEHOLDER_ONLY
            ? buildPlaceholderSrc(preview.src)
            : buildSrc(preview.src, 500);

          // Make the placeholder *look* blurred even if a cached edge returns a sharp file.
          const placeholderClasses = PLACEHOLDER_ONLY ? 'blur-xl scale-105' : '';
          const perfClasses = index < 6 ? '' : 'will-change-transform';

          return (
            <Link key={gallery.slug} to={`/photography/${gallery.slug}`} className="block">
              <DirectionAwareHover
                imageUrl={imageUrl}
                className="h-80 w-80 md:h-96 md:w-96"
                childrenClassName="font-cormorant"
                imageClassName={`${perfClasses} ${placeholderClasses}`.trim()}
              >
                <p className="font-bold text-xl mb-2">{gallery.title}</p>
                <p className="font-normal text-sm opacity-90 line-clamp-2">
                  {gallery.description}
                </p>
              </DirectionAwareHover>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Photography;