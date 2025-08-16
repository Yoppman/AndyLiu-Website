// src/pages/GalleryDetail.tsx
// If you're on Vite, set VITE_PLACEHOLDER_ONLY=1 in .env

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  MutableRefObject,
  useLayoutEffect,
} from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, X, ArrowUp } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { galleries } from '../data/galleries';

// ----- ENV FLAG (supports Vite or Next) ----------------------------------
const PLACEHOLDER_ONLY =
  // Vite-style
  (typeof import.meta !== 'undefined' )&& (
    // @ts-ignore
     String(import.meta.env.VITE_PLACEHOLDER_ONLY) === '1')

// ----- URL helpers -------------------------------------------------------
const cldFull = (src: string, w: number) => `${src}?a_auto,q_auto,f_auto,w_${w}`;
const cldSet = (src: string, widths: number[]) =>
  widths.map((w) => `${src}?a_auto,q_auto,f_auto,w_${w} ${w}w`).join(', ');
const cldPlaceholder = (src: string) => `${src}?a_auto,w_24,q_10,f_auto,e_blur:1000`;

// ----- Types -------------------------------------------------------------
interface Photo {
  src: string;
  orientation: 'vertical' | 'horizontal';
  dominantColor: string;
  lightroom?: boolean | 0 | 1;
}

interface Gallery {
  slug: string;
  title: string;
  description: string;
  hero?: Photo;
  photos: Photo[];
}

type ImgRef = MutableRefObject<HTMLImageElement | null>;

// ----- Eager image for critical content ----------------------------------
const EagerImage = forwardRef<HTMLImageElement, { photo: Photo; alt: string }>(
  ({ photo, alt }, externalRef) => {
    const setRefs = (node: HTMLImageElement | null) => {
      if (typeof externalRef === 'function') externalRef(node);
      else if (externalRef) (externalRef as ImgRef).current = node;
    };

    // In placeholder mode, serve only the tiny blurred preview
    if (PLACEHOLDER_ONLY) {
      return (
        <img
          ref={setRefs}
          src={cldPlaceholder(photo.src)}
          alt={alt}
          className={`max-h-[90vh] w-full ${
            photo.orientation === 'vertical' ? ' object-contain -rotate-90' : 'object-cover'
          } blur-xl scale-105`}
          loading="eager"
          decoding="async"
          fetchpriority="high"
          style={{ backgroundColor: photo.dominantColor, contentVisibility: 'auto' as any }}
        />
      );
    }

    // Normal optimized path
    return (
      <img
        ref={setRefs}
        src={cldFull(photo.src, 600)}
        srcSet={cldSet(photo.src, [300, 600, 900])}
        sizes="(max-width:600px) 100vw, (max-width:1200px) 50vw, 600px"
        alt={alt}
        className={`max-h-[90vh] w-full ${
          photo.orientation === 'vertical' ? ' object-contain -rotate-90' : 'object-cover'
        }`}
        loading="eager"
        decoding="async"
        fetchpriority="high"
        style={{ backgroundColor: photo.dominantColor, contentVisibility: 'auto' as any }}
      />
    );
  }
);
EagerImage.displayName = 'EagerImage';

