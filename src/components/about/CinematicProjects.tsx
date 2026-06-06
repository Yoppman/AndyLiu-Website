import React from 'react';
import { motion } from 'framer-motion';

interface Project {
  title: string;
  description: string;
  tags: string[];
}

const projects: Project[] = [
  {
    title: 'GenAI Conditional Image Generation',
    description:
      'Enhanced the ControlNet framework with an input feature to manipulate character poses, and paired it with Dreambooth to encode unique identifiers in text-to-image models.',
    tags: ['Python', 'Diffusion Models', 'ControlNet', 'Dreambooth'],
  },
  {
    title: 'Real-Time Environmental Data Monitoring',
    description:
      'A full-stack meteorological platform (React, RESTful API, Selenium crawler) tracking water levels, electricity loads, and seismic activity — deployed on GCP Kubernetes at 99.8% uptime.',
    tags: ['React', 'GCP', 'Kubernetes', 'Grafana'],
  },
  {
    title: 'Instruction-Level Debugger',
    description:
      'A C debugger built on the ptrace interface for assembly-level step-through, with a "Time Travel" feature that cut debug time 30% via Checkpoint/Restore In Userspace (CRIU).',
    tags: ['C', 'ptrace', 'CRIU', 'Systems'],
  },
  {
    title: 'Movie Recommendation System',
    description:
      'Matrix factorization via ALS and item-based collaborative filtering, achieving a 15.9% efficiency boost over the baseline KNN model.',
    tags: ['Python', 'ML', 'Collaborative Filtering'],
  },
];

/**
 * "Things I've Built" — an editorial index of work, set like a monograph's
 * table of contents: a ghost numeral, a serif title, the problem in a line,
 * and hairline tags. An amber accent ignites on hover. Dark + typographic, to
 * sit inside the cinematic theme (replaced the old spinning 3D objects).
 */
const CinematicProjects: React.FC = () => {
  return (
    <section className="bg-[#0a0a0b] py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <motion.h2
          className="mb-3 font-playfair text-4xl text-[#efeae1] md:text-5xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Things I&rsquo;ve Built
        </motion.h2>
        <motion.p
          className="mb-12 font-cormorant text-lg italic text-[#efeae1]/55"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          A few things I&rsquo;ve built &mdash; and the problems behind them.
        </motion.p>

        <div>
          {projects.map((p, i) => (
            <motion.article
              key={p.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group flex items-start gap-6 border-t border-white/10 py-9 transition-colors duration-500 hover:bg-white/[0.025] md:gap-10 md:py-11"
            >
              <span className="font-cormorant text-4xl font-light leading-none text-[#efeae1]/20 transition-colors duration-500 group-hover:text-amber-400/80 md:text-6xl">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex-1">
                <h3 className="font-playfair text-2xl text-[#efeae1] transition-transform duration-500 group-hover:translate-x-1 md:text-3xl">
                  {p.title}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#efeae1]/55 md:text-base">
                  {p.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-[#efeae1]/60"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
          {/* closing rule */}
          <div className="border-t border-white/10" aria-hidden />
        </div>
      </div>
    </section>
  );
};

export default CinematicProjects;
