import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

type Variant = 'arrow' | 'pill';
type Placement = 'corner' | 'bottom-center';

interface BackButtonProps {
  /** Where "back" goes. Defaults to the photography collections index. */
  to?: string;
  label?: string;
  /** 'arrow' (default): a bare arrow. 'pill': the labelled "Collections" chip. */
  variant?: Variant;
  /**
   * 'corner' (default): top-left on mobile, just below the header on desktop.
   * 'bottom-center': pinned to the middle of the bottom edge — handy on the
   * immersive pages where a top-left label already lives in the corner.
   */
  placement?: Placement;
  className?: string;
}

const POSITION: Record<Placement, string> = {
  corner: 'left-3 top-3 md:left-6 md:top-24',
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
};

/**
 * A "back" affordance for the photography sub-pages.
 *
 * The shared Header auto-hides on scroll and only reveals via top-edge hover
 * (impossible on touch), so a persistent way out is useful everywhere. Kept at
 * z-40 so the lightbox (z-50) / screening (z-80) overlays cover it.
 */
const BackButton: React.FC<BackButtonProps> = ({
  to = '/photography',
  label = 'Collections',
  variant = 'arrow',
  placement = 'corner',
  className = '',
}) => {
  const pos = POSITION[placement];

  if (variant === 'pill') {
    return (
      <Link
        to={to}
        aria-label={`Back to ${label}`}
        className={`group fixed z-40 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 py-2 pl-2.5 pr-3.5 font-cormorant text-sm text-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors hover:bg-black/65 active:bg-black/70 ${pos} ${className}`}
      >
        <ArrowLeft
          size={16}
          strokeWidth={1.75}
          className="transition-transform duration-300 group-hover:-translate-x-0.5"
        />
        <span className="tracking-wide">{label}</span>
      </Link>
    );
  }

  // 'arrow' — bare icon, with a soft shadow for legibility on any background.
  // The negative margin keeps it visually in the corner while the padding gives
  // a comfortable tap target.
  return (
    <Link
      to={to}
      aria-label={`Back to ${label}`}
      className={`group fixed z-40 p-2 text-white/85 transition-colors hover:text-white ${
        placement === 'corner' ? '-m-2' : ''
      } ${pos} ${className}`}
    >
      <ArrowLeft
        size={28}
        strokeWidth={1.75}
        className="drop-shadow-[0_1px_4px_rgba(0,0,0,0.65)] transition-transform duration-300 group-hover:-translate-x-1"
      />
    </Link>
  );
};

export default BackButton;
