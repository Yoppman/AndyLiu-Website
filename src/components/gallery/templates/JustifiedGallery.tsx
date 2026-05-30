import React, { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import EagerImage from '../shared/EagerImage';
import LazyImage from '../shared/LazyImage';
import { aspectOf } from '../shared/cloudinaryUtils';
import type { GalleryTemplateProps } from '../templateConfig';

const GAP = 16; // px — uniform spacing between every photo, in both axes
const EAGER_COUNT = 4;

/** Track the live pixel width of an element. */
function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

interface Row {
  items: number[];
  height: number;
  isLast: boolean;
}

/** Flickr-style justified rows: equal-height rows, true aspect ratios, uniform gaps. */
function computeRows(aspects: number[], containerW: number, targetH: number): Row[] {
  if (containerW <= 0) return [];
  const rows: Row[] = [];
  let current: number[] = [];
  let arSum = 0;

  for (let i = 0; i < aspects.length; i++) {
    current.push(i);
    arSum += aspects[i];
    const rowH = (containerW - (current.length - 1) * GAP) / arSum;
    if (rowH <= targetH) {
      rows.push({ items: current, height: rowH, isLast: false });
      current = [];
      arSum = 0;
    }
  }
  if (current.length) {
    // Last partial row: keep at target height, left-aligned (never upscale).
    const rowH = Math.min(targetH, (containerW - (current.length - 1) * GAP) / arSum);
    rows.push({ items: current, height: rowH, isLast: true });
  }
  return rows;
}

const JustifiedGallery: React.FC<GalleryTemplateProps> = ({
  photos,
  title,
  onPhotoClick,
  imgRefs,
}) => {
  const { ref, width } = useElementWidth<HTMLDivElement>();

  const targetH = width < 640 ? 240 : width < 1024 ? 300 : 360;
  const aspects = photos.map((p) => aspectOf(p));
  const rows = computeRows(aspects, width, targetH);

  return (
    <div className="max-w-[1700px] mx-auto px-6 sm:px-10 md:px-16 lg:px-24 py-10 md:py-16">
      <div ref={ref} className="w-full">
        {width > 0 &&
          rows.map((row, r) => (
            <div
              key={r}
              className="flex"
              style={{ gap: GAP, marginBottom: r === rows.length - 1 ? 0 : GAP }}
            >
              {row.items.map((idx) => {
                const photo = photos[idx];
                // Non-last rows grow proportionally to aspect so they fill the width
                // exactly (uniform gaps, no rounding seams); the last row is left-aligned.
                const style: React.CSSProperties = row.isLast
                  ? { height: row.height, width: row.height * aspects[idx], flex: '0 0 auto' }
                  : { height: row.height, flexGrow: aspects[idx], flexBasis: 0, minWidth: 0 };
                return (
                  <motion.div
                    key={photo.src}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                    style={style}
                    className="relative overflow-hidden bg-neutral-200 group"
                  >
                    <button
                      onClick={() => onPhotoClick(idx)}
                      aria-label={`Open ${title} photo ${idx + 1}`}
                      className="block w-full h-full"
                    >
                      <div className="w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.04]">
                        {idx < EAGER_COUNT ? (
                          <EagerImage ref={(el) => (imgRefs.current[idx] = el)} photo={photo} alt={`${title} ${idx + 1}`} />
                        ) : (
                          <LazyImage ref={(el) => (imgRefs.current[idx] = el)} photo={photo} alt={`${title} ${idx + 1}`} />
                        )}
                      </div>
                      <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/10" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          ))}
      </div>
    </div>
  );
};

export default JustifiedGallery;
