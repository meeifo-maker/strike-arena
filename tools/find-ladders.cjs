// Finds ladders in a SAM1 map by shape: columns of evenly spaced thin horizontal rung faces.
// Usage: node tools/find-ladders.cjs public/assets/maps/mirage.bin
const fs = require('fs');
const buf = fs.readFileSync(process.argv[2]);
const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
const vc = dv.getUint32(4, true), tc = dv.getUint32(8, true);
const mn = [0, 1, 2].map((i) => dv.getFloat32(12 + i * 4, true)), mx = [0, 1, 2].map((i) => dv.getFloat32(24 + i * 4, true));
let o = 36;
const pos = new Float32Array(vc * 3);
for (let i = 0; i < vc * 3; i++) { const a = i % 3; pos[i] = mn[a] + (dv.getUint16(o + i * 2, true) / 65535) * (mx[a] - mn[a]) }
o += vc * 6; o += vc * 3; o += vc; o = (o + 3) & ~3;
const idx = new Uint32Array(buf.buffer.slice(buf.byteOffset + o, buf.byteOffset + o + tc * 12));

// Upward-facing thin strips (top faces of rungs)
const rungs = [];
for (let t = 0; t < tc; t++) {
  const a = idx[t * 3] * 3, b = idx[t * 3 + 1] * 3, c = idx[t * 3 + 2] * 3;
  const ys = [pos[a + 1], pos[b + 1], pos[c + 1]];
  if (Math.max(...ys) - Math.min(...ys) > 0.05) continue;
  const xs = [pos[a], pos[b], pos[c]], zs = [pos[a + 2], pos[b + 2], pos[c + 2]];
  const ux = xs[1] - xs[0], uy = ys[1] - ys[0], uz = zs[1] - zs[0], vx = xs[2] - xs[0], vy = ys[2] - ys[0], vz = zs[2] - zs[0];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (Math.abs(ny) < 0.7 * Math.hypot(nx, ny, nz)) continue;
  const sx = Math.max(...xs) - Math.min(...xs), sz = Math.max(...zs) - Math.min(...zs);
  const long = Math.max(sx, sz), thin = Math.min(sx, sz);
  if (long < 0.3 || long > 1.2 || thin < 0.004 || thin > 0.12) continue;
  rungs.push({ x: (Math.max(...xs) + Math.min(...xs)) / 2, z: (Math.max(...zs) + Math.min(...zs)) / 2, y: ys[0], ax: sx > sz ? 'x' : 'z', w: long });
}
// Merge the two triangles of each quad
rungs.sort((p, q) => p.y - q.y);
const uniq = [];
for (const r of rungs) {
  if (uniq.some((u) => Math.abs(u.y - r.y) < 0.02 && u.ax === r.ax && Math.hypot(u.x - r.x, u.z - r.z) < 0.05)) continue;
  uniq.push(r);
}
const used = new Set(), ladders = [];
for (let i = 0; i < uniq.length; i++) {
  if (used.has(i)) continue;
  const r = uniq[i], col = [i];
  for (let j = i + 1; j < uniq.length; j++) {
    const q = uniq[j];
    const last = uniq[col[col.length - 1]];
    if (used.has(j) || q.ax !== r.ax || Math.hypot(q.x - last.x, q.z - last.z) > 0.12 || Math.abs(q.w - r.w) > 0.08) continue;
    const gap = q.y - last.y;
    if (gap < 0.28) continue;
    if (gap > 0.8) break;
    col.push(j);
  }
  if (col.length < 7) continue;
  const rs = col.map((k) => uniq[k]), gaps = rs.slice(1).map((q, k) => q.y - rs[k].y), g = gaps.reduce((s, v) => s + v, 0) / gaps.length;
  if (gaps.some((v) => Math.abs(v - g) > 0.08)) continue;
  col.forEach((k) => used.add(k));
  ladders.push({ x: +(rs.reduce((s, q) => s + q.x, 0) / rs.length).toFixed(2), z: +(rs.reduce((s, q) => s + q.z, 0) / rs.length).toFixed(2),
    y0: +rs[0].y.toFixed(2), y1: +rs[rs.length - 1].y.toFixed(2), ax: r.ax, w: +r.w.toFixed(2), n: rs.length, gap: +g.toFixed(2) });
}
// One entry per physical ladder: merge duplicate faces and segments split by a deck
const merged = [];
for (const l of ladders.sort((a, b) => a.y0 - b.y0)) {
  const m = merged.find((q) => q.ax === l.ax && Math.hypot(q.x - l.x, q.z - l.z) < 0.15 && l.y0 <= q.y1 + 1.6);
  if (m) { m.y1 = Math.max(m.y1, l.y1); m.w = Math.max(m.w, l.w) } else merged.push({ ...l });
}
const out = merged.map((l) => [l.x, l.z, l.ax === 'x' ? 0 : 1, l.w, +(l.y0 - 0.8).toFixed(2), +(l.y1 + 0.3).toFixed(2)]);
console.log('rung faces', uniq.length, 'segments', ladders.length, 'ladders', out.length);
console.log('// [x, z, widthAxis (0=x,1=z), width, yBottom, yTop]');
console.log(JSON.stringify(out));
