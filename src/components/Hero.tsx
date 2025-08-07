import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="pt-10 min-h-[calc(100vh-5rem)] lg:min-h-[calc(80vh-5rem)] xl:min-h-[calc(70vh-5rem)] bg-[#f4f4f3]">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-12">
          <div className="md:w-1/2 mb-10 md:mb-0 flex items-center justify-center">
            <img 
              src="https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747458978/DSCF1810_scyqvo.jpg" 
              alt="Portrait of Andy Liu" 
              className="w-full max-w-md h-auto object-cover rounded-sm shadow-md"
            />
          </div>
          
          <div className="md:w-1/2 px-4">
            <div className="flex items-center mb-8">
              <p className="text-2xl font-cormorant mr-10">Hello,</p>
              <div className="w-2/3 h-px bg-gray-400"></div>
            </div>
            
            <h1 className="font-cormorant text-4xl md:text-3xl lg:text-6xl leading-relaxed mb-8 mt-6">
              <div className="mb-2">I <strong className="font-semibold">shoot streets</strong></div>
              <div className="mb-2">I <strong className="font-semibold">brew beans</strong></div>
              <div className="mb-2">I <strong className="font-semibold">dance to the beat</strong></div>
              <div className="mb-4">I <strong className="font-semibold">debug life</strong></div><br/>
              <em className="font-normal italic block">Life’s too short not to enjoy every frame, flavor, and freestyle.</em>
            </h1>
            
            <p className="text-4xl text-gray-500 animate-bounce mt-10">↓</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;