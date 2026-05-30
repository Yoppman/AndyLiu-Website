import { useState, useEffect, forwardRef, MutableRefObject } from 'react';
import { useInView } from 'react-intersection-observer';
import { LoaderOne } from '../../ui/loader';
import { PLACEHOLDER_ONLY, cldFull, cldSet, cldPlaceholder, Photo } from './cloudinaryUtils';

type ImgRef = MutableRefObject<HTMLImageElement | null>;

const LazyImage = forwardRef<HTMLImageElement, { photo: Photo; alt: string }>(
  ({ photo, alt }, externalRef) => {
    const [loaded, setLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { ref: inViewRef, inView } = useInView({
      rootMargin: '200px',
      triggerOnce: true,
    });

    const setRefs = (node: HTMLImageElement | null) => {
      inViewRef(node);
      if (typeof externalRef === 'function') externalRef(node);
      else if (externalRef) (externalRef as ImgRef).current = node;
    };

    useEffect(() => {
      if (inView && !loaded && !PLACEHOLDER_ONLY) {
        setIsLoading(true);
      }
    }, [inView, loaded]);

    const isLR = photo.lightroom === 1 || photo.lightroom === true;

    const orientClass =
      photo.orientation === 'vertical'
        ? (isLR ? 'h-full w-auto object-contain' : 'object-contain -rotate-90')
        : 'object-cover';

    if (PLACEHOLDER_ONLY) {
      return (
        <div className="relative w-full h-full">
          {isLoading && !loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
              <LoaderOne />
            </div>
          )}
          <img
            ref={setRefs}
            src={cldPlaceholder(photo.src)}
            alt={alt}
            className={`max-h-[90vh] w-full transition-transform duration-300 hover:scale-105 opacity-100 ${orientClass} blur-xl scale-105`}
            loading="lazy"
            decoding="async"
            /* @ts-ignore */ fetchpriority="low"
            style={{ backgroundColor: photo.dominantColor, contentVisibility: 'auto' as any }}
            onLoad={() => { setLoaded(true); setIsLoading(false); }}
          />
        </div>
      );
    }

    return (
      <div className="relative w-full h-full">
        {isLoading && !loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
            <LoaderOne />
          </div>
        )}
        <img
          ref={setRefs}
          src={inView ? cldFull(photo.src, 300) : undefined}
          srcSet={inView ? cldSet(photo.src, [300, 600, 900]) : undefined}
          sizes="(max-width:600px) 100vw, (max-width:1200px) 50vw, 600px"
          alt={alt}
          className={`max-h-[90vh] w-full transition-transform duration-300 hover:scale-105 transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          } ${orientClass}`}
          loading="lazy"
          decoding="async"
          /* @ts-ignore */ fetchpriority="low"
          style={{ backgroundColor: photo.dominantColor, contentVisibility: 'auto' as any }}
          onLoad={() => { setLoaded(true); setIsLoading(false); }}
        />
      </div>
    );
  }
);
LazyImage.displayName = 'LazyImage';

export default LazyImage;
