import fs from 'fs';
import * as THREE from 'three';

const b = fs.readFileSync(process.argv[2]);
const jl = b.readUInt32LE(12);
const j = JSON.parse(b.slice(20, 20 + jl).toString());
const world = [];
function local(n) {
  const m = new THREE.Matrix4();
  if (n.matrix) return m.fromArray(n.matrix);
  const t = new THREE.Vector3(...(n.translation || [0, 0, 0]));
  const r = new THREE.Quaternion(...(n.rotation || [0, 0, 0, 1]));
  const s = new THREE.Vector3(...(n.scale || [1, 1, 1]));
  return m.compose(t, r, s);
}
function walk(i, parent) {
  const w = parent.clone().multiply(local(j.nodes[i]));
  world[i] = w;
  (j.nodes[i].children || []).forEach((c) => walk(c, w));
}
j.scenes[0].nodes.forEach((r) => walk(r, new THREE.Matrix4()));
const p = (i) => new THREE.Vector3().setFromMatrixPosition(world[i]).toArray().map((v) => +v.toFixed(3));
j.nodes.forEach((n, i) => {
  if (/^(arm_upper_[LR]|arm_lower_[LR]|hand_[LR]|finger_middle_2|finger_thumb_2)/.test(n.name || '') || n.mesh !== undefined || i >= 55)
    console.log(i, n.name, p(i), n.mesh !== undefined ? 'MESH skin=' + n.skin : '');
});
const s = new THREE.Vector3();
world[0].decompose(new THREE.Vector3(), new THREE.Quaternion(), s);
console.log('root scale', s.toArray().map((v) => +v.toFixed(3)));
