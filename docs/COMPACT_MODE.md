# Compact Mode — a pinch-to-zoom grid inside each collection

**Status:** Design proposal (not yet built)
**Author:** Andy + Claude
**Scope:** `GalleryDetail` (`/photography/:slug`) — a second way to view a single collection.

> **Decisions locked (2026-06-08):**
> 1. **No cropping** → a gapless **justified-rows** layout (Google-Photos style), not squares.
> 2. **Keep the dynamic, photo-derived background.**
> 3. **Slim top bar** chrome (title · count · zoom · Story⇆Grid toggle · back).

---

## 1. Summary

Today a collection opens in **Story mode** (`EditorialStory.tsx`): a slow, asymmetric,
poem-beside-photo layout meant for reading. This proposal adds a second view —
**Compact mode** — a dense, zoomable grid of the whole collection:

- A **gapless, justified-rows** layout: every photo shown **uncropped** at its true aspect,
  rows butted edge-to-edge with **no gaps**. Pure photos — **no captions/poems**.
- **Pinch to zoom changes the row height**: pinch *open* → taller rows → **fewer, larger**
  photos per row; pinch *closed* → shorter rows → **more, smaller** per row. (Trackpad +
  buttons + keyboard on desktop.)
- A **"return to their location" transition** when switching between modes: each photo
  glides from where it sits in one layout to where it sits in the other (FLIP). Because
  both layouts preserve aspect ratio, this is a clean uniform scale+slide — no distortion.

Story mode stays the default and is untouched. Compact mode is opt-in and remembered, per
the existing view-toggle convention (`Photography.tsx` already does grid/masonry via
`localStorage`).

### Goals
- The buttery feel: continuous pinch, snap to clean row heights, content stays put under
  your fingers.
- No gaps, no crops, the whole collection at a glance.
- A delightful, *literal* morph between the two layouts (not a crossfade).
- Reuse the existing lightbox, image utils, justified-row math, and perf patterns.

### Non-goals
- Not replacing or changing Story mode.
- Not a global/all-galleries grid (that's `Spectrum`). This is **per collection**.
- Not editing / selection / multi-select — this is a viewer.

---

## 2. The model we're copying (and where we diverge)

The interaction is **iOS Photos** (pinch to change how many photos fit per row, continuous
during the gesture, snap on release, content anchored under your fingers). The **layout** is
**Google Photos / Flickr "justified rows"**, because you asked for **no cropping** — and
iOS only gets its perfect square tiling *by* cropping. Justified rows is the one layout that
is simultaneously **gapless, uncropped, and "photos-per-row changes with zoom."**

```
Justified rows — same row HEIGHT, widths vary by aspect, butted edge-to-edge (no gaps):

▦▦▦▦   ▦▦    ▦▦▦▦▦      a pano + a near-square + a wide one fill one row
▦▦   ▦▦▦▦▦   ▦▦  ▦▦
▦▦▦▦▦    ▦▦▦▦    ▦▦
▦▦  ▦▦▦                 last row: natural height, left-aligned (not stretched)
```

Zoom sets a **target row height**; the packer fits as many photos as the width allows, then
nudges each row's height so the widths sum to the container exactly (that's what removes the
gaps). Bigger target height ⇒ fewer per row; smaller ⇒ more.

---

## 3. UX specification

### 3.1 Entering / leaving the mode
- A **view toggle** (Story ⇆ Grid; lucide `BookOpen` / `LayoutGrid`).
- In Compact mode the page is **pure photos**: `GalleryHero`, `GalleryIntro`, the editorial
  text and signoff are hidden. The only chrome is the **slim top bar** (§3.4).
- The **dynamic, photo-derived background** (`useDynamicBg`) is **kept** — it shows in the
  trailing space under the last row and tints the bar.

### 3.2 The zoom interaction
Zoom is a **target row-height ladder** (discrete snap levels), responsive by viewport.
Tunable; proposed defaults (px):

| Viewport          | Target row heights (zoomed-in → out) |
| ----------------- | ------------------------------------ |
| Phone `<640`      | `380, 260, 170, 110`                 |
| Tablet `640–1024` | `480, 340, 230, 150`                 |
| Desktop `≥1024`   | `560, 400, 270, 180`                 |

- Default: the **second-from-largest** level (a comfortable medium).
- "Photos per row" is **emergent** (depends on the aspects in each row), exactly like iOS —
  a row of panoramas holds fewer than a row of verticals at the same height.

