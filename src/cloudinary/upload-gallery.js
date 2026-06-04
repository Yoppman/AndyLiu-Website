#!/usr/bin/env node
// src/cloudinary/upload-gallery.js
//
// Upload a folder of photos to Cloudinary and generate a fully-wired gallery
// data file. Enhances upload-large.js with: a picked `hero`, a map `location`,
// concurrent uploads, resumable checkpointing (re-run to resume after a failure),
// and a --dry-run preview. The new gallery auto-registers via import.meta.glob.
//
// After it finishes it prints the two remaining steps (which need the live URLs):
//   1) node scripts/fetchGalleryDimensions.mjs   — refresh aspect ratios + rotation
//   2) add a galleryStories['<slug>'] entry       — the poetic prose
//
// Usage:
//   node src/cloudinary/upload-gallery.js <folder> \
//        --region "England" --lat 51.5074 --lng -0.1278 \
//        [--title London] [--description "…"] [--hero DSC00654.JPG] \
//        [--concurrency 5] [--limit N] [--dry-run]

import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import 'dotenv/config';
import cloudinary from './cloudinary.js';
import ColorThief from 'colorthief';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── arg parsing ──────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const positional = [];
const flags = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) flags[key] = true;
    else { flags[key] = next; i++; }
  } else {
    positional.push(a);
  }
}

const IMAGE_DIR = positional[0];
if (!IMAGE_DIR) {
  console.error(
    'Usage: node src/cloudinary/upload-gallery.js <folder> --region "England" --lat <num> --lng <num> ' +
      '[--title T] [--description "…"] [--hero file.JPG] [--concurrency 5] [--limit N] [--dry-run]'
  );
  process.exit(1);
}
if (!fs.existsSync(IMAGE_DIR)) {
  console.error(`Folder not found: ${IMAGE_DIR}`);
  process.exit(1);
}

const DRY_RUN = !!flags['dry-run'];
const CONCURRENCY = Math.max(1, parseInt(flags.concurrency || '5', 10));
const LIMIT = flags.limit ? parseInt(flags.limit, 10) : Infinity;
const MAX_SIZE = 10 * 1024 * 1024; // Cloudinary free-tier per-asset ceiling

// ── derive gallery constants ─────────────────────────────────────────────────
const baseName = path.basename(IMAGE_DIR.replace(/\/+$/, ''));
const collectionSlug = slugify(baseName);
const collectionTitle = flags.title ? String(flags.title) : humanize(collectionSlug);
const description = flags.description ? String(flags.description) : collectionTitle;
const constantName = `${pascal(collectionSlug)}Gallery`;

const GALLERIES_DIR = path.resolve(__dirname, '../data/galleries');
const OUTPUT_FILE = path.join(GALLERIES_DIR, `${constantName}.ts`);
if (!fs.existsSync(GALLERIES_DIR)) fs.mkdirSync(GALLERIES_DIR, { recursive: true });

// location is optional; only emitted when all three are present + numeric
const lat = flags.lat !== undefined ? Number(flags.lat) : NaN;
const lng = flags.lng !== undefined ? Number(flags.lng) : NaN;
const region = flags.region ? String(flags.region) : '';
const hasLocation = Number.isFinite(lat) && Number.isFinite(lng) && region.length > 0;
if ((flags.lat || flags.lng || flags.region) && !hasLocation) {
  console.warn('⚠ location ignored — need all of --lat, --lng, --region (numeric lat/lng).');
}

