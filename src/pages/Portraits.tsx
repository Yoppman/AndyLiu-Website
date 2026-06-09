import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import PageTransition from '../components/PageTransition';
import BackButton from '../components/BackButton';
import ComicWall from '../components/portraits/ComicWall';
import { portraits } from '../data/portraits';

/* Halftone / Ben-Day dot field — the printed-comic texture. */
const DOTS =
  'radial-gradient(rgba(255,255,255,0.92) 1px, transparent 1.5px)';

const Portraits: React.FC = () => {
  return (
    <PageTransition>
      <div className="relative min-h-screen bg-black text-white">
        <BackButton />
        {/* ── Comic-cover title ── */}
        <header className="relative overflow-hidden px-6 pt-28 pb-12 text-center md:pt-32">
          {/* halftone behind the logotype */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.13]"
            style={{ backgroundImage: DOTS, backgroundSize: '7px 7px' }}
          />
          {/* a soft colour wash so it doesn't read as pure black */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(60% 70% at 50% 0%, rgba(245,158,11,0.10), rgba(0,0,0,0) 70%)',
            }}
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative mb-4 pl-[0.5em] font-cormorant text-xs uppercase tracking-[0.5em] text-amber-300/80"
          >
            A field of faces · beta
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.1 }}
            className="relative font-playfair text-6xl font-black leading-[0.82] tracking-tight md:text-8xl lg:text-9xl"
          >
            PORTRAITS
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative mx-auto mt-6 max-w-xl font-cormorant text-lg italic leading-relaxed text-white/55 [text-wrap:balance] md:text-xl"
          >
            The people inside the frames — strangers composed into meaning for a single
            second, and the ones who never knew they were a photograph. Read it like a
            comic: panel by panel, face by face.
          </motion.p>
        </header>

        {/* ── The wall ── */}
        <main className="relative px-1 pb-1">
          <ComicWall />
          {/* faint global halftone for the printed-page feel */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
            style={{ backgroundImage: DOTS, backgroundSize: '5px 5px' }}
          />
        </main>

        {/* ── Footer ── */}
        <footer className="px-6 py-20 text-center">
          <p className="font-cormorant text-base italic text-white/30">
            {portraits.length} frames · a living edit, still growing
          </p>
          <Link
            to="/photography"
            className="group mt-4 inline-flex items-center gap-2 font-cormorant text-xs uppercase tracking-[0.3em] text-white/55 transition-colors hover:text-white"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
            Back to the collections
          </Link>
        </footer>
      </div>
    </PageTransition>
  );
};

export default Portraits;
