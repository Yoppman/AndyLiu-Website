import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import FilmStrip from '../components/experimental/FilmStrip';
import ParallaxStory from '../components/experimental/ParallaxStory';

const Experimental: React.FC = () => {
  return (
    <PageTransition>
      <div className="relative bg-neutral-950 min-h-screen">
        {/* Floating back link */}
        <nav className="fixed top-5 left-5 z-[500]">
          <Link
            to="/photography"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] text-white/50 hover:text-white transition-colors text-[13px] tracking-wide"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            <span className="font-cormorant">Back</span>
          </Link>
        </nav>

        {/* ── Section 1: Film Strip ── */}
        <section>
          {/* Section intro */}
          <div className="pt-32 pb-16 px-6 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="font-cormorant italic text-white/25 text-sm tracking-[0.25em] uppercase mb-4"
            >
              Experience I
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="font-playfair text-white text-4xl md:text-5xl lg:text-6xl leading-tight max-w-3xl mx-auto"
            >
              The Film Strip
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="font-cormorant text-white/30 text-lg mt-4 max-w-lg mx-auto"
            >
              A horizontal journey through every collection — drag, scroll, or swipe to explore.
            </motion.p>
          </div>

          <FilmStrip />
        </section>

        {/* Divider */}
        <div className="flex justify-center py-20">
          <div className="w-px h-32 bg-gradient-to-b from-transparent via-white/8 to-transparent" />
        </div>

        {/* ── Section 2: Parallax Story ── */}
        <section>
          <div className="pb-8 px-6 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="font-cormorant italic text-white/25 text-sm tracking-[0.25em] uppercase mb-4"
            >
              Experience II
            </motion.p>
          </div>

          <ParallaxStory />
        </section>
      </div>
    </PageTransition>
  );
};

export default Experimental;