// ----- Lazy-loaded thumbnail --------------------------------------------
const LazyImage = forwardRef<HTMLImageElement, { photo: Photo; alt: string }>(
  ({ photo, alt }, externalRef) => {
    const [loaded, setLoaded] = useState(false);
    const { ref: inViewRef, inView } = useInView({
      rootMargin: '200px',
      triggerOnce: true,
    });

    // merge refs so IntersectionObserver + parent logic both receive node
    const setRefs = (node: HTMLImageElement | null) => {
      inViewRef(node);
      if (typeof externalRef === 'function') externalRef(node);
      else if (externalRef) (externalRef as ImgRef).current = node;
    };

    // above return:
    const isLR = photo.lightroom === 1 || photo.lightroom === true;

    const orientClass =
      photo.orientation === 'vertical'
        ? (isLR
            ? 'h-full w-auto object-contain'   // vertical + lightroom
            : 'object-contain -rotate-90')     // vertical (no LR)
        : 'object-cover';                       // horizontal

    // In placeholder mode, always show tiny blurred preview only
    if (PLACEHOLDER_ONLY) {
      return (
        <img
          ref={setRefs}
          src={cldPlaceholder(photo.src)}
          alt={alt}
          className={`max-h-[90vh] w-full transition-transform duration-300 hover:scale-105 opacity-100 ${
            orientClass
          } blur-xl scale-105`}
          loading="lazy"
          decoding="async"
          fetchpriority="low"
          style={{ backgroundColor: photo.dominantColor, contentVisibility: 'auto' as any }}
          onLoad={() => setLoaded(true)}
        />
      );
    }

    // Normal optimized path
    return (
      <img
        ref={setRefs}
        src={inView ? cldFull(photo.src, 300) : undefined}
        srcSet={inView ? cldSet(photo.src, [300, 600, 900]) : undefined}
        sizes="(max-width:600px) 100vw, (max-width:1200px) 50vw, 600px"
        alt={alt}
        className={`max-h-[90vh] w-full transition-transform duration-300 hover:scale-105 transition-opacity duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${
          orientClass
        }`}
        loading="lazy"
        decoding="async"
        fetchpriority="low"
        style={{ backgroundColor: photo.dominantColor, contentVisibility: 'auto' as any }}
        onLoad={() => setLoaded(true)}
      />
    );
  }
);
LazyImage.displayName = 'LazyImage';

