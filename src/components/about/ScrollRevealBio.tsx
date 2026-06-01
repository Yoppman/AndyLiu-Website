import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Compare } from '../ui/compare';

const sentences = [
  "I'm Chia Da Liu — I earned my M.S. in Embedded & Cyber-Physical Systems at UC Irvine, and today I build high-availability systems as a Member of Technical Staff at Everpure (formerly Pure Storage).",
  'I bridge low-level firmware and high-level software — C++ drivers, Python automation, and ROS-based robotics.',
  "Beyond code, I'm an avid street and travel photographer, always hunting the perfect light and angle.",
];

const ScrollRevealBio: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const compareY = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-[#e7e5e0]">
      <div className="w-full px-[8vw] sm:px-[6vw] md:px-[4vw] lg:px-[4vw] xl:px-[6vw] 2xl:px-[10vw]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-32 xl:gap-24 items-center">
          <div className="px-4 lg:px-0">
            {/* eyebrow */}
            <motion.div
              className="flex items-center gap-4 mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="h-px w-10 bg-amber-500" />
              <span className="font-cormorant tracking-[0.3em] text-xs uppercase text-neutral-400">
                The person behind the work
              </span>
            </motion.div>

            {/* heading — slides up from a clipped mask */}
            <div className="overflow-hidden mb-8">
              <motion.h2
                className="font-playfair text-4xl md:text-5xl leading-tight"
                initial={{ y: '110%' }}
                whileInView={{ y: '0%' }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                From Taiwan to the Bay
              </motion.h2>
            </div>

            <div className="space-y-5">
              {sentences.map((sentence, i) => (
                <motion.p
                  key={i}
                  className="text-lg md:text-xl leading-relaxed text-neutral-700 border-l-2 border-transparent pl-0"
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 + i * 0.12 }}
                >
                  {sentence}
                </motion.p>
              ))}
            </div>
          </div>

          <motion.div className="flex justify-center lg:justify-end px-4 lg:px-0" style={{ y: compareY }}>
            <motion.div
              className="p-4 rounded-[2rem] bg-neutral-50 border border-neutral-200 shadow-xl"
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <Compare
                firstImage="https://res.cloudinary.com/duo70zkqx/image/upload/v1755454381/others/dsc08410.jpg"
                secondImage="https://res.cloudinary.com/duo70zkqx/image/upload/v1755454151/others/dsc09302.jpg"
                firstImageClassName="object-cover object-center"
                secondImageClassname="object-cover object-center"
                className="h-[320px] w-[320px] md:h-[480px] md:w-[480px] rounded-[1.5rem]"
                slideMode="hover"
                autoplay={true}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ScrollRevealBio;
