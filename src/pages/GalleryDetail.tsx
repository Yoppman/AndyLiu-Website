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
import { getTemplateAssignment } from '../components/gallery/templateConfig';
import EditorialSpread from '../components/gallery/templates/EditorialSpread';
import CinematicScroll from '../components/gallery/templates/CinematicScroll';
import IntimateCollection from '../components/gallery/templates/IntimateCollection';
import MosaicWall from '../components/gallery/templates/MosaicWall';
import DiptychGallery from '../components/gallery/templates/DiptychGallery';
import ScatteredExhibition from '../components/gallery/templates/ScatteredExhibition';

const templateComponents = {
  editorial: EditorialSpread,
  cinematic: CinematicScroll,
  intimate: IntimateCollection,
  mosaic: MosaicWall,
  diptych: DiptychGallery,
  scattered: ScatteredExhibition,
} as const;

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
  const { lightboxIdx, setLightboxIdx } = useLightbox(photos);
  usePrefetch(photos, heroImage.src);
  const { showTopArrow, scrollToTop } = useScrollTop();

  useEffect(() => {
    const idle = (cb: () => void) =>
      (window as any).requestIdleCallback
        ? (window as any).requestIdleCallback(cb, { timeout: 1200 })
        : setTimeout(cb, 120);
    idle(() => setRenderDeferredGrid(true));
  }, []);

  const { template, hero: heroVariant } = getTemplateAssignment(slug || '');
  const TemplateComponent = templateComponents[template];

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
          variant={heroVariant}
          description={description}
        />

        <TemplateComponent
          photos={photos}
          title={title}
          description={description}
          onPhotoClick={setLightboxIdx}
          imgRefs={imgRefs}
          renderDeferredGrid={renderDeferredGrid}
        />

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
