import { useRef } from 'react';
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
    <section ref={sectionRef} className="bg-[#e7e5e0] py-24 md:py-32">
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
              <span className="font-cormorant text-xs uppercase tracking-[0.3em] text-neutral-400">
                The person behind the work
              </span>
            </motion.div>

            {/* Playful hook */}
            <div className="mb-6">
              {playful.map((line, i) => (
                <div key={line} className="overflow-hidden">
                  <motion.p
                    className="font-playfair text-3xl leading-[1.2] text-neutral-900 md:text-4xl"
                    initial={{ y: '110%' }}
                    whileInView={{ y: '0%' }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
                  >
                    I <span className="italic text-neutral-500">{line}</span>
                  </motion.p>
                </div>
              ))}
            </div>
            <motion.p
              className="mb-10 font-cormorant text-lg italic text-neutral-600 md:text-xl"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Life&rsquo;s too short not to enjoy every frame, flavor, and freestyle.
            </motion.p>

            {/* Substance */}
            <div className="border-t border-neutral-300/70 pt-8">
              <h3 className="mb-5 font-playfair text-xl text-neutral-800">From Taiwan to the Bay</h3>
              <div className="space-y-5">
                {sentences.map((s, i) => (
                  <motion.p
                    key={i}
                    className="text-base leading-relaxed text-neutral-700 md:text-lg"
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

          {/* Portrait */}
          <motion.div
            className="order-1 flex justify-center px-4 lg:order-2 lg:justify-end lg:px-0"
            style={{ y: portraitY }}
          >
            <motion.div
              className="max-w-[340px] rounded-[1.75rem] border border-neutral-200 bg-neutral-50 p-3 shadow-xl md:max-w-[400px]"
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src={PORTRAIT}
                alt="Portrait of Andy Liu"
                draggable={false}
                className="h-auto w-full rounded-[1.25rem]"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ScrollRevealBio;
