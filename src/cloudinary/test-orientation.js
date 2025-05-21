// src/cloudinary/test-orientation.js
import fs   from 'fs'
import path from 'path'
import sharp from 'sharp'

async function testOrientations(dir) {
  const files = fs.readdirSync(dir).filter(f => /\.(jpe?g)$/i.test(f))
  for (const file of files) {
    const full = path.join(dir, file)

    // pull raw metadata (width, height, and EXIF orientation)
    const meta = await sharp(full).metadata()
    let { width, height, orientation } = meta
    orientation ||= 1

    // if EXIF tag 5–8 then display dims are swapped
    if ([5,6,7,8].includes(orientation)) {
      [width, height] = [height, width]
    }

    const dirn = height > width ? 'vertical' : 'horizontal'
    console.log(
      `${file}: raw=${meta.width}×${meta.height} ` +
      `(EXIF tag=${orientation}) → ` +
      `display=${width}×${height} → ${dirn}`
    )
  }
}

testOrientations('/Users/liu/Pictures/PersonalWebsite/BerlinStreet')
  .catch(console.error)