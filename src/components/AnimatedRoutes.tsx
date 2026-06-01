import { useLocation, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { lazy, Suspense } from 'react';
import Home from '../pages/Home';
import About from '../pages/About';
import Photography from '../pages/Photography';
import GalleryDetail from '../pages/GalleryDetail';
import Blog from '../pages/Blog';
import Resume from '../pages/Resume';
import Contact from '../pages/Contact';

// Lazy-load the map page to avoid pulling Leaflet into the main bundle
const MapExplorer = lazy(() => import('../pages/MapExplorer'));

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/photography" element={<Photography />} />
        <Route path="/photography/:slug" element={<GalleryDetail />} />
        <Route path="/map" element={<Suspense fallback={null}><MapExplorer /></Suspense>} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/resume" element={<Resume />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
