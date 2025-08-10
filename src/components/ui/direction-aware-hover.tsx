"use client";

import { useRef, useState, useCallback } from "react";

import { motion } from "framer-motion";

// Simple cn utility function
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const DirectionAwareHover = ({
  imageUrl,
  children,
  childrenClassName,
  imageClassName,
  className,
}: {
  imageUrl: string;
  children: React.ReactNode | string;
  childrenClassName?: string;
  imageClassName?: string;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<"top" | "bottom" | "left" | "right">("left");
  const [isHovered, setIsHovered] = useState(false);

  // Memoized direction calculation to avoid repeated calculations
  const getDirection = useCallback((
    ev: React.MouseEvent<HTMLDivElement, MouseEvent>,
    obj: HTMLElement
  ) => {
    const rect = obj.getBoundingClientRect();
    const x = ev.clientX - rect.left - rect.width / 2;
    const y = ev.clientY - rect.top - rect.height / 2;
    const angle = Math.atan2(y, x);
    const octant = Math.round(8 * angle / (2 * Math.PI) + 8) % 8;

    if (octant <= 1 || octant >= 7) return "right";
    if (octant >= 2 && octant <= 3) return "bottom";
    if (octant >= 4 && octant <= 5) return "left";
    return "top";
  }, []);

  const handleMouseEnter = useCallback((
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (!ref.current) return;
    const newDirection = getDirection(event, ref.current);
    setDirection(newDirection);
    setIsHovered(true);
  }, [getDirection]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <motion.div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={ref}
      className={cn(
        "md:h-96 w-60 h-60 md:w-96 bg-transparent rounded-lg overflow-hidden group/card relative cursor-pointer",
        className
      )}
      whileHover="hover"
      initial="initial"
    >
      {/* Background Image */}
      <motion.div
        variants={variants}
        className="h-full w-full relative bg-gray-50"
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
      >
        <img
          alt="image"
          className={cn(
            "h-full w-full object-cover",
            imageClassName
          )}
          src={imageUrl}
          loading="lazy"
        />
      </motion.div>

      {/* Overlay */}
      <motion.div
        className="absolute inset-0 bg-black/40 z-10"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Text Content */}
      <motion.div
        variants={textVariants}
        custom={direction}
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
        className={cn(
          "text-white absolute bottom-4 left-4 z-40",
          childrenClassName
        )}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

// Optimized variants with fewer properties for better performance
const variants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
  },
};

const textVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  hover: (direction: string) => ({
    opacity: 1,
    y: 0,
    x: direction === "left" ? -10 : direction === "right" ? 10 : 0,
  }),
};
