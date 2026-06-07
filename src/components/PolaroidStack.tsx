import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface PolaroidCard {
  id: string;
  image?: string;
  icon?: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  caption: string;
}

interface PolaroidStackProps {
  cards: PolaroidCard[];
}

const PolaroidStack: React.FC<PolaroidStackProps> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState(1);

  const handleNext = () => {
    setExitDirection(1);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const card = cards[currentIndex];

  return (
    <div className="relative w-full flex flex-col items-center">
      <div
        className="relative cursor-pointer select-none"
        style={{ width: 320, height: 400 }}
        onClick={handleNext}
      >
        {/* Background stacked cards */}
        {[2, 1].map((offset) => {
          const idx = (currentIndex + offset) % cards.length;
          return (
            <div
              key={`bg-${idx}-${offset}`}
              className="absolute inset-0 bg-[#faf8f5] shadow-md"
              style={{
                transform: `rotate(${offset === 1 ? 3 : -2}deg) translateY(${offset * 6}px)`,
                zIndex: 10 - offset,
              }}
            />
          );
        })}

        {/* Active card */}
        <AnimatePresence mode="wait" custom={exitDirection}>
          <motion.div
            key={card.id}
            custom={exitDirection}
            initial={{ rotate: exitDirection * 15, x: exitDirection * 200, opacity: 0 }}
            animate={{ rotate: 0, x: 0, opacity: 1 }}
            exit={{ rotate: exitDirection * -20, x: exitDirection * -250, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 22,
            }}
            className="absolute inset-0 bg-[#faf8f5] shadow-xl z-20 flex flex-col"
            style={{
              padding: '12px 12px 40px 12px',
            }}
          >
            {/* Photo area */}
            <div className="flex-1 bg-neutral-200 overflow-hidden relative">
              {card.image ? (
                <img
                  src={card.image}
                  alt={card.caption}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                  {card.icon}
                </div>
              )}
            </div>

            {/* Caption area */}
            <div className="pt-3 text-center">
              <p className="font-cormorant text-sm text-neutral-500 mb-0.5">{card.label}</p>
              {card.href ? (
                <a
                  href={card.href}
                  onClick={(e) => e.stopPropagation()}
                  className="font-playfair text-base text-neutral-800 hover:text-neutral-600 transition-colors"
                >
                  {card.value}
                </a>
              ) : (
                <p className="font-playfair text-base text-neutral-800">{card.value}</p>
              )}
            </div>

            {/* Handwritten caption */}
            <p
              className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-neutral-400 italic whitespace-nowrap"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {card.caption}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation dots */}
      <div className="flex gap-2 mt-6">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              setExitDirection(i > currentIndex ? 1 : -1);
              setCurrentIndex(i);
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === currentIndex ? 'bg-neutral-800 scale-125' : 'bg-neutral-300 hover:bg-neutral-500'
            }`}
          />
        ))}
      </div>

      <p className="mt-3 text-xs text-neutral-400 font-cormorant tracking-wider">
        click to flip through
      </p>
    </div>
  );
};

export { PolaroidStack };
export type { PolaroidCard };
