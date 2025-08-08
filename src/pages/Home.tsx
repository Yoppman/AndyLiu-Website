import React from 'react';
import Hero from '../components/Hero';
import Quote from '../components/Quote';
import LocationInfo from '../components/LocationInfo';
import GalleryPreview from '../components/GalleryPreview';
import Kaleidoscope from '../components/Kaleidoscope';
import HelloSection from '../components/HelloSection';

const Home: React.FC = () => {
  return (
    <div>
      <Kaleidoscope />
      <HelloSection />
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
  );
};

export default Home;