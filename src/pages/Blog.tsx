import React from 'react';

const Blog: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 pt-20">
      <header className="text-center mb-16">
        <h1 className="font-playfair text-4xl mb-4">Stories & Insights</h1>
        <p className="text-gray-600">Thoughts on photography, technology, and life</p>
      </header>

      <div className="space-y-16">
        {/* Blog post template */}
        <article className="group">
          <div className="aspect-w-16 aspect-h-9 mb-6 overflow-hidden rounded-lg">
            <div className="w-full h-96 bg-gray-100 flex items-center justify-center text-gray-400">
              <img 
                src="https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747608825/za8pbhwgrg2g2wsplb56.jpg" 
                alt="Blog Background" 
                className="w-full h-auto object-cover rounded-sm shadow-md"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <time className="text-gray-500 text-sm">March 15, 2024</time>
            <h2 className="font-playfair text-2xl mt-2 group-hover:text-gray-600 transition-colors">
              Coming Soon...
            </h2>
          </div>
          
          <p className="text-gray-600 mb-4">
            Coming Soon...
          </p>
          
          <a href="#" className="inline-block text-gray-800 hover:text-gray-600 transition-colors">
            Read More →
          </a>
        </article>
      </div>
    </div>
  );
};

export default Blog;