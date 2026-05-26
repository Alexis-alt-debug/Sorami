import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';

const inputPath  = './public/logo.png';
const outputPath = './public/logo-new.png';

// Read the image as raw RGBA pixels
const image = sharp(inputPath);
const { data, info } = await image
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const pixels = new Uint8Array(data);

// Make any near-black pixel transparent
// Threshold: R < 30, G < 30, B < 30
for (let i = 0; i < pixels.length; i += 4) {
  const r = pixels[i];
  const g = pixels[i + 1];
  const b = pixels[i + 2];
  if (r < 30 && g < 30 && b < 30) {
    pixels[i + 3] = 0; // set alpha to 0 (transparent)
  }
}

// Write back as PNG
const result = await sharp(Buffer.from(pixels), {
  raw: { width, height, channels: 4 },
}).png().toBuffer();

writeFileSync(outputPath, result);
console.log(`Done! Saved to ${outputPath}`);
