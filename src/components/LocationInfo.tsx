import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const center: [number, number] = [37.3541, -121.9552]; // Santa Clara, California

// Elegant amber pin with a soft pulsing halo (styles live in index.css)
const locationIcon = L.divIcon({
  className: 'location-pin-wrapper',
  html: '<span class="location-pin"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function LocationInfo() {
  return (
    <section className="relative py-16 bg-[#f4f4f3] z-40">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <p className="italic text-gray-600 text-2xl md:text-3xl leading-relaxed">
            <em>Current Location</em>
          </p>
          <h2 className="font-cormorant text-4xl md:text-5xl lg:text-6xl leading-loose">
            Santa Clara, California
          </h2>
        </div>

        {/* Map */}
        <div className="relative mx-auto w-full max-w-4xl h-[300px] md:h-[450px] mt-8 mb-8 rounded-md shadow-md overflow-hidden">
          <MapContainer
            center={center}
            zoom={11}
            scrollWheelZoom={false}
            zoomControl={true}
            attributionControl={true}
            className="h-full w-full"
            style={{ background: '#f4f4f3' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              subdomains="abcd"
              maxZoom={20}
            />
            <Marker position={center} icon={locationIcon}>
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                Santa Clara, California
              </Tooltip>
            </Marker>
          </MapContainer>
        </div>
      </div>
    </section>
  );
}

export default LocationInfo;
