import fs from 'fs';
import sharp from 'sharp';
import * as THREE from 'three';

// Side profile of a weapon GLB after the same normalisation as fitWeaponToBox + placeLoadedWeapon scaling.
// Usage: node weapon-profile.mjs <glb> <wantLength> <out.png>
const [file, wantArg, out] = process.argv.slice(2);
const b = fs.readFileSync(file);
const jl = b.readUInt32LE(12);
const j = JSON.parse(b.slice(20, 20 + jl).toString());
const binStart = 20 + jl + 8;
const world = [];
const local = (n) => n.matrix ? new THREE.Matrix4().fromArray(n.matrix)
  : new THREE.Matrix4().compose(new THREE.Vector3(...(n.translation || [0, 0, 0])), new THREE.Quaternion(...(n.rotation || [0, 0, 0, 1])), new THREE.Vector3(...(n.scale || [1, 1, 1])));
const walk = (i, p) => { world[i] = p.clone().multiply(local(j.nodes[i])); (j.nodes[i].children || []).forEach((c) => walk(c, world[i])); };
j.scenes[j.scene || 0].nodes.forEach((r) => walk(r, new THREE.Matrix4()));
let pts = [];
j.nodes.forEach((n, ni) => {
  if (n.mesh === undefined || n.skin !== undefined && false) return;
  if (n.mesh === undefined) return;
  for (const p of j.meshes[n.mesh].primitives) {
    const a = j.accessors[p.attributes.POSITION], bv = j.bufferViews[a.bufferView];
    const off = binStart + (bv.byteOffset || 0) + (a.byteOffset || 0), stride = bv.byteStride || 12;
    for (let i = 0; i < a.count; i++) pts.push(new THREE.Vector3(b.readFloatLE(off + i * stride), b.readFloatLE(off + i * stride + 4), b.readFloatLE(off + i * stride + 8)).applyMatrix4(world[ni]));
  }
});
const box = () => new THREE.Box3().setFromPoints(pts);
const recenter = () => { const c = box().getCenter(new THREE.Vector3()); pts.forEach((p) => p.sub(c)); };
const rot = (q) => pts.forEach((p) => p.applyQuaternion(q));
recenter();
let size = box().getSize(new THREE.Vector3());
const ax = [[size.x, new THREE.Vector3(1, 0, 0)], [size.y, new THREE.Vector3(0, 1, 0)], [size.z, new THREE.Vector3(0, 0, 1)]].sort((a, c) => c[0] - a[0]);
rot(new THREE.Quaternion().setFromUnitVectors(ax[0][1], new THREE.Vector3(0, 0, -1))); recenter();
size = box().getSize(new THREE.Vector3());
if (size.x > size.y) { rot(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2)); recenter(); }
size = box().getSize(new THREE.Vector3());
if (size.y > size.z * 1.05) { rot(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2)); recenter(); size = box().getSize(new THREE.Vector3()); if (size.x > size.y) { rot(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2)); recenter(); } }
size = box().getSize(new THREE.Vector3());
const k = +wantArg / Math.max(size.x, size.y, size.z);
pts.forEach((p) => p.multiplyScalar(k));
const bb = box();
console.log('bbox', bb.min.toArray().map((v) => +v.toFixed(3)), bb.max.toArray().map((v) => +v.toFixed(3)));
// vertical extent per z slice: grips/magazine show up as low y
const L = bb.max.z - bb.min.z;
for (let s = 0; s < 24; s++) {
  const z0 = bb.min.z + (L * s) / 24, z1 = z0 + L / 24;
  const sel = pts.filter((p) => p.z >= z0 && p.z < z1);
  if (!sel.length) continue;
  const sb = new THREE.Box3().setFromPoints(sel);
  console.log(`z ${z0.toFixed(3)}..${z1.toFixed(3)} y ${sb.min.y.toFixed(3)}..${sb.max.y.toFixed(3)} x ${sb.min.x.toFixed(3)}..${sb.max.x.toFixed(3)}`);
}
const W = 800, H = 400, sc = Math.min((W - 40) / L, (H - 40) / (bb.max.y - bb.min.y));
const img = Buffer.alloc(W * H * 3, 255);
const put = (x, y, r, g, bl) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const o = (y * W + x) * 3; img[o] = r; img[o + 1] = g; img[o + 2] = bl; };
for (let g = Math.ceil(bb.min.z / 0.05) * 0.05; g <= bb.max.z; g += 0.05) for (let y = 0; y < H; y++) put(Math.round(20 + (g - bb.min.z) * sc), y, Math.abs(g) < 1e-6 ? 255 : 200, 200, 200);
for (let g = Math.ceil(bb.min.y / 0.05) * 0.05; g <= bb.max.y; g += 0.05) for (let x = 0; x < W; x++) put(x, Math.round(H - 20 - (g - bb.min.y) * sc), Math.abs(g) < 1e-6 ? 255 : 200, 200, 200);
for (const p of pts) put(Math.round(20 + (p.z - bb.min.z) * sc), Math.round(H - 20 - (p.y - bb.min.y) * sc), 0, 0, 0);
await sharp(img, { raw: { width: W, height: H, channels: 3 } }).png().toFile(out);
console.log('grid 0.05; red lines = 0; left = -z (front?)');
