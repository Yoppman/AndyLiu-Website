import React from 'react';
import { Mail, Phone, MapPin, Camera } from 'lucide-react';
import { contactImages, contactData } from '../data/contact/contactImages';
import { BackgroundLines } from '../components/ui/background-lines';
import PageTransition from '../components/PageTransition';
import { PolaroidStack } from '../components/PolaroidStack';
import type { PolaroidCard } from '../components/PolaroidStack';

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
      <BackgroundLines className="relative min-h-screen w-full">
        <div className="max-w-5xl mx-auto px-6 py-16 pt-32 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Polaroid Stack */}
            <div className="flex justify-center">
              <PolaroidStack cards={polaroidCards} />
            </div>

            {/* Right side — title + quick info */}
            <div>
              <h1 className="font-playfair text-5xl md:text-6xl mb-4 leading-tight">
                Let's<br />Connect.
              </h1>
              <p className="font-cormorant text-xl text-neutral-500 mb-10 leading-relaxed">
                Whether it's a collaboration, a photo walk, or just a coffee chat —
                I'd love to hear from you.
              </p>

              <div className="space-y-5">
                <a
                  href={contactData.contactInfo[0].href}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-200 transition-colors">
                    <Mail size={18} className="text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 uppercase tracking-wider">Email</p>
                    <p className="font-playfair text-neutral-800 group-hover:text-neutral-600 transition-colors">
                      {contactData.contactInfo[0].value}
                    </p>
                  </div>
                </a>

                <a
                  href={contactData.contactInfo[2].href}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-200 transition-colors">
                    <Phone size={18} className="text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 uppercase tracking-wider">Phone</p>
                    <p className="font-playfair text-neutral-800 group-hover:text-neutral-600 transition-colors">
                      {contactData.contactInfo[2].value}
                    </p>
                  </div>
                </a>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                    <MapPin size={18} className="text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 uppercase tracking-wider">Location</p>
                    <p className="font-playfair text-neutral-800">
                      {contactData.location.city}, {contactData.location.state}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BackgroundLines>
    </PageTransition>
  );
};

export default Contact;