// ── helpers ──────────────────────────────────────────────────────────────────
function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
function humanize(slug) {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
function pascal(slug) {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}
function uploadBuffer(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', public_id: publicId, overwrite: true },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}
/** Parse the photo object literals out of an existing gallery file (for resume). */
function parseExistingPhotos(tsText) {
  const block = tsText.match(/photos:\s*\[\s*([\s\S]*?)\s*\]\s*}/);
  if (!block) return [];
  const objs = block[1].match(/{[^{}]*}/g) || [];
  return objs.map((o) => {
    const src = (o.match(/src:\s*['"]([^'"]+)['"]/) || [])[1] || '';
    const orientation = (o.match(/orientation:\s*['"]([^'"]+)['"]/) || [])[1] || 'horizontal';
    const dominantColor = (o.match(/dominantColor:\s*['"]([^'"]+)['"]/) || [])[1] || 'rgba(0,0,0,0.6)';
    return { src, orientation, dominantColor };
  }).filter((p) => p.src);
}
/** itemSlug for a local filename, matching the public_id we upload under. */
function itemSlugOf(file) {
  return slugify(path.basename(file, path.extname(file)));
}
/** itemSlug embedded in an uploaded src URL (…/<slug>/<itemSlug>.jpg). */
function itemSlugOfSrc(src) {
  try {
    return slugify(path.basename(new URL(src).pathname, path.extname(new URL(src).pathname)));
  } catch {
    return '';
  }
}
function sortPhotos(list) {
  // horizontal first (the site's convention), stable within each group by _idx
  return [...list].sort((a, b) => {
    if (a.orientation !== b.orientation) return a.orientation === 'horizontal' ? -1 : 1;
    return (a._idx ?? 0) - (b._idx ?? 0);
  });
}
function pickHero(sorted) {
  if (flags.hero) {
    const want = itemSlugOf(String(flags.hero));
    const m = sorted.find((p) => itemSlugOfSrc(p.src) === want);
    if (m) return m;
    console.warn(`⚠ --hero "${flags.hero}" not found among photos; falling back.`);
  }
  return sorted.find((p) => p.orientation === 'horizontal') || sorted[0];
}
function lit(p) {
  return `{ src: '${p.src}', orientation: '${p.orientation}', dominantColor: '${p.dominantColor}' }`;
}
function buildFile(sorted, hero) {
  const photoLines = sorted.map((p) => `      ${lit(p)}`).join(',\n');
  const heroLine = hero ? `  hero: ${lit(hero)},\n` : '';
  const locLine = hasLocation
    ? `  location: { lat: ${lat}, lng: ${lng}, region: '${region.replace(/'/g, "\\'")}' },\n`
    : '';
  return `import { Gallery } from '../types/galleries';

export const ${constantName}: Gallery = {
  slug: '${collectionSlug}',
  title: '${collectionTitle.replace(/'/g, "\\'")}',
  description: '${description.replace(/'/g, "\\'")}',
${heroLine}${locLine}  photos: [
${photoLines}
  ]
};

export default ${constantName};
`;
}

// ── concurrency pool ─────────────────────────────────────────────────────────
async function runPool(items, worker, concurrency) {
  let i = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await worker(items[idx], idx);
    }
  });
  await Promise.all(runners);
}

