import sharp from 'sharp';

const src = process.argv[2];
const out = process.argv[3];
const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;
const n = w * h;

for (let i = 0; i < data.length; i += 4) {
  const m = Math.max(data[i], data[i + 1], data[i + 2]);
  data[i + 3] = m < 14 ? 0 : m < 34 ? (((m - 14) / 20) * 255) | 0 : 255;
}

// keep only the arm component touching the bottom edge
const seen = new Uint8Array(n);
const q = [];
const en = (i) => {
  if (i < 0 || i >= n || seen[i] || data[i * 4 + 3] < 40) return;
  seen[i] = 1;
  q.push(i);
};
for (let x = 0; x < w; x++) en((h - 1) * w + x);
for (let qi = 0; qi < q.length; qi++) {
  const i = q[qi], x = i % w;
  if (x) en(i - 1);
  if (x < w - 1) en(i + 1);
  en(i - w);
  en(i + w);
}
let minX = w, maxX = 0, minY = h;
for (let i = 0; i < n; i++) {
  if (!seen[i] && data[i * 4 + 3] >= 40) data[i * 4 + 3] = 0;
  if (seen[i]) {
    const x = i % w, y = (i / w) | 0;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
  }
}
const pad = 6;
const left = Math.max(0, minX - pad), top = Math.max(0, minY - pad);
const width = Math.min(w, maxX + pad + 1) - left, height = h - top;
await sharp(data, { raw: { width: w, height: h, channels: 4 } })
  .extract({ left, top, width, height })
  .png()
  .toFile(out);
console.log('wrote', out, width + 'x' + height, 'aspect', (width / height).toFixed(3));
