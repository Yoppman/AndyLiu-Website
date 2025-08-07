// src/pages/GalleryDetail.tsx
// Install dependency:
//   npm i react-intersection-observer    # or yarn add react-intersection-observer

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  MutableRefObject,
} from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { galleries } from '../data/galleries';

// ----- Types -------------------------------------------------------------
interface Photo {
  src: string;
  orientation: 'vertical' | 'horizontal';
  dominantColor: string;
}

interface Gallery {
  slug: string;
  title: string;
  description: string;
  hero?: Photo;
  photos: Photo[];
}

type ImgRef = MutableRefObject<HTMLImageElement | null>;

// ----- Lazy‑loaded thumbnail --------------------------------------------
const LazyImage = forwardRef<HTMLImageElement, { photo: Photo; alt: string }>(
  ({ photo, alt }, externalRef) => {
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

    return (
      <img
        ref={setRefs}
        src={inView ? `${photo.src}?q_auto,f_auto,w_300` : undefined}
        srcSet={
          inView
            ? `${photo.src}?q_auto,f_auto,w_300 300w, ` +
              `${photo.src}?q_auto,f_auto,w_600 600w, ` +
              `${photo.src}?q_auto,f_auto,w_900 900w`
            : undefined
        }
        sizes="(max-width:600px) 100vw, (max-width:1200px) 50vw, 600px"
        alt={alt}
        className={`max-h-[90vh] w-full transition-transform duration-300 hover:scale-105 ${
          photo.orientation === 'vertical' ? ' object-contain -rotate-90' : 'object-cover'
        }`}
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        style={{ backgroundColor: photo.dominantColor }}
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
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const i = imgRefs.current.indexOf(img);
            if (i >= 0) setBgColor(photos[i].dominantColor);
            break;
          }
        }
      },
      { threshold: 0.4 }
    );

    imgRefs.current.forEach((img) => img && observer.observe(img));
    return () => observer.disconnect();
  }, [photos]);

  // Hero & siblings
  const heroImage = hero || photos[0];
  const prev = galleries[idx - 1] as Gallery | undefined;
  const next = galleries[idx + 1] as Gallery | undefined;
  // Preload hero for better LCP
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = `${heroImage.src}?q_auto,f_auto,w_1200`;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, [heroImage.src]);

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
        <img
          src={`${heroImage.src}?q_auto,f_auto,w_1200`}
          srcSet={`${heroImage.src}?q_auto,f_auto,w_600 600w, ${heroImage.src}?q_auto,f_auto,w_1200 1200w, ${
            heroImage.src
          }?q_auto,f_auto,w_1800 1800w`}
          sizes="(max-width:600px) 100vw, (max-width:1200px) 100vw, 1200px"
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          style={{ backgroundColor: heroImage.dominantColor }}
        />
        <div className="absolute inset-0 bg-black/30" />
        <h1 className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white font-cormorant text-4xl md:text-5xl lg:text-6xl">
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
          {photos.map((photo, i) => (
            <button
              key={photo.src}
              onClick={() => setLightboxIdx(i)}
              className={`block w-full overflow-hidden ${
                photo.orientation === 'vertical' ? 'aspect-[2/3]' : 'aspect-[3/2]'
              }`}
            >
              <LazyImage
                ref={(el) => (imgRefs.current[i] = el)}
                photo={photo}
                alt={`${title} shot ${i + 1}`}
              />
            </button>
          ))}
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
          <img
            src={`${photos[lightboxIdx].src}?q_auto,f_auto,w_1200`}
            srcSet={`${photos[lightboxIdx].src}?q_auto,f_auto,w_600 600w, ${photos[lightboxIdx].src}?q_auto,f_auto,w_1200 1200w, ${photos[lightboxIdx].src}?q_auto,f_auto,w_1800 1800w`}
            sizes="(max-width:600px) 100vw, (max-width:1200px) 100vw, 1200px"
            alt={`${title} shot ${lightboxIdx + 1}`}
            onClick={(e) => e.stopPropagation()}
            className={`transform origin-center transition-transform duration-200 ${
              photos[lightboxIdx].orientation === 'vertical'
                ? '-rotate-90 max-w-[90vh] max-h-[90vw]'
                : 'rotate-0 max-w-[90vw] max-h-[90vh]'
            } object-contain`}
            loading="eager"
            style={{ backgroundColor: photos[lightboxIdx].dominantColor }}
          />
        </div>
      )}
    </main>
  );
};

export default GalleryDetail;