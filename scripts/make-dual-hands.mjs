import sharp from 'sharp';
import { removeBackground } from '@imgly/background-removal-node';
import fs from 'fs';

async function rembg(src, out) {
  console.log('rembg', src);
  const blob = await removeBackground(src, { model: 'small', output: { format: 'image/png' } });
  const buf = Buffer.from(await blob.arrayBuffer());
  fs.writeFileSync(out, buf);
  return buf;
}

function keepBottomConnected(data, w, h) {
  const n = w * h;
  const seen = new Uint8Array(n);
  const q = [];
  const en = (i) => {
    if (i < 0 || i >= n || seen[i] || !data[i * 4 + 3]) return;
    seen[i] = 1;
    q.push(i);
  };
  for (let x = 0; x < w; x++) en((h - 1) * w + x);
  for (let y = (h * 0.65) | 0; y < h; y++) {
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
}

function brighten(data, brighten = 1.35, add = 18) {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 30) {
      data[i + 3] = 0;
      continue;
    }
    data[i] = Math.min(255, (data[i] * brighten + add) | 0);
    data[i + 1] = Math.min(255, (data[i + 1] * brighten * 0.95 + add) | 0);
    data[i + 2] = Math.min(255, (data[i + 2] * brighten * 0.9 + add) | 0);
    data[i + 3] = 255;
  }
}

async function finishPlate(rawBuf, out, { bright = 1.35, add = 18 } = {}) {
  const { data, info } = await sharp(rawBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  brighten(data, bright, add);
  keepBottomConnected(data, w, h);
  await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toFile(out);
  console.log('wrote', out, `${w}x${h}`);
  return { data, w, h };
}

async function splitLR(rawBuf, leftOut, rightOut) {
  const { data, info } = await sharp(rawBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  brighten(data, 1.4, 22);
  keepBottomConnected(data, w, h);

  // Split roughly at mid — left support hand vs right grip hand
  const mid = (w * 0.48) | 0;
  const L = Buffer.from(data);
  const R = Buffer.from(data);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (x > mid + 20) L[i + 3] = 0; // wipe right from left plate
      if (x < mid - 20) R[i + 3] = 0; // wipe left from right plate
    }
  }
  // Trim empty margins
  async function trimWrite(buf, out) {
    const png = await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
      .trim({ threshold: 10 })
      .png()
      .toBuffer();
    fs.writeFileSync(out, png);
    const m = await sharp(png).metadata();
    console.log('wrote', out, `${m.width}x${m.height}`);
  }
  await trimWrite(L, leftOut);
  await trimWrite(R, rightOut);
}

// Rifle: separated two-hand gen (left forward / right grip)
const rifleRaw = await rembg(
  'public/assets/viewhands/rifle-gen2.jpg',
  'public/assets/viewhands/rifle-gen2-raw.png'
);
await finishPlate(rifleRaw, 'public/assets/viewhands/rifle.png', { bright: 1.45, add: 24 });
await splitLR(rifleRaw, 'public/assets/viewhands/rifle-L.png', 'public/assets/viewhands/rifle-R.png');

// Pistol: use CS source re-cut for better grip alignment (tan gloves from existing if gen fails look)
const pistolRaw = await rembg(
  'public/assets/viewhands/pistol-gen2.jpg',
  'public/assets/viewhands/pistol-gen2-raw.png'
);
await finishPlate(pistolRaw, 'public/assets/viewhands/pistol.png', { bright: 1.5, add: 26 });

console.log('done');
