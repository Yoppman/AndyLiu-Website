import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import WordByWordReveal from './WordByWordReveal';

interface CinematicHeroProps {
  imageSrc: string;
  quote: string;
  author?: string;
}

const CinematicHero: React.FC<CinematicHeroProps> = ({ imageSrc, quote, author }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1.3, 1.0]);
  const overlayOpacity = useTransform(scrollYProgress, [0.1, 0.6], [0, 0.6]);
  const contentOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 1]);

  return (
    <section ref={sectionRef} className="relative" style={{ height: '200vh' }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        <motion.div
          className="absolute inset-0"
          style={{ scale }}
        >
          <img
            src={imageSrc}
            alt=""
            className="w-full h-full object-cover"
          />
        </motion.div>

        <motion.div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />

        <motion.div
          className="relative z-10 max-w-3xl mx-auto px-8 text-center"
          style={{ opacity: contentOpacity }}
        >
          <WordByWordReveal
            text={quote}
            scrollProgress={scrollYProgress}
            startAt={0.3}
            endAt={0.7}
            className="font-playfair text-3xl md:text-5xl italic text-white leading-relaxed"
          />
          {author && (
            <motion.p
              className="mt-8 font-cormorant text-lg text-white/70 tracking-widest uppercase"
              style={{
                opacity: useTransform(scrollYProgress, [0.65, 0.8], [0, 1]),
              }}
            >
              — {author}
            </motion.p>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default CinematicHero;
