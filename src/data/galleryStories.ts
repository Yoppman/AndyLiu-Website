// Poetic, travel-narrative copy shown alongside each gallery.
// Keyed by gallery `slug`. Everything is optional — galleries without an entry
// simply render no intro/captions. Safe to edit by hand.
//
// - intro:    a short poetic opener (2-4 sentences) shown below the hero.
// - meta:     a quiet location/context line above the intro.
// - signoff:  an optional closing line shown after the grid.
// - captions: prose for select photos, keyed by their index in the gallery's
//             `photos` array (0-based). Only a few photos need one — they
//             render BESIDE the photo as a storytelling beat.

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
      0: 'The first frame is always a held breath. The water has not yet decided whether to be sky or stone, and for one long second neither have I.',
      13: 'A reflection patient as a monk — the peak and its echo folded along the seam of the shore. Stand still long enough and you stop being able to tell which one is the original.',
      22: 'The geese keep their own hours, indifferent to mine. They have learned what the lake already knows: that the morning will keep, that there is no need to hurry through anything this gentle.',
      31: 'Light comes down the hillside in slow degrees, the way warmth returns to your hands. By the time it reaches the water it has forgotten it was ever in a rush.',
    },
  },

  alcatrazisland: {
    meta: 'Alcatraz Island · San Francisco Bay',
    intro:
      'A mile and a half of cold water did the work of any wall. The Rock keeps its silences in the peeling paint and the long corridors, where the bay light comes in sideways and the city glitters just close enough to feel like part of the sentence.',
    signoff:
      'The ferry pulls away and the island shrinks to a rumor — a gull, a lighthouse, a story the fog is still trying to finish.',
    captions: {
      0: 'You arrive the only way anyone ever did: by boat, watching the city refuse to come any closer.',
      14: 'Paint surrenders to salt one flake at a time. The island is slowly handing itself back to the weather.',
      28: 'A cell is just a small room until you notice the door only locks from the outside.',
      42: 'Even here, gardens. Someone needed something to tend — some proof that things could still be coaxed into bloom.',
      56: 'The bay does all the guarding now. Beauty, it turns out, makes a patient and thorough warden.',
      70: 'Rust keeps the calendar the clocks long ago gave up on.',
    },
  },

  architecture: {
    meta: 'Built Form · Lines & Light',
    intro:
      'Buildings are arguments made in concrete and glass — about how we should live, where the light should fall, what we are willing to hold up against the sky. I photograph the moments they forget to be useful and become pure geometry.',
    signoff:
      'Look up often enough and the city rearranges itself into something close to music.',
    captions: {
      0: 'Every façade is a face that has decided exactly how much it will reveal.',
      12: 'Light is the one tenant that never pays rent and never leaves a room unchanged.',
      24: 'Repetition, held long enough, becomes rhythm — the quiet percussion of windows.',
    },
  },

  berlinstreet: {
    meta: 'Berlin · On the Street',
    intro:
      'Berlin wears its history without apology — old scars beside fresh paint, the future arriving on a bicycle. On the street nothing is staged and everything is true for exactly one frame.',
    signoff:
      'The city moves on, indifferent and alive, and I am grateful to have stood in its current for an afternoon.',
    captions: {
      0: 'Street photography is mostly patience wearing the costume of luck.',
      14: 'A wall that once divided a world now just holds up a stranger’s spray-painted joke. Time has its own sense of humor.',
      28: 'Strangers, briefly composed into meaning, then gone before they ever knew they were a photograph.',
      42: 'The afternoon light in Berlin is the color of weak tea and old film — forgiving to everyone it touches.',
      54: 'Every doorway is a small theater caught between acts.',
    },
  },

  coffee: {
    meta: 'Coffee · A Small Ritual',
    intro:
      'Before the day asks anything of me, there is this: water, heat, the slow bloom of grounds, the patience of a pour. A good cup of coffee is the shortest pilgrimage I know.',
    signoff:
      'The cup empties, the day begins. The ritual asks only that you come back to it tomorrow.',
    captions: {
      0: 'Steam is the first language the morning is willing to speak.',
      7: 'Bitter, then warm, then gone — coffee rehearses the whole arc of attention in a single cup.',
    },
  },

  halfmoonbay: {
    meta: 'Half Moon Bay · California Coast',
    intro:
      'The Pacific does not perform for anyone; it simply arrives, again and again, against the cliffs. I came to watch the fog negotiate with the light and lost the whole afternoon to the sound of it.',
    signoff:
      'The tide carries the day back out with it, and the coast forgets I was ever standing here.',
    captions: {
      0: 'The horizon is the one line the ocean never crosses, no matter how hard it leans.',
      12: 'Fog is the coast’s way of asking you to slow down and trust your other senses.',
      24: 'Each wave is a sentence the sea has said a billion times and somehow still means.',
      34: 'Salt air rewrites everything it touches, gently, into something weathered and honest.',
    },
  },

  joshuatree: {
    meta: 'Joshua Tree · High Desert',
    intro:
      'The desert keeps almost nothing and forgets almost everything, which is why the few things that endure here — the twisted trees, the patient rock — seem to carry so much meaning. After dark the sky lowers itself close enough to touch.',
    signoff:
      'I leave the desert the way everyone does: a little emptier, a little clearer, dusted in its pale and ancient light.',
    captions: {
      0: 'A Joshua tree is a prayer the desert has been holding for a thousand years.',
      15: 'Heat makes the distance shimmer, as if the horizon were still deciding whether to stay.',
      30: 'Rock does its thinking slowly — in increments of weather, erosion, and ten thousand quiet years.',
      45: 'Out here your own smallness arrives as a relief instead of a fear.',
      58: 'When the sun goes the cold comes fast, and the stars come faster still.',
    },
  },

  'laguna-beach': {
    meta: 'Laguna Beach · Southern California',
    intro:
      'Laguna keeps its coves like secrets the tide will only tell at the right hour. The light here is unembarrassed — gold on the water, blue in the shadows, the whole coast lit like a long held note.',
    signoff:
      'The sun lowers itself into the sea, and for a moment the entire town turns the color of a good memory.',
    captions: {
      0: 'Some coastlines you simply visit; this one you keep finding yourself returning to.',
      10: 'The water trades colors with the sky all day and never once repeats itself.',
      19: 'Golden hour in Laguna is less a time of day than a temperament.',
    },
  },

  napavalley: {
    meta: 'Napa Valley · Wine Country',
    intro:
      'The valley measures time in seasons and vintages, in the slow patience of the vine. I drove its back roads with the windows down, chasing the particular gold that settles over the rows in the late afternoon.',
    signoff:
      'The light goes amber, then rose, then gone — and the valley keeps its long, unhurried promise to begin again.',
    captions: {
      0: 'A vineyard is a calendar you can walk through.',
      13: 'The rows run toward the hills like sentences reaching for a margin.',
      26: 'Everything here is in service of patience — the soil, the seasons, the slow chemistry of waiting.',
      39: 'Afternoon pools in the valley the way wine settles in the bowl of a glass.',
      52: 'Old vines and old roads agree on one thing: there is no hurrying what wants to ripen.',
      65: 'The hills hold the day’s heat the way good company holds a conversation — easily, late into the evening.',
      78: 'Dust on the road, gold on the leaves, the whole valley quietly exhaling.',
      91: 'A barrel is only a place where time is asked, politely, to do its work.',
      104: 'Even the shadows here seem to have been given a little while to age.',
      116: 'The last light leaves the way a welcome guest does — having stayed exactly long enough.',
    },
  },

  'nelson-ghost-town': {
    meta: 'Nelson · Nevada Ghost Town',
    intro:
      'Nelson is what the desert does with our leftovers: a town half-swallowed, its gold long gone, its trucks rusting where they were last useful. The quiet here is not peaceful so much as patient.',
    signoff:
      'The desert is in no hurry. It will take the rest of the town the same way it took the first of it — grain by grain, with all the time in the world.',
    captions: {
      0: 'Rust is just iron remembering it was always going to return to the earth.',
      11: 'Every abandoned thing keeps the exact shape of the moment it was last needed.',
    },
  },

  pachecopass: {
    meta: 'Pacheco Pass · California',
    intro:
      'The pass is a place most people only ever see at seventy miles an hour, on the way to somewhere else. I stopped. The golden hills rolled on without me, indifferent and enormous, exactly as they have since long before there were roads.',
    signoff:
      'I get back on the highway. The hills keep their gold, their wind, and their thousand-year shrug.',
    captions: {
      0: 'California’s hills turn gold in summer the way other places turn green — out of a stubborn honesty about the heat.',
      12: 'A lone oak holds its ground like punctuation in a very long sentence.',
      26: 'The wind here has crossed a hundred empty miles and is in no mood to stop now.',
    },
  },

  palmspring: {
    meta: 'Palm Springs · California Desert',
    intro:
      'Palm Springs is a mirage that decided to stay: clean modern lines against bare mountains, blue pools in a place that has no business having any. It is the desert dressed for cocktails, and somehow it works.',
    signoff:
      'The mountains turn pink, the pool lights flicker on, and the desert pretends — beautifully — that it was always meant to be this gentle.',
    captions: {
      0: 'A single palm against a clean sky is the whole town’s mood in one line.',
      11: 'Mid-century walls were built to frame the light, and the light has never once declined the invitation.',
      21: 'Even the heat here feels quietly art-directed.',
    },
  },

  'sachsenhausen-concentration': {
    meta: 'Sachsenhausen · Memorial, Oranienburg',
    intro:
      'Some places are not visited so much as witnessed. I made these photographs quietly, aware that a camera can document but never comprehend what was done here. They are offered as remembrance, not as art.',
    signoff:
      'We walk out through the same gate that so many could not. The only fitting response is to remember — and to refuse, always, to let it happen again.',
    captions: {
      0: 'The gate still carries its lie in wrought iron. We read it now as the warning it always was.',
      18: 'Numbers fail here. Each was a person — a name, a life that should have been long, and was not.',
      34: 'Stillness is the only honest language this ground will answer to.',
    },
  },

  sanfrancisco: {
    meta: 'San Francisco · California',
    intro:
      'San Francisco is a city built on fog and nerve, climbing hills it had no business climbing, throwing a bridge across a strait the wind already owned. I never tire of the way it appears and disappears in the same afternoon.',
    signoff:
      'The fog rolls back over the hills, the lights come up, and the city folds itself away for the night like a letter you already know you’ll want to read again.',
    captions: {
      0: 'The city introduces itself in fog and trusts you to fill in the rest.',
      14: 'Every hill is a promise that the view will be worth the climb.',
      28: 'The bridge does not so much cross the strait as dare it.',
      44: 'Light here is forever negotiating with the fog, and neither one ever wins for long.',
    },
  },

  'San Francisco Street': {
    meta: 'San Francisco · On the Street',
    intro:
      'Away from the postcards, the real city happens on the sidewalk — in the steam off a vendor’s cart, the slant of light down a side street, the small human dramas that resolve before you can name them. I only try to be ready.',
    signoff:
      'The street empties and fills, empties and fills. You could photograph it forever and never once catch the same city twice.',
    captions: {
      0: 'The street rewards the patient and quietly ignores the hurried.',
      14: 'A good frame on the street is a coincidence you were prepared to deserve.',
      28: 'A city is just a few million private lives agreeing, briefly, to share a corner.',
      42: 'Light keeps finding the most ordinary moments and making a case for them.',
      56: 'Everyone is the main character of a story you will only ever see a single frame of.',
      66: 'The city saves its best moments for those still looking after the crowds have gone home.',
    },
  },

  santacruz: {
    meta: 'Santa Cruz · California Coast',
    intro:
      'Santa Cruz runs on salt and nostalgia — the rattle of the old boardwalk, the patience of surfers reading the water, the fog that shows up each morning like a regular customer. It is a town that has made an art of not being in a hurry.',
    signoff:
      'The last light catches the pier, the surfers paddle in, and the town settles into the easy dark it has always preferred.',
    captions: {
      0: 'The coast here smells of salt and cotton candy and something a lot like memory.',
      12: 'Surfers and herons keep the same vigil, reading the same water for nearly the same reasons.',
      24: 'The boardwalk has been selling the same small joys for a hundred years and still means every one of them.',
    },
  },
};
