# Performance Optimization — Tracking

Living record of the performance work. Baseline captured 2026-05-31 against a dev
build (`vite`, port 5199) in the Claude Code preview browser. Cross-origin transfer
bytes read as 0 in Resource Timing (Cloudinary sends no `Timing-Allow-Origin`
header), so **request counts** are used as the actionable metric rather than bytes.

> Note: the preview runs a constrained/headless GPU. Scroll FPS there is not
> representative of a real device, but request counts, DOM-node counts, WebGL
> context behavior, and bundle facts are.

## Baseline (before Phase 1)

### Home page (`/`)
- **WebGL instability:** the two stacked home canvases (FloatingGalleryScene +
  LiquidScene) triggered **16× `THREE.WebGLRenderer: Context Lost`** and, with **no
  error boundary at the app root**, the entire site unmounted to a **blank screen**
  (`#root` had 0 children). Validates the multi-context pressure diagnosis and
  reveals a fragility: any WebGL failure white-screens the whole app.
- **~17 `w_1920` Cloudinary textures** requested for the 3D scenes.
- **`GalleryPreview` ("Recent Work") loads full-resolution originals** with no
  Cloudinary transform (e.g. `/alcatrazisland/dsc07756.jpg`, `/architecture/dsc01629.jpg`).
- **All 16 gallery data modules** + `galleryDimensions.ts` load on home.
- **Leaflet + 6 Carto map tiles** load on home (`LocationInfo`).

### Gallery — Napa Valley (`/photography/napavalley`, 122 photos)
- **141 Cloudinary image requests fire with NO scrolling** (~10 s after load),
  heading toward the **366** the prefetch loop enqueues (122 × {300,600,900}):
  - `w_300`: 46 · `w_600`: 46 · `w_900`: 45 · `w_1200`: 4
- **122 `<img>` mounted simultaneously** (no virtualization), page height **36,574 px**.
- **Scroll-up does NOT re-request** images: Cloudinary count held at **141 → 141 → 141**
  across a full scroll-down-then-up cycle (triggerOnce + HTTP cache + service worker).
- Scripted-scroll frame timing (headless, not representative): avg 16.6 ms, 0 jank frames.

## Phase 1 changes (in progress)

| # | Change | Files | Expected effect |
|---|--------|-------|-----------------|
| 6 | Remove the idle bulk-prefetch loop (366 reqs); keep hero + first-2 preloads | `usePrefetch.ts` | Gallery requests on load drop from ~366 toward just the visible window |
| 4 | Remove scroll-animated `filter: blur()` on the ~90-image mosaic wall | `LivingMosaic.tsx` | Eliminates full-layer GPU re-raster every frame while scrolling Act I |
| 3 | 3D textures 1920→1280 (Floating) / 1920→1440 (Liquid); dpr [1,2]→[1,1.5]; antialias off; aniso 8→4 | `FloatingGalleryScene.tsx`, `LiquidScene.tsx` | ~50–70% less texture VRAM/decode + fill cost while a scene is visible |
| 1+2 | Mount each home WebGL scene only when its section is near the viewport (IntersectionObserver); unmount when scrolled away (frees the GL context) | `FloatingGallery.tsx`, `LiquidShader.tsx`, new `useNearViewport.ts` | At most ~1 home WebGL context alive at a time; zero render cost off-screen |

## After Phase 1

**Environment caveat:** the Claude preview browser **does not deliver IntersectionObserver
callbacks** (a test observer fired 0 callbacks — including the mandatory initial one — even at
1440×900). Both the new WebGL gating *and* the pre-existing `LazyImage` depend on IO, so their
runtime behavior (mount-on-approach / lazy-load-on-scroll) must be confirmed in a **real browser**
(e.g. the dev server on :5173). Code correctness was verified instead.

**Verified in-preview (environment-independent):**
- ✅ All edited files **type-check clean** (`tsc -p tsconfig.app.json` — no new errors in the
  touched files; pre-existing errors elsewhere unchanged).
- ✅ **Prefetch bulk loop removed** — `usePrefetch` creates 0 `new Image()`; only the hero +
  first-2 `<link rel=preload>` remain.
- ✅ **Home no longer crashes**: `#root` mounts, header + 109 mosaic/comic images render. At
  scroll 0, **only the 2D cursor canvas is present — zero WebGL contexts** (previously two
  always-on contexts caused 16× context-loss → blank screen here).
- ✅ Mosaic renders **without the animated blur**.

**Expected on a real browser (logic verified, pending on-device confirmation):**
- Gallery (Napa): requests on load drop from **141→(366) to ≈ the in-view window (~10–20) + hero**;
  the rest stream via `LazyImage` (rootMargin 200px) as you scroll. Scroll-up stays cached
  (triggerOnce + HTTP cache + service worker) — already confirmed in baseline (141→141→141).
- Home: **≤ ~1 live WebGL context at a time** — FloatingGallery mounts approaching "Selected
  Frames" and unmounts past it; Liquid mounts for its act. Textures **w_1280 / w_1440** (was
  w_1920); dpr capped **1.5** (was 2); **MSAA off** on FloatingGallery.

## Follow-up fix — "Selected Frames" first-load gap (2026-05-31)
After gating, the 16 constellation textures (~2.9 MB) only began downloading on
approach; `useLoader` is all-or-nothing, so on a cold cache the fly-through stayed
blank through the first pass and only played fully on the cached return trip
(user-reported: ~5 photos first, 10+ on the way back). Fix: warm the 16 (+2 Liquid)
textures via `crossOrigin="anonymous"` `Image()` preloads when the home hero mounts,
so the gated scene's `useLoader` gets cache hits and the first pass is complete.
Verified in preview: **16 `w_1280` + 2 `w_1440` requests fire at home load with no
scrolling** (scene still unmounted), matching the exact URLs `useLoader` requests.
Files: `FloatingGallery.tsx`, `LiquidShader.tsx`. Restores pre-gating preload timing
without giving up the GL-context gating.

## Still open (proposed, not in this pass)
- Robustness: add a React **error boundary** around each `<Canvas>` so a GPU/context failure
  degrades to a poster instead of (currently) being able to white-screen the whole app.
- Phase 1 #5 (gate CursorTrailCanvas) and the bundle/infra items (#9 legacy three.js r79 +
  kaleidoscope in `index.html`, route code-splitting, the ineffective `<meta>` cache-control).
- Phase 2 (virtualization, LQIP, dynamic-bg throttle) and Phase 3 (ThumbHash, scroll-rig, etc.).
