import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#333] text-[#bbb] pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between pb-8 border-b border-[#444]">
          <div className="mb-8 md:mb-0">
            <p className="text-white text-xl font-playfair mb-2">Andy Liu</p>
            <p className="text-sm">&copy; 2025 Chia Da Liu</p>
          </div>

          <div className="flex flex-col items-start md:items-end">
            <div className="flex space-x-4 mb-4">
              <a
                href="https://github.com/Yoppman"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#bbb] hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github size={18} />
              </a>
              <a
                href="https://www.linkedin.com/in/andy9998811/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#bbb] hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
            </div>

            <nav className="mb-4">
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                <li>
                  <Link to="/about" className="text-[#bbb] hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/photography" className="text-[#bbb] hover:text-white transition-colors">
                    Photography
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-[#bbb] hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-[#bbb] hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>

            <p className="text-sm">
              <a
                href="mailto:chiadal@uci.edu"
                className="text-[#bbb] hover:text-white transition-colors"
              >
                chiadal@uci.edu
              </a>
            </p>
          </div>
        </div>

        <p className="text-[#777] text-xs text-center mt-6">
        © 2025 Andy Liu. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;