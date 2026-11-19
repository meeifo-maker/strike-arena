import fs from 'fs';
import sharp from 'sharp';
import * as THREE from 'three';

const file = process.argv[2], outPrefix = process.argv[3];
const b = fs.readFileSync(file);
const jl = b.readUInt32LE(12);
const j = JSON.parse(b.slice(20, 20 + jl).toString());
const binStart = 20 + jl + 8;
const world = [];
const local = (n) => n.matrix ? new THREE.Matrix4().fromArray(n.matrix)
  : new THREE.Matrix4().compose(new THREE.Vector3(...(n.translation || [0, 0, 0])), new THREE.Quaternion(...(n.rotation || [0, 0, 0, 1])), new THREE.Vector3(...(n.scale || [1, 1, 1])));
const walk = (i, p) => { world[i] = p.clone().multiply(local(j.nodes[i])); (j.nodes[i].children || []).forEach((c) => walk(c, world[i])); };
j.scenes[0].nodes.forEach((r) => walk(r, new THREE.Matrix4()));

const pts = [];
j.nodes.forEach((n, ni) => {
  if (n.mesh === undefined) return;
  for (const p of j.meshes[n.mesh].primitives) {
    const a = j.accessors[p.attributes.POSITION], bv = j.bufferViews[a.bufferView];
    const off = binStart + (bv.byteOffset || 0) + (a.byteOffset || 0), stride = bv.byteStride || 12;
    for (let i = 0; i < a.count; i++) {
      const v = new THREE.Vector3(b.readFloatLE(off + i * stride), b.readFloatLE(off + i * stride + 4), b.readFloatLE(off + i * stride + 8)).applyMatrix4(world[ni]);
      pts.push(v);
    }
  }
});
const box = new THREE.Box3().setFromPoints(pts);
console.log('world min', box.min.toArray().map((v) => +v.toFixed(3)), 'max', box.max.toArray().map((v) => +v.toFixed(3)));

// cross-section width along each axis, 10 slices, to find the hand end
for (const ax of ['x', 'y', 'z']) {
  const lo = box.min[ax], hi = box.max[ax], slices = [];
  for (let s = 0; s < 10; s++) {
    const a = lo + ((hi - lo) * s) / 10, c = lo + ((hi - lo) * (s + 1)) / 10;
    const sel = pts.filter((p) => p[ax] >= a && p[ax] <= c);
    const bb = new THREE.Box3().setFromPoints(sel.length ? sel : [new THREE.Vector3()]);
    const sz = bb.getSize(new THREE.Vector3());
    slices.push(`${sel.length}:${sz.toArray().map((v) => v.toFixed(2)).join('/')}`);
  }
  console.log('slices along', ax, slices.join('  '));
}

// orthographic point-splat silhouettes: front(-z view XY), side(ZY), top(XZ)
const views = { xy: ['x', 'y'], zy: ['z', 'y'], xz: ['x', 'z'] };
for (const [name, [u, v]] of Object.entries(views)) {
  const S = 400, img = Buffer.alloc(S * S * 3, 255);
  const span = Math.max(box.max[u] - box.min[u], box.max[v] - box.min[v]) * 1.05;
  const cu = (box.max[u] + box.min[u]) / 2, cv = (box.max[v] + box.min[v]) / 2;
  for (const p of pts) {
    const x = Math.round(((p[u] - cu) / span + 0.5) * (S - 1));
    const y = Math.round((0.5 - (p[v] - cv) / span) * (S - 1));
    if (x < 0 || y < 0 || x >= S || y >= S) continue;
    const i = (y * S + x) * 3;
    img[i] = img[i + 1] = img[i + 2] = 0;
  }
  // axis labels: red dot at +u end, blue dot at +v end
  const dot = (x, y, r, g, bl) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const i = ((y + dy) * S + x + dx) * 3; if (i >= 0 && i < img.length) { img[i] = r; img[i + 1] = g; img[i + 2] = bl } } };
  dot(S - 8, S / 2, 255, 0, 0);
  dot(S / 2, 8, 0, 0, 255);
  await sharp(img, { raw: { width: S, height: S, channels: 3 } }).png().toFile(`${outPrefix}-${name}.png`);
}
console.log('silhouettes written; red dot = +first axis, blue dot = +second axis');