// ----- Main page ---------------------------------------------------------
const GalleryDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const idx = galleries.findIndex((g: Gallery) => g.slug === slug);
  if (idx < 0) return <p className="p-16 text-center">Gallery not found</p>;

  const gallery = galleries[idx] as Gallery;
  const { title, description, photos, hero } = gallery;

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  // Defer part of the grid to avoid heavy first render
  const [renderDeferredGrid, setRenderDeferredGrid] = useState(false);
  // Keep track of which URLs we've prefetched this session
  const prefetchedUrlSetRef = useRef<Set<string>>(new Set());
  const prefetchImageElementsRef = useRef<HTMLImageElement[]>([]);

  // dynamic background colour based on current viewport image
  const [bgColor, setBgColor] = useState<string>(photos[0].dominantColor);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);

  // — Close lightbox on Esc
  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setLightboxIdx(null);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onKey]);

  // — Track which photo is visible to drive bg colour
  useEffect(() => {
    // Attach observers after the browser has a chance to paint
    const setup = () => {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const img = entry.target as HTMLImageElement;
            // Skip while image is still loading/decoding to avoid jank
            if (!img.complete) continue;
            const i = imgRefs.current.indexOf(img);
            if (i >= 0) setBgColor(photos[i].dominantColor);
            break;
          }
        },
        { threshold: 0.4 }
      );

      imgRefs.current.forEach((img) => img && observer.observe(img));
      return () => observer.disconnect();
    };

    let cleanup: (() => void) | undefined;
    const idleCb = (cb: () => void) =>
      (window as any).requestIdleCallback
        ? (window as any).requestIdleCallback(cb, { timeout: 800 })
        : setTimeout(cb, 60);

    idleCb(() => {
      cleanup = setup();
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [photos, renderDeferredGrid]);

  // Defer rendering of non-critical grid items to reduce initial jank
  useEffect(() => {
    const idle = (cb: () => void) =>
      (window as any).requestIdleCallback
        ? (window as any).requestIdleCallback(cb, { timeout: 1200 })
        : setTimeout(cb, 120);
    idle(() => setRenderDeferredGrid(true));
  }, []);

  // Warm the HTTP cache for grid images after idle time
  useEffect(() => {
    if (!photos?.length) return;
    if (PLACEHOLDER_ONLY) return; // do not prefetch full images in placeholder mode

    const buildGridCandidates = (baseSrc: string) => [
      cldFull(baseSrc, 300),
      cldFull(baseSrc, 600),
      cldFull(baseSrc, 900),
    ];

    const idle = (cb: () => void) =>
      (window as any).requestIdleCallback
        ? (window as any).requestIdleCallback(cb, { timeout: 2000 })
        : setTimeout(cb, 150);

    let cancelled = false;
    idle(() => {
      if (cancelled) return;
      let delayMs = 0;
      photos.forEach((p) => {
        const urls = buildGridCandidates(p.src);
        urls.forEach((url) => {
          if (prefetchedUrlSetRef.current.has(url)) return;
          prefetchedUrlSetRef.current.add(url);
          // Stagger requests a bit to stay responsive
          setTimeout(() => {
            if (cancelled) return;
            const img = new Image();
            img.decoding = 'async';
            img.loading = 'eager';
            img.referrerPolicy = 'no-referrer';
            img.src = url;
            prefetchImageElementsRef.current.push(img);
          }, delayMs);
          delayMs += 40; // ~25 imgs/sec
        });
      });
    });

    return () => {
      cancelled = true;
      // Clear references to allow GC; cache remains in the browser
      prefetchImageElementsRef.current = [];
    };
  }, [photos]);

  // When lightbox opens, prefetch adjacent images at display size
  useEffect(() => {
    if (lightboxIdx === null) return;
    if (PLACEHOLDER_ONLY) return; // don't fetch large images in placeholder mode

    const targets = [lightboxIdx - 1, lightboxIdx + 1].filter(
      (i) => i >= 0 && i < photos.length
    );
    targets.forEach((i) => {
      const url = cldFull(photos[i].src, 1200);
      if (prefetchedUrlSetRef.current.has(url)) return;
      prefetchedUrlSetRef.current.add(url);
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = url;
      prefetchImageElementsRef.current.push(img);
    });
  }, [lightboxIdx, photos]);

  // Hero & siblings
  const heroImage = hero || photos[0];
  const prev = galleries[idx - 1] as Gallery | undefined;
  const next = galleries[idx + 1] as Gallery | undefined;

  // Preload hero for better LCP; skip in placeholder mode to avoid bandwidth
  useLayoutEffect(() => {
    if (PLACEHOLDER_ONLY) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = cldFull(heroImage.src, 1200);
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [heroImage.src]);

  // Aggressively preload first four grid images so they are ready immediately; skip in placeholder mode
  useLayoutEffect(() => {
    if (PLACEHOLDER_ONLY) return;
    const firstTwo = photos.slice(0, 2);
    const links: HTMLLinkElement[] = [];
    firstTwo.forEach((p) => {
      const href600 = cldFull(p.src, 600);
      const href900 = cldFull(p.src, 900);
      const l1 = document.createElement('link');
      l1.rel = 'preload';
      l1.as = 'image';
      l1.href = href600;
      (l1 as any).fetchpriority = 'high';
      document.head.appendChild(l1);
      links.push(l1);

      const l2 = document.createElement('link');
      l2.rel = 'preload';
      l2.as = 'image';
      l2.href = href900;
      (l2 as any).fetchpriority = 'high';
      document.head.appendChild(l2);
      links.push(l2);
    });
    return () => {
      links.forEach((l) => l.remove());
    };
  }, [photos]);

  // — Floating Top arrow visibility
  const [showTopArrow, setShowTopArrow] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      setShowTopArrow(y > 300);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    if ('scrollBehavior' in document.documentElement.style) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const startY = window.scrollY;
    const durationMs = 500;
    const startTs = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - startTs) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      window.scrollTo(0, Math.round(startY * (1 - eased)));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  return (
    <main
      className="min-h-screen w-full transition-colors duration-1000"
      style={{ backgroundColor: bgColor }}
    >
      {/* Hero */}
      <div
        className={`relative w-full h-[50vh] overflow-hidden ${
          heroImage.orientation === 'vertical' ? 'aspect-[2/3]' : 'aspect-[3/2]'
        }`}
      >
        {PLACEHOLDER_ONLY ? (
          <img
            src={cldPlaceholder(heroImage.src)}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover blur-xl scale-105"
            loading="eager"
            decoding="async"
            style={{ backgroundColor: heroImage.dominantColor }}
          />
        ) : (
          <img
            src={cldFull(heroImage.src, 1200)}
            srcSet={cldSet(heroImage.src, [600, 1200, 1800])}
            sizes="(max-width:600px) 100vw, (max-width:1200px) 100vw, 1200px"
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            decoding="async"
            fetchpriority="high"
            style={{ backgroundColor: heroImage.dominantColor }}
          />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <h1 className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white font-cormorant text-4xl md:text-5xl lg:text-6xl will-change-[transform,opacity]">
          {title}
        </h1>
      </div>

      {/* Description */}
      <div className="max-w-4xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-8">
        <p className="font-cormorant text-lg leading-relaxed">{description}</p>
        <p className="font-cormorant text-lg leading-relaxed">
          Here’s a more in‑depth story behind this series: your inspirations, the
          challenges you faced, any anecdotes you want to share.
        </p>
      </div>

      {/* Photo grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
          {/* Render first four eagerly for instant display */}
          {photos.slice(0, 4).map((photo, i) => (
            <button
              key={photo.src}
              onClick={() => setLightboxIdx(i)}
              className={`block w-full overflow-hidden ${
                photo.orientation === 'vertical' ? 'aspect-[2/3]' : 'aspect-[3/2]'
              }`}
              style={{ contentVisibility: 'auto' as any }}
            >
              <EagerImage
                ref={(el) => (imgRefs.current[i] = el)}
                photo={photo}
                alt={`${title} shot ${i + 1}`}
              />
            </button>
          ))}
          {renderDeferredGrid &&
            photos.slice(4).map((photo, i) => {
              const realIndex = i + 4;
              return (
                <button
                  key={photo.src}
                  onClick={() => setLightboxIdx(realIndex)}
                  className={`block w-full overflow-hidden ${
                    photo.orientation === 'vertical' ? 'aspect-[2/3]' : 'aspect-[3/2]'
                  }`}
                  style={{ contentVisibility: 'auto' as any }}
                >
                  <LazyImage
                    ref={(el) => (imgRefs.current[realIndex] = el)}
                    photo={photo}
                    alt={`${title} shot ${realIndex + 1}`}
                  />
                </button>
              );
            })}
        </div>
      </div>

      {/* Prev / Next navigation */}
      <div className="max-w-7xl mx-auto px-6 py-12 flex justify-between items-center">
        {prev ? (
          <Link
            to={`/photography/${prev.slug}`}
            className="flex items-center text-3xl font-cormorant transition-transform duration-200 hover:scale-110"
          >
            <ArrowLeft size={40} strokeWidth={1} className="mr-2" />
            {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={`/photography/${next.slug}`}
            className="flex items-center text-3xl font-cormorant transition-transform duration-200 hover:scale-110"
          >
            {next.title}
            <ArrowRight size={40} strokeWidth={1} className="ml-2" />
          </Link>
        ) : (
          <span />
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute top-6 right-6 text-white"
          >
            <X size={32} />
          </button>
          {PLACEHOLDER_ONLY ? (
            <img
              src={cldPlaceholder(photos[lightboxIdx].src)}
              alt={`${title} shot ${lightboxIdx + 1}`}
              onClick={(e) => e.stopPropagation()}
              className={`transform origin-center transition-transform duration-200 ${
                photos[lightboxIdx].orientation === 'vertical'
                  ? (photos[lightboxIdx].lightroom === 1 ? 'max-w-[90vh] max-h-[90vw]'
                    :'-rotate-90 max-w-[90vh] max-h-[90vw]')
                  : 'rotate-0 max-w-[90vw] max-h-[90vh]'
              } object-contain blur-xl scale-105`}
              loading="eager"
              style={{ backgroundColor: photos[lightboxIdx].dominantColor }}
            />
          ) : (
            <img
              src={cldFull(photos[lightboxIdx].src, 1200)}
              srcSet={cldSet(photos[lightboxIdx].src, [600, 1200, 1800])}
              sizes="(max-width:600px) 100vw, (max-width:1200px) 100vw, 1200px"
              alt={`${title} shot ${lightboxIdx + 1}`}
              onClick={(e) => e.stopPropagation()}
              className={`transform origin-center transition-transform duration-200 ${
                photos[lightboxIdx].orientation === 'vertical'
                  ? (photos[lightboxIdx].lightroom === 1 ? 'max-w-[90vh] max-h-[90vw]'
                    :'-rotate-90 max-w-[90vh] max-h-[90vw]')
                  : 'rotate-0 max-w-[90vw] max-h-[90vh]'
              } object-contain`}
              loading="eager"
              style={{ backgroundColor: photos[lightboxIdx].dominantColor }}
            />
          )}
        </div>
      )}

      {/* Floating Top arrow */}
      {showTopArrow && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] animate-float-up select-none opacity-50 hover:opacity-100 transition-opacity"
          style={{ left: 'calc(50% - 28px)' }}
        >
          <ArrowUp size={56} strokeWidth={1.25} className="opacity-70" />
          <span className="text-sm mt-1 tracking-wide opacity-70">Top</span>
        </button>
      )}
    </main>
  );
};

export default GalleryDetail;