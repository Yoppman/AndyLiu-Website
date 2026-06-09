import React from 'react';
import Quote from '../components/Quote';
import LocationInfo from '../components/LocationInfo';
import GalleryPreview from '../components/GalleryPreview';
import HomeHero from '../components/home/HomeHero';
import PageTransition from '../components/PageTransition';
import CursorGlow from '../components/CursorGlow';
import DraggableBusinessCard from '../components/contact/DraggableBusinessCard';

const Home: React.FC = () => {
  return (
    <PageTransition>
    <div className="relative">
      <CursorGlow />

      <HomeHero opening="wall" />

      <Quote
        imageSrc="https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747459484/DSC02462_bqch9d.jpg"
        text="I left with a card full of borrowed light and the sense that the city had barely noticed me at all — which is, I have come to think, exactly how a place lets you love it."
        heightClassName="h-[85vh]"
      />
      <GalleryPreview />

      <LocationInfo />

      {/* Let's connect — the interactive business card */}
      <section className="relative overflow-hidden bg-neutral-950 py-28 md:py-36">
        {/* soft amber spotlight behind the card */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(60% 55% at 50% 45%, rgba(245,158,11,0.10) 0%, rgba(245,158,11,0) 60%)',
          }}
        />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <p className="font-cormorant italic text-amber-200/70 text-2xl md:text-3xl mb-3">
            Let&rsquo;s connect
          </p>
          <h2 className="font-cormorant text-4xl md:text-5xl text-white leading-tight mb-12">
            Keep in touch
          </h2>
          <div className="flex justify-center">
            <DraggableBusinessCard />
          </div>
        </div>
      </section>
    </div>
    </PageTransition>
  );
};

export default Home;
