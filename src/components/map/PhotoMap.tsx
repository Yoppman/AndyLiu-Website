import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Supercluster from 'supercluster';
import { ArrowLeft, Mail } from 'lucide-react';
import { galleries } from '../../data/galleries';
import type { Gallery } from '../../data/types/galleries';
import GalleryFlyout from './GalleryFlyout';

/* CARTO's free 'dark-matter' VECTOR style — WebGL, so zoom is continuous + gap-free. */
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const HOME: [number, number] = [-121.96, 37.35]; // [lng, lat]
const WORLD: [number, number, number, number] = [-180, -85, 180, 85];

/* ── Cloudinary helpers ── */
const isCloudinary = (url: string) =>
  /res\.cloudinary\.com\/[^/]+\/image\/(upload|fetch)\//.test(url);
const withTx = (src: string, tx: string) =>
  isCloudinary(src) ? src.replace(/(\/image\/(?:upload|fetch)\/)/, `$1${tx}/`) : src;
const buildMarkerThumb = (src: string) =>
  isCloudinary(src) ? withTx(src, 'c_fill,g_auto,w_96,h_96,q_auto,f_auto') : src;

type LocatedGallery = Gallery & { location: NonNullable<Gallery['location']> };
type PointProps = { idx: number; title: string; region: string };
/* getClusters returns a mix of cluster + point features; read loosely. */
interface AnyFeature {
  geometry: { coordinates: [number, number] };
  properties: Record<string, unknown>;
}

const PhotoMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [selected, setSelected] = useState<Gallery | null>(null);

  const located = useMemo<LocatedGallery[]>(
    () => galleries.filter((g): g is LocatedGallery => !!g.location),
    [],
  );

  // Build the Supercluster index once from the located galleries.
  const index = useMemo(() => {
    const sc = new Supercluster<PointProps>({ radius: 60, maxZoom: 10 });
    sc.load(
      located.map((g, idx) => ({
        type: 'Feature' as const,
        properties: { idx, title: g.title, region: g.location.region },
        geometry: { type: 'Point' as const, coordinates: [g.location.lng, g.location.lat] },
      })),
    );
    return sc;
  }, [located]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [-40, 32],
      zoom: 1.5,
      attributionControl: false,
      dragRotate: false,
      maxZoom: 16,
    });
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    // Home base — always shown, never clustered.
    const homeEl = document.createElement('div');
    homeEl.className = 'home-pin';
    homeEl.innerHTML =
      '<span class="home-pin-dot"></span><span class="pin-label">Santa Clara · Home</span>';
    new maplibregl.Marker({ element: homeEl, anchor: 'center' }).setLngLat(HOME).addTo(map);

    // Cluster-aware marker rendering.
    let markers: maplibregl.Marker[] = [];
    let prevKey = '';

    const render = () => {
      const zoom = Math.round(map.getZoom());
      const features = index.getClusters(WORLD, zoom) as unknown as AnyFeature[];

      // Only rebuild when the cluster layout actually changes (i.e. on zoom-level
      // crossings) — panning at the same zoom keeps the markers, so they glide
      // with the map instead of flashing.
      const key =
        zoom +
        '|' +
        features
          .map((f) =>
            f.properties.cluster
              ? `c${f.properties.cluster_id}:${f.properties.point_count}`
              : `p${f.properties.idx}`,
          )
          .join(',');
      if (key === prevKey) return;
      prevKey = key;

      markers.forEach((m) => m.remove());
      markers = [];

      features.forEach((feat) => {
        const [lng, lat] = feat.geometry.coordinates;
        const p = feat.properties;
        const el = document.createElement('div');

        if (p.cluster) {
          // ── Merged cluster: a count bubble ──
          const count = p.point_count as number;
          const clusterId = p.cluster_id as number;
          const leaves = index.getLeaves(clusterId, Infinity) as unknown as AnyFeature[];
          const titles = leaves.map((l) => l.properties.title as string);
          const regions = Array.from(new Set(leaves.map((l) => l.properties.region as string)));
          const label =
            count <= 3
              ? titles.join(' · ')
              : `${count} collections · ${regions.slice(0, 2).join(', ')}${
                  regions.length > 2 ? '…' : ''
                }`;

          el.className = 'cluster-pin';
          el.innerHTML =
            `<span class="cluster-count">${count}</span>` +
            `<span class="pin-label">${label}</span>`;
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            const target = Math.min(index.getClusterExpansionZoom(clusterId), 12);
            map.easeTo({ center: [lng, lat], zoom: target, duration: 700 });
          });
        } else {
          // ── Single collection: the photo pin ──
          const g = located[p.idx as number];
          const hero = g.hero || g.photos[0];
          el.className = 'photo-pin';
          el.innerHTML =
            `<div class="photo-pin-ring"><img src="${buildMarkerThumb(hero.src)}" alt="${g.title}" class="photo-pin-img" /></div>` +
            `<span class="pin-label">${g.title}</span>`;
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            setSelected(g);
          });
        }

        markers.push(
          new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([lng, lat]).addTo(map),
        );
      });
    };

    map.on('load', () => {
      map.resize();
      if (located.length) {
        const bounds = new maplibregl.LngLatBounds();
        located.forEach((g) => bounds.extend([g.location.lng, g.location.lat]));
        bounds.extend(HOME);
        map.fitBounds(bounds, {
          padding: { top: 130, bottom: 80, left: 70, right: 70 },
          maxZoom: 6,
          duration: 0,
        });
      }
      render();
    });
    map.on('moveend', render);

    return () => {
      markers.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, [index, located]);

  const closeFlyout = useCallback(() => setSelected(null), []);

  return (
    <div className="relative h-[calc(100vh-5rem)] w-full bg-neutral-950 maplibre-dark">
      {/* ── Floating nav bar ── */}
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

      {/* Title overlay — below the fixed 80px site header so it clears the logo. */}
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

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-[500] flex items-center gap-5 text-xs font-cormorant text-neutral-500 pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 border-amber-500 bg-amber-500/30" />
          Home
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 border-white/60 bg-neutral-700" />
          Gallery
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-white/60 bg-neutral-900 text-[8px] text-white">3</span>
          Cluster
        </span>
      </div>

      <GalleryFlyout gallery={selected} onClose={closeFlyout} />
    </div>
  );
};

export default PhotoMap;
