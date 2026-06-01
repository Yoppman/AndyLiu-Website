import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Briefcase, GraduationCap } from 'lucide-react';

interface Milestone {
  year: string;
  org: string;
  place?: string;
  role?: string;
  detail?: string;
  type: 'work' | 'edu';
  current?: boolean;
}

const milestones: Milestone[] = [
  {
    year: 'Now',
    org: 'Everpure (formerly Pure Storage)',
    place: 'Santa Clara',
    role: 'Member of Technical Staff — FlashBlade High Availability Team',
    detail: "Building the high-availability layer of FlashBlade, the company's scale-out platform for unstructured data.",
    type: 'work',
    current: true,
  },
  {
    year: '2025',
    org: 'Pure Storage',
    place: 'Santa Clara',
    role: 'Software Engineer Intern',
    detail: 'Optimized the write data path of an enterprise distributed storage system using the Data Streaming Accelerator (DSA).',
    type: 'work',
  },
  {
    year: '2024',
    org: 'University of California, Irvine',
    role: 'M.S. — Embedded & Cyber-Physical Systems',
    detail: 'GPA 4.0 / 4.0. Coursework: IoT Sensors & Actuators, Embedded Software, Control Systems.',
    type: 'edu',
  },
  {
    year: '2023',
    org: 'AdvanTech, Inc.',
    role: 'Software R&D Intern',
    detail: "Led a data-augmentation module using diffusion and deep generative models on the company's ML platform.",
    type: 'work',
  },
  {
    year: '2022',
    org: 'Industrial Technology Research Institute',
    role: 'Cloud Application Intern',
    detail: 'Automated service deployment for Docker containers across GCP Kubernetes clusters via shell tooling.',
    type: 'work',
  },
  {
    year: '2018',
    org: 'National Yang Ming Chiao Tung University',
    role: 'B.S. Computer Science · B.S. Industrial Engineering & Management',
    detail: 'GPA 4.13 / 4.3.',
    type: 'edu',
  },
  {
    year: '2015',
    org: 'Taipei Municipal Chien Kuo High School',
    type: 'edu',
  },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } } };
const line = {
  hidden: { opacity: 0, y: 26, filter: 'blur(9px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const Row: React.FC<{ m: Milestone }> = ({ m }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const yearY = useTransform(scrollYProgress, [0, 1], [70, -70]); // parallax
  const Icon = m.type === 'edu' ? GraduationCap : Briefcase;

  return (
    <div ref={ref} className="relative py-[9vh] pl-16 md:pl-44">
      {/* (1) parallax ghost year */}
      <motion.span
        style={{ y: yearY }}
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/2 -z-10 -translate-y-1/2 select-none font-cormorant font-bold leading-none text-[24vw] text-neutral-900/[0.045] md:text-[13rem]"
      >
        {m.year}
      </motion.span>

      {/* node on the rail */}
      <span
        className={`absolute left-[14px] top-[9vh] h-3.5 w-3.5 -translate-x-1/2 rounded-full ring-4 md:left-[82px] ${
          m.current ? 'bg-amber-500 ring-amber-200' : 'bg-neutral-400 ring-[#e7e5e0]'
        }`}
      />
      <span className="absolute left-24 top-[8.6vh] hidden font-cormorant text-xl text-neutral-400 md:block">
        {m.year}
      </span>

      {/* (2) rack-focus + (3) staggered reveal */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.55 }}
        className={
          m.current
            ? 'relative max-w-xl rounded-2xl border border-amber-200/80 bg-amber-50/50 p-6 shadow-[0_12px_55px_-12px_rgba(245,158,11,0.45)]'
            : 'relative max-w-xl'
        }
      >
        {m.current && (
          <motion.span
            variants={line}
            className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-700"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            Currently
          </motion.span>
        )}
        <motion.div variants={line} className="mb-2 flex items-center gap-2">
          <Icon size={18} className={m.current ? 'text-amber-600' : 'text-neutral-400'} />
          <h3 className="font-playfair text-xl text-neutral-900 md:text-2xl">
            {m.org}
            {m.place ? `, ${m.place}` : ''}
          </h3>
        </motion.div>
        {m.role && (
          <motion.p variants={line} className="mb-2 text-sm font-medium text-neutral-700 md:text-base">
            {m.role}
          </motion.p>
        )}
        {m.detail && (
          <motion.p variants={line} className="text-xs leading-relaxed text-neutral-500 md:text-sm">
            {m.detail}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

const CinematicTimeline: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start 25%', 'end 75%'] });
  const fill = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section className="bg-[#e7e5e0] py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <motion.h2
          className="mb-3 font-playfair text-4xl text-neutral-900 md:text-5xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          The Journey
        </motion.h2>
        <motion.p
          className="mb-10 font-cormorant text-lg italic text-neutral-500"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Taiwan → Irvine → the Bay.
        </motion.p>

        <div ref={containerRef} className="relative">
          {/* rail + (4) glowing playhead scrubber */}
          <div className="absolute bottom-0 left-[14px] top-0 w-px -translate-x-1/2 bg-neutral-300/70 md:left-[82px]" />
          <motion.div
            className="absolute left-[14px] top-0 w-px -translate-x-1/2 origin-top bg-gradient-to-b from-amber-500 to-orange-400 md:left-[82px]"
            style={{ height: fill }}
          />
          <motion.span
            className="absolute left-[14px] z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500 shadow-[0_0_18px_5px_rgba(245,158,11,0.55)] md:left-[82px]"
            style={{ top: fill }}
          />

          {milestones.map((m) => (
            <Row key={m.year + m.org} m={m} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CinematicTimeline;
