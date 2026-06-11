import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { galleries } from '../data/galleries';
import { galleryStories } from '../data/galleryStories';
import { cldSquare, type Gallery } from '../components/gallery/shared/cloudinaryUtils';
import PageTransition from '../components/PageTransition';
import BackButton from '../components/BackButton';

/**
 * "The Journey" — the travelogue as one continuous flight.
 *
 * A scroll-driven film over a dark vector map: as you descend, the camera
 * flies stop to stop along an amber itinerary line, and a literary card
 * crossfades to the place you've arrived — its story, three frames, a way in.
 * North down the coast, across the ocean, and east through Europe; then home.
 */

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const HOME: [number, number] = [-121.96, 37.35];

type Located = Gallery & { location: NonNullable<Gallery['location']> };
type Cam = { center: [number, number]; zoom: number; pitch: number; bearing: number };

interface StopScene {
  kind: 'stop';
  cam: Cam;
  stopId: number; // 0-based index among stops (for map feature-state)
  no: number; // 1-based display number
  slug: string;
  title: string;
  region: string;
  meta?: string;
  line: string;
  frames: string[];
}
type Scene =
  | { kind: 'intro'; cam: Cam }
  | { kind: 'outro'; cam: Cam }
  | StopScene;

/** The opening clause of a story — the poetic line we surface on the card. */
const firstSentence = (text?: string): string => {
  if (!text) return '';
  const m = text.match(/^[\s\S]*?[.!?](?=\s|$)/);
  return (m ? m[0] : text).trim();
};

/** Three representative frames: the cover, something from the middle, and an end. */
const pickFrames = (g: Located): string[] => {
  const srcs = [g.hero?.src ?? g.photos[0]?.src, g.photos[Math.floor(g.photos.length / 2)]?.src, g.photos[g.photos.length - 1]?.src];
  return Array.from(new Set(srcs.filter(Boolean) as string[])).slice(0, 3);
};

