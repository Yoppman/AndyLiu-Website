import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { galleries } from '../data/galleries';
import PageTransition from '../components/PageTransition';
import { useTransition } from '../context/TransitionContext';
import { Gallery } from '../components/gallery/shared/cloudinaryUtils';
import { useDynamicBg } from '../components/gallery/shared/useDynamicBg';
import { useLightbox } from '../components/gallery/shared/useLightbox';
import { usePrefetch } from '../components/gallery/shared/usePrefetch';
import { useScrollTop } from '../components/gallery/shared/useScrollTop';
import GalleryHero from '../components/gallery/shared/GalleryHero';
import GalleryLightbox from '../components/gallery/shared/GalleryLightbox';
import GalleryNav from '../components/gallery/shared/GalleryNav';
import ScrollTopButton from '../components/gallery/shared/ScrollTopButton';
import EditorialStory from '../components/gallery/templates/EditorialStory';
import GalleryIntro from '../components/gallery/shared/GalleryIntro';
import { galleryStories } from '../data/galleryStories';

/** Rough perceived-luminance check so story text stays legible on the photo-derived bg. */
function isDarkColor(rgba: string): boolean {
  const m = rgba.match(/rgba?\(([^)]+)\)/);
  if (!m) return true;
  const [r, g, b] = m[1].split(',').map((n) => parseFloat(n));
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}

const GalleryDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { morphSource } = useTransition();
  const isMorphing = morphSource?.slug === slug;
  const idx = galleries.findIndex((g: Gallery) => g.slug === slug);
  if (idx < 0) return <p className="p-16 text-center">Gallery not found</p>;

  const gallery = galleries[idx] as Gallery;
  const { title, description, photos, hero } = gallery;
  const heroImage = hero || photos[0];

  const prev = galleries[idx - 1] as Gallery | undefined;
  const next = galleries[idx + 1] as Gallery | undefined;

  const [renderDeferredGrid, setRenderDeferredGrid] = useState(false);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);

  const bgColor = useDynamicBg(photos, imgRefs, [renderDeferredGrid]);
  const { lightboxIdx, setLightboxIdx } = useLightbox();
  usePrefetch(photos, heroImage.src);
  const { showTopArrow, scrollToTop } = useScrollTop();

  useEffect(() => {
    const idle = (cb: () => void) =>
      (window as any).requestIdleCallback
        ? (window as any).requestIdleCallback(cb, { timeout: 1200 })
        : setTimeout(cb, 120);
    idle(() => setRenderDeferredGrid(true));
  }, []);

  const story = galleryStories[slug || ''];
  const storyColor = isDarkColor(bgColor) ? '#f1efe9' : '#1b1b1b';

  return (
    <PageTransition>
      <main
        className="min-h-screen w-full transition-colors duration-1000"
        style={{ backgroundColor: bgColor }}
      >
        <GalleryHero
          photo={heroImage}
          title={title}
          isMorphing={isMorphing}
          description={description}
          region={gallery.location?.region}
        />

        <GalleryIntro meta={story?.meta} intro={story?.intro} color={storyColor} />

        <EditorialStory
          photos={photos}
          title={title}
          description={description}
          onPhotoClick={setLightboxIdx}
          imgRefs={imgRefs}
          renderDeferredGrid={renderDeferredGrid}
          captions={story?.captions}
          storyColor={storyColor}
        />

        {story?.signoff && (
          <section className="max-w-3xl mx-auto px-6 pb-20 pt-4 md:pb-28 text-center" style={{ color: storyColor }}>
            <div className="mx-auto mb-10 h-px w-16 bg-current opacity-20" />
            <p className="font-cormorant italic text-xl md:text-2xl leading-relaxed opacity-80 [text-wrap:balance]">
              {story.signoff}
            </p>
          </section>
        )}

        <GalleryNav prev={prev} next={next} />
        <GalleryLightbox
          photos={photos}
          title={title}
          lightboxIdx={lightboxIdx}
          setLightboxIdx={setLightboxIdx}
        />
        <ScrollTopButton visible={showTopArrow} onClick={scrollToTop} />
      </main>
    </PageTransition>
  );
};

export default GalleryDetail;
