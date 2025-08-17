// src/components/ImageSlideshow.tsx
import React, { useState, useEffect } from 'react';
import { BackgroundGradient } from './ui/background-gradient';

interface ImageSlideshowProps {
  images: string[];
  interval?: number; // optional custom interval in ms
  aspect?: string;   // optional aspect ratio like '3/2', '2/3'
  objectFit?: 'cover' | 'contain'; // default is 'contain'
}

const ImageSlideshow: React.FC<ImageSlideshowProps> = ({
  images,
  interval = 2000,
  aspect = '2/3',
  objectFit = 'cover',
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <BackgroundGradient className="rounded-2xl" containerClassName="p-[5px]">
      <div className={`relative w-full aspect-[${aspect}] overflow-hidden rounded-2xl`}>
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Slide ${i}`}
            className={`
              absolute inset-0 w-full h-full object-${objectFit}
              transition-opacity duration-1000 ease-in-out
              ${i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'}
            `}
          />
        ))}
      </div>
    </BackgroundGradient>
  );
};

export default ImageSlideshow;