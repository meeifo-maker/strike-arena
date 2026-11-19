import sharp from 'sharp';

async function finish(rawPath, outPath, { bright = 2.0, add = 30, solidify = 90 } = {}) {
  const { data, info } = await sharp(rawPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
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

    // drop dark rembg fringe (causes black boxes in WebGL)
    if (lum < 22 || (lum < 35 && a < 140)) {
      data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0;
      continue;
    }

    r = Math.min(255, r * bright + add);
    g = Math.min(255, g * bright * 0.98 + add);
    b = Math.min(255, b * bright * 0.95 + add);
    data[i] = r | 0;
    data[i + 1] = g | 0;
    data[i + 2] = b | 0;
    // solid body, soft edge only
    data[i + 3] = a >= solidify ? 255 : Math.max(0, ((a / solidify) * 255) | 0);
  }

  const seen = new Uint8Array(n);
  const q = [];
  const en = (i) => {
    if (i < 0 || i >= n || seen[i] || !data[i * 4 + 3]) return;
    seen[i] = 1;
    q.push(i);
  };
  for (let x = 0; x < w; x++) en((h - 1) * w + x);
  for (let y = (h * 0.68) | 0; y < h; y++) {
    en(y * w);
    en(y * w + w - 1);
  }
  // also seed from any near-bottom opaque (clasped hands may not touch exact bottom)
  for (let y = (h * 0.85) | 0; y < h; y++) for (let x = 0; x < w; x++) en(y * w + x);
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
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      data[i + 3] = (data[i + 3] * f) | 0;
    }
  }

  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 10 })
    .png()
    .toFile(outPath);
  const m = await sharp(outPath).metadata();
  console.log('wrote', outPath, `${m.width}x${m.height}`);
}

await finish('public/assets/viewhands/rifle-gen2-raw.png', 'public/assets/viewhands/rifle.png', {
  bright: 2.35,
  add: 42,
  solidify: 70
});

// Use solid v18 two-hand pistol (tan gloves) — brighten + soft bottom
await finish('public/assets/viewhands/pistol-v18.png', 'public/assets/viewhands/pistol.png', {
  bright: 1.35,
  add: 22,
  solidify: 40
});

console.log('done');
