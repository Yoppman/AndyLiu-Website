import React from 'react';
import { Mail, Phone } from 'lucide-react';
import ImageSlideshow from '../components/ImageSlideshow'; // adjust path as needed
import { contactImages } from '../data/contact/contactImages';

const Contact: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 pt-24">
      <div className="flex flex-col md:flex-row gap-12">
        <div className="md:w-1/2">
          <ImageSlideshow images={contactImages} />
        </div>
        
        <div className="md:w-1/2">
          <h1 className="font-cormorant text-4xl mb-8">Let's Connect!</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="font-cormorant text-2xl mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail size={20} />
                  <div>
                    <p className="font-medium">Personal Email</p>
                    <a href="mailto:personal@email.com" className="font-playfair text-lg tracking-wide text-gray-600 hover:text-gray-900 transition-colors">
                      andy9998811@gmail.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail size={20} />
                  <div>
                    <p className="font-medium">School Email</p>
                    <a href="mailto:chiadal@uci.edu" className="font-playfair text-lg tracking-wide text-gray-600 hover:text-gray-900 transition-colors">
                      chiadal@uci.edu
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone size={20} />
                  <div>
                    <p className="font-medium">Phone</p>
                    <a 
                      href="tel:+12138343805" 
                      className="font-playfair text-lg tracking-wide text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      +1 (213) 834-3805
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="font-cormorant text-2xl mb-4">Location</h2>
              <p className="text-gray-600">Based in Irvine, California</p>
              <p className="text-gray-600">Available for Coffee Chat!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;