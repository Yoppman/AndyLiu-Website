import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';

interface Project {
  title: string;
  description: string;
  tags: string[];
}

const projects: Project[] = [
  {
    title: 'GenAI Conditional Image Generation',
    description:
      'Enhanced the ControlNet framework by adding an input feature to manipulate character poses, expanding the model\'s capabilities in generating diverse visual outputs. Incorporated ControlNet with Dreambooth, enabling encoding of unique identifiers in text-to-image models.',
    tags: ['Python', 'Diffusion Models', 'ControlNet', 'Dreambooth'],
  },
  {
    title: 'Real-Time Environmental Data Monitoring',
    description:
      'Developed a full-stack Meteorological Platform with React frontend, RESTful API backend and Selenium crawler, working with TSMC engineers to monitor water levels, electricity loads, and seismic activities. Deployed on GCP Kubernetes to 99.8% uptime.',
    tags: ['React', 'GCP', 'Kubernetes', 'Grafana'],
  },
  {
    title: 'Instruction-Level Debugger',
    description:
      'Implemented a C debugger using the ptrace interface, enabling step-through debugging at the assembly level. Developed a "Time Travel" feature with 30% decrease in debug time via Checkpoint/Restore In Userspace (CRIU).',
    tags: ['C', 'ptrace', 'CRIU', 'Systems'],
  },
  {
    title: 'Movie Recommendation System',
    description:
      'Utilized Matrix Factorization via ALS, item-based collaborative filtering, and achieved a 15.9% efficiency boost over the baseline KNN model.',
    tags: ['Python', 'ML', 'Collaborative Filtering'],
  },
];

const ProjectCards: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  return (
    <section ref={sectionRef} className="relative bg-[#f4f4f3]" style={{ height: '250vh' }}>
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden px-6">
        <motion.h2
          className="font-playfair text-3xl md:text-4xl mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Projects
        </motion.h2>

        <div className="relative w-full max-w-lg" style={{ height: '420px' }}>
          {projects.map((project, i) => (
            <ProjectCard
              key={project.title}
              project={project}
              index={i}
              total={projects.length}
              scrollProgress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const ProjectCard: React.FC<{
  project: Project;
  index: number;
  total: number;
  scrollProgress: ReturnType<typeof useScroll>['scrollYProgress'];
}> = ({ project, index, total, scrollProgress }) => {
  const yOffset = useTransform(
    scrollProgress,
    [0, 0.3, 0.8],
    [index * 4, index * 110, index * 110]
  );
  const rotate = useTransform(
    scrollProgress,
    [0, 0.3, 0.8],
    [0, (index % 2 === 0 ? -1 : 1) * (index === 0 ? 0 : 2), (index % 2 === 0 ? -1 : 1) * (index === 0 ? 0 : 2)]
  );
  const scale = useTransform(
    scrollProgress,
    [0, 0.3],
    [1 - index * 0.02, 1]
  );

  // Cursor-driven 3D tilt on hover.
  const rotateX = useSpring(0, { stiffness: 150, damping: 15 });
  const rotateY = useSpring(0, { stiffness: 150, damping: 15 });
  const handleMove = (e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    rotateY.set(((e.clientX - r.left) / r.width - 0.5) * 12);
    rotateX.set(-((e.clientY - r.top) / r.height - 0.5) * 12);
  };
  const handleLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="absolute top-0 left-0 w-full bg-white rounded-xl shadow-lg border-l-4 border-gradient-to-b p-6"
      style={{
        y: yOffset,
        rotate,
        scale,
        rotateX,
        rotateY,
        transformPerspective: 900,
        zIndex: total - index,
        borderLeftColor: `hsl(${220 + index * 30}, 60%, 55%)`,
      }}
    >
      <h3 className="font-playfair text-lg font-semibold mb-2">{project.title}</h3>
      <p className="text-sm text-neutral-600 leading-relaxed mb-4">{project.description}</p>
      <div className="flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

export default ProjectCards;
