// src/pages/GalleryDetail.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { galleries } from '../data/galleries';

const GalleryDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const idx = galleries.findIndex(g => g.slug === slug);
  if (idx < 0) return <p className="p-16 text-center">Gallery not found</p>;

  const gallery = galleries[idx];
  const { title, description, photos } = gallery;

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  // start with the hero image's color
  const [bgColor, setBgColor] = useState<string>(photos[0].dominantColor);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);

  // Close lightbox on Escape
  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setLightboxIdx(null);
  }, []);
  useEffect(() => {
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onKey]);

  // Observe which photo is in view and set its precomputed color
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const i = imgRefs.current.indexOf(img);
            if (i >= 0) {
              setBgColor(photos[i].dominantColor);
            }
            break;
          }
        }
      },
      { threshold: 0.4 }
    );

    imgRefs.current.forEach((img) => {
      if (img) observer.observe(img);
    });
    return () => observer.disconnect();
  }, [photos]);

  const hero = photos[0];
  const prev = galleries[idx - 1];
  const next = galleries[idx + 1];

  return (
    <main
      className="min-h-screen w-full transition-colors duration-1000"
      style={{ backgroundColor: bgColor }}
    >
      {/* Hero */}
      <div
        className={`
          relative w-full h-[50vh] overflow-hidden
          ${hero.orientation === 'vertical'
            ? 'aspect-[2/3]'
            : 'aspect-[3/2]'}
        `}
      >
        <img
          src={hero.src}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        <h1
          className="
            absolute bottom-8 left-1/2 transform -translate-x-1/2
            text-white font-cormorant text-4xl md:text-5xl lg:text-6xl
          "
        >
          {title}
        </h1>
      </div>

      {/* Description */}
      <div className="max-w-4xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-8">
        <p className="font-cormorant text-lg leading-relaxed">{description}</p>
        <p className="font-cormorant text-lg leading-relaxed">
          Here’s a more in‑depth story behind this series: your inspirations,
          the challenges you faced, any anecdotes you want to share.
        </p>
      </div>

      {/* Photo grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
          {photos.map((photo, i) => (
            <button
              key={photo.src}
              onClick={() => setLightboxIdx(i)}
              className={`
                block w-full overflow-hidden 
                ${photo.orientation === 'vertical'
                  ? 'aspect-[2/3]'
                  : 'aspect-[3/2]'}
              `}
            >
              <img
                ref={(el) => (imgRefs.current[i] = el)}
                src={photo.src}
                alt={`${title} shot ${i + 1}`}
                className={`
                  w-full h-full object-contain
                  transition-transform duration-300 hover:scale-105
                  ${photo.orientation === 'vertical' ? '-rotate-90' : ''}
                `}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Prev / Next */}
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
            src={photos[lightboxIdx].src}
            alt={`${title} shot ${lightboxIdx + 1}`}
            onClick={(e) => e.stopPropagation()}
            className={`
              transform origin-center transition-transform duration-200
              ${photos[lightboxIdx].orientation === 'vertical'
                ? '-rotate-90 max-w-[90vh] max-h-[90vw]'
                : 'rotate-0 max-w-[90vw] max-h-[90vh]'}
              object-contain
            `}
          />
        </div>
      )}
    </main>
  );
};

export default GalleryDetail;