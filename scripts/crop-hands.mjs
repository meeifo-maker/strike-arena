import sharp from 'sharp';
import fs from 'fs';

// Crop regions from CS screenshots, then rembg separately (next step)
await sharp('public/assets/viewhands/rifle-src.png')
  .extract({ left: 260, top: 170, width: 500, height: 270 })
  .png()
  .toFile('public/assets/viewhands/_rifle-full-crop.png');

await sharp('public/assets/viewhands/rifle-src.png')
  .extract({ left: 275, top: 195, width: 210, height: 175 })
  .png()
  .toFile('public/assets/viewhands/_rifle-L-crop.png');

await sharp('public/assets/viewhands/rifle-src.png')
  .extract({ left: 470, top: 230, width: 250, height: 195 })
  .png()
  .toFile('public/assets/viewhands/_rifle-R-crop.png');

await sharp('public/assets/viewhands/pistol-src.jpg')
  .extract({ left: 360, top: 260, width: 420, height: 280 })
  .png()
  .toFile('public/assets/viewhands/_pistol-crop.png');

console.log('crops ready');
