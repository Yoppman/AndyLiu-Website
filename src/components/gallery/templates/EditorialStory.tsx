import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import EagerImage from '../shared/EagerImage';
import LazyImage from '../shared/LazyImage';
import { aspectOf } from '../shared/cloudinaryUtils';
import type { GalleryTemplateProps } from '../templateConfig';

const GAP = 16; // consistent gutter between photos (both axes)
const MOBILE_BP = 768;
const EAGER_COUNT = 3;

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

/** Deterministic per-gallery RNG so the "improvised" layout is stable across reloads. */
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

type Block =
  | { kind: 'single'; idx: number; widthFrac: number; align: 'left' | 'center' | 'right' }
  | { kind: 'row'; idxs: number[] }
  | { kind: 'caption'; idx: number; side: 'left' | 'right'; text: string }
  | { kind: 'text'; text: string };

const EditorialStory: React.FC<GalleryTemplateProps & { captions?: Record<number, string>; storyColor?: string }> = ({
  photos,
  title,
  onPhotoClick,
  imgRefs,
  captions,
  storyColor,
}) => {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const isMobile = width > 0 && width < MOBILE_BP;
  const aspects = useMemo(() => photos.map((p) => aspectOf(p)), [photos]);

  const blocks = useMemo<Block[]>(() => {
    if (width <= 0) return [];
    const rng = seededRandom(title.length * 131 + photos.length * 17 + 9);
    const out: Block[] = [];
    let captionSide: 'left' | 'right' = 'left';
    let i = 0;

    if (isMobile) {
      // One photo per row; captions become their own full-width text beats.
      while (i < photos.length) {
        out.push({ kind: 'single', idx: i, widthFrac: 1, align: 'center' });
        if (captions?.[i]) out.push({ kind: 'text', text: captions[i] });
        i++;
      }
      return out;
    }

    const isVert = (k: number) => aspects[k] < 0.85;
    const hasCap = (k: number) => !!captions?.[k];

    while (i < photos.length) {
      // Storytelling beat: photo beside its caption (this is our intentional
      // asymmetry — the empty margin is filled with words, never left stranded).
      if (captions?.[i]) {
        out.push({ kind: 'caption', idx: i, side: captionSide, text: captions[i] });
        captionSide = captionSide === 'left' ? 'right' : 'left';
        i++;
        continue;
      }

      const remaining = photos.length - i;
      const r = rng();

      // A row may never swallow a captioned photo (its caption would be lost).
      const canPair = remaining >= 2 && !hasCap(i + 1);
      const canTrio = remaining >= 3 && !hasCap(i + 1) && !hasCap(i + 2);

      if (isVert(i)) {
        // A lone tall photo leaves an ugly one-sided gap, so verticals are
        // paired (or tripled) with their neighbours instead of stranded.
        if (canTrio && isVert(i + 1) && isVert(i + 2) && rng() < 0.5) {
          out.push({ kind: 'row', idxs: [i, i + 1, i + 2] });
          i += 3;
        } else if (canPair) {
          out.push({ kind: 'row', idxs: [i, i + 1] });
          i += 2;
        } else {
          // trailing lone vertical: centered with symmetric matting
          out.push({ kind: 'single', idx: i, widthFrac: 0.44, align: 'center' });
          i++;
        }
      } else if (canTrio && r < 0.26) {
        out.push({ kind: 'row', idxs: [i, i + 1, i + 2] });
        i += 3;
      } else if (canPair && r < 0.52) {
        out.push({ kind: 'row', idxs: [i, i + 1] });
        i += 2;
      } else {
        // Horizontal single: centered, varied width (intentional matting,
        // occasionally full-bleed) — no jarring one-sided void.
        const widthFrac = r < 0.62 ? 1 : 0.66 + rng() * 0.28; // full-width or 0.66–0.94
        out.push({ kind: 'single', idx: i, widthFrac, align: 'center' });
        i++;
      }
    }
    return out;
  }, [width, isMobile, photos, aspects, captions, title]);

  const maxBlockH = Math.min(Math.round(width * 0.62), 620);

  const renderPhoto = (idx: number, w: number, h: number) => (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{ width: w, height: h }}
      className="relative overflow-hidden bg-neutral-200 group cursor-pointer"
      onClick={() => onPhotoClick(idx)}
    >
      <div className="w-full h-full transition-transform duration-1000 ease-out group-hover:scale-[1.03]">
        {idx < EAGER_COUNT ? (
          <EagerImage ref={(el) => (imgRefs.current[idx] = el)} photo={photos[idx]} alt={`${title} ${idx + 1}`} />
        ) : (
          <LazyImage ref={(el) => (imgRefs.current[idx] = el)} photo={photos[idx]} alt={`${title} ${idx + 1}`} />
        )}
      </div>
    </motion.div>
  );

  const renderBlock = (block: Block, key: number) => {
    if (block.kind === 'text') {
      return (
        <p
          key={key}
          className="font-cormorant italic text-xl leading-relaxed text-center max-w-md mx-auto py-2 [text-wrap:balance]"
          style={{ color: storyColor }}
        >
          {block.text}
        </p>
      );
    }

    if (block.kind === 'single') {
      const w = block.widthFrac >= 1 ? width : Math.round(width * block.widthFrac);
      let h = Math.round(w / aspects[block.idx]);
      let dw = w;
      if (h > maxBlockH) {
        h = maxBlockH;
        dw = Math.round(h * aspects[block.idx]);
      }
      const justify = block.align === 'left' ? 'flex-start' : block.align === 'right' ? 'flex-end' : 'center';
      return (
        <div key={key} className="flex" style={{ justifyContent: justify }}>
          {renderPhoto(block.idx, dw, h)}
        </div>
      );
    }

    if (block.kind === 'row') {
      const sum = block.idxs.reduce((acc, idx) => acc + aspects[idx], 0);
      let h = (width - GAP * (block.idxs.length - 1)) / sum;
      if (h > maxBlockH) h = maxBlockH;
      const widths = block.idxs.map((idx) => Math.round(h * aspects[idx]));
      const total = widths.reduce((a, b) => a + b, 0) + GAP * (block.idxs.length - 1);
      return (
        <div key={key} className="flex" style={{ gap: GAP, justifyContent: total < width ? 'center' : 'flex-start' }}>
          {block.idxs.map((idx, k) => renderPhoto(idx, widths[k], Math.round(h)))}
        </div>
      );
    }

    // caption-beside
    const photoFrac = 0.56;
    const colGap = GAP * 2;
    const photoW = Math.round((width - colGap) * photoFrac);
    let h = Math.round(photoW / aspects[block.idx]);
    let dw = photoW;
    if (h > maxBlockH) {
      h = maxBlockH;
      dw = Math.round(h * aspects[block.idx]);
    }
    const photoEl = (
      <div className="flex-shrink-0" style={{ width: photoFrac * 100 + '%' }}>
        <div className="flex" style={{ justifyContent: block.side === 'left' ? 'flex-start' : 'flex-end' }}>
          {renderPhoto(block.idx, dw, h)}
        </div>
      </div>
    );
    const textEl = (
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 1, delay: 0.15 }}
        className="flex-1 flex items-center"
        style={{ color: storyColor }}
      >
        <p className="font-cormorant italic text-2xl lg:text-3xl leading-relaxed px-8 lg:px-14 [text-wrap:balance]">
          {block.text}
        </p>
      </motion.div>
    );
    return (
      <div key={key} className="flex items-center" style={{ gap: colGap }}>
        {block.side === 'left' ? (
          <>
            {photoEl}
            {textEl}
          </>
        ) : (
          <>
            {textEl}
            {photoEl}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-[1500px] mx-auto px-6 sm:px-10 md:px-16 lg:px-24 py-10 md:py-16">
      <div ref={ref} className="w-full flex flex-col" style={{ gap: GAP }}>
        {width > 0 && blocks.map((b, k) => renderBlock(b, k))}
      </div>
    </div>
  );
};

export default EditorialStory;
