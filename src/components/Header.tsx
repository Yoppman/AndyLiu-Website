// src/components/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Github, Linkedin } from 'lucide-react';
import { NavLink, Link, useLocation } from 'react-router-dom';

export default function Header() {
  const { pathname } = useLocation();

  const onPhotographySection = pathname.startsWith('/photography');
  const isDetail = /^\/photography\/[^/]+$/.test(pathname);

  const [visible, setVisible] = useState(true);
  const [blackBg, setBlackBg] = useState(false);
  const lastY = useRef(window.scrollY);
  const scrollTimer = useRef<number>();
  const hoverTimer = useRef<number>();
  const fromHover = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;

      if (y < 10) {
        setVisible(true);
        clearTimeout(hoverTimer.current);
      } else {
        setVisible(false);
      }

      if (y < lastY.current && y >= 10 && isDetail) {
        setBlackBg(true);
        clearTimeout(scrollTimer.current);
        scrollTimer.current = window.setTimeout(() => setBlackBg(false), 500);
      }

      lastY.current = y;
    };

    const onMouseEnter = () => {
      setVisible(true);
      fromHover.current = true;

      // Set background based on page type
      setBlackBg(isDetail);

      clearTimeout(hoverTimer.current);
    };

    const onMouseLeave = () => {
      hoverTimer.current = window.setTimeout(() => {
        setVisible(false);
        fromHover.current = false;
      }, 3000);
    };

    const hoverZone = document.getElementById('hover-zone');
    hoverZone?.addEventListener('mouseenter', onMouseEnter);
    hoverZone?.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      hoverZone?.removeEventListener('mouseenter', onMouseEnter);
      hoverZone?.removeEventListener('mouseleave', onMouseLeave);
      clearTimeout(scrollTimer.current);
      clearTimeout(hoverTimer.current);
    };
  }, [isDetail]);

  const base = 'fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out';
  const translate = visible ? 'translate-y-0' : '-translate-y-full';

  // Determine background color:
  const bgClass =
    isDetail
      ? blackBg ? 'bg-black' : 'bg-transparent'
      : blackBg ? 'bg-black' : fromHover.current ? 'bg-[#f4f4f3]' : 'bg-transparent';

  const textClass = isDetail || blackBg ? 'text-white' : 'text-black';

  return (
    <header className={`${base} ${translate} ${bgClass}`}>
      <div className={`max-w-7xl mx-auto px-10 h-20 flex items-center justify-between ${textClass}`}>
        <Link to="/" className="text-3xl font-cormorant tracking-wide">
          Andy Liu
        </Link>

        <nav className="hidden md:block">
          <ul className="flex space-x-8">
            {[
              { to: '/about', label: 'About' },
              { to: '/photography', label: 'Photography' },
              { to: '/blog', label: 'Blog' },
              { to: '/contact', label: 'Contact' },
            ].map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `relative pb-1 transition-all duration-200 ${
                      isActive
                        ? 'after:content-[""] after:absolute after:-bottom-0.5 after:left-0 after:w-full after:border-b-[1px] after:border-current'
                        : 'hover:after:content-[""] hover:after:absolute hover:after:-bottom-0.5 hover:after:left-0 hover:after:w-full hover:after:border-b-2 hover:after:border-current hover:opacity-80'
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex space-x-4 items-center">
          <a href="https://github.com/Yoppman" target="_blank" rel="noopener noreferrer">
            <Github size={20} />
          </a>
          <a href="https://www.linkedin.com/in/andy9998811/" target="_blank" rel="noopener noreferrer">
            <Linkedin size={20} />
          </a>
        </div>
      </div>
    </header>
  );
}