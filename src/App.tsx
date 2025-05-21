import React from 'react';
import { BrowserRouter ,  Routes, Route } from "react-router-dom";
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import About from './pages/About';
import Photography from './pages/Photography';
import GalleryDetail from './pages/GalleryDetail'
import Blog from './pages/Blog';
import Contact from './pages/Contact';

function App() {
  return (
    <BrowserRouter>
      <div className="font-cormorant text-[#151515] ">
      <div id="hover-zone" className="fixed top-0 left-0 w-full h-4 z-40" />
        <Header />
        <main>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/photography" element={<Photography />} />
            <Route path="/photography/:slug" element={<GalleryDetail />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;