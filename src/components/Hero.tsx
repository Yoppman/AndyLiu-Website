import React from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const Hero: React.FC = () => {
  // Motion values for interactive 3D tilt on the image card
  const rotateX = useSpring(useMotionValue(0), { stiffness: 120, damping: 12, mass: 0.2 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 120, damping: 12, mass: 0.2 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const deltaX = event.clientX - centerX;
    const deltaY = event.clientY - centerY;
    const percentX = deltaX / (bounds.width / 2);
    const percentY = deltaY / (bounds.height / 2);
    // Map to a modest rotation range for taste
    rotateY.set(percentX * 8);
    rotateX.set(-percentY * 8);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 120, damping: 14 } }
  } as const;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      variants={containerVariants}
      className="relative overflow-hidden pt-10 min-h-[calc(100vh-5rem)] lg:min-h-[calc(80vh-5rem)] xl:min-h-[calc(70vh-5rem)] bg-[#f4f4f3] z-30"
    >
      <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-12">
          {/* Left: Portrait with 3D tilt and floating animation.
              The image is a landscape file stood upright with a 270° CSS rotation,
              so its visual box is taller than its layout box and spills out the
              bottom. On the stacked mobile layout that spill overlapped the
              "Hello," text below it, so reserve viewport-proportional space under
              the image (≈ the spill height). On md+ the columns sit side by side,
              so no reserve is needed. */}
          <motion.div
            variants={itemVariants}
            className="md:w-1/2 mb-[16vw] md:mb-0 flex items-center justify-center"
          >
            <motion.div
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ rotateX, rotateY, transformPerspective: 900 }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 180, damping: 18 }}
              className="relative w-full max-w-xl md:max-w-2xl lg:max-w-5xl"
            >
              <motion.img
                // src="https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747458978/DSCF1810_scyqvo.jpg"
                src="https://res.cloudinary.com/dlfmzlwp6/image/upload/v1754866979/asset/dscf4602.jpg"
                alt="Portrait of Andy Liu"
                className="relative w-full h-auto object-cover rounded-sm shadow-md"
                style={{ rotate: 270 }}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: [12, 0, 12], opacity: 1 }}
                transition={{ y: { duration: 10, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.6, delay: 0.2 } }}
                draggable={false}
              />
            </motion.div>
          </motion.div>

          {/* Right: Intro text */}
          <motion.div variants={itemVariants} className="md:w-1/2 px-4">
            <div className="flex items-center mb-8">
              <motion.p variants={itemVariants} className="text-2xl font-cormorant mr-6">Hello,</motion.p>
              <motion.div
                initial={{ width: 0, opacity: 0.6 }}
                whileInView={{ width: '66%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-px bg-gradient-to-r from-gray-400 via-gray-500 to-transparent"
              />
            </div>

            <motion.h1
              variants={itemVariants}
              className="font-cormorant text-4xl md:text-3xl lg:text-6xl leading-relaxed mb-8 mt-6"
            >
              <motion.div variants={itemVariants} className="mb-2">
                I <strong className="font-semibold">shoot streets</strong>
              </motion.div>
              <motion.div variants={itemVariants} className="mb-2">
                I <strong className="font-semibold">brew beans</strong>
              </motion.div>
              <motion.div variants={itemVariants} className="mb-2">
                I <strong className="font-semibold">dance to the beat</strong>
              </motion.div>
              <motion.div variants={itemVariants} className="mb-4">
                I <strong className="font-semibold">debug life</strong>
              </motion.div>
              <motion.em variants={itemVariants} className="font-normal italic block">
                Life’s too short not to enjoy every frame, flavor, and freestyle.
              </motion.em>
            </motion.h1>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default Hero;