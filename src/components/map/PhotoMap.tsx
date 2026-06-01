import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Mail } from 'lucide-react';
import { galleries } from '../../data/galleries';
import type { Gallery } from '../../data/types/galleries';
import GalleryFlyout from './GalleryFlyout';

/* ── Cloudinary helpers ── */
const isCloudinary = (url: string) =>
  /res\.cloudinary\.com\/[^/]+\/image\/(upload|fetch)\//.test(url);

const withTx = (src: string, tx: string) =>
  isCloudinary(src)
    ? src.replace(/(\/image\/(?:upload|fetch)\/)/, `$1${tx}/`)
    : src;

/** Tiny circular thumbnail for the map pin */
const buildMarkerThumb = (src: string) =>
  isCloudinary(src)
    ? withTx(src, 'c_fill,g_face,w_96,h_96,q_auto,f_auto')
    : src;

/* ── Custom Leaflet icon factory ── */
function photoIcon(gallery: Gallery): L.DivIcon {
  const hero = gallery.hero || gallery.photos[0];
  const thumb = buildMarkerThumb(hero.src);

  return L.divIcon({
    className: 'photo-map-marker',
    html: `
      <div class="photo-pin-ring">
        <img src="${thumb}" alt="${gallery.title}" class="photo-pin-img" />
      </div>
    `,
    iconSize: [52, 52],
    iconAnchor: [26, 26],
    tooltipAnchor: [0, -30],
  });
}

/* ── Home base marker icon ── */
const homeIcon = L.divIcon({
  className: 'photo-map-marker',
  html: `<div class="home-pin"><span class="home-pin-dot"></span></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  tooltipAnchor: [0, -14],
});

/* ── Fit-bounds helper ── */
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  React.useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds.pad(0.3), { maxZoom: 6 });
  }, [map, points]);
  return null;
}

/* ── Main component ── */
const PhotoMap: React.FC = () => {
  const [selected, setSelected] = useState<Gallery | null>(null);

  const galleriesWithLocation = useMemo(
    () => galleries.filter((g): g is Gallery & { location: NonNullable<Gallery['location']> } => !!g.location),
    [],
  );

  const points = useMemo<[number, number][]>(
    () => galleriesWithLocation.map((g) => [g.location.lat, g.location.lng]),
    [galleriesWithLocation],
  );

  const handleMarkerClick = useCallback((gallery: Gallery) => {
    setSelected(gallery);
  }, []);

  const closeFlyout = useCallback(() => setSelected(null), []);

  return (
    <div className="relative h-[calc(100vh-5rem)] w-full bg-neutral-950 dark-map">
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

      {/* Title overlay */}
      <div className="absolute top-6 left-6 z-[500] pointer-events-none">
        <h1 className="font-cormorant text-3xl md:text-4xl text-white font-bold drop-shadow-lg">
          Explore by Location
        </h1>
        <p className="font-cormorant text-neutral-400 text-sm mt-1">
          {galleriesWithLocation.length} galleries across {new Set(galleriesWithLocation.map((g) => g.location.region)).size} regions
        </p>
      </div>

      <MapContainer
        center={[38, -10]}
        zoom={3}
        scrollWheelZoom={true}
        zoomControl={true}
        className="h-full w-full"
        style={{ background: '#0a0a0a' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={18}
        />

        <FitBounds points={points} />

        {/* Home base pin */}
        <Marker position={[37.35, -121.96]} icon={homeIcon}>
          <Tooltip direction="top" offset={[0, 0]} opacity={1} className="dark-map-tooltip">
            Santa Clara (Home)
          </Tooltip>
        </Marker>

        {/* Gallery markers */}
        {galleriesWithLocation.map((gallery) => (
          <Marker
            key={gallery.slug}
            position={[gallery.location.lat, gallery.location.lng]}
            icon={photoIcon(gallery)}
            eventHandlers={{
              click: () => handleMarkerClick(gallery),
            }}
          >
            <Tooltip direction="top" offset={[0, 0]} opacity={1} className="dark-map-tooltip">
              {gallery.title}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-[500] flex items-center gap-5 text-xs font-cormorant text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 border-amber-500 bg-amber-500/30" />
          Home
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 border-white/60 bg-neutral-700" />
          Gallery
        </span>
      </div>

      <GalleryFlyout gallery={selected} onClose={closeFlyout} />
    </div>
  );
};

export default PhotoMap;
