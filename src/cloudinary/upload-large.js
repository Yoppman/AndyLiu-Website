#!/usr/bin/env node
// src/cloudinary/upload-large.js

import { fileURLToPath } from 'url';
import fs   from 'fs';
import path from 'path';
import sharp from 'sharp';
import 'dotenv/config';
import cloudinary from './cloudinary.js'; // cloudinary configured
import ColorThief from 'colorthief';

// fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Usage: node upload-large.js <image_directory>
const [IMAGE_DIR] = process.argv.slice(2);
if (!IMAGE_DIR) {
  console.error('Usage: node upload-large.js <image_directory>');
  process.exit(1);
}

// derive gallery constants
const baseName        = path.basename(IMAGE_DIR);
const collectionSlug  = slugify(baseName);
const collectionTitle = humanize(collectionSlug);
const constantName    = `${baseName}Gallery`;

// paths: script is in src/cloudinary, gallery in src/data/galleries
const GALLERIES_DIR   = path.resolve(__dirname, '../data/galleries');
const OUTPUT_FILE     = path.join(GALLERIES_DIR, `${constantName}.ts`);

const MAX_SIZE        = 10 * 1024 * 1024; // 10MB

if (!fs.existsSync(GALLERIES_DIR)) {
  fs.mkdirSync(GALLERIES_DIR, { recursive: true });
}

// helpers
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
}
function humanize(slug) {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
function uploadBuffer(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', public_id: publicId, overwrite: true },
      (err, result) => err ? reject(err) : resolve(result)
    );
    stream.end(buffer);
  });
}

;(async () => {
  // ── 0) Read existing CoffeeGallery.ts and extract every `{…}` under photos: [ ... ]
  let existingLines = [];
  const uploadedNames = new Set();

  if (fs.existsSync(OUTPUT_FILE)) {
    const tsText = fs.readFileSync(OUTPUT_FILE, 'utf8');
    // grab the photos array content
    const block = tsText.match(/photos:\s*\[\s*([\s\S]*?)\s*\]/);
    if (block) {
      // find all object literals {...}
      const objs = block[1].match(/{[\s\S]*?}/g) || [];
      for (const objText of objs) {
        const trimmed = objText.trim().replace(/,$/, '');
        existingLines.push(trimmed);
        // extract src URL
        const m = trimmed.match(/['"]?src['"]?\s*:\s*['"]([^'"]+)['"]/);
        if (m) {
          // grab filename and lowercase
          const fn = path.basename(new URL(m[1]).pathname).toLowerCase();
          uploadedNames.add(fn);
        }
      }
      console.log(`🔎 Found ${existingLines.length} existing photos; will skip those.`);
      console.log(`   ↑ extracted ${uploadedNames.size} distinct filenames`);
    }
  }

  // console.log(`${existingLines}`);

  // ── 1) Process local JPEGs
  const allFiles = fs.readdirSync(IMAGE_DIR)
    .filter(f => /\.(jpe?g)$/i.test(f))
    .sort();

  const newLines = [];

  for (const file of allFiles) {
    if (uploadedNames.has(file.toLowerCase())) {
      console.log(`⏭ Skipping already-uploaded ${file}`);
      continue;
    }
    console.log(`\n➡ Processing ${file}…`);
    const filepath = path.join(IMAGE_DIR, file);

    // ── 2) Orientation
    const meta = await sharp(filepath).metadata();
    let { width=0, height=0, orientation=1 } = meta;
    if ([5,6,7,8].includes(orientation)) [width,height] = [height,width];
    const orient = height > width ? 'vertical' : 'horizontal';

    // ── 3) Compress
    let quality = 90;
    let buffer  = await sharp(filepath).jpeg({ quality, mozjpeg:true }).toBuffer();
    while (buffer.length > MAX_SIZE && quality > 10) {
      quality -= 10;
      buffer = await sharp(filepath).jpeg({ quality, mozjpeg:true }).toBuffer();
    }
    if (buffer.length > MAX_SIZE) {
      console.warn(`⚠ ${file} >10MB at quality=${quality}`);
    }

    // ── 4) Dominant color
    const [r,g,b] = await ColorThief.getColor(filepath);
    const dominantColor = `rgba(${r}, ${g}, ${b}, 0.6)`;

    // ── 5) Upload
    const name     = path.basename(file, path.extname(file));
    const itemSlug = slugify(name);
    const publicId = `${collectionSlug}/${itemSlug}`;
    console.log(`Uploading ${file} as ${publicId} (q=${quality})…`);
    const result = await uploadBuffer(buffer, publicId);

    newLines.push(
      `{ src: '${result.secure_url}', orientation: '${orient}', dominantColor: '${dominantColor}' }`
    );
  }

  // ── 6) Merge and write TS file
  const allLines   = existingLines.concat(newLines);
  const photoLines = allLines.map(l => `      ${l}`).join(',\n');

  const tsOut = `import { Gallery } from '../types/galleries';

export const ${constantName}: Gallery = {
  slug: '${collectionSlug}',
  title: '${collectionTitle}',
  description: '${collectionTitle}',
  photos: [
${photoLines}
  ]
};

export default ${constantName};
`;

  fs.writeFileSync(OUTPUT_FILE, tsOut, 'utf8');
  console.log(`\n✅ Updated gallery written to ${OUTPUT_FILE}`);
})();