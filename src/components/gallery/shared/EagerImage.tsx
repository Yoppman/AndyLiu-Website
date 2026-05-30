import { useState, forwardRef, MutableRefObject } from 'react';
import { LoaderOne } from '../../ui/loader';
import { PLACEHOLDER_ONLY, cldFull, cldSet, cldPlaceholder, Photo } from './cloudinaryUtils';

type ImgRef = MutableRefObject<HTMLImageElement | null>;

const EagerImage = forwardRef<HTMLImageElement, { photo: Photo; alt: string }>(
  ({ photo, alt }, externalRef) => {
    const [loaded, setLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const setRefs = (node: HTMLImageElement | null) => {
      if (typeof externalRef === 'function') externalRef(node);
      else if (externalRef) (externalRef as ImgRef).current = node;
    };

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
            className={`max-h-[90vh] w-full ${
              photo.orientation === 'vertical' ? ' object-contain -rotate-90' : 'object-cover'
            } blur-xl scale-105`}
            loading="eager"
            decoding="async"
            /* @ts-ignore */ fetchpriority="high"
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
          src={cldFull(photo.src, 600)}
          srcSet={cldSet(photo.src, [300, 600, 900])}
          sizes="(max-width:600px) 100vw, (max-width:1200px) 50vw, 600px"
          alt={alt}
          className={`max-h-[90vh] w-full ${
            photo.orientation === 'vertical' ? ' object-contain -rotate-90' : 'object-cover'
          }`}
          loading="eager"
          decoding="async"
          /* @ts-ignore */ fetchpriority="high"
          style={{ backgroundColor: photo.dominantColor, contentVisibility: 'auto' as any }}
          onLoad={() => { setLoaded(true); setIsLoading(false); }}
        />
      </div>
    );
  }
);
EagerImage.displayName = 'EagerImage';

export default EagerImage;
