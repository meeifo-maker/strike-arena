import fs from 'fs';

const b = fs.readFileSync(process.argv[2]);
const jl = b.readUInt32LE(12);
const j = JSON.parse(b.slice(20, 20 + jl).toString());
console.log('meshes', (j.meshes || []).map((m) => `${m.name}(${m.primitives.length})`).join(', '));
console.log('skins', (j.skins || []).length, 'joints', (j.skins || []).map((s) => s.joints.length));
console.log('anims', (j.animations || []).map((a) => a.name));
console.log('materials', (j.materials || []).map((m) => m.name));
console.log('images', (j.images || []).map((im) => `${im.mimeType} ${j.bufferViews[im.bufferView]?.byteLength}`));
for (const m of j.meshes || [])
  for (const p of m.primitives) {
    const a = j.accessors[p.attributes.POSITION];
    console.log('pos', m.name, a.count, 'min', a.min?.map((v) => +v.toFixed(3)), 'max', a.max?.map((v) => +v.toFixed(3)));
  }
j.nodes.forEach((n, i) => {
  if (i > 40) return;
  console.log(i, n.name, n.mesh !== undefined ? 'mesh' + n.mesh : '', n.skin !== undefined ? 'skin' : '', n.children ? 'kids:' + n.children.join(',') : '', n.scale ? 's' + n.scale.map((v) => +v.toFixed(3)) : '', n.rotation ? 'r' + n.rotation.map((v) => +v.toFixed(3)) : '', n.translation ? 't' + n.translation.map((v) => +v.toFixed(3)) : '', n.matrix ? 'matrix' : '');
});
console.log('nodes total', j.nodes.length, 'scene roots', j.scenes?.[0]?.nodes);
