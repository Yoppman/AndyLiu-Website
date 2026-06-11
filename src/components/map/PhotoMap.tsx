import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ArrowLeft, Mail, Moon, Satellite, Mountain, Play, Square } from 'lucide-react';
import { galleries } from '../../data/galleries';
import type { Gallery } from '../../data/types/galleries';
import GalleryFlyout from './GalleryFlyout';

/* CARTO 'dark-matter' VECTOR style — kept as the single base; we toggle a
   satellite raster + 3D terrain on top rather than swapping styles (which would
   wipe our sources/layers/images). */
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const SAT_TILES =
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const DEM_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
const HOME: [number, number] = [-121.96, 37.35]; // [lng, lat]

type BaseMode = 'dark' | 'satellite' | 'terrain';
type LocatedGallery = Gallery & { location: NonNullable<Gallery['location']> };

const isCloudinary = (url: string) =>
  /res\.cloudinary\.com\/[^/]+\/image\/(upload|fetch)\//.test(url);
const buildThumb = (src: string) =>
  isCloudinary(src)
    ? src.replace(/(\/image\/(?:upload|fetch)\/)/, `$1c_fill,g_auto,w_120,h_120,q_auto,f_auto/`)
    : src;

/* Load an image (CORS-enabled so we can read its pixels for the icon canvas). */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/* Render a circular, ringed photo thumbnail into ImageData (2x for retina). */
function circleIcon(img: HTMLImageElement | null, diameter: number, fallback: string): ImageData | null {
  const scale = 2;
  const d = diameter * scale;
  const canvas = document.createElement('canvas');
  canvas.width = d;
  canvas.height = d;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const r = d / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(r, r, r - scale * 2, 0, Math.PI * 2);
  ctx.clip();
  if (img) {
    const s = Math.max(d / img.width, d / img.height);
    const w = img.width * s;
    const h = img.height * s;
    try {
      ctx.drawImage(img, r - w / 2, r - h / 2, w, h);
    } catch {
      ctx.fillStyle = fallback;
      ctx.fillRect(0, 0, d, d);
    }
  } else {
    ctx.fillStyle = fallback;
    ctx.fillRect(0, 0, d, d);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(r, r, r - scale * 1.5, 0, Math.PI * 2);
  ctx.lineWidth = scale * 2.25;
  ctx.strokeStyle = '#efeae1';
  ctx.stroke();
  try {
    return ctx.getImageData(0, 0, d, d);
  } catch {
    return null;
  }
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
function flyTo(map: maplibregl.Map, opts: maplibregl.FlyToOptions): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const fin = () => {
      if (done) return;
      done = true;
      map.off('moveend', fin);
      resolve();
    };
    map.once('moveend', fin);
    map.flyTo({ curve: 1.4, essential: true, ...opts });
    setTimeout(fin, (opts.duration ?? 2000) + 900); // safety net
  });
}

const PhotoMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const tourRef = useRef(false);
  const modeRef = useRef<BaseMode>('dark');

  const [mode, setMode] = useState<BaseMode>('dark');
  const [touring, setTouring] = useState(false);
  const [selected, setSelected] = useState<Gallery | null>(null);

  const located = useMemo<LocatedGallery[]>(
    () => galleries.filter((g): g is LocatedGallery => !!g.location),
    [],
  );

  const geojson = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: located.map((g, idx) => ({
        type: 'Feature',
        id: idx,
        properties: { idx, title: g.title, region: g.location.region, slug: g.slug },
        geometry: { type: 'Point', coordinates: [g.location.lng, g.location.lat] },
      })),
    }),
    [located],
  );

  modeRef.current = mode;

  /* Apply a basemap mode: toggle the satellite raster + 3D terrain + projection. */
  const applyMode = useCallback((m: BaseMode) => {
    const map = mapRef.current;
    if (!map || !map.getLayer('sat')) return;
    map.setLayoutProperty('sat', 'visibility', m === 'dark' ? 'none' : 'visible');
    if (m === 'terrain') {
      try {
        map.setTerrain({ source: 'dem', exaggeration: 1.3 });
      } catch {
        /* DEM source may be unavailable (CORS) — terrain just stays flat */
      }
      try {
        (map as unknown as { setProjection: (p: object) => void }).setProjection({ type: 'mercator' });
      } catch {
        /* older build: no globe/projection support */
      }
      try {
        (map as unknown as { setSky?: (s: object) => void }).setSky?.({
          'sky-color': '#0b0b14',
          'horizon-color': '#23232f',
          'fog-color': '#0a0a0a',
          'sky-horizon-blend': 0.5,
          'horizon-fog-blend': 0.5,
          'fog-ground-blend': 0.6,
          'atmosphere-blend': 0.6,
        });
      } catch {
        /* sky unsupported — skip */
      }
      map.easeTo({ pitch: 62, duration: 1200 });
    } else {
      try {
        map.setTerrain(null);
      } catch {
        /* ignore */
      }
      try {
        (map as unknown as { setProjection: (p: object) => void }).setProjection({ type: 'globe' });
      } catch {
        /* ignore */
      }
      map.easeTo({ pitch: 0, duration: 800 });
    }
  }, []);

  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) applyMode(mode);
  }, [mode, applyMode]);

  // ── Build the map once ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [-30, 25],
      zoom: 1.4,
      attributionControl: false,
      maxZoom: 16,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    // Surface internal errors (bad expressions, failed tile sources like the DEM)
    // to the console instead of failing silently.
    map.on('error', (e) => console.error('[PhotoMap] maplibre error:', (e as { error?: unknown }).error ?? e));

    map.on('load', async () => {
      map.resize();
      try {
        (map as unknown as { setProjection: (p: object) => void }).setProjection({ type: 'globe' });
      } catch {
        /* ignore */
      }

      // Satellite imagery (hidden until selected) + DEM for terrain.
      map.addSource('sat', {
        type: 'raster',
        tiles: [SAT_TILES],
        tileSize: 256,
        attribution: 'Imagery © Esri',
      });
      map.addLayer({ id: 'sat', type: 'raster', source: 'sat', layout: { visibility: 'none' } });
      map.addSource('dem', {
        type: 'raster-dem',
        tiles: [DEM_TILES],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 15,
        attribution: 'Terrain: AWS Terrain Tiles',
      });

      // Per-gallery circular photo icons (native symbol images, with collision).
      await Promise.all(
        located.map(async (g, idx) => {
          const hero = g.hero || g.photos[0];
          const img = await loadImage(buildThumb(hero.src));
          const data = circleIcon(img, 52, '#2a2a2a');
          if (data && !map.hasImage(`pin-${idx}`)) map.addImage(`pin-${idx}`, data, { pixelRatio: 2 });
        }),
      );

      // Native clustered source.
      map.addSource('galleries', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterRadius: 60,
        clusterMaxZoom: 9,
      });
      map.addSource('home', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: HOME } }],
        },
      });

      // Cluster bubbles + count.
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'galleries',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': 'rgba(18,18,24,0.85)',
          'circle-stroke-color': 'rgba(255,255,255,0.7)',
          'circle-stroke-width': 1.5,
          'circle-radius': ['step', ['get', 'point_count'], 16, 5, 20, 15, 26],
        },
      });
      // The cluster count is drawn as an HTML overlay (see updateClusterCounts
      // below), not a GL symbol layer — GL text can only use the basemap's glyph
      // fonts (Open Sans), and we want the site's Cormorant face like everywhere
      // else on the map. The GL circle above stays as the bubble behind it.
      // Hover ring beneath the pins — driven by a filter, NOT feature-state
      // (feature-state can't be used in the layout props symbol layers rely on).
      map.addLayer({
        id: 'photo-hover',
        type: 'circle',
        source: 'galleries',
        filter: ['==', ['get', 'idx'], -1], // matches nothing until hover
        paint: {
          'circle-radius': 30,
          'circle-color': 'rgba(245,158,11,0.16)',
          'circle-stroke-color': '#f59e0b',
          'circle-stroke-width': 2,
        },
      });
      // Photo pins only — no baked-in GL text labels. The original map showed a
      // gallery's name on hover (in the site's Cormorant face) rather than as a
      // permanent label under every pin; MapLibre symbol layers can only render
      // the style's glyph fonts (Open Sans), so we keep the name in the HTML
      // hover popup below and let the pins stay clean. icon-allow-overlap:false
      // + icon-padding still give automatic decluttering.
      map.addLayer({
        id: 'photos',
        type: 'symbol',
        source: 'galleries',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'icon-image': ['concat', 'pin-', ['to-string', ['get', 'idx']]],
          'icon-size': ['interpolate', ['linear'], ['zoom'], 2, 0.5, 5, 0.82, 10, 1.05],
          'icon-allow-overlap': false,
          'icon-padding': 2,
        },
      });
      // Home base.
      map.addLayer({
        id: 'home-glow',
        type: 'circle',
        source: 'home',
        paint: { 'circle-radius': 10, 'circle-color': '#f59e0b', 'circle-opacity': 0.25, 'circle-blur': 0.7 },
      });
      map.addLayer({
        id: 'home-dot',
        type: 'circle',
        source: 'home',
        paint: {
          'circle-radius': 5,
          'circle-color': '#f59e0b',
          'circle-stroke-color': '#1a1205',
          'circle-stroke-width': 1.5,
        },
      });

      // ── Interactions ──
      map.on('click', 'clusters', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const clusterId = f.properties?.cluster_id;
        const src = map.getSource('galleries') as maplibregl.GeoJSONSource;
        src
          .getClusterExpansionZoom(clusterId)
          .then((z) => {
            const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
            map.easeTo({ center: coords, zoom: Math.min(z, 12), duration: 700 });
          })
          .catch(() => undefined);
      });
      map.on('mouseenter', 'clusters', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'clusters', () => (map.getCanvas().style.cursor = ''));

      // Cluster counts as HTML markers (Cormorant), kept in sync with the GL
      // clusters on every frame. pointer-events:none lets clicks fall through to
      // the GL 'clusters' layer, which already handles expand-on-click above.
      const countMarkers = new Map<number, maplibregl.Marker>();
      const updateClusterCounts = () => {
        if (!map.getSource('galleries')) return;
        const seen = new Set<number>();
        for (const f of map.querySourceFeatures('galleries')) {
          const props = f.properties as
            | { cluster?: boolean; cluster_id?: number; point_count_abbreviated?: string | number }
            | null;
          if (!props?.cluster || props.cluster_id == null) continue;
          const id = props.cluster_id;
          if (seen.has(id)) continue; // dedupe across tile boundaries
          seen.add(id);
          const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
          let marker = countMarkers.get(id);
          if (!marker) {
            const el = document.createElement('div');
            el.className = 'mp-cluster-count';
            el.textContent = String(props.point_count_abbreviated ?? '');
            marker = new maplibregl.Marker({ element: el }).setLngLat(coords).addTo(map);
            countMarkers.set(id, marker);
          } else {
            marker.setLngLat(coords);
          }
        }
        for (const [id, marker] of countMarkers) {
          if (!seen.has(id)) {
            marker.remove();
            countMarkers.delete(id);
          }
        }
      };
      map.on('render', () => {
        if (!map.isSourceLoaded('galleries')) return;
        updateClusterCounts();
      });

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 16,
        className: 'map-photo-popup',
      });
      popupRef.current = popup;

      map.on('mousemove', 'photos', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        map.getCanvas().style.cursor = 'pointer';
        const idx = f.properties?.idx as number;
        map.setFilter('photo-hover', ['==', ['get', 'idx'], idx]); // highlight ring
        const g = located[idx];
        if (!g) return;
        // The pin already *is* the cover image — so hover just names the place,
        // like the original map's tooltip. No second copy of the photo.
        const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
        popup
          .setLngLat(coords)
          .setHTML(`<span class="mp-pop-title">${g.title}</span>`)
          .addTo(map);
      });
      map.on('mouseleave', 'photos', () => {
        map.getCanvas().style.cursor = '';
        map.setFilter('photo-hover', ['==', ['get', 'idx'], -1]);
        popup.remove();
      });
      map.on('click', 'photos', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const idx = f.properties?.idx as number;
        const g = located[idx];
        if (!g) return;
        setSelected(g);
        const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
        map.flyTo({ center: coords, zoom: Math.max(map.getZoom(), 5.5), duration: 1100 });
      });

      // Stop the auto-tour the moment the user grabs the map.
      map.on('dragstart', () => {
        tourRef.current = false;
        setTouring(false);
      });

      // Frame everything, then apply the initial mode.
      const bounds = new maplibregl.LngLatBounds();
      located.forEach((g) => bounds.extend([g.location.lng, g.location.lat]));
      bounds.extend(HOME);
      map.fitBounds(bounds, { padding: { top: 140, bottom: 90, left: 80, right: 80 }, maxZoom: 6, duration: 0 });
      applyMode(modeRef.current);
    });

    return () => {
      tourRef.current = false;
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [geojson, located, applyMode]);

  // ── Auto-tour ───────────────────────────────────────────────────────────────
  const startTour = useCallback(async () => {
    const map = mapRef.current;
    if (!map || tourRef.current) return;
    tourRef.current = true;
    setTouring(true);
    for (let i = 0; i < located.length; i++) {
      if (!tourRef.current) break;
      const g = located[i];
      setSelected(g);
      await flyTo(map, {
        center: [g.location.lng, g.location.lat],
        zoom: 8.4,
        pitch: 56,
        bearing: i % 2 ? 22 : -22,
        duration: 3600,
      });
      if (!tourRef.current) break;
      map.easeTo({ bearing: map.getBearing() + 45, duration: 1500, easing: (t) => t }); // gentle orbit
      await wait(1700);
    }
    tourRef.current = false;
    setTouring(false);
    setSelected(null);
  }, [located]);

  const stopTour = useCallback(() => {
    tourRef.current = false;
    setTouring(false);
  }, []);

  const closeFlyout = useCallback(() => setSelected(null), []);

  const MODES: { id: BaseMode; label: string; Icon: typeof Moon }[] = [
    { id: 'dark', label: 'Dark', Icon: Moon },
    { id: 'satellite', label: 'Satellite', Icon: Satellite },
    { id: 'terrain', label: '3D Terrain', Icon: Mountain },
  ];

  return (
    <div className="relative h-[calc(100vh-5rem)] w-full bg-neutral-950 maplibre-dark">
      {/* Floating nav bar */}
      <nav className="absolute top-5 right-5 z-[500] flex items-center gap-1 rounded-full bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] px-1.5 py-1.5 shadow-lg shadow-black/20">
        <Link
          to="/photography"
          className="flex items-center gap-1.5 pl-3 pr-3.5 py-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors text-[13px] tracking-wide"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          <span className="font-cormorant">Photography</span>
        </Link>
        <span className="w-px h-4 bg-white/10" />
        <Link
          to="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors text-[13px] font-cormorant tracking-wide"
        >
          Andy Liu
        </Link>
        <span className="w-px h-4 bg-white/10" />
        <Link
          to="/contact"
          className="flex items-center justify-center w-8 h-8 rounded-full text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
          title="Contact"
        >
          <Mail size={14} strokeWidth={1.5} />
        </Link>
      </nav>

      {/* Title overlay */}
      <div className="absolute top-24 left-6 z-[500] pointer-events-none">
        <h1 className="font-cormorant text-3xl md:text-4xl text-white font-bold drop-shadow-lg">
          Explore by Location
        </h1>
        <p className="font-cormorant text-neutral-400 text-sm mt-1">
          {located.length} galleries across {new Set(located.map((g) => g.location.region)).size} regions
        </p>
      </div>

      {/* Map canvas */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {/* Basemap + tour control bar */}
      <div className="absolute bottom-6 left-1/2 z-[500] -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] px-1.5 py-1.5 shadow-lg shadow-black/30">
        {MODES.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-cormorant tracking-wide transition-colors ${
                active ? 'bg-white/[0.14] text-white' : 'text-white/55 hover:text-white hover:bg-white/[0.07]'
              }`}
            >
              <m.Icon size={14} strokeWidth={1.6} />
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          );
        })}
        <span className="mx-0.5 w-px h-5 bg-white/10" />
        <button
          onClick={touring ? stopTour : startTour}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-cormorant tracking-wide text-amber-200/90 hover:text-amber-100 hover:bg-amber-400/10 transition-colors"
        >
          {touring ? <Square size={13} strokeWidth={1.8} /> : <Play size={13} strokeWidth={1.8} />}
          {touring ? 'Stop' : 'Tour'}
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-24 left-6 z-[500] flex items-center gap-5 text-xs font-cormorant text-neutral-500 pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 border-amber-500 bg-amber-500/30" />
          Home
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 border-white/60 bg-neutral-700" />
          Gallery
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-white/60 bg-neutral-900 text-[8px] text-white">
            3
          </span>
          Cluster
        </span>
      </div>

      <GalleryFlyout gallery={selected} onClose={closeFlyout} />
    </div>
  );
};

export default PhotoMap;
