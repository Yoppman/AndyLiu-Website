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
  gettymuseum: {
    meta: 'The Getty · Stone & Sunset',
    intro:
      'The Getty sits on its hill like something Los Angeles dreamed of being — all white travertine and clean right angles, a temple to art that quietly upstages most of the art inside it. A little tram lifts you up out of the traffic and the city falls away beneath you; by the time you reach the top you have half-forgotten there is a freeway down there at all. Inside hang the Rembrandts and the gold-framed gods. But the masterpiece, everyone secretly agrees, is mounted outside, and it is repainted every single evening: the sun going down over the whole basin of the city, the haze turning to rose and then to fire, the pale stone catching the last of it as though it had been built for precisely this. I have seen a great many sunsets. This is the one I would hang in the gallery.',
    signoff:
      'They let you in for free, which feels like a trick until you understand that the city is the price — you pay in the climb, in the light, in the having-to-leave. The tram carries you back down into an ordinary evening, and the whole way you keep glancing back, the way you do at anything you are not finished loving.',
    captions: {
      0: 'Up here the first thing you notice is the stone — some sixteen thousand tons of travertine, cut to show the fossils, the whole hill quietly insisting that this, too, is a kind of permanence.',
      8: 'The tram lifts you up out of the traffic and the city lets go of you by degrees. Halfway up you stop checking your phone; you will not be needing it for a while.',
      16: 'Richard Meier drew the place in white and right angles, then let the California light do the colouring. By afternoon the walls are the colour of cream, by dusk of apricot, by dark of candlelight.',
      24: 'The garden is an argument the architect lost and the city won — soft curves and aloe and running water set down in the middle of all that geometry, proof that even a temple needs something that grows.',
      32: 'And then the view. The whole basin of Los Angeles laid out below, the freeways drawing their slow rivers of light, the haze going gold and then rose — the city at its most forgivable, seen from just far enough away.',
      40: 'Inside, the gods carry on in their gilded frames, lit low and reverent. But the galleries thin out toward evening, everyone drifting, helplessly, back toward the windows.',
      48: 'By the time the sky catches fire the terraces fill with strangers standing very still, phones down for once, watching the day perform the one trick no museum will ever hang on a wall.',
      56: 'The stone holds the warmth a little longer than the air does, the way good days do — you can feel it leaving, and you stay anyway, precisely for the leaving.',
      64: 'You come for the art and you leave talking about the light. The Getty does not mind. It has known all along which of its masterpieces was the real one.',
    },
  },

  orangecounty: {
    meta: 'Orange County · With My Father',
    intro:
      'Some trips you take for the place, and some for the person beside you; this one was the second kind. My father and I drove down to the coast with no real plan — a fishing pier, a long quiet beach, a kids’ soccer game we half-watched as the sun went down. We did not say much that needed saying; we rarely do, the two of us, but I have come to understand that the quiet is its own kind of conversation. What I remember is the light — that gold California-afternoon kind — and the plain comfort of being unhurried beside someone you have known your whole life. These are not the photographs of a destination. They are a few good days I would like to keep.',
    signoff:
      'He is in almost none of these frames, and in all of them. You spend your whole childhood looking up at your father; it sneaks up on you, the afternoon you realize you are finally standing beside him, watching the same sea.',
    captions: {
      0: 'The coast does not change much, and that is rather the point of it. You come back with your father and the same gold light is waiting, patient as it ever was.',
      8: 'An empty beach in the late afternoon, the sand combed by no one, the sea doing its slow and ancient work. Some days the entire itinerary is just: be here, together, a while.',
      16: 'Men stand along the pier with their lines in the water, in no hurry to catch a thing. Fishing, I have learned from my father, is mostly an excuse to stand quietly beside someone and call it a plan.',
      24: 'The boardwalk runs straight into the haze, porch after porch of other people’s summers. We walked it slowly, the way you do when there is nowhere else you would rather be.',
      32: 'I caught a silhouette in the glass, looking out to sea, and could not tell for a second whether it was him or me. We are beginning, lately, to stand the same way.',
      40: 'A kids’ game under the early lights, the sun going down behind the goal. My father watched it the way he used to watch mine — leaning forward, quietly hoping, for strangers now.',
      48: 'The light goes, the way it always does, and you drive home tired and sunburnt and somehow full. Not every good day announces itself. Most of them look exactly like this one.',
    },
  },

  ussmidway: {
    meta: 'USS Midway · San Diego Bay',
    intro:
      'An aircraft carrier is a city that goes to war — four acres of steel that once carried five thousand lives and the machines they flew. The Midway is retired now, moored in San Diego Bay, and you walk its decks the way you walk a cathedral: quietly, looking up, aware you are inside something built for a purpose larger and harder than yourself. Every rivet is someone’s long day; every cramped bunk, someone’s year away from home. I came as a tourist and left a little sobered. History is easy to read about and strange to stand on — to grip the same cold rail a thousand sailors gripped, and feel how near the past really is.',
    signoff:
      'The jets sit silent on the deck now, wings folded, pointed at a skyline instead of a horizon. It is a good thing, a warship turned into a place where children run and ask their grandfathers what it was like. Some monuments are built to remember a war; the best of them are built so we remember the people.',
    captions: {
      0: 'From the dock it reads less like a ship than a building that escaped to sea. You crane your neck and still cannot take it all in — which is, perhaps, the first thing it means to teach you.',
      8: '“The engine that won the war,” the placard says, opened up like an anatomy lesson. We forget how much of history was, in the end, very good machines tended by very tired people.',
      16: 'A pilot stands frozen in his flight gear, helmet on, forever about to launch. Behind him the bay sparkles, peaceful and ordinary — the exact thing all that steel was ever for.',
      24: 'Five thousand people lived in these corridors, slept stacked three high, crossed oceans in a windowless city. The deck you wander in an afternoon was someone’s entire world for a year.',
      32: '“The War Is Over,” a wall announces in red — and you stand there doing the quiet arithmetic of everyone for whom it came too late, or not at all.',
      40: 'Up on the bridge the light comes in gold across the chart table, the city shining through the glass where the open sea used to be. The old warrior has been handed the gentlest retirement there is: to sit in the sun, and be remembered.',
    },
  },

  hawaii: {
    meta: 'Honolulu · Aloha & Farewell',
    intro:
      'Aloha means both hello and goodbye, and Honolulu is where I finally understood why — that the same warm word can open a door and close it, that arriving and leaving are sometimes only one wave, seen from different shores. I came here at the beginning of something, and the island has kept it for me ever since: the green hush of the valleys, the tide working patiently at the sand, the particular blue the sky turns just before the dark. Not every story you carry home is a happy one. But the sea keeps no score — it takes what you give it and hands back something smoother, and you learn, in time, to call that growing. These frames are not sad. They are only honest, the way the ocean is.',
    signoff:
      'The island never asks you to forget. It just shows you the tide going out and coming back, out and back, until you understand that letting go and holding on are the same motion, practiced over a whole life. I left lighter than I arrived. That, too, is a kind of aloha.',
    captions: {
      0: 'Aloha is the first word you learn here and the last one you understand. It meets you at the airport and waits, patiently, for the end of the trip to explain itself.',
      9: 'Evening comes to the island slowly, the way good news and bad news both do — the palms going to silhouette, the blue deepening, the day in no hurry at all to be over.',
      18: 'Hawaiʻi wears its sweetness lightly: a surfboard menu, a rack of pineapples, a kid with a backpack, the whole place smelling faintly of sunscreen and plumeria.',
      27: 'The old dances are still danced, the old stories still shouted up at the rafters. Some things the island simply refuses to let the ocean take.',
      36: 'Inland the green is almost violent, the mountains pleated like something just unfolded. You drive up into it and feel, briefly, very small and very forgiven.',
      45: 'From the cliffs the reef draws its pale lines on the blue, and the horizon does the one thing horizons are for — reminding you the world keeps going, with or without your permission.',
      54: 'Somewhere on this beach two people once stood at the edge of the water while the tide quietly erased their footprints, and the island let it. Not everything is meant to be kept — only, for a little while, held.',
      63: 'An ordinary evening, the sea going dark beyond the glass. Some of the most important nights of your life only look important later — in the photograph, in the quiet, in the missing.',
      72: 'The tide goes out as far as it came in. I used to think that was loss; the ocean has been trying, my whole life, to teach me it is just the other half of arriving.',
      81: 'You do not get over a place like this. You grow around it — the way a palm leans into the very wind that bent it, and goes on being a palm.',
    },
  },

  barcelona: {
    meta: 'Barcelona · Gaudí & the Blue Hour',
    intro:
      'Barcelona is a city Gaudí dreamed and the sea agreed to. The stone melts into curves, the cathedrals grow like coral, and nothing — not a lamppost, not a doorknob — was ever content to be merely straight. But the thing I came home unable to describe was the light: one evening by the water the whole sky turned a blue I still have no honest word for, deeper than dusk and softer than night, and it held, and held, as if the day could not quite bear to end. I have chased blue hours on three continents. That one ruined me for all the others.',
    signoff:
      'They say Gaudí left his cathedral unfinished on purpose — that a thing this beautiful should never be entirely done. I have come to think the blue hour works the same way: it ends only so it can promise to come back. I am already planning the trip that will let me stand inside it again.',
    captions: {
      0: 'Barcelona meets you mid-stride — all boulevard and balcony, the smell of the sea two streets over. You are walking in it before you have quite decided to.',
      16: 'The old quarter stacks its iron balconies and trailing plants up into the light, every façade a small argument for living a little higher off the ground.',
      32: 'The city does not perform for you so much as let you join in. Within an hour you are part of the very crowd you came to photograph.',
      48: 'Even the art here is made of a thousand small lives pressed together and lit from within — which is, come to think of it, exactly what the city is.',
      64: 'Gaudí built houses that look grown rather than made, as though he planted a seed and then argued with it for forty years.',
      80: 'The Sagrada Família is still rising, cranes and all — a cathedral that has already outlived its architect and means to outlive us too. Some prayers are built in stone precisely because they take longer than a life.',
      100: 'Inside, the windows do not show you saints; they simply turn the afternoon into colour and pour it over you. I forgot, for a while, to take the picture.',
      120: 'Not a straight line in the place — door, tile, banister, all of it curving as if the house were still mid-breath.',
      140: 'Look straight up through the stone and the sky becomes a held shape, the building cupping its small ration of blue like something it intends to keep.',
      160: 'And then, at the end of every Gaudí fever-dream, the Mediterranean: flat and patient and a little bored of being beautiful, the oldest thing in a city obsessed with the new.',
      180: 'Here it is — the reason for the whole trip. The evening the sky let go of the sun and turned, slowly, the most impossible blue. I stood on the sand and forgot to breathe, certain I would never see its equal, and I have not.',
      200: 'A single sail, a rising moon, a sky going from peach to violet to that blue. The day signed its name and left without a sound.',
      220: 'Between the landmarks, the small Barcelona — a shutter half-open, a cat asleep on warm tile, a balcony holding someone’s entire afternoon.',
      240: 'After dark the city gives back the warmth the stone gathered all day, slowly, the way you return a held hand.',
      260: 'Up close, the famous mosaics are only broken crockery and stubbornness; step back and they become the sky. Barcelona is forever asking you to step back.',
      280: 'I keep returning, in memory, to that one blue hour by the water — proof that a place can hand you a few minutes you will spend the rest of your life trying to deserve.',
    },
  },

  rome: {
    meta: 'Rome · Ruin & Gold',
    intro:
      'Rome does not do humility. It piles empire on empire and leaves the ruins where they fell, because what is three thousand years to a city that invented the idea of forever? You turn a corner and there is the Colosseum, casual as a parked car; you step through a bronze door and the sky is suddenly a hole in a temple older than your whole country. I have loved a few cities — Rome is the one that loves itself enough not to need me, and somehow that only made me fall harder.',
    signoff:
      'There is a show that packs its heroine off from Paris to Rome for the better backdrops — a Vespa, a stylist, a romance lit like a perfume ad. Standing here I finally understood the impulse: Rome is so shamelessly cinematic that real life starts to feel like product placement. Emily got the wardrobe; I got blisters, a gelato down my sleeve, and the oldest sky in the world pouring through a hole in a roof. Reader, I would take the blisters every time.',
    captions: {
      0: 'You come around the hill and there it is — the Colosseum, twenty centuries old and still the biggest thing in the room. Rome introduces itself the only way it knows how: by winning.',
      11: 'Inside, the arena lies open like an exposed nerve, all tunnels and cages and machinery. Even the cruelty here was engineered to last.',
      22: 'Brick under marble under grass, layer beneath layer. In Rome the ground is simply history that has not been excavated yet.',
      33: 'The cypresses stand guard like dark green exclamation points, and the ruin glows behind them — proof that Rome can upstage even its own trees.',
      44: 'A baroque church grew straight out of a pagan temple, columns and all. Rome never demolishes; it just builds the next belief on top of the last one.',
      56: 'At dusk the domes float over the rooftops and the swifts come out to write something illegible across the sky. The city has been beautiful so long it no longer checks whether anyone is watching.',
      70: 'The light here is the colour of old gold leaf, and it makes a liar of every photograph — nothing you carry home is ever as warm as the hour you stood in.',
      84: 'Everyone climbs the famous steps to sit and watch everyone else climb the famous steps. Rome turns even loitering into a kind of theatre.',
      98: 'Through the bronze doors the Pantheon waits, and then you see it: the sky itself, falling in one slow shaft through a hole left open for nineteen hundred years. Some rooms you do not photograph — you just take off your hat.',
      112: 'Between the monuments, the ordinary Rome: a fountain nobody named, a wall the colour of a peach, a cat asleep on a Caesar. The miraculous, off the clock.',
      128: 'You do not see Rome so much as get adopted by it for a few days — fed, dazzled, gently put in your place. I have rarely been so happy to be made to feel small.',
    },
  },

  florence: {
    meta: 'Florence · Gold & Shadow',
    intro:
      'Florence does not show you everything at once — it is a city of held breath and lowered voices, of treasures kept behind heavy doors and faces half-turned in the lamplight. By day the Duomo blazes; by night the alleys close around you like a confidence, and you feel the centuries watching from behind the shutters. Every wall here has been keeping a secret since the Medici, and is in no hurry to tell you. I came for the Renaissance and stayed for the shadows — the mystery, it turns out, is the point.',
    signoff:
      'I left with the feeling of having been let in on something without ever being told what — which is, I think, exactly how Florence prefers to be loved: a little in the dark, and grateful for it.',
    captions: {
      0: 'Florence greets you in code — a blaze of marble at the end of a dim street, gone the instant you look away, as if the city were testing whether you can be trusted with the rest.',
      10: 'Beneath the frescoes, a delivery rider idles at a red light. Six centuries of genius, and the city wears them like an old coat: warm, unbothered, faintly ironic.',
      20: 'The alleys keep their own counsel. They narrow until the sky is a rumour, then open without warning onto something that stops your heart — a secret is always smaller than the room it was kept in.',
      30: 'The Duomo refuses every angle and grants none, too vast for the square and too bright for the eye, a mountain of marble pretending to be a building. You do not photograph it so much as fail to, beautifully.',
      42: 'In the museum the faces wait in their half-light, lit one row at a time, the rest left to the dark on purpose. Florence learned long ago that nothing seduces like what it withholds.',
      55: 'Behind every shutter, the suggestion of a watcher. Here you are never quite alone with the city; the past keeps you company, and does not always announce itself.',
      68: 'An old name carved above a doorway, a café laid for evening, the gold draining slowly off the stone. Florence does its loveliest work in the last hour of light.',
      82: 'The stone is the colour of old honey and older money. Run a hand along it and you can almost feel the ledger of everyone who passed this way before you.',
      96: 'After dark a single basilica catches fire and floats above the rooftops, gold against the black hills — the city lighting one candle and keeping the rest of itself in shadow.',
      110: 'Two figures descend a lamplit stair and are gone. In Florence the night is not empty; it is merely discreet.',
      122: 'The mystery was never in the masterpieces. It is in the doorways they hang behind, the streets that lead there, the patience the city has kept for six hundred years.',
      132: 'You begin to suspect Florence knows something it will not say — and that the not-saying is the most Florentine thing about it.',
    },
  },

  venice: {
    meta: 'Venice · Water & Stone',
    intro:
      'Venice should not exist, and seems to know it — a city poured into the sea on a dare, holding its breath now for a thousand years. The streets are made of water; here you learn to read a place by its reflection first, the way you might come to love someone by their shadow. I arrived expecting a museum and found a living thing instead — salt-eaten, gorgeous, quietly going under, and ringing its bells anyway. Every alley is a sentence that ends in water. I have never wanted so badly to stay lost.',
    signoff:
      'The boat pulled away and Venice did what it does to everyone — pretended not to watch me leave, then settled a little deeper into the lagoon, as if to say the only way to keep a place is to let it go. Of all the cities I have loved, it is the one I am most afraid the tide will take before I find my way back.',
    captions: {
      0: 'You do not arrive in Venice so much as run aground in it: the train ends, the land ends, and there it is — the whole improbable city held up on the water like something the sea is still deciding whether to keep.',
      8: 'The palaces stand to their knees in the tide, their paint peeling like sunburn, lovely in the particular way of things that have made their peace with not lasting.',
      16: 'Here the bus is a boat and the road is a reflection. You spend the first day astonished and the second already taking it for granted — which is, I think, the cruelest and kindest trick the city knows.',
      24: 'A man steers a blue boat down a street that is also a river, ferrying groceries past a thousand years of marble. In Venice the miraculous clocks in for work every morning and never once mentions it.',
      33: 'Every calle promises to lead you somewhere and delivers you instead to water, or to yourself. Getting lost is not a danger here; it is the only honest way to travel.',
      42: 'Even the bell towers lean — tired of standing, leaning the way an old man leans into a story he has told a hundred times and loves no less for it.',
      51: 'They named it the Bridge of Sighs for the last look it gave the condemned. I sighed too, for the opposite reason: too much beauty arriving at once, and nowhere to set it down.',
      60: 'After the rain the stones turn to mirror and the city quietly doubles, until for a moment you cannot tell which Venice is sinking and which is only its reflection, going down at exactly the same rate.',
      68: 'From the top of the campanile the rooftops run red to the edge of sight and dissolve into mist — the whole city a sentence the fog keeps trying, very gently, to finish.',
    },
  },

  paris: {
    meta: 'Paris · Street & Salon',
    intro:
      'Paris has rehearsed beauty for so long it no longer seems to try — the light arrives pearl-grey and forgiving, and even the puddles compose themselves. I walked it the way you reread a book you already half-know by heart: the Louvre’s marble stairs, a square in Montmartre where painters still chase a likeness, an old man and his spaniel keeping a slow appointment with the morning. By evening the Arc puts on its gold and the city remembers it was once an empire. These are the pages I dog-eared.',
    signoff:
      'I came home with more frames than I had days, and the stubborn conviction that Paris is less a place you visit than a light you spend the rest of your life trying to photograph again.',
    captions: {
      0: 'The trip begins the way Paris insists on everything — in marble, and in flattering light. Even the mirror seems to want you at your best.',
      12: 'Morning comes up pearl-grey off the rooftops, the particular silver the city keeps for its early hours, forgiving to stone and stranger alike.',
      24: 'At the top of the great stair she waits — headless, triumphant, her wings still beating after two thousand years. The whole museum seems to climb toward her on purpose.',
      38: 'Room after gilded room, the masters keep their appointments: saints and battles and unbearable light, hung edge to edge as though beauty could simply be filed.',
      52: 'Everyone leans the same direction, phones raised like a quiet congregation. We have always needed somewhere to carry our wonder.',
      66: 'Beneath the arches, two strangers to me promise each other their lives. Paris lends them the set and asks for nothing back.',
      80: 'A man in good tweed walks his spaniel and his phone call down the same cobbles his grandfather might have — dressed, as the city dresses, with careless exactness.',
      95: 'The shutters stay half-closed, the way Paris keeps a little of itself in reserve. Beauty here is a thing overheard, never quite handed to you.',
      110: 'An afternoon dissolves into coffee and watching — the two great Parisian disciplines, neither of which can be hurried.',
      125: 'On the hill the painters still set their easels against the evening, chasing a likeness the camera steals in a hundredth of a second and somehow never quite catches.',
      140: 'Montmartre climbs and turns and forgets where it was going, and you are happy to be lost in the only direction that matters: up.',
      158: 'A doorway, a railing, a single lit window — the small punctuation between monuments, where the actual city quietly lives.',
      176: 'Blue hour comes down like a held chord, and the stone goes from grey to gold in the time it takes to change a lens.',
      196: 'The Arc shoulders its carved victories and its sculpted dead, lit from below until the whole weight of a nation’s memory seems to hover, just slightly, off the ground.',
      216: 'Each night the guard gathers at the flame — plumes and rifles and the old choreography of remembrance. History, it turns out, is something you have to keep doing.',
      235: 'From a high window the city lays out its lit arteries, the Arc a small gold knot at the centre, and you understand at last why they called it the City of Light — not for the lamps, but for the way it refuses to go dark in you.',
    },
  },

  london: {
    meta: 'London · Street & Stone',
    intro:
      'London keeps its centuries stacked in plain sight — Victorian brick leaning on Portland stone, marble gods a short walk from a pizzeria, an ice-cream van parked beneath a slowly turning wheel. I came the way every traveller does, a stranger with a camera, and spent the days learning the particular way the English light forgives a grey afternoon. The city never once looked up at me. These are the frames it left in my hands.',
    signoff:
      'I left with a card full of borrowed light and the sense that the city had barely noticed me at all — which is, I have come to think, exactly how a place lets you love it.',
    captions: {
      0: 'Every trip begins with a stranger in the mirror — the camera raised like a question, the room still deciding whether to let me in.',
      9: 'London hoards its sunlight and then spends it all at once, low and gold down a single street, as if the whole city had leaned west to catch the last of the afternoon.',
      18: 'The brick here remembers more than I ever will. A century of weather is written into every reddened seam, patient as a ledger no one reads.',
      28: 'Iron gates gilded at the tips, guarding nothing now but the old habit of grandeur. The city keeps its manners long after it has forgotten why.',
      38: 'In the museum the gods wait in their marble, having outlasted every empire that came to admire them. You photograph them the way you would whisper in a library.',
      48: 'Portland stone takes the colour of an overcast sky, until the great towers seem half-dissolved into the very weather they were built to outlast.',
      60: 'Autumn arrives quietly, one tree at a time, setting a small orange fire against all that grey and ordered stone.',
      72: 'A hand-painted sign, a striped awning, a notice taped crooked to a lamppost — the small honest theatre of a street simply going about its day.',
      88: 'Strangers cross the frame on errands of their own, lending the picture a life I could never have thought to arrange.',
      108: 'Between the monuments, the ordinary: a doorway, a railing, a stretch of pavement no guidebook names and the light loves anyway.',
      132: 'Beside the great river and its turning wheel, the city’s real heart turns out to be something smaller — a man leaning from a van, cheerfully insisting his cones were never beaten.',
      160: 'By dusk the stone goes cool and the windows go warm, and London performs the only trick it truly needs — turning an unremarkable evening into something that aches, faintly, on the walk home.',
    },
  },

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
