import React from 'react';
import { motion } from 'motion/react';
import { Briefcase, GraduationCap } from 'lucide-react';
import { Timeline } from '../components/ui/timeline';
import PageTransition from '../components/PageTransition';
import CinematicHero from '../components/about/CinematicHero';
import ScrollRevealBio from '../components/about/ScrollRevealBio';
import StatsCounter from '../components/about/StatsCounter';
import ProjectCards from '../components/about/ProjectCards';
import ScrollProgressIndicator from '../components/about/ScrollProgressIndicator';

const wrapWithAnimation = (content: React.ReactNode, index: number) => (
  <motion.div
    initial={{ opacity: 0, x: index % 2 === 0 ? -60 : 60 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
  >
    {content}
  </motion.div>
);

const JourneyTimeline = () => {
  const journeyData = [
    {
      title: "June 2025",
      content: wrapWithAnimation(
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Briefcase size={18} className="text-neutral-500" />
            <h3 className="font-semibold text-xl">PureStorage, Santa Clara</h3>
          </div>
          <p className="mb-2 text-sm font-medium text-neutral-800">Software Engineer Intern</p>
          <p className="text-xs font-normal text-neutral-700">
            Optimize write data path for enterprise distributed storage system using DSA (Data Streaming Accelerator)
          </p>
        </div>,
        0
      ),
    },
    {
      title: "2024",
      content: wrapWithAnimation(
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap size={18} className="text-neutral-500" />
            <h3 className="font-semibold text-xl">University of California, Irvine</h3>
          </div>
          <p className="mb-2 text-sm font-medium text-neutral-800">M.S. in Embedded & Cyber-Physical Systems</p>
          <p className="mb-4 text-xs text-neutral-600">GPA: 4.0/4.0 | Expected Dec 2025</p>
          <p className="text-xs font-normal text-neutral-700">
            Coursework: IoT Sensor and Actuator, Embedded Software, Control System
          </p>
        </div>,
        1
      ),
    },
    {
      title: "2023",
      content: wrapWithAnimation(
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Briefcase size={18} className="text-neutral-500" />
            <h3 className="font-semibold text-xl">AdvanTech, Inc</h3>
          </div>
          <p className="mb-2 text-sm font-medium text-neutral-800">Software R&D Intern</p>
          <p className="text-xs font-normal text-neutral-700">
            Led development of a data augmentation module using diffusion model and deep generative models on the company's ML platform
          </p>
        </div>,
        2
      ),
    },
    {
      title: "2022",
      content: wrapWithAnimation(
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Briefcase size={18} className="text-neutral-500" />
            <h3 className="font-semibold text-xl">Industrial Technology Research Institute</h3>
          </div>
          <p className="mb-2 text-sm font-medium text-neutral-800">Cloud Application Intern</p>
          <p className="text-xs font-normal text-neutral-700">
            Developed shell scripts to automate service deployment for Docker containers within GCP Kubernetes clusters
          </p>
        </div>,
        3
      ),
    },
    {
      title: "2018",
      content: wrapWithAnimation(
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap size={18} className="text-neutral-500" />
            <h3 className="font-semibold text-xl">National Yang Ming Chiao Tung University</h3>
          </div>
          <p className="mb-2 text-sm font-medium text-neutral-800">B.S in Computer Science</p>
          <p className="mb-2 text-sm font-medium text-neutral-800">B.S. in Industrial Engineering & Management</p>
          <p className="text-xs text-neutral-600">GPA: 4.13/4.3</p>
        </div>,
        4
      ),
    },
    {
      title: "2015",
      content: wrapWithAnimation(
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap size={18} className="text-neutral-500" />
            <h3 className="font-semibold text-xl">Taipei Municipal Chien Kuo High School, CKHS</h3>
          </div>
        </div>,
        5
      ),
    },
  ];

  return (
    <div className="relative w-full overflow-clip">
      <Timeline data={journeyData} />
    </div>
  );
};

const About: React.FC = () => {
  return (
    <PageTransition>
      <ScrollProgressIndicator />

      <div id="cinematic-hero">
        <CinematicHero
          imageSrc="https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747608825/za8pbhwgrg2g2wsplb56.jpg"
          quote="Success is where hard work meets luck."
          author="Personal Motto"
        />
      </div>

      <div id="bio-section">
        <ScrollRevealBio />
      </div>

      <div id="stats-section">
        <StatsCounter />
      </div>

      <div id="timeline-section">
        <section className="bg-[#f4f4f3]">
          <JourneyTimeline />
        </section>
      </div>

      <div id="projects-section">
        <ProjectCards />
      </div>
    </PageTransition>
  );
};

export default About;
