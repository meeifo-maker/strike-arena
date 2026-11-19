import { removeBackground } from '@imgly/background-removal-node';
import fs from 'fs';

const crop = process.argv[2];
const out = process.argv[3];
console.log('rembg', crop, '->', out);
const blob = await removeBackground(crop, { model: 'small', output: { format: 'image/png' } });
fs.writeFileSync(out, Buffer.from(await blob.arrayBuffer()));
console.log('wrote', out, fs.statSync(out).size);
