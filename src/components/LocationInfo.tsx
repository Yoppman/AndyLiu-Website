import React from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
} from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const center = { lat: 37.3541, lng: -121.9552 };

const mapOptions = {
  disableDefaultUI: true,
  styles: [
    { stylers: [{ saturation: -100 }] },
    { featureType: 'landscape.natural.terrain', stylers: [{ visibility: 'off' }] }
  ]
};

function LocationInfo() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  return (
    <section className="py-16 bg-[#f4f4f3]">
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
        <div className="mx-auto w-full max-w-4xl h-[300px] md:h-[450px] mt-8 mb-8 rounded-md shadow-md overflow-hidden">
          {isLoaded && (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={center}
              zoom={10}
              options={mapOptions}
            >
            <Marker
              position={center}
              icon={{
                url: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
                scaledSize: new window.google.maps.Size(32, 32) // optional: resize it
              }}
            />
            </GoogleMap>
          )}
        </div>
      </div>
    </section>
  );
}

export default LocationInfo;