// ── main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n📁 ${baseName}  →  slug '${collectionSlug}'  (${constantName}.ts)`);
  if (hasLocation) console.log(`📍 ${region}  [${lat}, ${lng}]`);
  if (DRY_RUN) console.log('🧪 DRY RUN — no uploads, no files written.\n');

  // Resume: seed from an existing gallery file and skip already-uploaded names.
  const photos = [];
  const uploadedSlugs = new Set();
  if (fs.existsSync(OUTPUT_FILE)) {
    const existing = parseExistingPhotos(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    existing.forEach((p, n) => {
      photos.push({ ...p, _idx: n });
      uploadedSlugs.add(itemSlugOfSrc(p.src));
    });
    if (existing.length) console.log(`🔎 ${existing.length} photos already in ${constantName}.ts — will skip those.`);
  }

  const allFiles = fs.readdirSync(IMAGE_DIR).filter((f) => /\.(jpe?g)$/i.test(f)).sort();
  const toProcess = allFiles
    .map((file, n) => ({ file, _idx: 1000 + n }))
    .filter(({ file }) => !uploadedSlugs.has(itemSlugOf(file)))
    .slice(0, LIMIT);

  console.log(`🖼  ${allFiles.length} images found, ${toProcess.length} to upload (concurrency ${CONCURRENCY}).\n`);
  if (!toProcess.length) {
    console.log('Nothing to do.');
    return;
  }

  let done = 0;
  let writeTick = 0;
  const flush = () => fs.writeFileSync(OUTPUT_FILE, buildFile(sortPhotos(photos), pickHero(sortPhotos(photos))), 'utf8');

  await runPool(toProcess, async ({ file, _idx }) => {
    const filepath = path.join(IMAGE_DIR, file);
    try {
      // orientation (EXIF-aware: swap dims for rotated tags 5–8)
      const meta = await sharp(filepath).metadata();
      let { width = 0, height = 0, orientation = 1 } = meta;
      if ([5, 6, 7, 8].includes(orientation)) [width, height] = [height, width];
      const orient = height > width ? 'vertical' : 'horizontal';

      if (DRY_RUN) {
        photos.push({ src: `local:${file}`, orientation: orient, dominantColor: 'rgba(0,0,0,0.6)', _idx });
        console.log(`[${++done}/${toProcess.length}] ◦ ${file} → ${orient}`);
        return;
      }

      // compress under the size ceiling
      let quality = 90;
      let buffer = await sharp(filepath).rotate().jpeg({ quality, mozjpeg: true }).toBuffer();
      while (buffer.length > MAX_SIZE && quality > 10) {
        quality -= 10;
        buffer = await sharp(filepath).rotate().jpeg({ quality, mozjpeg: true }).toBuffer();
      }
      if (buffer.length > MAX_SIZE) console.warn(`  ⚠ ${file} still >10MB at q=${quality}`);

      // dominant color (best-effort)
      let dominantColor = 'rgba(0,0,0,0.6)';
      try {
        const [r, g, b] = await ColorThief.getColor(filepath);
        dominantColor = `rgba(${r}, ${g}, ${b}, 0.6)`;
      } catch {
        console.warn(`  ⚠ color failed for ${file}, using neutral.`);
      }

      const publicId = `${collectionSlug}/${itemSlugOf(file)}`;
      const result = await uploadBuffer(buffer, publicId);
      photos.push({ src: result.secure_url, orientation: orient, dominantColor, _idx });

      console.log(`[${++done}/${toProcess.length}] ✓ ${publicId} (${orient}, q=${quality})`);
      if (++writeTick % 5 === 0) flush(); // checkpoint so progress survives a crash
    } catch (err) {
      console.error(`[${++done}/${toProcess.length}] ✗ ${file} — ${err.message} (skipped)`);
    }
  }, CONCURRENCY);

  if (DRY_RUN) {
    const h = photos.filter((p) => p.orientation === 'horizontal').length;
    const v = photos.length - h;
    const hero = pickHero(sortPhotos(photos));
    console.log(`\n🧪 Dry run complete: ${photos.length} photos (${h} horizontal, ${v} vertical).`);
    console.log(`   hero would be: ${hero ? hero.src.replace('local:', '') : '—'}`);
    console.log(`   captions for ≥1 poetic beat / 10 photos → ~${Math.max(2, Math.round(photos.length / 10))} caption slots.`);
    console.log('   (no files written)\n');
    return;
  }

  flush(); // final, complete write
  console.log(`\n✅ Wrote ${photos.length} photos to src/data/galleries/${constantName}.ts`);
  console.log('\nNext steps (need the live URLs that now exist):');
  console.log('  1) node scripts/fetchGalleryDimensions.mjs');
  console.log(`  2) add a galleryStories['${collectionSlug}'] entry — aim for ~${Math.max(2, Math.round(photos.length / 10))} caption beats`);
  console.log(`     spread across the gallery (≥1 poetic sentence per 10 photos).\n`);
})();
