// src/pages/Photography.tsx
import React from 'react'
import { Link } from 'react-router-dom'
import { galleries } from '../data/galleries'  // now points at index.ts

const Photography: React.FC = () => (
  <div className="max-w-7xl mx-auto px-6 py-16 pt-24">
    <h1 className="font-cormorant font-bold text-4xl mb-12 text-center">
      Photography Collections
    </h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {galleries.map((g) => (
        <Link
          key={g.slug}
          to={`/photography/${g.slug}`}
          className="group block relative overflow-hidden rounded-lg shadow-lg"
        >
          <img
            src={g.photos[0].src}
            alt={g.title}
            className="w-full h-80 object-cover 
                       transition-transform duration-500 
                       group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 
                          flex flex-col justify-end p-6 text-white">
            <h2 className="font-cormorant text-2xl mb-2">{g.title}</h2>
            <p className="text-sm opacity-80">{g.description}</p>
          </div>
        </Link>
      ))}
    </div>
  </div>
)

export default Photography