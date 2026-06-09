import { MutableRefObject } from 'react';
import { Photo } from './shared/cloudinaryUtils';

export interface GalleryTemplateProps {
  photos: Photo[];
  title: string;
  description: string;
  onPhotoClick: (index: number) => void;
  imgRefs: MutableRefObject<(HTMLImageElement | null)[]>;
  renderDeferredGrid: boolean;
  captions?: Record<number, string>;
}

export type HeroVariant = 'standard' | 'cinematic' | 'minimal' | 'split';

interface TemplateAssignment {
  hero: HeroVariant;
}

// Every gallery uses the same crop-free justified-rows grid; only the hero
// banner style varies per gallery for a touch of editorial variety.
const assignments: Record<string, HeroVariant> = {
  berlinstreet: 'standard',
  sanfrancisco: 'cinematic',
  alcatrazisland: 'split',
  joshuatree: 'cinematic',
  pachecopass: 'cinematic',
  'sachsenhausen-concentration': 'minimal',
  coffee: 'minimal',
  'nelson-ghost-town': 'split',
  palmspring: 'minimal',
  napavalley: 'standard',
  halfmoonbay: 'cinematic',
  sanfranciscostreet: 'standard',
  architecture: 'split',
  'laguna-beach': 'cinematic',
  santacruz: 'standard',
  ranchosantamargaritalake: 'minimal',
  london: 'cinematic',
  paris: 'split',
  venice: 'cinematic',
  florence: 'minimal',
  rome: 'split',
  barcelona: 'cinematic',
  hawaii: 'minimal',
  orangecounty: 'standard',
  ussmidway: 'cinematic',
  gettymuseum: 'cinematic',
  yosemite: 'cinematic',
  losangeles: 'split',
  redwoodforest: 'split',
  tahoe: 'cinematic',
  mammothlake: 'minimal',
  film: 'split',
  carmelbythesea: 'cinematic',
  tokyo: 'cinematic',
  taiwan: 'cinematic',
};

export function getTemplateAssignment(slug: string): TemplateAssignment {
  return { hero: assignments[slug] ?? 'standard' };
}
