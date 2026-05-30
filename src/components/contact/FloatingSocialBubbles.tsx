import React from 'react';
import { motion } from 'motion/react';
import { Github, Linkedin, Mail, Instagram, Globe } from 'lucide-react';

interface SocialBubble {
  icon: React.ReactNode;
  label: string;
  href: string;
  color: string;
  delay: number;
}

const bubbles: SocialBubble[] = [
  {
    icon: <Github size={24} />,
    label: 'GitHub',
    href: 'https://github.com/Yoppman',
    color: 'bg-neutral-900 text-white',
    delay: 0,
  },
  {
    icon: <Linkedin size={24} />,
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/andyliu',
    color: 'bg-blue-600 text-white',
    delay: 0.5,
  },
  {
    icon: <Mail size={24} />,
    label: 'Email',
    href: 'mailto:andy9998811@gmail.com',
    color: 'bg-red-500 text-white',
    delay: 1.0,
  },
  {
    icon: <Instagram size={24} />,
    label: 'Instagram',
    href: 'https://instagram.com',
    color: 'bg-gradient-to-br from-purple-600 to-pink-500 text-white',
    delay: 1.5,
  },
  {
    icon: <Globe size={24} />,
    label: 'Portfolio',
    href: '/',
    color: 'bg-emerald-600 text-white',
    delay: 2.0,
  },
];

const FloatingSocialBubbles: React.FC = () => {
  return (
    <div className="flex flex-wrap justify-center gap-6 py-8">
      {bubbles.map((bubble, i) => (
        <motion.a
          key={bubble.label}
          href={bubble.href}
          target={bubble.href.startsWith('http') ? '_blank' : undefined}
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          className="group relative"
        >
          <motion.div
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: bubble.delay,
              ease: 'easeInOut',
            }}
            whileHover={{ scale: 1.2 }}
            className={`w-14 h-14 rounded-full ${bubble.color} flex items-center justify-center shadow-lg cursor-pointer transition-shadow hover:shadow-xl`}
          >
            {bubble.icon}
          </motion.div>
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-cormorant text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {bubble.label}
          </span>
        </motion.a>
      ))}
    </div>
  );
};

export default FloatingSocialBubbles;
