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
            className="w-full h-full object-cover blur-xl scale-105"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
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
          src={inView ? cldFull(photo.src, 600) : undefined}
          srcSet={inView ? cldSet(photo.src, [400, 600, 900, 1200]) : undefined}
          sizes="(max-width:600px) 100vw, (max-width:1200px) 50vw, 600px"
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          style={{ backgroundColor: photo.dominantColor, contentVisibility: 'auto' as any }}
          onLoad={() => { setLoaded(true); setIsLoading(false); }}
        />
      </div>
    );
  }
);
LazyImage.displayName = 'LazyImage';

export default LazyImage;
