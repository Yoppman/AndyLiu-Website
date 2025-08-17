import React from 'react';
import { Mail, Phone } from 'lucide-react';
import ImageSlideshow from '../components/ImageSlideshow';
import { contactImages, contactData, ContactInfo } from '../data/contact/contactImages';
import { AnimatedTestimonials } from '../components/ui/animated-testimonials';
import { BackgroundLines } from '../components/ui/background-lines';
import { TypewriterEffectSmooth } from '../components/ui/typewriter-effect';

const Contact: React.FC = () => {
  // Business logic: Get testimonials from data
  const testimonials = contactData.testimonials;

  // Business logic: Render contact info based on type
  const renderContactInfo = (info: ContactInfo) => {
    const Icon = info.type === 'email' ? Mail : Phone;

    return (
      <div key={info.value} className="flex items-center gap-3">
        <Icon size={20} />
        <div>
          <p className="font-medium">{info.label}</p>
          <a
            href={info.href}
            className="font-playfair text-lg tracking-wide text-gray-600 hover:text-gray-900 transition-colors"
          >
            {info.value}
          </a>
        </div>
      </div>
    );
  };

  return (
    <BackgroundLines className="relative h-auto md:h-auto w-full">
      <div className="max-w-5xl mx-auto px-6 py-16 pt-32 relative z-10">
      <div className="flex flex-col gap-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <ImageSlideshow images={contactImages} />
          </div>

          <div>
            <div className="mb-8">
              <TypewriterEffectSmooth
                words={contactData.title.split(' ').map((t) => ({ text: t }))}
                className="font-cormorant"
                cursorClassName="bg-black dark:bg-white"
              />
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="font-cormorant text-2xl mb-4">Contact Information</h2>
                <div className="space-y-4">
                  {contactData.contactInfo.map(renderContactInfo)}
                </div>
              </div>

              <div>
                <h2 className="font-cormorant text-2xl mb-4">Location</h2>
                <p className="text-gray-600">Based in {contactData.location.city}, {contactData.location.state}</p>
                <p className="text-gray-600">{contactData.location.availability}</p>
              </div>
            </div>
          </div>
        </div>

        {/* <AnimatedTestimonials testimonials={testimonials} autoplay /> */}
      </div>
    </div>
  </BackgroundLines>
  );
};

export default Contact;