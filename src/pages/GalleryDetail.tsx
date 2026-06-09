import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { galleries } from '../data/galleries';
import PageTransition from '../components/PageTransition';
import BackButton from '../components/BackButton';
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
import CompactGrid from '../components/gallery/templates/CompactGrid';
import ModeToggle from '../components/gallery/shared/ModeToggle';
import GalleryIntro from '../components/gallery/shared/GalleryIntro';
import GalleryScreening from '../components/gallery/shared/GalleryScreening';
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
  const [screening, setScreening] = useState(false);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const mainRef = useRef<HTMLElement | null>(null);

  // Story (the editorial read) vs Compact (the gapless justified grid). Always
  // opens in Story — the mode is intentionally NOT remembered, and resets to Story
  // for every collection you open.
  type ViewMode = 'story' | 'compact';
  const [viewMode, setViewMode] = useState<ViewMode>('story');
  useEffect(() => {
    setViewMode('story'); // a new collection always starts in Story
  }, [slug]);
  // Captured just before a mode switch so the new layout can animate each visible
  // photo home from where it sat in the old one (a FLIP — §5 of the design doc).
  type FlipState = {
    first: Map<number, { rect: DOMRect; src: string }>;
    anchorIdx: number;
    anchorTop: number;
  };
  const flipRef = useRef<FlipState | null>(null);
  const firstRunRef = useRef(true);

  const switchView = useCallback((mode: ViewMode) => {
    let pending: FlipState | null = null;
    try {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduce) {
        const vh = window.innerHeight;
        const first = new Map<number, { rect: DOMRect; src: string }>();
        let anchorIdx = -1;
        let anchorTop = 0;
        let best = Infinity;
        imgRefs.current.forEach((el, idx) => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          if (rect.width < 1 || rect.bottom < -100 || rect.top > vh + 100) return;
          first.set(idx, { rect, src: el.currentSrc || el.src });
          const center = rect.top + rect.height / 2;
          const d = Math.abs(center - vh / 2);
          if (d < best) {
            best = d;
            anchorIdx = idx;
            anchorTop = rect.top;
          }
        });
        if (anchorIdx >= 0) pending = { first, anchorIdx, anchorTop };
      }
    } catch {
      pending = null;
    }
    flipRef.current = pending;
    setViewMode(mode);
  }, []);

  // Run the morph (and keep the anchor photo put) right after the new layout
  // commits. Degrades to a plain top-scroll if anything is missing.
  useLayoutEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    const p = flipRef.current;
    flipRef.current = null;
    if (!p) {
      window.scrollTo({ top: 0 });
      return;
    }

    // Hide the page for this one pre-paint frame so the new layout's destination
    // never flashes. The new template measures its width in its own layout effect
    // (starting at 0), so we read the final rects in the rAF below — by then it's
    // packed — then reveal in the same frame, before paint.
    const main = mainRef.current;
    if (main) main.style.opacity = '0';

    requestAnimationFrame(() => {
      try {
        // Keep the anchor photo at its previous viewport position.
        const anchorEl = imgRefs.current[p.anchorIdx];
        if (anchorEl) {
          const delta = anchorEl.getBoundingClientRect().top - p.anchorTop;
          if (Math.abs(delta) > 0.5) window.scrollBy(0, delta);
        }

        // Float a clone of each visible photo from its old rect to its new one.
        const vh = window.innerHeight;
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:45;pointer-events:none;';
        document.body.appendChild(overlay);
        const pendingAnims: Promise<unknown>[] = [];
        let k = 0;
        p.first.forEach((f, idx) => {
          const realImg = imgRefs.current[idx];
          if (!realImg) return;
          const last = realImg.getBoundingClientRect();
          if (last.width < 1 || last.bottom < -50 || last.top > vh + 50) return;

          const clone = document.createElement('img');
          clone.src = f.src;
          clone.style.cssText =
            `position:fixed;left:${last.left}px;top:${last.top}px;width:${last.width}px;` +
            `height:${last.height}px;object-fit:cover;transform-origin:0 0;will-change:transform;`;
          overlay.appendChild(clone);
          realImg.style.opacity = '0'; // hide the real one until its clone lands

          const dx = f.rect.left - last.left;
          const dy = f.rect.top - last.top;
          const sx = last.width ? f.rect.width / last.width : 1;
          const sy = last.height ? f.rect.height / last.height : 1;
          const anim = clone.animate(
            [
              { transform: `translate(${dx}px,${dy}px) scale(${sx},${sy})` },
              { transform: 'translate(0px,0px) scale(1,1)' },
            ],
            { duration: 620, easing: 'cubic-bezier(0.22,1,0.36,1)', delay: Math.min(k * 10, 160), fill: 'both' },
          );
          k++;
          pendingAnims.push(
            anim.finished.catch(() => undefined).then(() => {
              realImg.style.opacity = '';
            }),
          );
        });

        if (main) main.style.opacity = ''; // reveal; animated reals stay hidden behind their clones
        Promise.allSettled(pendingAnims).then(() => overlay.remove());
      } catch {
        if (main) main.style.opacity = '';
      }
    });
  }, [viewMode]);

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

  // In Compact mode the slim bar is the only top chrome — hide the global header
  // (and its top-edge hover trigger) so the two never collide.
  useEffect(() => {
    if (viewMode === 'compact') document.body.setAttribute('data-immersive', '1');
    else document.body.removeAttribute('data-immersive');
    return () => document.body.removeAttribute('data-immersive');
  }, [viewMode]);

  return (
    <PageTransition>
      <main
        ref={mainRef}
        className="min-h-screen w-full transition-colors duration-1000"
        style={{ backgroundColor: bgColor }}
      >
        {viewMode === 'compact' ? (
          <>
            <CompactGrid
              photos={photos}
              title={title}
              description={description}
              onPhotoClick={setLightboxIdx}
              imgRefs={imgRefs}
              renderDeferredGrid={renderDeferredGrid}
              storyColor={storyColor}
              bgColor={bgColor}
              onExit={() => switchView('story')}
            />
            <div style={{ color: storyColor }}>
              <GalleryNav prev={prev} next={next} />
            </div>
          </>
        ) : (
          <>
            <BackButton />
            <GalleryHero
              photo={heroImage}
              title={title}
              isMorphing={isMorphing}
              description={description}
              region={gallery.location?.region}
              onPlay={() => setScreening(true)}
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

            <ScrollTopButton visible={showTopArrow} onClick={scrollToTop} />
          </>
        )}

        <ModeToggle mode={viewMode} onSelect={switchView} />

        <GalleryLightbox
          photos={photos}
          title={title}
          lightboxIdx={lightboxIdx}
          setLightboxIdx={setLightboxIdx}
        />
        <AnimatePresence>
          {screening && (
            <GalleryScreening
              photos={photos}
              title={title}
              captions={story?.captions}
              intro={story?.intro}
              signoff={story?.signoff}
              onClose={() => setScreening(false)}
            />
          )}
        </AnimatePresence>
      </main>
    </PageTransition>
  );
};

export default GalleryDetail;
