import React from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Camera } from 'lucide-react';
import { contactImages, contactData } from '../data/contact/contactImages';
import { BackgroundLines } from '../components/ui/background-lines';
import PageTransition from '../components/PageTransition';
import { PolaroidStack } from '../components/PolaroidStack';
import type { PolaroidCard } from '../components/PolaroidStack';
import TravelMap from '../components/contact/TravelMap';
import FloatingSocialBubbles from '../components/contact/FloatingSocialBubbles';
import DraggableBusinessCard from '../components/contact/DraggableBusinessCard';

const Contact: React.FC = () => {
  const polaroidCards: PolaroidCard[] = [
    {
      id: 'portrait',
      image: contactImages[0],
      label: 'photographer & engineer',
      value: 'Andy Liu',
      caption: 'nice to meet you',
      icon: <Camera size={48} className="text-neutral-400" />,
    },
    {
      id: 'email-personal',
      image: contactImages[2],
      label: 'Personal Email',
      value: contactData.contactInfo[0].value,
      href: contactData.contactInfo[0].href,
      caption: 'drop me a line anytime',
    },
    {
      id: 'email-school',
      image: contactImages[4],
      label: 'School Email',
      value: contactData.contactInfo[1].value,
      href: contactData.contactInfo[1].href,
      caption: 'for academic inquiries',
    },
    {
      id: 'phone',
      image: contactImages[1],
      icon: <Phone size={48} className="text-neutral-400" />,
      label: 'Phone',
      value: contactData.contactInfo[2].value,
      href: contactData.contactInfo[2].href,
      caption: 'prefer text over calls',
    },
    {
      id: 'location',
      image: contactImages[3],
      icon: <MapPin size={48} className="text-neutral-400" />,
      label: 'Based in',
      value: `${contactData.location.city}, ${contactData.location.state}`,
      caption: contactData.location.availability.toLowerCase(),
    },
    {
      id: 'vibes',
      image: contactImages[5],
      label: 'current mood',
      value: 'Always Exploring',
      caption: 'the world is my studio',
    },
  ];

  return (
    <PageTransition>
      <div className="relative min-h-screen w-full bg-white">
        {/* Section 1: Hero */}
        <BackgroundLines className="relative w-full">
          <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-center"
            >
              <h1 className="font-playfair text-6xl md:text-8xl mb-4 leading-tight text-neutral-900">
                Let's Create<br />Together.
              </h1>
              <p className="font-cormorant text-xl md:text-2xl text-neutral-500 max-w-xl mx-auto leading-relaxed">
                Whether it's a collaboration, a photo walk, or just a coffee chat —
                I'd love to hear from you.
              </p>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="absolute bottom-12"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-6 h-10 border-2 border-neutral-300 rounded-full flex justify-center pt-2"
              >
                <motion.div className="w-1 h-2 bg-neutral-400 rounded-full" />
              </motion.div>
            </motion.div>
          </div>
        </BackgroundLines>

        {/* Section 2: Travel Map */}
        <section className="py-20 px-6 bg-gradient-to-b from-white to-neutral-50">
          <TravelMap />
        </section>

        {/* Section 3: Interactive Contact Grid */}
        <section className="py-20 px-6 bg-neutral-50">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-cormorant text-3xl md:text-4xl text-neutral-800 mb-2">
              Get in Touch
            </h2>
            <p className="font-cormorant text-neutral-500">three ways to reach me</p>
          </motion.div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
            {/* Business Card */}
            <div className="flex justify-center">
              <DraggableBusinessCard />
            </div>

            {/* Polaroid Stack */}
            <div className="flex justify-center">
              <PolaroidStack cards={polaroidCards} />
            </div>

            {/* Social Bubbles */}
            <div className="flex flex-col items-center">
              <motion.h3
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="font-cormorant text-lg text-neutral-600 mb-4"
              >
                Find me online
              </motion.h3>
              <FloatingSocialBubbles />
            </div>
          </div>
        </section>

        {/* Section 4: Quick Contact Row */}
        <section className="py-16 px-6 bg-white border-t border-neutral-100">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.a
                href={contactData.contactInfo[0].href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0 }}
                className="flex items-center gap-4 group p-4 rounded-xl hover:bg-neutral-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-200 transition-colors shrink-0">
                  <Mail size={20} className="text-neutral-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400 uppercase tracking-wider">Email</p>
                  <p className="font-playfair text-neutral-800 group-hover:text-neutral-600 transition-colors">
                    {contactData.contactInfo[0].value}
                  </p>
                </div>
              </motion.a>

              <motion.a
                href={contactData.contactInfo[2].href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-4 group p-4 rounded-xl hover:bg-neutral-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-200 transition-colors shrink-0">
                  <Phone size={20} className="text-neutral-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400 uppercase tracking-wider">Phone</p>
                  <p className="font-playfair text-neutral-800 group-hover:text-neutral-600 transition-colors">
                    {contactData.contactInfo[2].value}
                  </p>
                </div>
              </motion.a>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-4 p-4"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                  <MapPin size={20} className="text-neutral-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400 uppercase tracking-wider">Location</p>
                  <p className="font-playfair text-neutral-800">
                    {contactData.location.city}, {contactData.location.state}
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">{contactData.location.availability}</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer accent */}
        <div className="py-12 bg-neutral-950 text-center">
          <p className="font-cormorant text-neutral-500 text-sm tracking-[0.3em] uppercase">
            Andy Liu — Photographer & Engineer
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default Contact;
