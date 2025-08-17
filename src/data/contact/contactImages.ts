// src/data/contact/contactImages.ts

export interface ContactInfo {
  type: 'email' | 'phone';
  label: string;
  value: string;
  href: string;
}

export interface TestimonialData {
  quote: string;
  name: string;
  designation: string;
  src: string;
}

export interface LocationInfo {
  city: string;
  state: string;
  availability: string;
}

export interface ContactData {
  title: string;
  contactInfo: ContactInfo[];
  location: LocationInfo;
  testimonials: TestimonialData[];
}

export const contactImages = [
  "https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747780923/DSC03231_lh0bqs.jpg",
  "https://res.cloudinary.com/duo70zkqx/image/upload/a_90/personal/dsc08978.jpg",
  "https://res.cloudinary.com/duo70zkqx/image/upload/v1755454762/personal/dscf2311.jpg",
  "https://res.cloudinary.com/duo70zkqx/image/upload/a_-90/personal/dscf4682.jpg",
  "https://res.cloudinary.com/duo70zkqx/image/upload/v1755454766/personal/dscf2573.jpg",
  "https://res.cloudinary.com/dlfmzlwp6/image/upload/v1747458978/DSCF1810_scyqvo.jpg",
];

export const contactData: ContactData = {
  title: "Let's Connect!",
  contactInfo: [
    {
      type: 'email',
      label: 'Personal Email',
      value: 'andy9998811@gmail.com',
      href: 'mailto:andy9998811@gmail.com'
    },
    {
      type: 'email',
      label: 'School Email',
      value: 'chiadal@uci.edu',
      href: 'mailto:chiadal@uci.edu'
    },
    {
      type: 'phone',
      label: 'Phone',
      value: '+1 (213) 834-3805',
      href: 'tel:+12138343805'
    }
  ],
  location: {
    city: 'Irvine',
    state: 'California',
    availability: 'Available for Coffee Chat!'
  },
  testimonials: [
    {
      quote: "Exploring the world through light and shadow.",
      name: "Laguna Beach",
      designation: "Personal series",
      src: contactImages[0]
    },
    {
      quote: "Photography lets me slow down and pay attention.",
      name: "Berlin Street",
      designation: "Personal series",
      src: contactImages[1]
    },
    {
      quote: "Every image is a conversation with the scene.",
      name: "Architecture",
      designation: "Personal series",
      src: contactImages[2]
    },
    {
      quote: "I'm always seeking the story behind the scene.",
      name: "Nature",
      designation: "Personal series",
      src: contactImages[3]
    },
    {
      quote: "Details reveal themselves when you take your time.",
      name: "Portraits",
      designation: "Personal series",
      src: contactImages[4]
    },
    {
      quote: "123Details reveal themselves when you take your time.",
      name: "1234",
      designation: "Personal series",
      src: contactImages[5]
    }
  ]
};