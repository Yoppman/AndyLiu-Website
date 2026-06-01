import React from 'react';
import { ArrowUp } from 'lucide-react';

interface Props {
  visible: boolean;
  onClick: () => void;
}

const ScrollTopButton: React.FC<Props> = ({ visible, onClick }) => {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      aria-label="Scroll to top"
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] animate-float-up select-none opacity-50 hover:opacity-100 transition-opacity"
      style={{ left: 'calc(50% - 28px)' }}
    >
      <ArrowUp size={56} strokeWidth={1.25} className="opacity-70" />
      <span className="text-sm mt-1 tracking-wide opacity-70">Top</span>
    </button>
  );
};

export default ScrollTopButton;
