import React, { useMemo } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
} from 'motion/react';
import { galleryDimensions } from '../../data/galleryDimensions';
import { galleryStories } from '../../data/galleryStories';
import { galleries } from '../../data/galleries';
import type { Gallery } from '../../data/types/galleries';

/* ── Cloudinary ── */
const isCloudinary = (url: string) =>
  /res\.cloudinary\.com\/[^/]+\/image\/(upload|fetch)\//.test(url);

const withTx = (src: string, tx: string) =>
  isCloudinary(src)
    ? src.replace(/(\/image\/(?:upload|fetch)\/)/, `$1${tx}/`)
    : src;

const buildSrc = (src: string, width: number) => {
  if (!isCloudinary(src)) return src;
  const dims = galleryDimensions[src];
  const anglePart = dims?.rotate ? `,a_${dims.rotate}` : '';
  return withTx(src, `c_fill,g_auto,w_${width},q_auto,f_auto${anglePart}`);
};

/* ── Pick galleries with stories (they have the richest content) ── */
function pickStoryGalleries(): { gallery: Gallery; story: typeof galleryStories[string] }[] {
  return galleries
    .filter((g) => {
      const s = galleryStories[g.slug];
      return s?.intro && s?.captions && Object.keys(s.captions).length >= 2;
    })
    .slice(0, 5) // cap at 5 for scroll-length sanity
    .map((g) => ({ gallery: g, story: galleryStories[g.slug] }));
}

/* ── Main component ── */
const ParallaxStory: React.FC = () => {
  const storyGalleries = useMemo(pickStoryGalleries, []);

  return (
    <section className="relative bg-neutral-950">
      {/* Opening title */}
      <div className="h-[60vh] flex flex-col items-center justify-center px-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="font-cormorant italic text-white/30 text-lg tracking-[0.2em] uppercase mb-4"
        >
          Scroll to explore
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.15 }}
          className="font-playfair text-4xl md:text-6xl text-white text-center leading-tight max-w-3xl"
        >
          Stories Behind
          <br />
          the Lens
        </motion.h2>
      </div>

      {/* Each gallery gets a parallax chapter */}
      {storyGalleries.map(({ gallery, story }, i) => (
        <ParallaxChapter
          key={gallery.slug}
          gallery={gallery}
          story={story}
          index={i}
          isLast={i === storyGalleries.length - 1}
        />
      ))}

      {/* Closing breath */}
      <div className="h-[40vh] flex items-center justify-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5 }}
          className="font-cormorant italic text-white/20 text-xl tracking-wide"
        >
          — fin —
        </motion.p>
      </div>
    </section>
  );
};

/* ── A single parallax chapter ── */
interface ChapterProps {
  gallery: Gallery;
  story: typeof galleryStories[string];
  index: number;
  isLast: boolean;
}

const ParallaxChapter: React.FC<ChapterProps> = ({ gallery, story, index }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const hero = gallery.hero || gallery.photos[0];
  const heroSrc = buildSrc(hero.src, 1600);

  // Pick 2 interior photos for the mid-section reveals
  const captionKeys = story?.captions ? Object.keys(story.captions).map(Number).sort((a, b) => a - b) : [];
  const midPhotos = useMemo(() => {
    const picks = captionKeys.slice(0, 2).map((idx) => {
      const photo = gallery.photos[idx];
      if (!photo) return null;
      return {
        photo,
        src: buildSrc(photo.src, 1000),
        caption: story?.captions?.[idx] || '',
      };
    });
    return picks.filter(Boolean) as { photo: typeof gallery.photos[0]; src: string; caption: string }[];
  }, [gallery, story, captionKeys]);

  /* Parallax transforms */
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const heroY = useTransform(smoothProgress, [0, 1], ['0%', '20%']);
  const heroScale = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [1.08, 1, 1, 1.04]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.15, 0.6, 0.85], [0, 1, 1, 0]);

  return (
    <div ref={ref} className="relative">
      {/* ── Act 1: Full-bleed hero with title ── */}
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{ y: heroY, scale: heroScale, opacity: heroOpacity }}
        >
          <img
            src={heroSrc}
            alt={gallery.title}
            className="w-full h-full object-cover"
            loading={index < 2 ? 'eager' : 'lazy'}
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />
          <div className="absolute inset-0 bg-neutral-950/20" />
        </motion.div>

        {/* Title card — centered on the hero */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-[18vh] px-6">
          <motion.p
            style={{ opacity: useTransform(smoothProgress, [0.05, 0.2, 0.5], [0, 1, 0]) }}
            className="font-cormorant text-white/40 text-sm tracking-[0.3em] uppercase mb-3"
          >
            {story?.meta || gallery.location?.region}
          </motion.p>
          <motion.h3
            style={{ opacity: useTransform(smoothProgress, [0.05, 0.2, 0.5], [0, 1, 0]) }}
            className="font-playfair text-white text-4xl md:text-6xl lg:text-7xl text-center leading-[1.1] max-w-4xl"
          >
            {gallery.title}
          </motion.h3>
        </div>
      </div>

      {/* Scroll spacer — controls how long the hero stays pinned */}
      <div className="h-[120vh]" />

      {/* ── Act 2: Intro text — appears as hero fades ── */}
      {story?.intro && (
        <div className="relative z-10 -mt-[30vh] mb-20 flex justify-center px-6">
          <motion.p
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-cormorant italic text-white/60 text-xl md:text-2xl lg:text-[1.7rem] leading-relaxed max-w-2xl text-center [text-wrap:balance]"
          >
            {story.intro}
          </motion.p>
        </div>
      )}

      {/* ── Act 3: Mid-section photo reveals with captions ── */}
      {midPhotos.map(({ src, caption, photo }, i) => (
        <MidReveal key={i} src={src} caption={caption} photo={photo} side={i % 2 === 0 ? 'left' : 'right'} />
      ))}

      {/* ── Signoff ── */}
      {story?.signoff && (
        <div className="py-24 px-6 flex justify-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1.5 }}
            className="font-cormorant italic text-white/30 text-lg md:text-xl max-w-xl text-center leading-relaxed [text-wrap:balance]"
          >
            {story.signoff}
          </motion.p>
        </div>
      )}

      {/* Chapter divider */}
      <div className="flex justify-center py-10">
        <div className="w-px h-20 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  );
};

/* ── Photo + caption side-reveal ── */
interface MidRevealProps {
  src: string;
  caption: string;
  photo: { dominantColor: string };
  side: 'left' | 'right';
}

const MidReveal: React.FC<MidRevealProps> = ({ src, caption, photo, side }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ['8%', '-8%']);

  const isLeft = side === 'left';

  return (
    <div
      ref={ref}
      className={`relative flex flex-col md:flex-row items-center gap-8 md:gap-14 px-6 md:px-16 lg:px-24 py-16 md:py-24 ${
        isLeft ? '' : 'md:flex-row-reverse'
      }`}
    >
      {/* Photo */}
      <motion.div
        initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full md:w-[55%] aspect-[3/2] overflow-hidden rounded-sm flex-shrink-0"
      >
        <motion.img
          src={src}
          alt=""
          style={{ y: imgY }}
          className="absolute inset-[-10%] w-[120%] h-[120%] object-cover"
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundColor: photo.dominantColor }}
        />
      </motion.div>

      {/* Caption */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex items-center"
      >
        <p
          className={`font-cormorant italic text-white/50 text-xl md:text-2xl leading-relaxed [text-wrap:balance] ${
            isLeft ? 'md:pl-4' : 'md:pr-4'
          }`}
        >
          {caption}
        </p>
      </motion.div>
    </div>
  );
};

export default ParallaxStory;
