import React from 'react';
import { BrowserRouter } from "react-router-dom";
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import AnimatedRoutes from './components/AnimatedRoutes';
import { TransitionProvider } from './context/TransitionContext';
import SharedMorphOverlay from './components/SharedMorphOverlay';

function App() {
  return (
    <BrowserRouter>
      <TransitionProvider>
        <div className="font-cormorant text-[#151515] min-h-screen flex flex-col">
          <div id="hover-zone" className="fixed top-0 left-0 w-full h-4 z-40" />
          <Header />
          <SharedMorphOverlay />
          <main className="flex-1">
            <ScrollToTop />
            <AnimatedRoutes />
          </main>
          <Footer />
        </div>
      </TransitionProvider>
    </BrowserRouter>
  );
}

export default App;