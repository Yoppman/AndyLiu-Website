import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Compare } from '../ui/compare';

const sentences = [
  "I'm Chia Da Liu, a master's student in Embedded & Cyber-Physical Systems at UC Irvine (expected Dec 2025) and soon-to-be Software Test Development Engineer Intern at Pure Storage.",
  "I bridge low-level firmware and high-level software — crafting C++ drivers, Python automation scripts, and ROS-based robotic demos.",
  "Beyond code, I'm an avid street and travel photographer, always hunting the perfect light and angle.",
];

const ScrollRevealBio: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const compareY = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section ref={sectionRef} className="py-20 bg-white">
      <div className="w-full px-[8vw] sm:px-[6vw] md:px-[4vw] lg:px-[4vw] xl:px-[6vw] 2xl:px-[10vw]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-32 xl:gap-24 items-center">
          <div className="px-4 lg:px-0">
            <motion.h2
              className="font-playfair text-4xl mb-8"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            >
              From Taiwan to Irvine, CA
            </motion.h2>

            <div className="space-y-4">
              {sentences.map((sentence, i) => (
                <motion.p
                  key={i}
                  className="text-xl leading-relaxed"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.8 }}
                  transition={{
                    duration: 0.6,
                    ease: 'easeOut',
                    delay: i * 0.15,
                  }}
                >
                  {sentence}
                </motion.p>
              ))}
            </div>
          </div>

          <motion.div
            className="flex justify-center lg:justify-end px-4 lg:px-0"
            style={{ y: compareY }}
          >
            <motion.div
              className="p-6 border rounded-3xl bg-white border-neutral-200 shadow-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Compare
                firstImage="https://res.cloudinary.com/duo70zkqx/image/upload/v1755454381/others/dsc08410.jpg"
                secondImage="https://res.cloudinary.com/duo70zkqx/image/upload/v1755454151/others/dsc09302.jpg"
                firstImageClassName="object-cover object-center"
                secondImageClassname="object-cover object-center"
                className="h-[300px] w-[300px] md:h-[500px] md:w-[500px]"
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
