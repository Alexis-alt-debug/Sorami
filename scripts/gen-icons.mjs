import sharp from 'sharp';

const input = './public/logo.png';

await sharp(input).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile('./public/icon-512.png');
await sharp(input).resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile('./public/icon-192.png');
await sharp(input).resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile('./public/apple-touch-icon.png');

console.log('Icons generated: icon-512.png, icon-192.png, apple-touch-icon.png');
