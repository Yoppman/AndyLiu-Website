import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { useInView } from 'react-intersection-observer';

interface Stat {
  value: number;
  label: string;
  suffix: string;
  decimals: number;
}

const stats: Stat[] = [
  { value: 4.0, label: 'GPA', suffix: '/4.0', decimals: 1 },
  { value: 7, label: 'Projects', suffix: '+', decimals: 0 },
  { value: 3, label: 'Internships', suffix: '+', decimals: 0 },
  { value: 2, label: 'Degrees', suffix: '', decimals: 0 },
];

const StatItem: React.FC<{ stat: Stat; delay: number }> = ({ stat, delay }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) =>
    v.toFixed(stat.decimals)
  );
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (inView && !hasAnimated.current) {
      hasAnimated.current = true;
      const timeout = setTimeout(() => {
        animate(count, stat.value, { duration: 2, ease: 'easeOut' });
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [inView, count, stat.value, delay]);

  return (
    <motion.div
      ref={ref}
      className="text-center px-6 py-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
    >
      <div className="flex items-baseline justify-center">
        <motion.span className="font-cormorant text-6xl md:text-7xl font-bold text-neutral-900">
          {rounded}
        </motion.span>
        <span className="font-cormorant text-2xl md:text-3xl text-amber-500 ml-1">
          {stat.suffix}
        </span>
      </div>
      <p className="mt-3 text-xs md:text-sm uppercase tracking-[0.25em] text-neutral-400 font-sans">
        {stat.label}
      </p>
    </motion.div>
  );
};

const StatsCounter: React.FC = () => {
  return (
    <section className="py-20 md:py-24 bg-[#e7e5e0]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-neutral-200">
          {stats.map((stat, i) => (
            <StatItem key={stat.label} stat={stat} delay={i * 200} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsCounter;
