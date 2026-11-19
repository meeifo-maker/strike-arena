import fs from 'fs';
import sharp from 'sharp';

// Re-encode embedded GLB textures to smaller JPEGs and repack the binary chunk.
const [src, out, size = '2048'] = process.argv.slice(2);
const b = fs.readFileSync(src);
const jl = b.readUInt32LE(12);
const j = JSON.parse(b.slice(20, 20 + jl).toString());
const binStart = 20 + jl + 8;
const imageViews = new Map((j.images || []).map((im, i) => [im.bufferView, i]));

const chunks = [];
let offset = 0;
for (let vi = 0; vi < j.bufferViews.length; vi++) {
  const v = j.bufferViews[vi];
  let data = b.slice(binStart + (v.byteOffset || 0), binStart + (v.byteOffset || 0) + v.byteLength);
  if (imageViews.has(vi)) {
    data = await sharp(data).resize(+size, +size, { fit: 'inside' }).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
    j.images[imageViews.get(vi)].mimeType = 'image/jpeg';
  }
  const pad = (4 - (offset % 4)) % 4;
  if (pad) { chunks.push(Buffer.alloc(pad)); offset += pad; }
  v.byteOffset = offset;
  v.byteLength = data.length;
  v.buffer = 0;
  chunks.push(data);
  offset += data.length;
}
const bin = Buffer.concat(chunks);
const binPadded = Buffer.concat([bin, Buffer.alloc((4 - (bin.length % 4)) % 4)]);
j.buffers = [{ byteLength: bin.length }];
let json = Buffer.from(JSON.stringify(j));
json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + json.length + 8 + binPadded.length, 8);
const jh = Buffer.alloc(8); jh.writeUInt32LE(json.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
const bh = Buffer.alloc(8); bh.writeUInt32LE(binPadded.length, 0); bh.writeUInt32LE(0x004e4942, 4);
fs.writeFileSync(out, Buffer.concat([header, jh, json, bh, binPadded]));
console.log('wrote', out, (fs.statSync(out).size / 1e6).toFixed(2), 'MB');
