import { MutableRefObject } from 'react';
import { Photo } from './shared/cloudinaryUtils';

export interface GalleryTemplateProps {
  photos: Photo[];
  title: string;
  description: string;
  onPhotoClick: (index: number) => void;
  imgRefs: MutableRefObject<(HTMLImageElement | null)[]>;
  renderDeferredGrid: boolean;
}

export type TemplateName =
  | 'editorial'
  | 'cinematic'
  | 'intimate'
  | 'mosaic'
  | 'diptych'
  | 'scattered';

export type HeroVariant = 'standard' | 'cinematic' | 'minimal' | 'split';

interface TemplateAssignment {
  template: TemplateName;
  hero: HeroVariant;
}

const assignments: Record<string, TemplateAssignment> = {
  'berlinstreet':                  { template: 'editorial',  hero: 'standard' },
  'sanfrancisco':                  { template: 'editorial',  hero: 'cinematic' },
  'alcatrazisland':                { template: 'editorial',  hero: 'split' },
  'joshuatree':                    { template: 'cinematic',  hero: 'cinematic' },
  'pachecopass':                   { template: 'cinematic',  hero: 'cinematic' },
  'sachsenhausen-concentration':   { template: 'cinematic',  hero: 'minimal' },
  'coffee':                        { template: 'intimate',   hero: 'minimal' },
  'nelson-ghost-town':             { template: 'intimate',   hero: 'split' },
  'palmspring':                    { template: 'intimate',   hero: 'minimal' },
  'napavalley':                    { template: 'mosaic',     hero: 'standard' },
  'halfmoonbay':                   { template: 'mosaic',     hero: 'cinematic' },
  'sanfranciscostreet':            { template: 'mosaic',     hero: 'standard' },
  'architecture':                  { template: 'diptych',    hero: 'split' },
  'laguna-beach':                  { template: 'diptych',    hero: 'cinematic' },
  'santacruz':                     { template: 'scattered',  hero: 'standard' },
  'ranchosantamargaritalake':      { template: 'scattered',  hero: 'minimal' },
};

const defaultAssignment: TemplateAssignment = { template: 'editorial', hero: 'standard' };

export function getTemplateAssignment(slug: string): TemplateAssignment {
  return assignments[slug] ?? defaultAssignment;
}
