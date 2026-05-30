import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Gallery } from './cloudinaryUtils';

interface Props {
  prev?: Gallery;
  next?: Gallery;
}

const GalleryNav: React.FC<Props> = ({ prev, next }) => (
  <div className="max-w-7xl mx-auto px-6 py-12 flex justify-between items-center">
    {prev ? (
      <Link
        to={`/photography/${prev.slug}`}
        className="flex items-center text-3xl font-cormorant transition-transform duration-200 hover:scale-110"
      >
        <ArrowLeft size={40} strokeWidth={1} className="mr-2" />
        {prev.title}
      </Link>
    ) : <span />}
    {next ? (
      <Link
        to={`/photography/${next.slug}`}
        className="flex items-center text-3xl font-cormorant transition-transform duration-200 hover:scale-110"
      >
        {next.title}
        <ArrowRight size={40} strokeWidth={1} className="ml-2" />
      </Link>
    ) : <span />}
  </div>
);

export default GalleryNav;
