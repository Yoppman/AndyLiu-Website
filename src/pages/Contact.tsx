import React from 'react';
import { motion } from 'motion/react';
import { Github, Linkedin, Instagram, MapPin } from 'lucide-react';
import { cldFull } from '../components/gallery/shared/cloudinaryUtils';
import { contactData } from '../data/contact/contactImages';
import PageTransition from '../components/PageTransition';
import TravelMap from '../components/contact/TravelMap';
import DraggableBusinessCard from '../components/contact/DraggableBusinessCard';

// A warm sunset to close the film on.
const HERO_PHOTO =
  'https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747703401/LagunaBeach/dsc03805.jpg';

const EMAIL = contactData.contactInfo[0]; // personal email

const socials = [
  { label: 'GitHub', value: 'github.com/Yoppman', href: 'https://github.com/Yoppman', Icon: Github },
  {
    label: 'LinkedIn',
    value: 'in/andy9998811',
    href: 'https://www.linkedin.com/in/andy9998811/',
    Icon: Linkedin,
  },
  {
    label: 'Instagram',
    value: '@andyliu_0104',
    href: 'https://instagram.com/andyliu_0104',
    Icon: Instagram,
  },
];

const Contact: React.FC = () => {
  return (
    <PageTransition>
      <div className="relative w-full bg-[#0a0a0b] text-[#efeae1]">
        {/* Act 1 — the invitation */}
        <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
          <img
            src={cldFull(HERO_PHOTO, 2200)}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-[#0a0a0b]" />

          <motion.div
            className="relative z-10 max-w-2xl text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="font-cormorant text-xs uppercase tracking-[0.5em] text-[#efeae1]/60 pl-[0.5em]">
              Say hello
            </span>
            <h1 className="mt-6 font-cormorant text-6xl font-light leading-[0.98] text-[#efeae1] drop-shadow-[0_2px_30px_rgba(0,0,0,0.6)] md:text-8xl">
              Let&rsquo;s make
              <span className="block italic font-extralight">something.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-xl font-cormorant text-lg italic text-[#efeae1]/75 drop-shadow-[0_1px_14px_rgba(0,0,0,0.5)] md:text-xl">
              I take on a handful of commissions a year &mdash; portraits, travel, and the quiet
              stories in between. And I&rsquo;m always good for a coffee and a photo walk.
            </p>
            <a
              href={EMAIL.href}
              className="group mt-10 inline-flex items-center gap-3 text-[#efeae1] transition-colors hover:text-amber-300"
            >
              <span className="font-cormorant text-xl md:text-2xl">{EMAIL.value}</span>
              <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
            </a>
          </motion.div>

          <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[#efeae1]/50">
            <span className="font-cormorant text-[0.65rem] uppercase tracking-[0.3em]">Scroll</span>
            <span className="block h-10 w-px bg-gradient-to-b from-[#efeae1]/50 to-transparent" />
          </div>
        </section>

        {/* Act 2 — the atlas */}
        <section className="bg-[#0a0a0b] px-6 py-20 md:py-28">
          <TravelMap />
        </section>

        {/* Act 3 — the details */}
        <section className="bg-[#0a0a0b] px-6 py-20 md:py-28">
          <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
            <div>
              <div className="mb-8 flex items-center gap-4">
                <span className="h-px w-10 bg-amber-500" />
                <span className="font-cormorant text-xs uppercase tracking-[0.35em] text-[#efeae1]/45">
                  Find me elsewhere
                </span>
              </div>

              <div>
                {socials.map((s) => {
                  const Icon = s.Icon;
                  return (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-6 border-t border-white/10 py-5 transition-colors hover:text-amber-300"
                    >
                      <span className="flex items-center gap-3">
                        <Icon
                          size={18}
                          strokeWidth={1.5}
                          className="text-[#efeae1]/50 transition-colors group-hover:text-amber-300"
                        />
                        <span className="font-cormorant text-xs uppercase tracking-[0.3em] text-[#efeae1]/45 transition-colors group-hover:text-amber-300/70">
                          {s.label}
                        </span>
                      </span>
                      <span className="font-cormorant text-lg text-[#efeae1] transition-transform duration-300 group-hover:-translate-x-1 md:text-xl">
                        {s.value}
                      </span>
                    </a>
                  );
                })}
                <div className="border-t border-white/10" />
              </div>

              <div className="mt-8 flex items-center gap-3 text-[#efeae1]/60">
                <MapPin size={16} strokeWidth={1.5} className="text-amber-400" />
                <span className="font-cormorant text-base">
                  {contactData.location.city}, {contactData.location.state}
                  <span className="text-[#efeae1]/40">
                    {' '}
                    &mdash; {contactData.location.availability.toLowerCase()}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <DraggableBusinessCard />
            </div>
          </div>
        </section>

        {/* Act 4 — the sign-off */}
        <section className="border-t border-white/10 bg-[#0a0a0b] py-16 text-center">
          <p className="font-cormorant text-xl italic text-[#efeae1]/60 md:text-2xl">
            Until the next frame.
          </p>
          <p className="mt-4 font-cormorant text-xs uppercase tracking-[0.4em] text-[#efeae1]/35">
            Andy Liu &mdash; Photographer &amp; Engineer
          </p>
        </section>
      </div>
    </PageTransition>
  );
};

export default Contact;
