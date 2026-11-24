// Bakes a Sketchfab/Blender map GLB into the compact binary the game streams (public/assets/maps/<name>.bin).
// usage: node tools/build-map.cjs <in.glb> <out.bin>
//
// Layout (little endian):
//   'SAM1' | u32 vertCount | u32 triCount | f32 min[3] | f32 max[3]
//   u16 pos[vertCount*3] (quantised over min..max) | i8 nrm[vertCount*3] | u8 surf[vertCount]
//   (pad to 4) | u32 idx[triCount*3]
// surf: 0 plaster/dev, 1 light stone, 2 dark trim, 3 wood, 4 metal
const fs = require('fs');
const [, , inPath, outPath] = process.argv;
const buf = fs.readFileSync(inPath);
const jsonLen = buf.readUInt32LE(12);
const j = JSON.parse(buf.slice(20, 20 + jsonLen).toString());
const binStart = 20 + jsonLen + 8;

const SKIP_NODE = /blocklight|_shadow|overlay|toolsnodraw|toolsclip|skybox/i;
function surfOf(matName, nodeName) {
  const s = (matName + ' ' + nodeName).toLowerCase();
  if (/black|trim|metal|nuke/.test(s)) return /metal|nuke/.test(s) ? 4 : 2;
  if (/wood|door/.test(s)) return 3;
  if (/reflectivity|stone|step|block/.test(s)) return 1;
  return 0;
}

const COMP = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const NCOMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
function readAccessor(i) {
  const a = j.accessors[i], bv = j.bufferViews[a.bufferView], T = COMP[a.componentType], n = NCOMP[a.type];
  const off = binStart + (bv.byteOffset || 0) + (a.byteOffset || 0), stride = bv.byteStride || n * T.BYTES_PER_ELEMENT;
  const out = new Float64Array(a.count * n);
  for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) {
    const p = off + k * stride + c * T.BYTES_PER_ELEMENT;
    out[k * n + c] = T === Float32Array ? buf.readFloatLE(p) : T === Uint32Array ? buf.readUInt32LE(p) : T === Uint16Array ? buf.readUInt16LE(p) : T === Uint8Array ? buf.readUInt8(p) : T === Int16Array ? buf.readInt16LE(p) : buf.readInt8(p);
  }
  return out;
}

// column-major 4x4
function compose(t, r, s) {
  const [x, y, z, w] = r || [0, 0, 0, 1], [sx, sy, sz] = s || [1, 1, 1];
  const xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
  return [(1 - 2 * (yy + zz)) * sx, 2 * (xy + wz) * sx, 2 * (xz - wy) * sx, 0,
    2 * (xy - wz) * sy, (1 - 2 * (xx + zz)) * sy, 2 * (yz + wx) * sy, 0,
    2 * (xz + wy) * sz, 2 * (yz - wx) * sz, (1 - 2 * (xx + yy)) * sz, 0,
    (t || [0, 0, 0])[0], (t || [0, 0, 0])[1], (t || [0, 0, 0])[2], 1];
}
function mul(a, b) {
  const o = new Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let v = 0; for (let k = 0; k < 4; k++) v += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = v }
  return o;
}

const P = [], N = [], S = [], I = [];
let skipped = 0;
function visit(ni, parent, parentSkip) {
  const n = j.nodes[ni];
  const local = n.matrix ? n.matrix : compose(n.translation, n.rotation, n.scale);
  const m = mul(parent, local), skip = parentSkip || SKIP_NODE.test(n.name || '');
  if (n.mesh != null) for (const p of j.meshes[n.mesh].primitives) {
    const mat = j.materials[p.material], mn = mat ? mat.name : '';
    if (skip || (mat && mat.alphaMode === 'BLEND')) { skipped++; continue }
    const pos = readAccessor(p.attributes.POSITION), nrm = p.attributes.NORMAL != null ? readAccessor(p.attributes.NORMAL) : null;
    const base = P.length / 3, sf = surfOf(mn, n.name || '');
    for (let k = 0; k < pos.length; k += 3) {
      const x = pos[k], y = pos[k + 1], z = pos[k + 2];
      P.push(m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]);
      if (nrm) {
        const a = nrm[k], b = nrm[k + 1], c = nrm[k + 2];
        let nx = m[0] * a + m[4] * b + m[8] * c, ny = m[1] * a + m[5] * b + m[9] * c, nz = m[2] * a + m[6] * b + m[10] * c;
        const l = Math.hypot(nx, ny, nz) || 1; N.push(nx / l, ny / l, nz / l);
      } else N.push(0, 1, 0);
      S.push(sf);
    }
    const idx = p.indices != null ? readAccessor(p.indices) : Array.from({ length: pos.length / 3 }, (_, q) => q);
    for (let k = 0; k < idx.length; k++) I.push(base + idx[k]);
  }
  for (const c of n.children || []) visit(c, m, skip);
}
const ID = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
for (const r of j.scenes[j.scene || 0].nodes) visit(r, ID, false);

const vc = P.length / 3, tc = I.length / 3;
const min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
for (let k = 0; k < P.length; k += 3) for (let c = 0; c < 3; c++) { min[c] = Math.min(min[c], P[k + c]); max[c] = Math.max(max[c], P[k + c]) }
// Recentre horizontally so the map sits around the origin; heights are kept (metres)
const cx = (min[0] + max[0]) / 2, cz = (min[2] + max[2]) / 2;
for (let k = 0; k < P.length; k += 3) { P[k] -= cx; P[k + 2] -= cz }
min[0] -= cx; max[0] -= cx; min[2] -= cz; max[2] -= cz;

const head = 4 + 4 + 4 + 24, posB = vc * 6, nrmB = vc * 3, sfB = vc, pad = (4 - ((head + posB + nrmB + sfB) % 4)) % 4;
const out = Buffer.alloc(head + posB + nrmB + sfB + pad + tc * 12);
let o = 0;
out.write('SAM1', 0); o = 4;
out.writeUInt32LE(vc, o); o += 4; out.writeUInt32LE(tc, o); o += 4;
for (const v of min.concat(max)) { out.writeFloatLE(v, o); o += 4 }
for (let k = 0; k < P.length; k++) {
  const c = k % 3, q = Math.round((P[k] - min[c]) / (max[c] - min[c] || 1) * 65535);
  out.writeUInt16LE(Math.max(0, Math.min(65535, q)), o); o += 2;
}
for (let k = 0; k < N.length; k++) { out.writeInt8(Math.max(-127, Math.min(127, Math.round(N[k] * 127))), o); o++ }
for (const s of S) { out.writeUInt8(s, o); o++ }
o += pad;
for (const v of I) { out.writeUInt32LE(v, o); o += 4 }
fs.writeFileSync(outPath, out);
console.log(JSON.stringify({ verts: vc, tris: tc, skippedPrims: skipped, size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]].map((v) => +v.toFixed(1)), yRange: [+min[1].toFixed(2), +max[1].toFixed(2)], recentre: [+cx.toFixed(2), +cz.toFixed(2)], MB: +(out.length / 1e6).toFixed(1) }));
