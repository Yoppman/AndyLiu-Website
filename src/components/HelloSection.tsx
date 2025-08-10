import React from 'react';

const HelloSection: React.FC = () => {
  return (
    <section className="relative min-h-[calc(120vh-7rem)] lg:min-h-[calc(100vh-7rem)] xl:min-h-[calc(90vh-7rem)] bg-transparent flex items-center justify-center mb-16 z-20">
      <div className="text-center relative z-20">
        <h1 className="text-32xl md:text-5xl lg:text-6xl font-cormorant text-white relative z-20">
          Welcome To My Journey
        </h1>
      </div>
    </section>
  );
};

export default HelloSection;
