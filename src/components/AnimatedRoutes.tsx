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

// Lazy-load heavy pages to keep the main bundle lean
const MapExplorer = lazy(() => import('../pages/MapExplorer'));
const Experimental = lazy(() => import('../pages/Experimental'));
const Portraits = lazy(() => import('../pages/Portraits'));
const Spectrum = lazy(() => import('../pages/Spectrum'));
const Darkroom = lazy(() => import('../pages/Darkroom'));
const Journey = lazy(() => import('../pages/Journey'));

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/photography" element={<Photography />} />
        <Route path="/photography/portraits" element={<Suspense fallback={null}><Portraits /></Suspense>} />
        <Route path="/photography/spectrum" element={<Suspense fallback={null}><Spectrum /></Suspense>} />
        <Route path="/photography/darkroom" element={<Suspense fallback={null}><Darkroom /></Suspense>} />
        <Route path="/photography/journey" element={<Suspense fallback={null}><Journey /></Suspense>} />
        <Route path="/photography/:slug" element={<GalleryDetail />} />
        <Route path="/map" element={<Suspense fallback={null}><MapExplorer /></Suspense>} />
        <Route path="/experimental" element={<Suspense fallback={null}><Experimental /></Suspense>} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/resume" element={<Resume />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
