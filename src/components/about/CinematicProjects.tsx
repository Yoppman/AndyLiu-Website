import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import type { ProjectShape } from './ProjectObject';

const ProjectObject = React.lazy(() => import('./ProjectObject'));

interface Project {
  title: string;
  description: string;
  tags: string[];
  shape: ProjectShape;
}

const projects: Project[] = [
  {
    title: 'GenAI Conditional Image Generation',
    description:
      'Enhanced the ControlNet framework with an input feature to manipulate character poses, and paired it with Dreambooth to encode unique identifiers in text-to-image models.',
    tags: ['Python', 'Diffusion Models', 'ControlNet', 'Dreambooth'],
    shape: 'crystal',
  },
  {
    title: 'Real-Time Environmental Data Monitoring',
    description:
      'A full-stack meteorological platform (React, RESTful API, Selenium crawler) tracking water levels, electricity loads, and seismic activity — deployed on GCP Kubernetes at 99.8% uptime.',
    tags: ['React', 'GCP', 'Kubernetes', 'Grafana'],
    shape: 'globe',
  },
  {
    title: 'Instruction-Level Debugger',
    description:
      'A C debugger built on the ptrace interface for assembly-level step-through, with a "Time Travel" feature that cut debug time 30% via Checkpoint/Restore In Userspace (CRIU).',
    tags: ['C', 'ptrace', 'CRIU', 'Systems'],
    shape: 'cube',
  },
  {
    title: 'Movie Recommendation System',
    description:
      'Matrix factorization via ALS and item-based collaborative filtering, achieving a 15.9% efficiency boost over the baseline KNN model.',
    tags: ['Python', 'ML', 'Collaborative Filtering'],
    shape: 'knot',
  },
];

const CinematicProjects: React.FC = () => {
  return (
    <section className="bg-[#e7e5e0] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.h2
          className="mb-3 font-playfair text-4xl text-neutral-900 md:text-5xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Selected Work
        </motion.h2>
        <motion.p
          className="mb-12 font-cormorant text-lg italic text-neutral-500"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          A few things I&rsquo;ve built — each with a little object of its own.
        </motion.p>

        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-8">
          {projects.map((p, i) => (
            <motion.article
              key={p.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-3xl border border-neutral-200/70 bg-white p-7 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.3)] transition-shadow duration-500 hover:shadow-[0_34px_80px_-28px_rgba(0,0,0,0.45)] md:p-8"
            >
              {/* themed 3D object */}
              <div className="relative mb-6 h-52 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-neutral-50 to-neutral-200/70">
                <Suspense fallback={null}>
                  <ProjectObject shape={p.shape} />
                </Suspense>
              </div>

              <span className="font-cormorant text-5xl font-bold leading-none text-neutral-900/10">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mb-3 mt-1 font-playfair text-xl font-semibold text-neutral-900 md:text-2xl">
                {p.title}
              </h3>
              <p className="mb-5 text-sm leading-relaxed text-neutral-600">{p.description}</p>
              <div className="flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <span key={t} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
                    {t}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CinematicProjects;
