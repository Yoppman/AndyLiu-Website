// src/data/galleries.ts
export interface PhotoEntry {
    src:         string
    orientation: 'horizontal' | 'vertical';
    dominantColor: string; // e.g. 'rgba(176,172,168,0.2)'
    lightroom?: boolean | 0 | 1;
  }
  
  export interface Gallery {
    slug:        string
    title:       string
    description: string
    photos:      PhotoEntry[]
    hero?: PhotoEntry; // Optional custom hero image
  }