# Contact — "The Closing Frame"

The contact page is the end of the film: a dark, generous invitation that matches the
cinematic site rather than a light grab-bag of widgets.

## Concept
One confident statement, not five disconnected toys. Reaching out should feel like the
natural last beat after the work.

## The arc (4 acts)
1. **The invitation** — full-screen, a warm full-bleed sunset (`LagunaBeach/dsc03805`)
   behind an ink scrim. In voice: eyebrow *Say hello* → **"Let's make something."**
   (echoes the home collage CTA) → the commissions + coffee line → one elegant email CTA
   → scroll cue.
2. **The atlas** — the existing travel map, **dark-themed** (bone continents at ~10%, a
   glowing amber home pin), with its **staggered pin load-in preserved** (the spring
   "merging" effect the owner liked).
3. **The details** — left: elegant social rails (GitHub / LinkedIn / Instagram) as hairline
   rows with amber-on-hover (same language as the About "Things I've Built" index) + a
   location/availability line. Right: the **draggable business card**, kept (already dark +
   amber + carries the tagline).
4. **The sign-off** — *"Until the next frame."* + the name line.

## Palette & type
Site-standard dark: ink `#0a0a0b`, raised `#15151a`, bone `#efeae1`, amber accent,
Cormorant/Playfair. See `docs/DESIGN.md`.

## Keep / reimagine / drop
- **Keep:** `DraggableBusinessCard`, `TravelMap` (re-themed dark).
- **Reimagine:** the hero (light → dark cinematic + literary copy); social bubbles →
  elegant labeled links; whole page → dark.
- **Drop:** `BackgroundLines`, the candy social bubbles, the `PolaroidStack`, the
  quick-contact row. (Components left in the repo but no longer imported.)

## Decisions (owner)
- Instagram handle: **@andyliu_0104**.
- Map: **keep the same map, dark** (and keep its load animation).
- Headline + right-column element: designer's call → "Let's make something." + the card.

## Data fixed
- Instagram href set to the real handle.
- LinkedIn aligned to the header (`/in/andy9998811`).
- `Header.tsx`: `/contact` added to the dark-page set so the nav reads light.

## Files
`src/pages/Contact.tsx` (rewritten), `src/components/contact/TravelMap.tsx` (dark),
`src/components/Header.tsx` (nav). Commit `0a76cc8`.
