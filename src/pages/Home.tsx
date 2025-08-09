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
      title: "Laguna Beach",
      image: "https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747703401/LagunaBeach/dsc03805.jpg",
      className: "absolute top-10 left-[20%] rotate-[-5deg]",
    },
    {
      title: "Berlin Street",
      image: "https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747780923/DSC03231_lh0bqs.jpg",
      className: "absolute top-40 left-[25%] rotate-[-7deg]",
    },
    {
      title: "Architecture",
      image: "https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747780922/DSC03229_rlenrb.jpg",
      className: "absolute top-5 left-[40%] rotate-[8deg]",
    },
    {
      title: "Nature",
      image: "https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747780921/DSC03228_dye5rr.jpg",
      className: "absolute top-32 left-[55%] rotate-[10deg]",
    },
    {
      title: "Street Life",
      image: "https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747780920/DSC03227_alnevm.jpg",
      className: "absolute top-20 right-[35%] rotate-[2deg]",
    },
    {
      title: "Urban",
      image: "https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747780919/DSC03226_mekiqz.jpg",
      className: "absolute top-24 left-[45%] rotate-[-7deg]",
    },
    {
      title: "Moments",
      image: "https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747780918/DSC03225_bubdih.jpg",
      className: "absolute top-8 left-[30%] rotate-[4deg]",
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
              className="pointer-events-none relative z-10 h-80 w-80 object-cover rounded-lg"
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