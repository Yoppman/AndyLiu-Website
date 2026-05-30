// Poetic, travel-narrative copy shown alongside each gallery.
// Keyed by gallery `slug`. Everything is optional — galleries without an entry
// simply render no intro/captions. Safe to edit by hand.
//
// - intro:    a short poetic opener (2-4 sentences) shown below the hero.
// - meta:     a quiet location/context line above the intro.
// - signoff:  an optional closing line shown after the grid.
// - captions: prose for select photos, keyed by their index in the gallery's
//             `photos` array (0-based). Only a few photos need one.

export interface GalleryStory {
  meta?: string;
  intro?: string;
  signoff?: string;
  captions?: Record<number, string>;
}

export const galleryStories: Record<string, GalleryStory> = {
  ranchosantamargaritalake: {
    meta: 'Rancho Santa Margarita · California',
    intro:
      'Some mornings the lake forgets that it is water and becomes a mirror for the hills. I came for the birds and stayed for the stillness — the particular quiet that pools at the edge of small towns, where the mountains lean in close to study their own reflection.',
    signoff:
      'By noon the wind returns, the mirror breaks into a thousand bright pieces, and the birds lift off as if they had only been waiting for the spell to end.',
    captions: {
      0: 'The first frame is always a held breath — the water still deciding whether to be sky or stone.',
      2: 'Red tile, palm frond, borrowed mountain. California rehearsing its own postcard.',
      13: 'A reflection patient as a monk: the peak and its echo, folded along the seam of the shore.',
    },
  },
};
