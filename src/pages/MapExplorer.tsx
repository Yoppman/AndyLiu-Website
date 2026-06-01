import React from 'react';
import PageTransition from '../components/PageTransition';
import PhotoMap from '../components/map/PhotoMap';

const MapExplorer: React.FC = () => {
  return (
    <PageTransition>
      <PhotoMap />
    </PageTransition>
  );
};

export default MapExplorer;
