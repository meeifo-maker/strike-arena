import fs from 'fs';

// Print per-Y-slice x/z extents for the right arm (z<0) of the static arms GLB.
const b = fs.readFileSync(process.argv[2]);
const jl = b.readUInt32LE(12);
const j = JSON.parse(b.slice(20, 20 + jl).toString());
const bin = 20 + jl + 8;
const acc = j.accessors[j.meshes[0].primitives[0].attributes.POSITION];
const v = j.bufferViews[acc.bufferView];
const f = new Float32Array(b.buffer.slice(b.byteOffset + bin + (v.byteOffset || 0) + (acc.byteOffset || 0)), 0, acc.count * 3);
// node matrices: apply full chain to get world coords
const M = (m) => m;
const mul = (a, c) => { const r = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) for (let l = 0; l < 4; l++) r[k * 4 + i] += a[l * 4 + i] * c[k * 4 + l]; return r; };
let W = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
const chain = [0, 1, 2, 3, 4];
for (const n of chain) if (j.nodes[n].matrix) W = mul(W, M(j.nodes[n].matrix));
const pts = [];
for (let i = 0; i < acc.count; i++) {
  const x = f[i * 3], y = f[i * 3 + 1], z = f[i * 3 + 2];
  pts.push([W[0] * x + W[4] * y + W[8] * z + W[12], W[1] * x + W[5] * y + W[9] * z + W[13], W[2] * x + W[6] * y + W[10] * z + W[14]]);
}
const side = process.argv[3] === 'L' ? 1 : -1;
const arm = pts.filter(p => Math.sign(p[2]) === side);
for (let y = -0.5; y < 0.52; y += 0.025) {
  const s = arm.filter(p => p[1] >= y && p[1] < y + 0.025);
  if (!s.length) continue;
  const xs = s.map(p => p[0]), zs = s.map(p => p[2]);
  // also list x-clusters along z to spot thumb vs fingers
  const zb = {};
  for (const p of s) { const k = Math.round(p[2] * 50) / 50; (zb[k] ||= []).push(p[0]); }
  const cols = Object.keys(zb).map(Number).sort((a, c) => a - c).map(k => `${k.toFixed(2)}:${Math.min(...zb[k]).toFixed(3)}..${Math.max(...zb[k]).toFixed(3)}`).join(' ');
  console.log(y.toFixed(3), 'n', s.length, 'x', Math.min(...xs).toFixed(3), Math.max(...xs).toFixed(3), 'z', Math.min(...zs).toFixed(3), Math.max(...zs).toFixed(3), '|', y > 0 ? cols : '');
}
