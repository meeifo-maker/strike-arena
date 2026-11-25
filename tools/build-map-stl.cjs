// Bakes a binary STL map (Z up) into the same .bin layout as build-map.cjs.
// usage: node tools/build-map-stl.cjs <in.stl> <out.bin> <scale>
// Floors (normal.y > 0.7) get surf 1 (light stone), everything else surf 0 (plaster).
const fs = require('fs');
const [, , inPath, outPath, scaleArg] = process.argv;
const s = +scaleArg || 1;
const buf = fs.readFileSync(inPath), tc = buf.readUInt32LE(80), vc = tc * 3;
const P = new Float64Array(vc * 3), N = new Float64Array(vc * 3), S = new Uint8Array(vc);
let kept = 0;
for (let t = 0; t < tc; t++) {
  const o = 84 + t * 50, v = [];
  // STL (x, y, z-up) -> game (x, y-up, -y)
  for (let q = 0; q < 3; q++) { const p = o + 12 + q * 12; v.push([buf.readFloatLE(p) * s, buf.readFloatLE(p + 8) * s, -buf.readFloatLE(p + 4) * s]) }
  const ux = v[1][0] - v[0][0], uy = v[1][1] - v[0][1], uz = v[1][2] - v[0][2], wx = v[2][0] - v[0][0], wy = v[2][1] - v[0][1], wz = v[2][2] - v[0][2];
  let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
  const l = Math.hypot(nx, ny, nz);
  if (l < 1e-9) continue;
  nx /= l; ny /= l; nz /= l;
  for (let q = 0; q < 3; q++) {
    const i = kept * 3 + q;
    P[i * 3] = v[q][0]; P[i * 3 + 1] = v[q][1]; P[i * 3 + 2] = v[q][2];
    N[i * 3] = nx; N[i * 3 + 1] = ny; N[i * 3 + 2] = nz;
    S[i] = ny > 0.7 ? 1 : 0;
  }
  kept++;
}
const VC = kept * 3, TC = kept;
const min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
for (let k = 0; k < VC * 3; k++) { const c = k % 3; min[c] = Math.min(min[c], P[k]); max[c] = Math.max(max[c], P[k]) }
// Recentre horizontally; the lowest point of the model sits at y = 0
const cx = (min[0] + max[0]) / 2, cz = (min[2] + max[2]) / 2, cy = min[1];
for (let k = 0; k < VC * 3; k += 3) { P[k] -= cx; P[k + 1] -= cy; P[k + 2] -= cz }
min[0] -= cx; max[0] -= cx; min[1] -= cy; max[1] -= cy; min[2] -= cz; max[2] -= cz;

const head = 36, posB = VC * 6, nrmB = VC * 3, sfB = VC, pad = (4 - ((head + posB + nrmB + sfB) % 4)) % 4;
const out = Buffer.alloc(head + posB + nrmB + sfB + pad + TC * 12);
let o = 0;
out.write('SAM1', 0); o = 4;
out.writeUInt32LE(VC, o); o += 4; out.writeUInt32LE(TC, o); o += 4;
for (const v of min.concat(max)) { out.writeFloatLE(v, o); o += 4 }
for (let k = 0; k < VC * 3; k++) { const c = k % 3, q = Math.round((P[k] - min[c]) / (max[c] - min[c] || 1) * 65535); out.writeUInt16LE(Math.max(0, Math.min(65535, q)), o); o += 2 }
for (let k = 0; k < VC * 3; k++) { out.writeInt8(Math.max(-127, Math.min(127, Math.round(N[k] * 127))), o); o++ }
for (let k = 0; k < VC; k++) { out.writeUInt8(S[k], o); o++ }
o += pad;
for (let k = 0; k < VC; k++) { out.writeUInt32LE(k, o); o += 4 }
fs.writeFileSync(outPath, out);
console.log(JSON.stringify({ tris: TC, dropped: tc - TC, size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]].map((v) => +v.toFixed(1)), MB: +(out.length / 1e6).toFixed(2) }));