const Journey: React.FC = () => {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const railItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const prevStopId = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  // Build the itinerary: north→south down the Americas, then west→east in Europe.
  const { scenes, stops } = useMemo(() => {
    const located = galleries.filter((g): g is Located => !!g.location);
    const continent = (g: Located) => (g.location.lng < -30 ? 0 : 1);
    const ordered = [...located].sort((a, b) => {
      const ca = continent(a);
      const cb = continent(b);
      if (ca !== cb) return ca - cb;
      return ca === 0 ? b.location.lat - a.location.lat : a.location.lng - b.location.lng;
    });

    const stopScenes: StopScene[] = ordered.map((g, i) => {
      const story = galleryStories[g.slug];
      return {
        kind: 'stop',
        cam: {
          center: [g.location.lng, g.location.lat],
          zoom: 8.6,
          pitch: 48,
          bearing: i % 2 ? 16 : -16,
        },
        stopId: i,
        no: i + 1,
        slug: g.slug,
        title: g.title,
        region: g.location.region,
        meta: story?.meta,
        line: firstSentence(story?.intro) || g.description,
        frames: pickFrames(g),
      };
    });

    const intro: Scene = { kind: 'intro', cam: { center: [-52, 28], zoom: 1.7, pitch: 0, bearing: 0 } };
    const outro: Scene = { kind: 'outro', cam: { center: HOME, zoom: 8.4, pitch: 50, bearing: 0 } };
    return { scenes: [intro, ...stopScenes, outro] as Scene[], stops: stopScenes };
  }, []);

  // ── Build the map once ──
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const intro = scenes[0].cam;
    const map = new maplibregl.Map({
      container: mapEl.current,
      style: MAP_STYLE,
      center: intro.center,
      zoom: intro.zoom,
      pitch: intro.pitch,
      bearing: intro.bearing,
      interactive: false, // the camera is driven entirely by scroll
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      map.resize();

      // The itinerary line — an amber thread through the stops, in order.
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: stops.map((s) => s.cam.center) },
        },
      });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#f59e0b',
          'line-width': 1.4,
          'line-opacity': 0.5,
          'line-dasharray': [1.6, 2.6],
        },
      });

      // The stops themselves — dots that swell amber when the camera arrives.
      map.addSource('stops', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: stops.map((s) => ({
            type: 'Feature',
            id: s.stopId,
            properties: { title: s.title },
            geometry: { type: 'Point', coordinates: s.cam.center },
          })),
        },
      });
      map.addLayer({
        id: 'stop-halo',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': ['case', ['boolean', ['feature-state', 'active'], false], 17, 0],
          'circle-color': '#f59e0b',
          'circle-opacity': 0.28,
          'circle-blur': 0.7,
        },
      });
      map.addLayer({
        id: 'stop-dot',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': ['case', ['boolean', ['feature-state', 'active'], false], 5.5, 3],
          'circle-color': ['case', ['boolean', ['feature-state', 'active'], false], '#f59e0b', '#efeae1'],
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(0,0,0,0.45)',
        },
      });

      // Land on whatever scene we're already at (handles a mid-page reload).
      const s = scenes[activeRef.current];
      if (s.kind === 'stop') {
        map.setFeatureState({ source: 'stops', id: s.stopId }, { active: true });
        prevStopId.current = s.stopId;
      }
      map.flyTo({ ...s.cam, duration: 0 });
    });

    // A second resize after layout settles inside the sticky/transform context.
    const t = window.setTimeout(() => map.resize(), 300);

    return () => {
      window.clearTimeout(t);
      map.remove();
      mapRef.current = null;
    };
  }, [scenes, stops]);

  // ── Fly + highlight whenever the active scene changes ──
  useEffect(() => {
    activeRef.current = active;
    const map = mapRef.current;
    if (!map) return;
    const scene = scenes[active];

    const fly = () =>
      map.flyTo({ ...scene.cam, duration: 3200, curve: 1.5, essential: true });
    if (map.isStyleLoaded()) fly();
    else map.once('load', fly);

    if (!map.getSource('stops')) return;
    if (prevStopId.current !== null) {
      map.setFeatureState({ source: 'stops', id: prevStopId.current }, { active: false });
      prevStopId.current = null;
    }
    if (scene.kind === 'stop') {
      map.setFeatureState({ source: 'stops', id: scene.stopId }, { active: true });
      prevStopId.current = scene.stopId;
    }
  }, [active, scenes]);

  // Keep the active name visible in the index rail.
  useEffect(() => {
    railItemRefs.current[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  // ── Scroll drives the active scene ──
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(idx)) setActive(idx);
          }
        }
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    );
    sectionRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [scenes]);

  const scrollToScene = useCallback((i: number) => {
    sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scene = scenes[active];

  return (
    <PageTransition>
      <div className="relative bg-black text-[#efeae1]">
        <BackButton variant="pill" placement="bottom-center" />
        {/* ── Sticky map stage ── */}
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <div ref={mapEl} className="absolute inset-0 h-full w-full" />

          {/* legibility scrims */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 38%, transparent 62%), linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 30%)',
            }}
          />

          {/* top status line */}
          <div className="pointer-events-none absolute left-6 top-24 z-20 md:left-10">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-amber-500/70" />
              <span className="font-cormorant text-xs uppercase tracking-[0.4em] text-[#efeae1]/55">
                The Journey
              </span>
            </div>
            {scene.kind === 'stop' && (
              <p className="mt-2 font-cormorant text-sm tracking-[0.2em] text-[#efeae1]/40">
                {String(scene.no).padStart(2, '0')} / {String(stops.length).padStart(2, '0')}
              </p>
            )}
          </div>

          {/* the crossfading card */}
          <div className="absolute inset-0 z-20 flex items-end md:items-center">
            <div className="w-full px-4 pb-6 md:px-10 md:pb-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  {scene.kind === 'intro' && (
                    <div className="max-w-2xl">
                      <h1 className="font-cormorant text-6xl font-light leading-[0.95] md:text-8xl">
                        The Journey
                      </h1>
                      <p className="mt-6 max-w-xl font-cormorant text-lg italic text-[#efeae1]/70 md:text-xl">
                        Every place I&rsquo;ve carried a camera, drawn as one continuous flight &mdash;{' '}
                        {stops.length} stops, one pair of eyes. Scroll to take off.
                      </p>
                      <div className="mt-10 flex items-center gap-2 text-[#efeae1]/45">
                        <span className="font-cormorant text-[0.7rem] uppercase tracking-[0.35em]">
                          Begin
                        </span>
                        <span className="block h-10 w-px bg-gradient-to-b from-[#efeae1]/45 to-transparent" />
                      </div>
                    </div>
                  )}

                  {scene.kind === 'stop' && (
                    <div className="max-w-xs rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-md md:max-w-md md:p-7">
                      <div className="mb-3 flex items-center gap-3 md:mb-4">
                        <span className="h-px w-7 bg-amber-500" />
                        <span className="font-cormorant text-[0.7rem] uppercase tracking-[0.32em] text-amber-300/85">
                          Stop {String(scene.no).padStart(2, '0')} · {scene.region}
                        </span>
                      </div>
                      <h2 className="font-cormorant text-3xl leading-none md:text-5xl">{scene.title}</h2>
                      {scene.meta && (
                        <p className="mt-2 font-cormorant text-sm italic text-[#efeae1]/55">
                          {scene.meta}
                        </p>
                      )}
                      <p className="mt-3 font-cormorant text-sm leading-relaxed text-[#efeae1]/75 [text-wrap:pretty] line-clamp-3 md:mt-4 md:text-base md:line-clamp-none">
                        {scene.line}
                      </p>

                      <div className="mt-4 flex gap-2 md:mt-5">
                        {scene.frames.map((src) => (
                          <Link
                            key={src}
                            to={`/photography/${scene.slug}`}
                            className="group relative aspect-square w-1/3 overflow-hidden rounded-[3px]"
                          >
                            <img
                              src={cldSquare(src, 220)}
                              alt={scene.title}
                              loading="lazy"
                              decoding="async"
                              draggable={false}
                              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                            />
                          </Link>
                        ))}
                      </div>

                      <Link
                        to={`/photography/${scene.slug}`}
                        className="group mt-4 inline-flex items-center gap-2 font-cormorant text-sm uppercase tracking-[0.25em] text-[#efeae1]/70 transition-colors hover:text-amber-300 md:mt-5"
                      >
                        Wander the gallery
                        <ArrowRight
                          size={15}
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </Link>
                    </div>
                  )}

                  {scene.kind === 'outro' && (
                    <div className="max-w-xl">
                      <span className="font-cormorant text-xs uppercase tracking-[0.4em] text-amber-300/80">
                        Home
                      </span>
                      <h2 className="mt-4 font-cormorant text-5xl font-light leading-[0.95] md:text-7xl">
                        Back to Santa Clara.
                      </h2>
                      <p className="mt-5 font-cormorant text-lg italic text-[#efeae1]/65 md:text-xl">
                        Every trip is a long way of learning to see the place you started from. The
                        light here was waiting the whole time.
                      </p>
                      <Link
                        to="/photography"
                        className="group mt-9 inline-flex items-center gap-2 font-cormorant text-sm uppercase tracking-[0.25em] text-[#efeae1]/70 transition-colors hover:text-amber-300"
                      >
                        See every gallery
                        <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* gallery index (desktop) — click a name to fly there */}
          <nav className="absolute right-3 top-1/2 z-20 hidden max-h-[78vh] -translate-y-1/2 flex-col items-end gap-px overflow-y-auto pr-1 md:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {stops.map((s) => {
              const isActive = active === s.no;
              return (
                <button
                  key={s.slug}
                  ref={(el) => (railItemRefs.current[s.no] = el)}
                  onClick={() => scrollToScene(s.no)}
                  className="group flex items-center justify-end gap-2.5 py-1 pl-4"
                >
                  <span
                    className={`whitespace-nowrap font-cormorant text-[11px] uppercase tracking-[0.16em] transition-colors duration-300 ${
                      isActive ? 'text-amber-300' : 'text-white/35 group-hover:text-white/80'
                    }`}
                  >
                    {s.title}
                  </span>
                  <span
                    className={`block shrink-0 rounded-full transition-all duration-300 ${
                      isActive ? 'h-1.5 w-1.5 bg-amber-400' : 'h-1 w-1 bg-white/30 group-hover:bg-white/60'
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Scroll-driving spacers (transparent; they only report position) ── */}
        <div className="relative z-10 -mt-[100vh] pointer-events-none">
          {scenes.map((_, i) => (
            <section
              key={i}
              data-idx={i}
              ref={(el) => (sectionRefs.current[i] = el)}
              className="h-screen w-full"
            />
          ))}
        </div>
      </div>
    </PageTransition>
  );
};

export default Journey;
