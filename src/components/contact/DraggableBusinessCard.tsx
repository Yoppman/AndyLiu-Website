import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Mail, Phone, MapPin, Camera } from 'lucide-react';
import { contactData } from '../../data/contact/contactImages';

const DraggableBusinessCard: React.FC = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const tiltX = useSpring(useTransform(mouseY, [-100, 100], [10, -10]), {
    stiffness: 150,
    damping: 20,
  });
  const tiltY = useSpring(useTransform(mouseX, [-100, 100], [-10, 10]), {
    stiffness: 150,
    damping: 20,
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="flex flex-col items-center"
    >
      <p className="font-cormorant text-sm text-neutral-400 mb-4 tracking-wider">
        hover to tilt · click to flip
      </p>

      {/* Perspective container */}
      <div
        ref={cardRef}
        className="relative cursor-pointer"
        style={{ perspective: 1000, width: 360, height: 210 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Tilt layer (mouse-driven) */}
        <motion.div
          style={{ rotateX: tiltX, rotateY: tiltY }}
          className="w-full h-full"
        >
          {/* Flip layer (click-driven) */}
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
            className="w-full h-full relative"
          >
            {/* Front */}
            <div
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 shadow-2xl p-6 flex flex-col justify-between"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Camera size={16} className="text-amber-400" />
                  <span className="text-[10px] text-amber-400 tracking-[0.3em] uppercase">
                    Photographer & Engineer
                  </span>
                </div>
                <h3 className="font-cormorant text-2xl text-white mt-2">Andy Liu</h3>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-neutral-400 text-xs">
                  <Mail size={12} />
                  <span>{contactData.contactInfo[0].value}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-400 text-xs">
                  <Phone size={12} />
                  <span>{contactData.contactInfo[2].value}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-400 text-xs">
                  <MapPin size={12} />
                  <span>{contactData.location.city}, {contactData.location.state}</span>
                </div>
              </div>

              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden rounded-tr-xl">
                <div className="absolute top-3 right-3 w-12 h-12 border border-amber-400/20 rounded-full" />
                <div className="absolute top-5 right-5 w-6 h-6 border border-amber-400/10 rounded-full" />
              </div>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-50 to-white shadow-2xl p-6 flex flex-col items-center justify-center"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-3">
                <Camera size={28} className="text-amber-400" />
              </div>
              <p className="font-cormorant text-lg text-neutral-800 text-center">
                "Honoring the story behind the scene"
              </p>
              <div className="mt-4 flex gap-3">
                <a
                  href={contactData.contactInfo[0].href}
                  onClick={(e) => e.stopPropagation()}
                  className="text-neutral-500 hover:text-neutral-800 transition-colors"
                >
                  <Mail size={18} />
                </a>
                <a
                  href={contactData.contactInfo[2].href}
                  onClick={(e) => e.stopPropagation()}
                  className="text-neutral-500 hover:text-neutral-800 transition-colors"
                >
                  <Phone size={18} />
                </a>
              </div>
              <p className="text-[10px] text-neutral-400 mt-4 tracking-wider">
                {contactData.location.availability}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DraggableBusinessCard;
