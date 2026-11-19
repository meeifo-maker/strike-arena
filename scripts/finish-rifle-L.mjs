import sharp from 'sharp';

async function finish(src, out, { bright = 1.7, add = 32 } = {}) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const n = w * h;

  for (let i = 0; i < data.length; i += 4) {
    let a = data[i + 3];
    if (a < 18) {
      data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0;
      continue;
    }
    let r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const lum = (r + g + b) / 3;

    // kill dark fringe + white blowout at sleeve cut
    if (lum < 16 || (lum > 235 && a < 200)) {
      data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0;
      continue;
    }
    if (lum < 30 && a < 140) {
      data[i + 3] = 0;
      continue;
    }

    // wipe near-black vertical grip leftovers (keep tan/grey glove)
    const grey = Math.abs(r - g) < 14 && Math.abs(g - b) < 14;
    if (grey && lum < 55) {
      data[i + 3] = 0;
      continue;
    }

    data[i] = Math.min(255, (r * bright + add) | 0);
    data[i + 1] = Math.min(255, (g * bright * 0.98 + add) | 0);
    data[i + 2] = Math.min(255, (b * bright * 0.95 + add) | 0);
    data[i + 3] = a >= 65 ? 255 : Math.max(0, ((a / 65) * 255) | 0);
  }

  const seen = new Uint8Array(n);
  const q = [];
  const en = (i) => {
    if (i < 0 || i >= n || seen[i] || !data[i * 4 + 3]) return;
    seen[i] = 1;
    q.push(i);
  };
  for (let y = (h * 0.7) | 0; y < h; y++) for (let x = 0; x < w; x++) en(y * w + x);
  for (let x = 0; x < w; x++) en((h - 1) * w + x);
  let qi = 0;
  while (qi < q.length) {
    const i = q[qi++];
    const x = i % w;
    if (x) en(i - 1);
    if (x < w - 1) en(i + 1);
    if (i >= w) en(i - w);
    if (i + w < n) en(i + w);
  }
  for (let i = 0; i < n; i++) if (data[i * 4 + 3] && !seen[i]) data[i * 4 + 3] = 0;

  for (let y = h - 14; y < h; y++) {
    const f = Math.pow((h - 1 - y) / 13, 0.7);
    for (let x = 0; x < w; x++) data[(y * w + x) * 4 + 3] = (data[(y * w + x) * 4 + 3] * f) | 0;
  }

  await sharp(data, { raw: { width: w, height: h, channels: 4 } }).trim({ threshold: 8 }).png().toFile(out);
  console.log('wrote', out, (await sharp(out).metadata()).width + 'x' + (await sharp(out).metadata()).height);
}

// Clean single left support hand (no right hand, no gun)
await finish('public/assets/viewhands/rifle-L-only.png', 'public/assets/viewhands/rifle.png', {
  bright: 2.0,
  add: 36
});
console.log('done');
