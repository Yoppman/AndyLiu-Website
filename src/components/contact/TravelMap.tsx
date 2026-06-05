import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Pin {
  id: string;
  label: string;
  gallery?: string;
  x: number; // % from left
  y: number; // % from top
  thumbnail?: string;
}

const pins: Pin[] = [
  { id: 'sf', label: 'San Francisco', gallery: 'sanfrancisco', x: 8.5, y: 38, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1751189663/sanfrancisco/dsc06488.jpg' },
  { id: 'sc', label: 'Santa Cruz', gallery: 'santacruz', x: 7.5, y: 42, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1747703419/LagunaBeach/dsc03871.jpg' },
  { id: 'hmb', label: 'Half Moon Bay', gallery: 'halfmoonbay', x: 6, y: 39, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1747773495/architecture/dsc02269.jpg' },
  { id: 'nv', label: 'Napa Valley', gallery: 'napavalley', x: 10, y: 34, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1747730763/berlinstreet/dsc00725.jpg' },
  { id: 'jt', label: 'Joshua Tree', gallery: 'joshuatree', x: 18, y: 58, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1748512319/joshuatree/dsc04025.jpg' },
  { id: 'ps', label: 'Palm Springs', gallery: 'palmspring', x: 19, y: 60, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1747808971/coffee/dsc01861.jpg' },
  { id: 'lb', label: 'Laguna Beach', gallery: 'laguna-beach', x: 15, y: 56, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1747703419/LagunaBeach/dsc03871.jpg' },
  { id: 'pp', label: 'Pacheco Pass', gallery: 'pachecopass', x: 10, y: 41, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1751191624/pachecopass/dsc06041.jpg' },
  { id: 'rl', label: 'Rancho Lake', gallery: 'ranchosantamargaritalake', x: 16, y: 55, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1747459484/DSC02462_bqch9d.jpg' },
  { id: 'ai', label: 'Alcatraz Island', gallery: 'alcatrazisland', x: 7, y: 37, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1751189995/sanfrancisco/dsc06738.jpg' },
  { id: 'ngt', label: 'Nelson Ghost Town', gallery: 'nelson-ghost-town', x: 22, y: 52, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1747808971/coffee/dsc01861.jpg' },
  { id: 'home', label: 'Santa Clara (Home)', x: 9, y: 40 },
  { id: 'berlin', label: 'Berlin', gallery: 'berlinstreet', x: 53, y: 24, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1747730763/berlinstreet/dsc00725.jpg' },
  { id: 'sach', label: 'Sachsenhausen', gallery: 'sachsenhausen-concentration', x: 54, y: 23, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1747730811/berlinstreet/dsc01321.jpg' },
  { id: 'london', label: 'London', gallery: 'london', x: 49, y: 23, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1780547370/london/dsc00750.jpg' },
  { id: 'paris', label: 'Paris', gallery: 'paris', x: 50.5, y: 25, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1780551095/paris/dsc02551.jpg' },
  { id: 'venice', label: 'Venice', gallery: 'venice', x: 53, y: 29, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1780552142/venice/dsc04145.jpg' },
  { id: 'florence', label: 'Florence', gallery: 'florence', x: 52, y: 31, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1780563148/florence/dsc05040.jpg' },
  { id: 'rome', label: 'Rome', gallery: 'rome', x: 52.5, y: 33, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1780563305/rome/dsc05648.jpg' },
  { id: 'barcelona', label: 'Barcelona', gallery: 'barcelona', x: 50.5, y: 30, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1780565603/barcelona/dsc07214.jpg' },
  { id: 'hawaii', label: 'Hawaii (Honolulu)', gallery: 'hawaii', x: 2.5, y: 45, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1780566907/hawaii/dsc09057.jpg' },
  { id: 'orangecounty', label: 'Orange County', gallery: 'orangecounty', x: 13.5, y: 58, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1780567672/orangecounty/dsc00550.jpg' },
  { id: 'ussmidway', label: 'USS Midway · San Diego', gallery: 'ussmidway', x: 13, y: 62, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1780567764/ussmidway/dsc00694.jpg' },
  { id: 'getty', label: 'The Getty · LA', gallery: 'gettymuseum', x: 12, y: 54, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1780568239/gettymuseum/dsc02124.jpg' },
  { id: 'yosemite', label: 'Yosemite', gallery: 'yosemite', x: 11.5, y: 37, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1780627009/yosemite/dsc03012.jpg' },
  { id: 'losangeles', label: 'Los Angeles', gallery: 'losangeles', x: 12.5, y: 55, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1780628332/losangeles/dsc04587.jpg' },
  { id: 'redwoodforest', label: 'Redwood Forest · Santa Cruz', gallery: 'redwoodforest', x: 8, y: 41, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1780630889/redwoodforest/dsc06176.jpg' },
  { id: 'tahoe', label: 'Lake Tahoe', gallery: 'tahoe', x: 11, y: 33, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1780630914/tahoe/dsc04839.jpg' },
  { id: 'mammothlake', label: 'Mammoth Lakes', gallery: 'mammothlake', x: 12.5, y: 38, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1780631738/mammothlake/dsc06342.jpg' },
  { id: 'film', label: 'On Film · San Francisco', gallery: 'film', x: 8, y: 37, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1780631753/film/84171998417199-r1-004-0a.jpg' },
  { id: 'carmelbythesea', label: 'Carmel-by-the-Sea', gallery: 'carmelbythesea', x: 7, y: 44, thumbnail: 'https://res.cloudinary.com/dlfmzlwp6/image/upload/w_200,q_auto/v1780632209/carmelbythesea/dsc06521.jpg' },
];

const TravelMap: React.FC = () => {
  const [activePin, setActivePin] = useState<string | null>(null);

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center mb-8"
      >
        <h2 className="font-cormorant text-3xl md:text-4xl text-neutral-800 mb-2">
          Where I've Shot
        </h2>
        <p className="font-cormorant text-neutral-500">tap a pin to see the gallery</p>
      </motion.div>

      <div className="relative w-full aspect-[2/1] bg-neutral-50 rounded-2xl overflow-hidden border border-neutral-200">
        {/* Stylized World Map SVG */}
        <svg viewBox="0 0 100 50" className="w-full h-full absolute inset-0 opacity-[0.08]">
          {/* North America */}
          <path d="M5,10 Q8,8 12,9 L18,8 Q22,7 25,10 L26,14 Q25,18 22,20 L20,25 Q18,28 15,30 L12,28 Q8,25 6,22 L4,18 Q3,14 5,10 Z" fill="currentColor" />
          {/* South America */}
          <path d="M18,30 Q20,28 22,30 L24,34 Q25,38 23,42 L20,45 Q18,46 16,44 L15,40 Q14,36 16,33 Z" fill="currentColor" />
          {/* Europe */}
          <path d="M42,8 Q45,6 48,8 L52,7 Q55,8 56,11 L55,15 Q53,18 50,19 L47,18 Q44,16 43,13 L42,10 Z" fill="currentColor" />
          {/* Africa */}
          <path d="M45,20 Q48,18 52,20 L54,25 Q55,30 53,35 L50,40 Q48,42 46,40 L44,35 Q43,30 44,25 Z" fill="currentColor" />
          {/* Asia */}
          <path d="M58,6 Q62,5 68,7 L75,8 Q80,10 82,14 L80,20 Q78,24 74,25 L68,24 Q64,22 60,18 L57,14 Q56,10 58,6 Z" fill="currentColor" />
          {/* Australia */}
          <path d="M78,35 Q82,33 86,35 L88,38 Q88,42 85,43 L82,42 Q78,40 78,37 Z" fill="currentColor" />
        </svg>

        {/* Grid lines */}
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <div key={`h-${i}`} className="absolute w-full h-px bg-neutral-200/50" style={{ top: `${(i + 1) * 16.6}%` }} />
          ))}
          {[...Array(9)].map((_, i) => (
            <div key={`v-${i}`} className="absolute h-full w-px bg-neutral-200/50" style={{ left: `${(i + 1) * 10}%` }} />
          ))}
        </div>

        {/* Pins */}
        {pins.map((pin, i) => (
          <motion.div
            key={pin.id}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute z-10"
            style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -50%)' }}
            onMouseEnter={() => setActivePin(pin.id)}
            onMouseLeave={() => setActivePin(null)}
            onClick={() => {
              if (pin.gallery) window.location.href = `/photography/${pin.gallery}`;
            }}
          >
            {/* Pulse ring */}
            <motion.div
              className={`absolute inset-0 rounded-full ${pin.id === 'home' ? 'bg-amber-400' : 'bg-neutral-800'}`}
              animate={{ scale: [1, 2, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
              style={{ width: 12, height: 12, margin: -3 }}
            />

            {/* Pin dot */}
            <motion.div
              whileHover={{ scale: 1.8 }}
              className={`w-3 h-3 rounded-full cursor-pointer shadow-md relative z-10 ${
                pin.id === 'home' ? 'bg-amber-500 ring-2 ring-amber-300' : 'bg-neutral-800'
              }`}
            />

            {/* Tooltip */}
            <AnimatePresence>
              {activePin === pin.id && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-30 pointer-events-none"
                >
                  <div className="bg-white rounded-lg shadow-xl p-2 min-w-[140px]">
                    {pin.thumbnail && (
                      <img
                        src={pin.thumbnail}
                        alt={pin.label}
                        className="w-full h-20 object-cover rounded mb-2"
                      />
                    )}
                    <p className="font-cormorant text-sm text-neutral-800 text-center font-semibold">
                      {pin.label}
                    </p>
                    {pin.gallery && (
                      <p className="text-[10px] text-neutral-400 text-center mt-0.5">click to view</p>
                    )}
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white transform rotate-45 -mt-1 shadow-sm" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* "Home" label for Santa Clara */}
        <div
          className="absolute font-cormorant text-[10px] text-amber-600 tracking-wider"
          style={{ left: '11%', top: '40%' }}
        >
          HOME
        </div>
      </div>

      <div className="flex justify-center gap-6 mt-4 text-xs font-cormorant text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neutral-800" /> Photo locations
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> Home base
        </span>
      </div>
    </div>
  );
};

export default TravelMap;
