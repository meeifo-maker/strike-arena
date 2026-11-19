import sharp from 'sharp';
import { removeBackground } from '@imgly/background-removal-node';
import fs from 'fs';

async function plate(cropPath, outPath, { trimBottom = 0, gunRect }) {
  console.log('rembg', cropPath);
  const blob = await removeBackground(cropPath, {
    model: 'medium',
    output: { format: 'image/png' }
  });
  const buf = Buffer.from(await blob.arrayBuffer());
  fs.writeFileSync(outPath.replace('.png', '-raw.png'), buf);

  let img = sharp(buf).ensureAlpha();
  const meta = await img.metadata();
  if (trimBottom) {
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
  const [gx0, gy0, gx1, gy1] = gunRect;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < 50) {
        data[i + 3] = 0;
        continue;
      }
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = (r + g + b) / 3;
      const inGun = x >= gx0 && x <= gx1 && y >= gy0 && y <= gy1;
      const lower = y > h * 0.42;
      // erase most of baked CS gun so our 3D gun sits cleanly on hands
      if (inGun && !lower && lum > 48 && Math.abs(r - g) < 28) {
        data[i + 3] = 0;
        continue;
      }
      data[i] = Math.min(255, (r * 1.75 + 45) | 0);
      data[i + 1] = Math.min(255, (g * 1.65 + 40) | 0);
      data[i + 2] = Math.min(255, (b * 1.55 + 35) | 0);
      data[i + 3] = 255;
    }
  }

  const keep = new Uint8Array(n);
  const seen = new Uint8Array(n);
  const q = [];
  for (let i = 0; i < n; i++) keep[i] = data[i * 4 + 3] > 0 ? 1 : 0;
  const en = (i) => {
    if (i < 0 || i >= n || seen[i] || !keep[i]) return;
    seen[i] = 1;
    q.push(i);
  };
  for (let x = 0; x < w; x++) en((h - 1) * w + x);
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
  for (let i = 0; i < n; i++) if (keep[i] && !seen[i]) data[i * 4 + 3] = 0;

  await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toFile(outPath);
  let o = 0;
  let sr = 0;
  let sg = 0;
  let sb = 0;
  for (let i = 0; i < n; i++) {
    if (data[i * 4 + 3]) {
      o++;
      sr += data[i * 4];
      sg += data[i * 4 + 1];
      sb += data[i * 4 + 2];
    }
  }
  console.log(outPath, `${w}x${h}`, 'op%', ((100 * o) / n).toFixed(1), 'avg', (sr / o) | 0, (sg / o) | 0, (sb / o) | 0);
}

await plate('public/assets/viewhands/pistol-crop.png', 'public/assets/viewhands/pistol.png', {
  trimBottom: 28,
  gunRect: [90, 0, 300, 110]
});
await plate('public/assets/viewhands/rifle-crop.png', 'public/assets/viewhands/rifle.png', {
  trimBottom: 22,
  gunRect: [30, 0, 360, 125]
});
console.log('all done');
