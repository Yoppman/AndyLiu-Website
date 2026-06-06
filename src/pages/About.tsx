import React, { useEffect } from 'react';
import { useNavigationType } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import AboutHero from '../components/about/AboutHero';
import ScrollRevealBio from '../components/about/ScrollRevealBio';
import StatsCounter from '../components/about/StatsCounter';
import CinematicTimeline from '../components/about/CinematicTimeline';
import CinematicProjects from '../components/about/CinematicProjects';
import ScrollProgressIndicator from '../components/about/ScrollProgressIndicator';

const About: React.FC = () => {
  const navType = useNavigationType();

  // When returning from the résumé (a POP navigation), restore the exact scroll
  // position the visitor left from. ScrollToTop fires window.scrollTo(0, 0)
  // synchronously on route change, so we wait two frames to land after it.
  useEffect(() => {
    if (navType !== 'POP') return;
    const saved = sessionStorage.getItem('about:scrollY');
    if (saved == null) return;
    sessionStorage.removeItem('about:scrollY');
    const y = parseInt(saved, 10);
    if (Number.isNaN(y)) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => window.scrollTo(0, y));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [navType]);

  return (
    <PageTransition>
      <ScrollProgressIndicator />

      <div id="cinematic-hero">
        <AboutHero />
      </div>

      {/* The lights go down — the beige overture sinks into the dark story. */}
      <div aria-hidden className="h-[45vh] bg-gradient-to-b from-[#e7e5e0] to-[#0a0a0b]" />

      <div id="bio-section">
        <ScrollRevealBio />
      </div>

      <div id="stats-section">
        <StatsCounter />
      </div>

      <div id="timeline-section">
        <CinematicTimeline />
      </div>

      <div id="projects-section">
        <CinematicProjects />
      </div>
    </PageTransition>
  );
};

export default About;