**Inputs that drive zoom:**
- **Touch pinch** — two-finger pinch on the grid. During the gesture we apply a live
  `transform: scale()` to the rows (origin = pinch midpoint); on `touchend` we map the
  accumulated scale to a new target height, snap, re-pack, and reset the transform.
- **Trackpad pinch (desktop)** — `wheel` with `event.ctrlKey === true`; same pipeline.
  We `preventDefault` to suppress the browser's page zoom.
- **Buttons** — the bar's `–` / `+` step the ladder. This is the a11y + mouse path, and the
  **MVP** path (ships before pinch).
- **Keyboard** — `+`/`-`/`0`; arrows move focus between photos, `Enter` opens.
- **Double-tap / double-click** a photo — step one level *in*, anchored on that photo.

**Focal anchoring:** after a commit, adjust `scrollTop` so the photo under the focal point
stays at the same screen position (the grid zooms *around* it, not the top-left).

### 3.3 Photos (tiles)
- Each is a `<button>` (tap + keyboard), shown **uncropped** at `rowH × (rowH·aspect)`.
  Because the box matches the photo's aspect, the `<img>` fills it exactly (no letterboxing,
  no crop).
- Source via `cldFull`/`cldSet` (aspect-preserving), **not** `cldSquare`. Rotation is already
  baked by the util.
- **Tap/click → open the lightbox** at that photo via `setLightboxIdx(idx)`. Compact uses the
  **same `photos` array and order** as Story, so indices line up and the lightbox swipes the
  full run exactly as today.
- Hover (desktop): a subtle inset ring + slight scale. No captions, ever.

### 3.4 The slim top bar
A thin, translucent bar pinned to the top (tinted by the dynamic bg), holding:

```
←   Tokyo · 168 frames                    –  +        Story
↑   back to collections    title · count   zoom out/in  switch to Story mode
```

- Left: the existing back affordance (to `/photography`).
- Center/left: collection **title · N frames**.
- Right: **zoom `–` / `+`** and the **Story ⇆ Grid** toggle.
- It can auto-dim/shrink on scroll so it stays out of the way (optional polish).

---

## 4. Layout model — the justified packer

Greedy justified rows (Flickr/Google algorithm), adapted from `EditorialStory`'s existing
`'row'` math (`h = containerWidth / Σ aspect`):

```ts
// aspects[i] = aspectOf(photos[i])  (w/h, from galleryDimensions)
function packRows(aspects: number[], containerW: number, targetH: number) {
  const rows: { idxs: number[]; height: number }[] = [];
  let row: number[] = [];
  let arSum = 0;
  for (let i = 0; i < aspects.length; i++) {
    row.push(i);
    arSum += aspects[i];
    const naturalW = targetH * arSum;           // width if we used the target height
    if (naturalW >= containerW) {                // row is full → justify to exact width
      rows.push({ idxs: row, height: containerW / arSum }); // gapless: widths sum to W
      row = []; arSum = 0;
    }
  }
  if (row.length) rows.push({ idxs: row, height: targetH }); // last row: natural height
  return rows; // each photo: width = height * aspect, height = row.height
}
```

- **Gap = 0** on both axes (the requested look).
- **Last row** stays at the target height, **left-aligned** — never stretched to fill, which
  would balloon a lone trailing photo. The dynamic bg fills the remainder.
- Re-packing on zoom or resize is O(n) and cheap.

**Responsive image sizing.** Each photo renders at `width = rowH · aspect`. Request from a
fixed width ladder (cache-friendly) and let `sizes`/`srcSet` choose:

```ts
const WIDTHS = [200, 400, 600, 900, 1300]; // px, snapped to maximize Cloudinary reuse
// src={cldFull(p.src, pickNearest(displayW * dpr))}  srcSet={cldSet(p.src, WIDTHS)}
```

