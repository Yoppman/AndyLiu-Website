import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';

/**
 * The single "about" beat — personality first, substance below. The playful
 * hook (formerly the home Hero) and the formal bio are merged here so the page
 * introduces the person once, not twice.
 */
const playful = ['shoot streets', 'brew beans', 'dance to the beat', 'debug life'];

const sentences = [
  "I'm Chia Da Liu — I earned my M.S. in Embedded & Cyber-Physical Systems at UC Irvine, and today I build high-availability systems as a Member of Technical Staff at Everpure (formerly Pure Storage).",
  'I bridge low-level firmware and high-level software — C++ drivers, Python automation, and ROS-based robotics.',
  "Beyond code, I'm an avid street and travel photographer, always hunting the perfect light and angle.",
];

// His portrait, delivered upright via Cloudinary rotation (a_270) — no CSS hack.
const PORTRAIT =
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/a_270,w_900,q_auto,f_auto/v1754866979/asset/dscf4602.jpg';

const ScrollRevealBio: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const portraitY = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section ref={sectionRef} className="bg-[#0a0a0b] py-24 md:py-32">
      <div className="w-full px-[8vw] sm:px-[6vw] md:px-[4vw] xl:px-[6vw] 2xl:px-[10vw]">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-24">
          {/* Text */}
          <div className="order-2 px-4 lg:order-1 lg:px-0">
            <motion.div
              className="mb-8 flex items-center gap-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="h-px w-10 bg-amber-500" />
              <span className="font-cormorant text-xs uppercase tracking-[0.3em] text-[#efeae1]/45">
                The person behind the work
              </span>
            </motion.div>

            {/* Playful hook */}
            <div className="mb-6">
              {playful.map((line, i) => (
                <div key={line} className="overflow-hidden">
                  <motion.p
                    className="font-playfair text-3xl leading-[1.2] text-[#efeae1] md:text-4xl"
                    initial={{ y: '110%' }}
                    whileInView={{ y: '0%' }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
                  >
                    I <span className="italic text-[#efeae1]/50">{line}</span>
                  </motion.p>
                </div>
              ))}
            </div>
            <motion.p
              className="mb-10 font-cormorant text-lg italic text-[#efeae1]/60 md:text-xl"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Life&rsquo;s too short not to enjoy every frame, flavor, and freestyle.
            </motion.p>

            {/* Substance */}
            <div className="border-t border-white/10 pt-8">
              <h3 className="mb-5 font-playfair text-xl text-[#efeae1]/90">From Taiwan to the Bay</h3>
              <div className="space-y-5">
                {sentences.map((s, i) => (
                  <motion.p
                    key={i}
                    className="text-base leading-relaxed text-[#efeae1]/70 md:text-lg"
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 + i * 0.1 }}
                  >
                    {s}
                  </motion.p>
                ))}
              </div>
            </div>
          </div>

          {/* Portrait — a clean print floating on the dark, lit by a soft glow */}
          <motion.div
            className="order-1 flex justify-center px-4 lg:order-2 lg:justify-end lg:px-0"
            style={{ y: portraitY }}
          >
            <div className="flex flex-col items-center">
              <div className="relative">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-8 blur-2xl"
                  style={{
                    background:
                      'radial-gradient(closest-side, rgba(244,208,150,0.16), transparent)',
                  }}
                />
                <motion.img
                  src={PORTRAIT}
                  alt="Portrait of Andy Liu"
                  draggable={false}
                  className="relative w-full max-w-[360px] rounded-[3px] shadow-[0_35px_70px_-20px_rgba(0,0,0,0.6)] md:max-w-[420px]"
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>

              {/* Résumé — a quiet hairline button that ignites amber on hover */}
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Link
                  to="/resume"
                  className="group inline-flex items-center gap-3 rounded-full border border-white/15 px-7 py-3 transition-all duration-500 hover:border-amber-400/50 hover:bg-amber-400/[0.06]"
                >
                  <span className="font-cormorant text-sm uppercase tracking-[0.35em] text-[#efeae1]/80 transition-colors duration-500 group-hover:text-amber-300">
                    My Résumé
                  </span>
                  <span className="text-[#efeae1]/50 transition-all duration-500 group-hover:translate-x-1 group-hover:text-amber-300">
                    &rarr;
                  </span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ScrollRevealBio;
