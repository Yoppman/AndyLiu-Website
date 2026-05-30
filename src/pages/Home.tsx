import React from 'react';
import Hero from '../components/Hero';
import Quote from '../components/Quote';
import LocationInfo from '../components/LocationInfo';
import GalleryPreview from '../components/GalleryPreview';
import HomeHero from '../components/home/HomeHero';
import PageTransition from '../components/PageTransition';
import CursorTrailCanvas from '../components/CursorTrailCanvas';
import FilmGrainOverlay from '../components/FilmGrainOverlay';

const Home: React.FC = () => {
  return (
    <PageTransition>
    <div className="relative">
      <CursorTrailCanvas />
      <FilmGrainOverlay />

      <HomeHero />

      <Hero />
      <Quote
        imageSrc="https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747459484/DSC02462_bqch9d.jpg"
        text="In every hidden corner of the earth, I honor the story woven behind the scene—not only the scene itself."
        author="Andy Liu"
        heightClassName="h-[400px]"
      />
      <GalleryPreview />
      <LocationInfo />
    </div>
    </PageTransition>
  );
};

export default Home;