We never refetch *during* a pinch (we scale what's on screen); only on commit, and only for
photos in view.

---

## 5. The mode-switch transition ("return to their location")

The same photo exists in both layouts; on switch we animate each from its **current rect** to
its **target rect** — a **FLIP** (First / Last / Invert / Play).

**Why it's especially clean here:** with no cropping, a photo has the **same aspect ratio** in
Story and Compact, so the morph is a **uniform scale + translate** — no squish, no crop
reveal. That's the ideal case for Motion's shared-layout.

### Two implementations (we'll prototype A first)
- **A — Motion shared layout (`layoutId`).** Tag each photo `layoutId={`ph-${idx}`}`; render
  Story or Compact; Motion tweens the shared boxes between trees. *Least code*, and uniform
  same-aspect boxes animate smoothly. Risk: animating many boxes is heavy → scope to the
  viewport; off-screen photos just appear.
- **B — Manual FLIP.** Measure First rects (refs map), swap, measure Last rects, set inverse
  transform, animate to identity with a spring + stagger. *Most control + most performant
  (transform-only).* Fallback if A janks.

### Character (tunable — let's feel it live)
- **Spring:** languid to match the site's slow, cinematic tone (vs. snappy).
- **Stagger order:** gather toward the photo you tapped / the viewport center.
- **Direction:** animate **both** ways (Story→Grid and Grid→Story).
- **Scope:** only animate in-viewport photos; the rest are simply present after the swap.
- **Reduced motion / huge galleries:** fall back to a quick crossfade.

---

## 6. Architecture, state & integration

```
GalleryDetail (host)
├─ viewMode: 'story' | 'compact'           ← new state (default 'story', persisted)
├─ keeps useDynamicBg (background stays)    ← unchanged; shown in both modes
├─ EditorialStory           (when 'story')  ← unchanged
└─ CompactGrid              (when 'compact') ← NEW justified-rows template
   ├─ useGridZoom()  → { targetH, gestureHandlers, … }   ← NEW hook (ladder + pinch + snap)
   ├─ packRows(...)  → justified rows                     ← §4
   └─ photo → setLightboxIdx(i)             ← reuses existing lightbox
```

- **`viewMode`** lives in `GalleryDetail`; persisted in `localStorage` (one global pref,
  default Story), mirroring `Photography.tsx`.
- **`CompactGrid`** satisfies the existing `GalleryTemplateProps` so it drops into the host
  like `EditorialStory`. It ignores `captions` by design.
- **`useGridZoom`** owns the row-height ladder, the pinch/wheel math, snap, and focal-scroll
  anchoring.
- **Lightbox:** unchanged. `setLightboxIdx(i)`, same `photos` order; closing returns to the
  grid at the same scroll position.
- **Dynamic background:** unchanged — `useDynamicBg` keeps tinting the page (and the bar)
  from the photos in both modes.
- **FLIP** is coordinated by the host (the only place that sees both layouts).

---

## 7. Performance

Large collections exist (Barcelona 288, Paris 240). `docs/PERFORMANCE.md` applies — **no mass
eager prefetch** (we removed a 366-request burst elsewhere; don't reintroduce it).

- **Lazy + `content-visibility`.** Reuse the `.spectrum-tile` recipe:

  ```css
  .compact-tile { content-visibility: auto; contain-intrinsic-size: 320px 240px; }
  ```

  Offscreen rows cost ~nothing; only in-view photos decode. For ≤~300 photos this is enough —
  **no JS virtualization in v1** (add windowing later behind the same API if a mega-gallery
  needs it).
- **Width ladder** (`WIDTHS`) maximizes Cloudinary cache reuse; we don't fetch 1300px frames
  for a 110px-tall phone row.
- **Gesture = transform only.** During a pinch we scale decoded photos; we refetch only on
  commit, and only for visible photos.
- **FLIP cost.** Measure rects for **visible** photos only (cap ~40–60); batch reads then
  writes to avoid layout thrash.
- **No WebGL here** — no context-budget risk (unlike Home/Room).

---

## 8. Accessibility
- Photos are real `<button>`s with `aria-label` (`"Open <title>, photo N of M"`).
- Keyboard: `+`/`-`/`0` zoom; arrows move focus; `Enter` opens; `Esc` closes the lightbox.
- `prefers-reduced-motion`: skip the FLIP (instant or quick crossfade); disable hover scale.
- `touch-action: none` on the grid during a pinch so the browser doesn't hijack it; normal
  vertical scroll otherwise.

---

## 9. Edge cases
- **Tiny galleries:** clamp the ladder so even the largest row height shows ≥2 per row where
  sensible; hide zoom controls if only one level fits.
- **Resize / rotate device:** re-pack at the same target height; re-pick the ladder if the
  breakpoint changes.
- **Extreme aspects (panoramas):** fine — shown uncropped; a pano simply spans most of a row.
- **Last row:** natural height, left-aligned; bg fills the rest.
- **Switch mid-scroll:** on enter-Compact, scroll so the photo nearest the Story viewport
  center is in view, so the FLIP starts from something on screen.
- **Lightbox round-trip:** open from a photo → close → back to the same grid + scroll.

---

## 10. Open decisions

**Resolved:**
- ~~Crop vs. aspect~~ → **no crop, justified rows.**
- ~~Background~~ → **keep dynamic photo-derived bg.**
- ~~Chrome~~ → **slim top bar** (title · count · zoom · Story⇆Grid · back).

- ~~Persistence~~ → **never remembered. Always opens in Story**, and resets to Story for
  every collection (2026-06-09).
- ~~Compact chrome / header collision~~ → in Compact the global header + its hover trigger are
  **hidden** (`body[data-immersive]` → `#site-header`/`#hover-zone` `display:none`); the slim
  bar is the sole top chrome (taller, `z-40`). Prev/next-collection nav is shown at the bottom,
  same as Story (2026-06-09).

**Still to tune (not blocking the MVP):**
1. **Row-height ladders** — now 6 rungs each (e.g. desktop `560·400·270·180·125·90`); two extra
   small rungs added 2026-06-09 for a denser min.
2. **Transition character** — spring feel, stagger order (§5).
3. **Last-row behavior** — left-aligned natural height (recommended) vs. justified-stretch.

---

## 11. Phased plan
- **Phase 0 — Decisions.** Done for the blockers; §10 items are tunable later.
- **Phase 1 — MVP grid. ✅ BUILT (2026-06-08).** `CompactGrid` + `useGridZoom` with
  **button/keyboard** zoom (no pinch yet), justified gapless rows (full rows fill exactly via
  `flex-grow:aspect`/`flex-basis:0`; last row natural, left-aligned), lazy + `.compact-tile`
  `content-visibility`, tap→lightbox, slim bar (back · title·count · `–`/`+` · Story), dynamic
  bg kept, poems hidden. Entry via a floating "Grid" button in Story; mode is remembered
  (`localStorage 'gallery-view'`) and the zoom level too (`'compact-zoom'`). Switch scrolls to
  top (smart anchoring is Phase 3). Files: `CompactGrid.tsx`, `useGridZoom.ts`, `packRows.ts`,
  `GalleryDetail.tsx`, `index.css`.
- **Phase 2 — Pinch. ✅ BUILT (2026-06-09).** Touch pinch + trackpad `ctrl+wheel` scale the
  grid via a transform (origin = pinch point), snap to the nearest ladder rung on release
  (with a 0.18s settle so there's no pop), and correct scroll so the focal point holds. Robust
  to no-level-change releases; `will-change`/`overflow-x` toggled per gesture; the click a
  pinch's lift would synthesise is suppressed. In `CompactGrid.tsx` + `useGridZoom.ts`.
- **Phase 3 — The morph. ✅ BUILT (2026-06-09).** Switching Story⇆Compact floats a clone of
  each visible photo from its old rect to its new one (FLIP via the Web Animations API),
  anchored on the photo nearest viewport-center so the switch stays local. Deferred to a
  pre-paint `rAF` (so the newly-mounted layout has packed) with a one-frame opacity hide so the
  destination never flashes; reals are hidden behind their clones until each lands. Honors
  `prefers-reduced-motion` (instant swap) and wrapped in try/catch so a broken morph can never
  break the page. In `GalleryDetail.tsx`.
- **Phase 4 — Polish/perf.** Width-ladder tuning, double-tap-to-zoom, optional virtualization.

---

## 12. Files touched (estimate)

| File | Change |
| --- | --- |
| `src/pages/GalleryDetail.tsx` | `viewMode` state + persistence; render `EditorialStory` or `CompactGrid`; host the FLIP; hide hero/intro/signoff in Compact; keep `useDynamicBg` |
| `src/components/gallery/templates/CompactGrid.tsx` | **new** — justified-rows zoom grid + slim bar |
| `src/components/gallery/shared/useGridZoom.ts` | **new** — row-height ladder + pinch/wheel/snap + focal anchor |
| `src/components/gallery/shared/packRows.ts` | **new** — the justified packer (§4) |
| `src/components/gallery/shared/useModeTransition.ts` | **new** (Phase 3) — FLIP measure/invert/play |
| `src/index.css` | add `.compact-tile { content-visibility … }` (mirrors `.spectrum-tile`) |

**Reused as-is:** `cldFull`/`cldSet` (aspect images), `aspectOf`/`dimOf` (packing + FLIP
math), `GalleryLightbox` + `setLightboxIdx` (open at index), the `Spectrum.tsx` tile +
`.spectrum-tile` perf recipe, `useDynamicBg` (background). `EditorialStory`'s `'row'` block
math is the seed for `packRows`. *(Note: `JustifiedGallery.tsx` no longer exists — the prior
memory note was stale.)*
```
