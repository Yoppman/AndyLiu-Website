import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, ArrowUpRight } from 'lucide-react';
import type { Gallery } from '../data/types/galleries';
import { galleryDimensions } from '../data/galleryDimensions';

/* ── Cloudinary helpers ── */
const isCloudinary = (url: string) =>
  /res\.cloudinary\.com\/[^/]+\/image\/(upload|fetch)\//.test(url);

const withTx = (src: string, tx: string) =>
  isCloudinary(src)
    ? src.replace(/(\/image\/(?:upload|fetch)\/)/, `$1${tx}/`)
    : src;

/**
 * Build an optimised Cloudinary URL, including rotation when the source
 * file is stored sideways (galleryDimensions.rotate).
 */
const buildSrc = (src: string, width: number) => {
  if (!isCloudinary(src)) return src;
  const dims = galleryDimensions[src];
  const anglePart = dims?.rotate ? `,a_${dims.rotate}` : '';
  return withTx(src, `c_fill,g_auto,w_${width},dpr_auto,q_auto,f_auto${anglePart}`);
};

/* ── Card size assignment ── */
// Deliberately assign dramatically different sizes to create visual rhythm.
// Pattern: large → small → medium → small → large → medium → …
type CardSize = 'lg' | 'md' | 'sm';
const sizePattern: CardSize[] = ['lg', 'sm', 'md', 'sm', 'lg', 'md', 'sm', 'md'];

function getCardSize(index: number): CardSize {
  return sizePattern[index % sizePattern.length];
}

/**
 * Hand-picked photo index for each gallery's masonry card.
 *
 *   number   → gallery.photos[n]
 *   'hero'   → gallery hero image
 *
 * To browse: open each gallery file in src/data/galleries/ —
 * photos are listed top-to-bottom, 0-indexed.
 */
const masonryPhotoIndex: Record<string, number | 'hero'> = {
  'laguna-beach':                 0,
  'berlinstreet':                 0,
  'architecture':                 5,
  'coffee':                       0,
  'alcatrazisland':               0,
  'joshuatree':                   1,
  'halfmoonbay':                  14,
  'palmspring':                   2,
  'napavalley':                   20,
  'nelson-ghost-town':            -1,
  'pachecopass':                  0,
  'sanfrancisco':                 0,
  'sanfranciscostreet':           0,
  'sachsenhausen-concentration':  6,
  'santacruz':                    0,
  'ranchosantamargaritalake':     13,
};

/**
 * Force a specific card size for a gallery, overriding the pattern.
 * Use this when the chosen photo doesn't suit the size the pattern assigns.
 */
const sizeOverride: Record<string, CardSize> = {
};

function getCardImage(gallery: Gallery) {
  const pick = masonryPhotoIndex[gallery.slug];
  if (pick === 'hero') return gallery.hero || gallery.photos[0];
  if (typeof pick === 'number' && gallery.photos[pick]) return gallery.photos[pick];
  return gallery.hero || gallery.photos[0];
}

function getEffectiveSize(gallery: Gallery, index: number): CardSize {
  return sizeOverride[gallery.slug] ?? getCardSize(index);
}

/* ── Stagger animation ── */
const containerVariants = {
  animate: {
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 40, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

/* ─────────────────────────────────────────────────────── */

interface MasonryGridProps {
  galleries: Gallery[];
  onCardClick: (
    e: React.MouseEvent<HTMLAnchorElement>,
    gallery: Gallery,
    imageUrl: string,
  ) => void;
}

const MasonryGrid: React.FC<MasonryGridProps> = ({ galleries, onCardClick }) => {
  return (
    <motion.div
      className="columns-1 sm:columns-2 lg:columns-3 gap-5"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {galleries.map((gallery, index) => {
        const size = getEffectiveSize(gallery, index);
        const photo = getCardImage(gallery);
        const imageUrl = buildSrc(photo.src, size === 'lg' ? 900 : size === 'md' ? 700 : 500);
        const isVertical = photo.orientation === 'vertical';
        const photoCount = gallery.photos.length;
        const region = gallery.location?.region;

        // Height classes — the dramatic difference that makes masonry shine
        const heightClass =
          size === 'lg'
            ? isVertical
              ? 'aspect-[3/5]'   // tall portrait — the hero card
              : 'aspect-[3/4]'   // tall landscape
            : size === 'md'
              ? 'aspect-[4/3]'   // wider medium
              : 'aspect-[16/10]'; // compact strip

        return (
          <motion.div
            key={gallery.slug}
            variants={itemVariants}
            className="break-inside-avoid mb-5"
          >
            <Link
              to={`/photography/${gallery.slug}`}
              className="group relative block overflow-hidden rounded-2xl"
              onClick={(e) => onCardClick(e, gallery, imageUrl)}
            >
              {/* Image */}
              <div className={`relative ${heightClass} overflow-hidden`}>
                <img
                  src={imageUrl}
                  alt={gallery.title}
                  loading={index < 6 ? 'eager' : 'lazy'}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Gradient overlay — subtle, elegant */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />

                {/* ── Content layer ── */}
                <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
                  {/* Region tag — top left */}
                  {region && (
                    <span className="absolute top-4 left-4 flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase text-white/50 font-light">
                      <MapPin size={9} strokeWidth={1.2} />
                      {region}
                    </span>
                  )}

                  {/* Photo count — top right */}
                  <span className="absolute top-4 right-4 text-[10px] tracking-[0.15em] text-white/40 font-light">
                    {photoCount} photos
                  </span>

                  {/* Title */}
                  <h3
                    className={`font-cormorant font-medium text-white/85 leading-snug tracking-wide ${
                      size === 'lg'
                        ? 'text-2xl md:text-[1.7rem]'
                        : size === 'md'
                          ? 'text-xl md:text-2xl'
                          : 'text-lg md:text-xl'
                    }`}
                  >
                    {gallery.title}
                  </h3>

                  {/* Explore arrow — appears on hover */}
                  <div className="absolute bottom-5 right-5 md:bottom-6 md:right-6 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white/70">
                      <ArrowUpRight size={16} />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default MasonryGrid;
