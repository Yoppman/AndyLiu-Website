import { motion, useTransform, MotionValue } from 'motion/react';

interface WordByWordRevealProps {
  text: string;
  scrollProgress: MotionValue<number>;
  startAt?: number;
  endAt?: number;
  className?: string;
}

const WordByWordReveal: React.FC<WordByWordRevealProps> = ({
  text,
  scrollProgress,
  startAt = 0,
  endAt = 1,
  className = '',
}) => {
  const words = text.split(' ');
  const range = endAt - startAt;

  return (
    <p className={className}>
      {words.map((word, i) => (
        <Word
          key={i}
          word={word}
          progress={scrollProgress}
          start={startAt + (i / words.length) * range}
          end={startAt + ((i + 1) / words.length) * range}
        />
      ))}
    </p>
  );
};

const Word: React.FC<{
  word: string;
  progress: MotionValue<number>;
  start: number;
  end: number;
}> = ({ word, progress, start, end }) => {
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], [8, 0]);

  return (
    <motion.span
      style={{ opacity, y }}
      className="inline-block mr-[0.3em]"
    >
      {word}
    </motion.span>
  );
};

export default WordByWordReveal;
