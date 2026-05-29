import { motion, useScroll } from 'motion/react';
import { useLocation } from 'react-router-dom';

interface Section {
  id: string;
  label: string;
}

const sections: Section[] = [
  { id: 'cinematic-hero', label: 'Intro' },
  { id: 'bio-section', label: 'About' },
  { id: 'stats-section', label: 'Stats' },
  { id: 'timeline-section', label: 'Journey' },
  { id: 'projects-section', label: 'Projects' },
];

const ScrollProgressIndicator: React.FC = () => {
  const { pathname } = useLocation();
  const { scrollYProgress } = useScroll();

  if (pathname !== '/about') return null;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center">
      <div className="relative w-0.5 h-48 bg-neutral-200 rounded-full overflow-hidden">
        <motion.div
          className="w-full bg-neutral-800 origin-top"
          style={{ scaleY: scrollYProgress }}
        />
      </div>

      {sections.map((section, i) => (
        <button
          key={section.id}
          onClick={() => scrollToSection(section.id)}
          className="absolute w-2.5 h-2.5 rounded-full bg-neutral-400 hover:bg-neutral-800 transition-colors -left-[4px]"
          style={{ top: `${(i / (sections.length - 1)) * 100}%` }}
          title={section.label}
        />
      ))}
    </div>
  );
};

export default ScrollProgressIndicator;
