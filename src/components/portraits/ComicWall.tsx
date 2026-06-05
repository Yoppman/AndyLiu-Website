import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { portraits } from '../../data/portraits';
import { galleryDimensions } from '../../data/galleryDimensions';
import { galleries } from '../../data/galleries';

/* ── Cloudinary ── */
const isCloudinary = (url: string) =>
  /res\.cloudinary\.com\/[^/]+\/image\/(upload|fetch)\//.test(url);
const withTx = (src: string, tx: string) =>
  isCloudinary(src) ? src.replace(/(\/image\/(?:upload|fetch)\/)/, `$1${tx}/`) : src;
/** Scale to a width without cropping (c_limit); bake a_<rotate> for sideways-stored frames. */
const sized = (src: string, w: number) => {
  if (!isCloudinary(src)) return src;
  const rot = galleryDimensions[src]?.rotate;
  return withTx(src, `c_limit,w_${w},q_auto,f_auto${rot ? `,a_${rot}` : ''}`);
};

/* ── Provenance: which collection each frame belongs to ── */
const srcToGallery = (() => {
  const m = new Map<string, (typeof galleries)[number]>();
  for (const g of galleries) {
    if (g.hero) m.set(g.hero.src, g);
    for (const p of g.photos) m.set(p.src, g);
  }
  return m;
})();

interface Item {
  index: number;
  src: string;
  aspect: number; // upright w/h
  title: string;
  slug: string;
  region?: string;
}

const ITEMS: Item[] = portraits.map((src, index) => {
  const d = galleryDimensions[src];
  const aspect = d && d.h ? d.w / d.h : 1.4;
  const g = srcToGallery.get(src);
  return { index, src, aspect, title: g?.title ?? 'Portrait', slug: g?.slug ?? '', region: g?.location?.region };
});

/* ── Justified rows: every frame at its true aspect ratio, scaled to fill the
 *    row width — so nothing is cropped and orientation is preserved. Row target
 *    heights cycle to keep a bold, non-uniform rhythm. ── */
const GUTTER = 6;
/* Row "width budgets" in aspect-ratio units. A SMALL budget closes the row after
 * one or two frames, so those frames come out BIG (the stressed ones); a LARGE
 * budget packs many small frames. Mostly dense, with periodic hero rows — so a
 * handful of photos are obviously larger and the heights swing, never a uniform
 * grid. Aspect ratio + orientation are always preserved; nothing is cropped. */
const ROW_TARGETS = [2.0, 5.5, 4.8, 6.4, 2.4, 5.2, 6.0, 4.4, 2.0, 5.8, 4.6, 6.2, 2.6, 5.0, 4.2];

interface Row { items: Item[]; h: number }
function buildRows(items: Item[], W: number): Row[] {
  if (W <= 0) return [];
  // fewer frames per row on small screens, so the big ones stay big
  const scale = W < 640 ? 0.42 : W < 980 ? 0.7 : 1;
  const rows: Row[] = [];
  let row: Item[] = [];
  let sum = 0;
  let ti = 0;
  for (const it of items) {
    row.push(it);
    sum += it.aspect;
    if (sum >= ROW_TARGETS[ti % ROW_TARGETS.length] * scale) {
      rows.push({ items: row, h: (W - GUTTER * (row.length - 1)) / sum });
      row = [];
      sum = 0;
      ti++;
    }
  }
  if (row.length) {
    // last partial row: justify to width, but cap so a lone frame can't dominate
    rows.push({ items: row, h: Math.min((W - GUTTER * (row.length - 1)) / sum, W * 0.46) });
  }
  return rows;
}

/* ── Lightbox: the full, uncropped frame + a door into its collection ── */
const Lightbox: React.FC<{ index: number | null; onClose: () => void; onNav: (d: number) => void }> = ({
  index,
  onClose,
  onNav,
}) => {
  const it = index != null ? ITEMS[index] : null;
  useEffect(() => {
    if (index == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onNav(-1);
      else if (e.key === 'ArrowRight') onNav(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, onClose, onNav]);

  return (
    <AnimatePresence>
      {it && (
        <motion.div
          className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-black/92 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
        >
          <button onClick={onClose} aria-label="Close" className="absolute top-5 right-5 rounded-full bg-white/10 p-2.5 text-white/70 hover:bg-white/20 hover:text-white transition-colors">
            <X size={18} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onNav(-1); }} aria-label="Previous" className="absolute left-3 md:left-6 rounded-full bg-white/10 p-2.5 text-white/70 hover:bg-white/20 hover:text-white transition-colors">
            <ChevronLeft size={22} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onNav(1); }} aria-label="Next" className="absolute right-3 md:right-6 rounded-full bg-white/10 p-2.5 text-white/70 hover:bg-white/20 hover:text-white transition-colors">
            <ChevronRight size={22} />
          </button>

          <motion.img
            key={it.src}
            src={sized(it.src, 1600)}
            alt={it.title}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.28 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[84vh] max-w-[92vw] object-contain rounded-sm shadow-2xl"
          />

          <div className="mt-5 flex flex-col items-center gap-1 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="font-cormorant text-white text-xl">
              {it.title}
              {it.region && <span className="text-white/40"> · {it.region}</span>}
            </p>
            {it.slug && (
              <Link to={`/photography/${it.slug}`} className="group inline-flex items-center gap-1.5 font-cormorant text-sm uppercase tracking-[0.25em] text-amber-300/80 hover:text-amber-300 transition-colors">
                View the {it.title} collection
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ComicWall: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [open, setOpen] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = useMemo(() => buildRows(ITEMS, width), [width]);
  const nav = useCallback((d: number) => setOpen((i) => (i == null ? i : (i + d + ITEMS.length) % ITEMS.length)), []);
  const close = useCallback(() => setOpen(null), []);

  return (
    <>
      <div ref={ref} className="portrait-wall flex flex-col gap-[6px]">
        {rows.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-[6px]" style={{ height: row.h }}>
            {row.items.map((it) => (
              <button
                key={it.src}
                onClick={() => setOpen(it.index)}
                style={{ width: Math.round(it.aspect * row.h), flex: '0 0 auto' }}
                className="portrait-panel group relative overflow-hidden bg-neutral-900"
                aria-label={`${it.title} — open`}
              >
                <img
                  src={sized(it.src, Math.min(1600, Math.round(it.aspect * row.h * 1.7)))}
                  alt={it.title}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="h-full w-full select-none object-cover"
                  style={{ filter: 'saturate(1.05)' }}
                />
                {/* provenance label — focus + "where is this?" (revealed on hover) */}
                <figcaption className="portrait-cap pointer-events-none absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3">
                  <span className="font-cormorant text-white text-sm md:text-base leading-tight drop-shadow">
                    {it.title}
                  </span>
                </figcaption>
              </button>
            ))}
          </div>
        ))}
      </div>

      <Lightbox index={open} onClose={close} onNav={nav} />
    </>
  );
};

export default ComicWall;
