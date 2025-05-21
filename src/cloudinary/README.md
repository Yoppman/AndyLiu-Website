# Upload Large Images & Generate Gallery Data

A Node.js script to automate:

1. **Compressing** large JPEGs under 10 MB  
2. **Extracting** each image’s dominant color  
3. **Uploading** to Cloudinary  
4. **Merging** new entries into your existing `Gallery` TS file under `src/data/galleries`

---

## 📦 Prerequisites

- **Node.js** (v14+)  
- **npm** or **yarn**  
- Cloudinary account credentials  

Install dependencies:

```bash
cd your-project-root
npm install sharp cloudinary colorthief
npm install --save-dev @types/node ts-node typescript
```

---

## 🔧 Configuration

1. **Place** the script at:
   ```
   src/cloudinary/upload-large.js
   ```
2. **Ensure** your project has a gallery file at:
   ```
   src/data/galleries/<FolderName>Gallery.ts
   ```
   for example:
   ```
   src/data/galleries/CoffeeGallery.ts
   ```

3. **Set** your Cloudinary creds inside the script:

   ```js
   cloudinary.config({
     cloud_name: 'dlfmzlwp6',
     api_key:    '…',
     api_secret: '…',
   });
   ```

---

## 🚀 Usage

```bash
node src/cloudinary/upload-large.js /absolute/path/to/ImageFolder
```

- `ImageFolder` is the **local** directory containing your new JPEGs.  
- The script will:
  1. Read and parse the existing `<FolderName>Gallery.ts`  
  2. Skip any images whose filenames (case‑insensitive) already appear in that TS file  
  3. Compress & extract dominant color for each **new** image  
  4. Upload to Cloudinary under `/<folder-slug>/<image-slug>`  
  5. Append new entries—complete with:
     ```ts
     { src: 'https://…/your-upload.jpg', orientation: 'horizontal', dominantColor: 'rgba(r, g, b, 0.6)' }
     ```
  6. Overwrite the gallery file with the **merged** photo array  

---

## 📄 Example

```bash
# Assume /Users/you/Photos/Coffee contains DSC01861.JPG, DSC01862.JPG…
node src/cloudinary/upload-large.js /Users/you/Photos/Coffee
```

Output:

```
🔎 Found 12 existing photos; will skip those.
⏭ Skipping already-uploaded DSC01861.JPG
➡ Processing DSC01862.JPG…
Uploading DSC01862.JPG as coffee/dsc01862 (q=90)…
✅ Updated gallery written to src/data/galleries/CoffeeGallery.ts
```

Your `CoffeeGallery.ts` will now include the newly uploaded images (and their `dominantColor`).

---

## 🛠️ Troubleshooting

- **“Class GNotificationCenterDelegate is implemented in both …”**  
  Run `npm dedupe` or pin a single version of `@img/sharp-libvips-darwin-arm64` in your lockfile.

- **No images skipped?**  
  Ensure your existing gallery file’s `photos` block includes each entry as an object literal—single‑ or multi‑line.

- **Script not found?**  
  Verify you’re running Node with ESM support and the correct relative path.

---

## 💡 Tips

- **Batch imports**: Rename your image directory to match your gallery name (e.g. `Coffee` → `CoffeeGallery.ts`).  
- **Re-run safely**: The script is idempotent—re-running won’t duplicate already‑uploaded files.  
- **Style**: Keep each photo entry in one line for readability:
  ```ts
  { src: '…', orientation: 'vertical', dominantColor: 'rgba(…)'}
  ```

Enjoy friction‑free gallery updates on your photography website!
