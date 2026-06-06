import React from 'react';
import PageTransition from '../components/PageTransition';
import AboutHero from '../components/about/AboutHero';
import Hero from '../components/Hero';
import ScrollRevealBio from '../components/about/ScrollRevealBio';
import StatsCounter from '../components/about/StatsCounter';
import CinematicTimeline from '../components/about/CinematicTimeline';
import CinematicProjects from '../components/about/CinematicProjects';
import ScrollProgressIndicator from '../components/about/ScrollProgressIndicator';

const About: React.FC = () => {
  return (
    <PageTransition>
      <ScrollProgressIndicator />

      <div id="cinematic-hero">
        <AboutHero />
      </div>

      <Hero />

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
