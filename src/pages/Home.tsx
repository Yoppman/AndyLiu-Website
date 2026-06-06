import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Quote from '../components/Quote';
import LocationInfo from '../components/LocationInfo';
import GalleryPreview from '../components/GalleryPreview';
import HomeHero, { type HeroOpening } from '../components/home/HomeHero';
import PageTransition from '../components/PageTransition';
import CursorGlow from '../components/CursorGlow';
import DraggableBusinessCard from '../components/contact/DraggableBusinessCard';

const OPENINGS: { id: HeroOpening; label: string }[] = [
  { id: 'wall', label: 'The Wall' },
  { id: 'frame', label: 'The Frame' },
  { id: 'classic', label: 'Current' },
];

/** TEMPORARY: lets us compare the redesigned openings live. Remove once chosen. */
const OpeningSwitcher: React.FC<{ value: HeroOpening; onChange: (v: HeroOpening) => void }> = ({
  value,
  onChange,
}) => (
  <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-1 rounded-full border border-white/10 bg-black/55 px-2 py-1.5 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
    <span className="px-2 font-cormorant text-[0.6rem] uppercase tracking-[0.3em] text-white/40">
      Opening
    </span>
    {OPENINGS.map((o) => (
      <button
        key={o.id}
        onClick={() => onChange(o.id)}
        className={`rounded-full px-3 py-1 font-cormorant text-sm transition-colors ${
          value === o.id ? 'bg-[#efeae1] text-black' : 'text-white/60 hover:text-white'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const Home: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const raw = params.get('hero');
  const opening: HeroOpening =
    raw === 'frame' || raw === 'classic' || raw === 'wall' ? raw : 'wall';

  const setOpening = (v: HeroOpening) =>
    setParams(
      (prev) => {
        prev.set('hero', v);
        return prev;
      },
      { replace: true },
    );

  return (
    <PageTransition>
    <div className="relative">
      <CursorGlow />

      <OpeningSwitcher value={opening} onChange={setOpening} />

      <HomeHero opening={opening} />

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