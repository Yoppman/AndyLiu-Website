// src/data/galleries/index.ts
import type { Gallery } from '../types/galleries'

// // man ual imports (easy, type‑safe, no magic):
// import LagunaBeachGallery from './LagunaBeachGallery'
// import BerlinStreetGallery from './BerlinStreetGallery'
// // import MoreGallery from './moreGallery'

// export const galleries: Gallery[] = [
//   LagunaBeachGallery,
//   BerlinStreetGallery,
//   // MoreGallery,
// ]

const modules = import.meta.glob<{ default: Gallery }>('./*.ts', { eager: true })
export const galleries = Object.values(modules).map(m => m.default)