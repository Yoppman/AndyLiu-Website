import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LayoutGrid, Rows3, Aperture } from 'lucide-react';
import { galleries } from '../data/galleries';
import { DirectionAwareHover } from '../components/ui/direction-aware-hover';
import PageTransition from '../components/PageTransition';
import MasonryGrid from '../components/MasonryGrid';
import { useTransition } from '../context/TransitionContext';

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
    ? withTx(src, `c_fill,g_auto,w_${width},dpr_auto,q_auto,f_auto`)
    : `${src}?f_auto,q_80,w_${width},c_fill,g_auto`; // non-Cloudinary fallback

// Tiny blurred placeholder
const buildPlaceholderSrc = (src: string) =>
  isCloudinary(src)
    ? withTx(src, 'w_24,q_10,f_auto,e_blur:1000')
    : `${src}?w_24,q_10,f_auto,e_blur:1000`; // fallback for non-Cloudinary

const containerVariants = {
  animate: {
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

type ViewMode = 'grid' | 'masonry';

const Photography: React.FC = () => {
  const { setMorphSource } = useTransition();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('photography-view') as ViewMode) || 'grid',
  );

  const switchView = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('photography-view', mode);
  }, []);

  const handleCardClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, gallery: typeof galleries[0], imageUrl: string) => {
      e.preventDefault();
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      setMorphSource({ rect, imageUrl, slug: gallery.slug });
      navigate(`/photography/${gallery.slug}`);
    },
    [setMorphSource, navigate],
  );

  return (
    <PageTransition>
    <div className="max-w-7xl mx-auto px-6 py-16 pt-24">
      {/* Header row: title + view toggle */}
      <div className="flex items-center justify-between mb-12">
        {/* Portraits subpage link — balances the view toggle, keeps the title centered */}
        <Link
          to="/photography/portraits"
          className="group inline-flex items-center gap-2 text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <Aperture size={16} strokeWidth={1.5} className="opacity-70 transition-transform duration-500 group-hover:rotate-90" />
          <span className="font-cormorant text-base">Portraits</span>
          <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-700">
            beta
          </span>
        </Link>
        <h1 className="font-cormorant font-bold text-4xl text-center">
          Photography Collections
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => switchView('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'text-neutral-900 bg-neutral-200/60'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
            aria-label="Grid view"
            title="Grid view"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => switchView('masonry')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'masonry'
                ? 'text-neutral-900 bg-neutral-200/60'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
            aria-label="Masonry view"
            title="Masonry view"
          >
            <Rows3 size={18} />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        /* ── Grid view (original) ── */
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center"
          variants={containerVariants}
          initial="initial"
          animate="animate"
        >
          {galleries.map((gallery, index) => {
            const preview = gallery.hero || gallery.photos[0];

            const imageUrl = PLACEHOLDER_ONLY
              ? buildPlaceholderSrc(preview.src)
              : buildSrc(preview.src, 2000);

            const placeholderClasses = PLACEHOLDER_ONLY ? 'blur-xl scale-105' : '';
            const perfClasses = index < 6 ? '' : 'will-change-transform';

            return (
              <motion.div key={gallery.slug} variants={itemVariants}>
                <Link
                  to={`/photography/${gallery.slug}`}
                  className="block"
                  onClick={(e) => handleCardClick(e, gallery, imageUrl)}
                >
                  <DirectionAwareHover
                    imageUrl={imageUrl}
                    className="h-80 w-80 md:h-96 md:w-96 rounded-xl"
                    childrenClassName="font-cormorant"
                    imageClassName={`${perfClasses} ${placeholderClasses}`.trim()}
                  >
                    <p className="font-bold text-xl mb-2">{gallery.title}</p>
                    <p className="font-normal text-sm opacity-90 line-clamp-2">
                      {gallery.description}
                    </p>
                  </DirectionAwareHover>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        /* ── Masonry view ── */
        <MasonryGrid
          galleries={galleries}
          onCardClick={handleCardClick}
        />
      )}
    </div>
    </PageTransition>
  );
};

export default Photography;