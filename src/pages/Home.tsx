import React from 'react';
import Hero from '../components/Hero';
import Quote from '../components/Quote';
import LocationInfo from '../components/LocationInfo';
import GalleryPreview from '../components/GalleryPreview';
import Kaleidoscope from '../components/Kaleidoscope';
import HelloSection from '../components/HelloSection';
import {
  DraggableCardBody,
  DraggableCardContainer,
} from '../components/ui/draggable-card';

const Home: React.FC = () => {
  const photographyItems = [
    {
      title: "Pacheco",
      image: "https://res.cloudinary.com/dlfmzlwp6/image/upload/v1751191624/pachecopass/dsc06041.jpg",
      className: "absolute top-12 left-[55%] rotate-[-5deg]",
    },
    {
      title: "Berlin",
      image: "https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747730763/berlinstreet/dsc00725.jpg",
      className: "absolute bottom-64 left-[35%] rotate-[-7deg]",
    },
    {
      title: "Architecture",
      image: "https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747773495/architecture/dsc02269.jpg",
      className: "absolute top-56 left-[55%] rotate-[8deg]",
    },
    {
      title: "Nature",
      image: "https://res.cloudinary.com/dlfmzlwp6/image/upload/v1748512319/joshuatree/dsc04025.jpg",
      className: "absolute top-64 left-[60%] rotate-[10deg]",
    },
    {
      title: "Street",
      image: "https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747730811/berlinstreet/dsc01321.jpg",
      className: "absolute top-72 right-[25%] rotate-[2deg]",
    },
    {
      title: "Urban",
      image: "https://res.cloudinary.com/dlfmzlwp6/image/upload/v1751189663/sanfrancisco/dsc06488.jpg",
      className: "absolute bottom-32 right-[22%] rotate-[-7deg]",
    },
    {
      title: "Moments",
      image: "https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747703419/LagunaBeach/dsc03871.jpg",
      className: "absolute bottom-20 right-[68%] rotate-[4deg]",
    },
    {
      title: "Brewing",
      image: "https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747808971/coffee/dsc01861.jpg",
      className: "absolute bottom-20 right-[50%] rotate-[4deg]",
    },
    {
      title: "Golden State Bridge",
      image: "https://res.cloudinary.com/dlfmzlwp6/image/upload/v1751189995/sanfrancisco/dsc06738.jpg",
      className: "absolute -top-80 right-[60%] rotate-[4deg]",
    },
  ];

  return (
    <div>
      {/* Draggable Photography Cards */}
      <DraggableCardContainer className="relative flex min-h-screen w-full items-center justify-center overflow-clip bg-gradient-to-br from-neutral-50 to-neutral-100">
        <p className="absolute top-1/2 mx-auto max-w-2xl -translate-y-3/4 text-center text-2xl font-cormorant text-neutral-600 md:text-4xl px-6">
          Drag and explore my photography journey through different moments and places.
        </p>
        {photographyItems.map((item, index) => (
          <DraggableCardBody key={index} className={item.className}>
            <img
              src={item.image}
              alt={item.title}
              className="pointer-events-none relative z-10 h-70 w-100 object-cover rounded-lg mx-auto"
            />
            <h3 className="mt-4 text-center text-2xl font-cormorant font-bold text-neutral-700">
              {item.title}
            </h3>
          </DraggableCardBody>
        ))}
      </DraggableCardContainer>

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