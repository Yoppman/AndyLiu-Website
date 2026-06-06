# Andy Liu — Photography Portfolio · Design System & Reproduction Guide

A premium, cinematic, literary photography portfolio. This document captures the design
language, the signature techniques, and enough detail to **reproduce the look and feel** on
a new project. It's the "why" behind the pixels, not just a token dump.

---

## 1. Philosophy — the bar

> The goal: a site that feels crafted by someone who treats every pixel as if it matters —
> "form and function inseparable." Not "nice," but the kind of thing someone would pay to own.

Three ideas drive every decision:

1. **Edit, don't add.** The premium feeling comes from *one confident point of view, executed
   everywhere*, and ruthless restraint — not from more effects. When in doubt, remove.
2. **The photographs are the heroes.** Chrome whispers; images and type carry the emotion.
   On dark, photos glow; on light, they're matted generously. Color comes from the *work*,
   not the UI.
3. **Direction "C" — a bright editorial baseline, punctuated by rationed cinematic dark
   set-pieces.** The drama is dosed so it lands (a home title sequence, a gallery's opening,
   the lightbox, the Screening, the dark About/Contact). Transitions between light and dark
   are deliberate beats ("the lights go down").

Voice is **literary & cinematic** ("In every hidden corner of the earth — I honor the story
behind the scene"). Copy is quiet, first-person, evocative. The site also takes **a few
creative commissions a year** (a soft "work with me," never an agency pitch).

---

## 2. Stack

- **React 18 + TypeScript + Vite.** SPA, `react-router-dom`.
- **Tailwind CSS v3** (utility-first; design values inline). `font-cormorant` / `font-playfair`
  in `tailwind.config.js`.
- **Motion** — both `framer-motion` (^11) and `motion` (^12) are present; match the file you're
  editing. Springs + scroll-linked `useTransform`.
- **three.js + @react-three/fiber** for the few WebGL set-pieces (home fly-through, liquid,
  About hero orb).
- **MapLibre GL + supercluster** for the `/map` photo map.
- **Cloudinary** as the image CDN (all transforms in the URL path).
- Typecheck with `npx tsc -p tsconfig.app.json --noEmit` (the repo's `npm run lint` is broken).

---

## 3. Design tokens

### Color
The site has two worlds; both share **bone + amber**.

| Token | Value | Role |
|---|---|---|
| **Ink** | `#0a0a0b` | the dark base (home hero, lightbox, About body, Contact, Spectrum) |
| **Raised** | `#15151a` | lifted dark surfaces (cards, tooltips) |
| **Bone** | `#efeae1` | primary text/elements on dark (warm white — *never pure `#fff`*) |
| Bone opacities | `/75 /60 /55 /45 /40 /35` | secondary → tertiary text, labels, captions |
| **Hairline** | `white/10` | dividers, borders, rails on dark |
| **Amber** | `#f59e0b` (`amber-500`); `amber-400/300` on dark | the single accent — rationed; glows on ink |
| Editorial light | `#e7e5e0` (warm) · `#f4f4f3` · `white` | light surfaces (About 3D hero, light editorial) |
| Ink text (light) | `#151515` / `neutral-900` | text on light surfaces |

Rules: **one accent (amber), used sparingly.** Let photographs supply all other color. Avoid
generic gradients (the old indigo/emerald glows were removed).

### Typography
- **Cormorant Garamond** (300/400/600 + italics) — the workhorse serif; body, eyebrows, most
  display.
- **Playfair Display** (400/600 + italics) — higher-contrast display (section headings, the
  About bio/timeline/projects headings).
- Loaded via Google Fonts `<link>` in `index.html`.

Patterns:
- **Eyebrow:** `font-cormorant`, `text-xs`, `uppercase`, `tracking-[0.3em]`–`[0.5em]`, muted
  (bone/45 on dark, neutral-400 on light), often preceded by an amber hairline rule
  (`h-px w-10 bg-amber-500`).
- **Display:** Cormorant/Playfair, `font-light`/`font-extralight`, tight leading (`~1.0`),
  italic on the emphasized phrase, big (`text-7xl`–`text-8xl` / `clamp` via `vw`).
- **Body:** Cormorant, relaxed leading, `[text-wrap:balance]` on literary lines.

### Spacing / radius / shadow
- Sections breathe: `py-20`–`py-32`. Generous gutters.
- Radius is restrained: photos `rounded-[2px]`–`rounded-[3px]` (prints, not bubbles).
- Shadows are soft + deep for "floating print": e.g. `shadow-[0_35px_70px_-20px_rgba(0,0,0,0.45)]`.
- A scoped **film grain** (inline SVG `feTurbulence`, `opacity ~0.06`, **no blend mode**) over
  dark scenes.

---

## 4. Motion language

- **Signature ease:** `cubic-bezier(0.22, 1, 0.36, 1)` (a refined ease-out). Entrances rise +
  fade (`y: 20–34 → 0`, `opacity 0 → 1`).
- **Slow & rationed.** Durations `0.6–1.4s`. Cross-dissolves `~1.4s`. The "wow" is one or two
  perfectly tuned moments, not constant motion.
- **Physical, not flashy.** Spring-smoothed cursor/parallax (`useSpring`), gentle scroll
  parallax (`useTransform`).
- **Always honor `prefers-reduced-motion`** (drop ken-burns/auto-drift; keep gentle fades).
- **Performance:** transforms + opacity only on animated elements. No CSS `filter` or
  `mix-blend-mode` over large *moving* content (both forced the home "Wall" to jank — fixed by
  removing them). Continuous autonomous animation is avoided on big subtrees.

---

## 5. Imagery system (the engine)

All images are Cloudinary; **transforms live in the URL path**, inserted after `/upload/`.
Helpers in `src/components/gallery/shared/cloudinaryUtils.ts`:

- `cldFull(src, w)` → `q_auto,f_auto,w_${w}` (+ baked rotation, see below).
- `cldSet(src, widths)` → responsive `srcSet`.
- `cldSquare(src, w)` / `cldSquareSet` → **content-aware square crop** (`c_fill,g_auto,w,h`) —
  keeps faces/subjects when cropping to a tile.
- `cldPlaceholder(src)` → tiny blurred LQIP (`w_24,q_10,e_blur:1000`).

**Per-photo metadata** (in `src/data/galleries/*.ts`): `{ src, orientation, dominantColor }`.
`dominantColor` (an `rgba(...)`) is used as the `<img>` background (no flash of empty) **and**
as ambient light (below). `src/data/galleryDimensions.ts` (auto-generated) holds true
`{ w, h, rotate? }`; `cldFull` prepends `a_${rotate}` so sideways-stored verticals deliver
upright.

> ⚠️ **Cloudinary caveat (this account):** *effect-only* transform components are rejected
> (a bare `/e_saturation:-10/` → HTTP 400), but an `e_*` bundled with a resize works (hence the
> blur placeholder is fine). So **no server-side color grades** — darkening is done with a CSS
> veil instead. `c_fill,g_auto,w,h` (crops) are fine.

### "The lit room" — ambient color
The single most premium, near-free technique: each photo **lights its surroundings** with a
soft radial glow sampled from its `dominantColor`. Used in:
- the **lightbox** (the dark room glows the current photo's color, crossfading between frames),
- the **Screening** (each frame letterboxed in its own glow),
- the **About portrait** and the **Contact**'s warmth.

Parse helper: pull `r,g,b` from the stored `rgba` string, then
`radial-gradient(..., rgba(r,g,b,~0.2), transparent)`.

---

## 6. Signature patterns & components

- **The cursor light** (`CursorGlow.tsx`) — a warm candlelight glow trailing the cursor
  (`mix-blend-screen`, spring-lagged); lights the dark sections, recedes on light. Desktop +
  non-reduced-motion only.
- **Cover → detail morph** (`SharedMorphOverlay.tsx` + `TransitionContext`) — clicking a gallery
  animates the cover image full-screen onto the detail hero (matched size + scale) for a
  seamless shared-element transition.
- **The Wall** (`home/openings/WallOpening.tsx`) — the home opening: a drifting parallax wall
  built **only** from gallery covers + the Selected Frames (`wallCoversAndFrames()`); tiles
  gently crossfade to fresh frames over time; a **pinned tile** (London mirror-selfie) sits in
  the center column; a literary line surfaces over a filmic pool on scroll.
- **The Screening** (`gallery/shared/GalleryScreening.tsx`) — "play a gallery as a film":
  full-screen, photos shown whole + ambient-lit, slow cross-dissolves, the written intro/
  captions/signoff as titles+subtitles; click halves / arrows to step, a progress bar drives
  the auto-advance.
- **Spectrum** (`pages/Spectrum.tsx`) — the whole archive sorted by **HSL hue** into a dense
  content-visibility tapestry; click opens the color-sorted lightbox.
- **Unified gallery hero** (`gallery/shared/GalleryHero.tsx`) — one confident full-screen
  parallax hero for every gallery (region eyebrow + title + description over a vivid gradient,
  scroll cue).
- **The editorial index** — the repeating layout for lists (About "Things I've Built", the
  gallery index cards, Contact rails): hairline-divided rows, ghost numerals, serif titles,
  hairline tag pills, **amber-on-hover**.
- **Hinges** — gradient transitions between light and dark sections ("the lights go down" on
  About; the dark hero → cinematic photo Quote on home).
- **Adaptive chrome** — `mix-blend-difference` on UI that must read over both light and dark
  (the About scroll-progress rail).

---

## 7. Page map

- **Home** (`Home.tsx` + `home/HomeHero.tsx`): Wall opening → *Selected Frames* WebGL
  fly-through → B&W collage (commissions CTA) → liquid dissolve → full-bleed cinematic **Quote**
  → photo-forward **Recent galleries** → location map → connect (business card). A temporary
  `?hero=wall|frame|classic` switcher exists for comparing openings — remove before ship.
- **Photography** (`Photography.tsx`): editorial header (archive scale) + photo-forward 4:3
  gallery cards (place + frame count, slow zoom) + a masonry view toggle; links to Portraits
  and Spectrum; uses the morph.
- **Gallery detail** (`GalleryDetail.tsx`): color-adaptive bg (`useDynamicBg`) → unified hero →
  literary intro (`GalleryIntro`) → `EditorialStory` photo layout (single/pair/trio/
  caption-beside, generous vertical rhythm) → signoff → prev/next → lightbox + Screening.
- **Portraits** (`/photography/portraits`): a comic/halftone wall of faces (kept intentionally).
- **About** (`About.tsx`): a **light** 3D portrait hero (the bright overture, with a WebGL orb)
  → a light→dark **hinge** → dark bio (portrait floats on a glow) → dark stats → dark timeline
  (amber playhead/node glow) → dark "Things I've Built" editorial index.
- **Contact** (`Contact.tsx`): the dark "closing frame" — see `docs/contact-dark.md`.
- **Map** (`/map`): MapLibre dark photo map with clustered photo pins.

---

## 8. Data architecture

- `src/data/galleries/*.ts` — one file per gallery (`slug`, `title`, `description`, `hero?`,
  `location {lat,lng,region}`, `photos[]`). Auto-registered via `import.meta.glob`.
- `src/data/galleryDimensions.ts` — **auto-generated** (`node scripts/fetchGalleryDimensions.mjs`)
  after adding photos. Holds upright display dims + rotation.
- `src/data/galleryStories.ts` — literary prose per gallery slug (`meta`, `intro`, `signoff`,
  `captions` keyed by photo index). This writing is a core differentiator — treat text as a
  first-class designed element.
- New gallery from a folder: `node src/cloudinary/upload-gallery.js <folder> --region … --lat …
  --lng …` (bakes EXIF rotation at upload), then regenerate dimensions + add a stories entry.

---

## 9. Performance & WebGL discipline

WebGL contexts are a scarce per-page resource (Safari is strict; Chrome caps ~16). Rules:
- **Gate** R3F `<Canvas>` to near-viewport, **latch mounted** + pause `frameloop` off-screen
  (don't churn mount/unmount), and **release** on real unmount (`ReleaseContextOnUnmount` →
  `gl.forceContextLoss()`).
- Wrap every `<Canvas>` in `SceneErrorBoundary` (a class boundary — Suspense doesn't catch
  throws) so a lost context degrades to a poster, never a white-screened route.
- Prefer DOM/CSS over WebGL when it reads the same (the Wall, Frame, Screening, Spectrum, the
  rethought About projects are all WebGL-free).

---

## 10. Accessibility

- Contrast: bone on ink is high-contrast; amber is for accents/large text, not small body.
- `prefers-reduced-motion` is respected across animated components.
- Real `alt`, keyboard nav in the lightbox/screening (arrows, Esc), focusable controls.

---

## 11. Reproduce it (checklist)

1. **Palette:** ink `#0a0a0b` / raised `#15151a` / bone `#efeae1` / amber `#f59e0b`; warm light
   `#e7e5e0`. Bone, not white. Amber, rationed.
2. **Type:** Cormorant Garamond + Playfair Display; tracked-uppercase eyebrows; light-weight
   italic display.
3. **Motion:** ease `cubic-bezier(0.22,1,0.36,1)`, slow, rationed, reduced-motion-safe.
4. **Images:** Cloudinary path transforms; store `dominantColor`; use it as bg + ambient glow.
5. **Set-pieces, dosed:** one cinematic dark moment per surface (opening, gallery hero, lightbox,
   Screening), calm editorial in between.
6. **Photos are the heroes;** chrome whispers; grain + glow for soul; generous space.
7. **WebGL only where it earns it,** and always gated + released + error-bounded.

## 12. Principles to preserve
Restraint over flash · cohesion over novelty · the work over the chrome · bone over white ·
amber, rationed · light↔dark as deliberate beats · the writing as design.
