import React from 'react';

interface QuoteProps {
  /** URL of the background image */
  imageSrc: string;
  /** Main quote text */
  text: string;
  /** Optional attribution */
  author?: string;
  /** Optional height (defaults to 600px) */
  heightClassName?: string;
}

const Quote: React.FC<QuoteProps> = ({
  imageSrc,
  text,
  author,
  heightClassName = 'h-[600px]',
}) => {
  return (
    <section className={`relative ${heightClassName} bg-white`}>
      <div className="h-full">
        <img
          src={imageSrc}
          alt="Quote background"
          className="w-full h-full object-cover"
        />
      </div>

      <div
        className="
          absolute 
          right-0 
          top-1/2 
          transform 
          -translate-y-1/2 
          translate-x-[-30px] 
          bg-white 
          p-8 
          shadow-lg 
          max-w-[500px] 
          mx-6
        "
      >
        <p className="font-playfair text-2xl italic leading-relaxed">
          “{text}”
        </p>
        {author && (
          <p className="mt-4 text-right font-semibold">— {author}</p>
        )}
      </div>
    </section>
  );
};

export default Quote;