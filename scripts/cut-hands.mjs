import sharp from 'sharp';
import { removeBackground } from '@imgly/background-removal-node';
import fs from 'fs';

async function cutHands(src, crop, out, { trimBottom = 0, gunWipe, brighten = 1.4, add = 20 }) {
  const cropPath = out.replace('.png', '-crop.png');
  await sharp(src).extract(crop).png().toFile(cropPath);
  console.log('rembg', cropPath);
  const blob = await removeBackground(cropPath, {
    model: 'small',
    output: { format: 'image/png' }
  });
  const rawBuf = Buffer.from(await blob.arrayBuffer());
  fs.writeFileSync(out.replace('.png', '-raw.png'), rawBuf);

  let img = sharp(rawBuf).ensureAlpha();
  const meta = await img.metadata();
  if (trimBottom > 0) {
    img = sharp(
      await img
        .extract({ left: 0, top: 0, width: meta.width, height: meta.height - trimBottom })
        .toBuffer()
    );
  }
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const n = w * h;
  const [gx0, gy0, gx1, gy1] = gunWipe;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < 40) {
        data[i + 3] = 0;
        continue;
      }
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = (r + g + b) / 3;
      const inGun = x >= gx0 && x <= gx1 && y >= gy0 && y <= gy1;
      const lower = y > h * 0.48;
      // wipe baked CS gun body so only gloves/arms remain under our 3D weapon
      if (inGun && y < h * 0.52) {
        const grey = Math.abs(r - g) < 28 && Math.abs(g - b) < 28;
        const tanGun = r > 100 && g > 80 && b > 50 && Math.abs(r - g) < 50;
        if ((grey || tanGun) && lum > 40 && !lower) {
          data[i + 3] = 0;
          continue;
        }
        if (!lower && lum > 70) {
          data[i + 3] = 0;
          continue;
        }
      }
      data[i] = Math.min(255, (r * brighten + add) | 0);
      data[i + 1] = Math.min(255, (g * brighten * 0.95 + add) | 0);
      data[i + 2] = Math.min(255, (b * brighten * 0.9 + add) | 0);
      data[i + 3] = 255;
    }
  }

  // keep only components touching the bottom (arms enter from bottom)
  const seen = new Uint8Array(n);
  const q = [];
  const en = (i) => {
    if (i < 0 || i >= n || seen[i] || !data[i * 4 + 3]) return;
    seen[i] = 1;
    q.push(i);
  };
  for (let x = 0; x < w; x++) en((h - 1) * w + x);
  for (let y = (h * 0.7) | 0; y < h; y++) {
    en(y * w);
    en(y * w + w - 1);
  }
  let qi = 0;
  while (qi < q.length) {
    const i = q[qi++];
    const x = i % w;
    const y = (i / w) | 0;
    if (x) en(i - 1);
    if (x < w - 1) en(i + 1);
    if (y) en(i - w);
    if (y < h - 1) en(i + w);
  }
  for (let i = 0; i < n; i++) if (data[i * 4 + 3] && !seen[i]) data[i * 4 + 3] = 0;

  await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toFile(out);
  let o = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i]) o++;
  console.log(out, `${w}x${h}`, 'opaque%', ((100 * o) / n).toFixed(1));
}

await cutHands(
  'public/assets/viewhands/pistol-src.jpg',
  { left: 450, top: 310, width: 380, height: 240 },
  'public/assets/viewhands/pistol.png',
  { trimBottom: 24, gunWipe: [80, 0, 300, 115], brighten: 1.55, add: 28 }
);

await cutHands(
  'public/assets/viewhands/rifle-src.png',
  { left: 340, top: 185, width: 440, height: 250 },
  'public/assets/viewhands/rifle.png',
  { trimBottom: 20, gunWipe: [40, 0, 380, 130], brighten: 1.85, add: 40 }
);

console.log('done');
