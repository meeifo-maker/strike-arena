// Builds real skin textures from a local CS2 install for every skin in public/skins-data.js.
// Needs Source2Viewer-CLI (github.com/ValveResourceFormat/ValveResourceFormat, cli-windows-x64.zip).
// Usage: node scripts/extract-skins.mjs ["path/to/pak01_dir.vpk"] [--cli path/to/Source2Viewer-CLI.exe]
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import sharp from 'sharp';

const args = process.argv.slice(2);
const cliIdx = args.indexOf('--cli');
const CLI = cliIdx >= 0 ? args.splice(cliIdx, 2)[1] : path.join(process.env.LOCALAPPDATA || '', 's2v-cli', 'Source2Viewer-CLI.exe');
const VPK = args[0] || 'C:/Program Files (x86)/Steam/steamapps/common/Counter-Strike Global Offensive/game/csgo/pak01_dir.vpk';
const TMP = path.join(os.tmpdir(), 'cs2-skin-extract');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const PUB = path.join(ROOT, 'public');
const OUT = path.join(PUB, 'assets/skins/tex');
const DATA = path.join(PUB, 'skins-data.js');
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const s2v = (...a) => execFileSync(CLI, ['-i', VPK, ...a], { maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
const listFile = path.join(TMP, 'list.txt');
if (!fs.existsSync(listFile)) fs.writeFileSync(listFile, s2v('--vpk_list'));
const LIST = fs.readFileSync(listFile, 'utf8').split('\n').map((l) => l.split(' ')[0].trim()).filter(Boolean);
const find = (suffix) => LIST.find((p) => p.endsWith(suffix));

const dump = (vpath) => {
  const out = path.join(TMP, vpath.replace(/_c$/, ''));
  if (!fs.existsSync(out)) s2v('--vpk_filepath', vpath, '-d', '-o', TMP);
  return out;
};
// "x/name_psd_1a2b3c.vtex" → dumped png path
const texPng = (ref) => {
  const vtex = ref.replace(/^resource_name:/, '').replace(/"/g, '');
  const want = path.join(TMP, vtex.replace(/_(psd|tga|png|tif|exr)_[0-9a-f]+\.vtex$/, '.png').replace(/\.vtex$/, '.png'));
  if (!fs.existsSync(want)) s2v('--vpk_filepath', vtex + '_c', '-d', '-o', TMP);
  if (fs.existsSync(want)) return want;
  const dir = path.dirname(want), stem = path.basename(want, '.png');
  const alt = fs.existsSync(dir) && fs.readdirSync(dir).find((f) => f.startsWith(stem) && f.endsWith('.png'));
  if (alt) return path.join(dir, alt);
  throw new Error('texture not dumped: ' + vtex);
};

const STYLE = { so: 0, hy: 1, sp: 2, an: 3, am: 4, aa: 5, cu: 6, aq: 7, gs: 8 };
function readPaint(pk) {
  const vmat = find(`/paints/vmats/${pk}.vmat_c`);
  if (vmat) {
    const txt = fs.readFileSync(dump(vmat), 'utf8'), p = {};
    for (const m of txt.matchAll(/"([\w]+)"\s+"([^"]*)"/g)) p[m[1]] = m[2];
    const col = (i) => (p['g_vColor' + i] || '[0.5 0.5 0.5 1]').replace(/[[\]]/g, '').trim().split(/\s+/).slice(0, 3).map(Number);
    return {
      style: p.F_PAINT_STYLE != null ? +p.F_PAINT_STYLE : 0, pattern: p.g_tPattern, colors: [0, 1, 2, 3].map(col),
      scale: +(p.g_flPatternTexCoordScale || 1), rot: +(p.g_flPatternTexCoordRotation || 0),
      off: (p.g_vPatternTexCoordOffset || '[0 0]').replace(/[[\]]/g, '').trim().split(/\s+/).slice(0, 2).map(Number),
      clamp: p.g_nPatternTextureHorizontalSampling === '2', rough: +(p.g_flPaintRoughness || 0.4),
    };
  }
  const comp = find(`/${pk}.vcompmat_c`);
  if (!comp) throw new Error('no paint material for ' + pk);
  const txt = fs.readFileSync(dump(comp), 'utf8');
  const tpl = (txt.match(/templates\/(\w\w)_/) || [])[1] || 'cu';
  const vars = {};
  for (const blk of txt.split(/m_strName = /).slice(1)) {
    const name = (blk.match(/^"(\w+)"/) || [])[1];
    if (!name || vars[name]) continue;
    const v = {};
    const f = (k) => (blk.match(new RegExp(k + ' = (-?[\\d.]+)')) || [])[1];
    v.x = f('m_flValueFloatX'); v.y = f('m_flValueFloatY');
    const c = blk.match(/m_cValueColor4 = \[ ([\d, ]+) \]/); if (c) v.c = c[1].split(',').map((n) => +n / 255);
    const t = blk.match(/m_strTextureRuntimeResourcePath = resource_name:"([^"]+)"/); if (t) v.t = t[1];
    vars[name] = v;
  }
  return {
    style: STYLE[tpl] ?? 6, pattern: vars.g_tPattern && vars.g_tPattern.t,
    colors: [0, 1, 2, 3].map((i) => (vars['g_vColor' + i] && vars['g_vColor' + i].c) || [0.5, 0.5, 0.5]),
    scale: +((vars.g_flPatternTexCoordScale || {}).x || 1), rot: +((vars.g_flPatternTexCoordRotation || {}).x || 0),
    off: [+((vars.g_vPatternTexCoordOffset || {}).x || 0), +((vars.g_vPatternTexCoordOffset || {}).y || 0)],
    clamp: false, rough: +((vars.g_flPaintRoughness || {}).x || 0.4),
  };
}

// Texture embedded in a weapon .glb (kind: 'baseColorTexture' | 'metallicRoughnessTexture')
function glbTexture(file, kind) {
  const b = fs.readFileSync(file), jl = b.readUInt32LE(12), j = JSON.parse(b.slice(20, 20 + jl).toString());
  const bin = b.slice(20 + jl + 8);
  const ref = j.materials[0].pbrMetallicRoughness[kind];
  if (!ref) return null;
  const img = j.images[j.textures[ref.index].source];
  if (img.uri) return path.resolve(path.dirname(file), img.uri);
  const bv = j.bufferViews[img.bufferView];
  return bin.slice(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
}
// RGB pixels at N×N. Alpha is dropped before resizing: some CS2 textures have alpha 0, which sharp would premultiply to black
const rawCache = new Map();
async function rgbAt(src, N) {
  const key = (typeof src === 'string' ? src : 'buf' + src.length + ':' + src[100]) + ':' + N;
  if (rawCache.has(key)) return rawCache.get(key);
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  let rgb = data;
  if (info.channels !== 3) {
    rgb = Buffer.alloc(info.width * info.height * 3);
    for (let i = 0, n = info.width * info.height; i < n; i++) for (let c = 0; c < 3; c++) rgb[i * 3 + c] = data[i * info.channels + Math.min(c, info.channels - 1)];
  }
  const out = await sharp(rgb, { raw: { width: info.width, height: info.height, channels: 3 } }).resize(N, N, { fit: 'fill' }).raw().toBuffer();
  rawCache.set(key, out);
  return out;
}
async function alphaAt(src, N) {
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const a = Buffer.alloc(info.width * info.height, 255);
  if (info.channels === 4) for (let i = 0; i < a.length; i++) a[i] = data[i * 4 + 3];
  return sharp(a, { raw: { width: info.width, height: info.height, channels: 1 } }).resize(N, N, { fit: 'fill' }).raw().toBuffer();
}
// Custom paints whose alpha marks parts that keep the weapon's own finish (Fire Serpent's wooden furniture);
// on other custom paints alpha is a gloss mask, so this can't be applied generally
const KEEP_BASE_BELOW_ALPHA = { cu_fireserpent_ak47_bravo: 0xc8 };
async function detail(src, N) {
  const rgb = await rgbAt(src, N), d = new Float32Array(N * N);
  let sum = 0, n = 0;
  for (let i = 0; i < N * N; i++) { const l = 0.3 * rgb[i * 3] + 0.59 * rgb[i * 3 + 1] + 0.11 * rgb[i * 3 + 2]; d[i] = l; if (l > 8) { sum += l; n++; } }
  const mean = sum / Math.max(1, n);
  for (let i = 0; i < d.length; i++) d[i] = Math.pow(Math.min(1.6, Math.max(0.3, d[i] / mean)), 0.75);
  return d;
}

// metal: glTF metallicRoughness map (metalness in blue) — limits the paint to metal parts when set
async function composite(paint, base, N, metal) {
  const out = Buffer.alloc(N * N * 3), det = await detail(base, N);
  const c = paint.colors;
  if (paint.style === 6 || paint.style === 8) {
    const rgb = Buffer.from(await rgbAt(texPng(paint.pattern), N));
    const cut = KEEP_BASE_BELOW_ALPHA[paint.pk];
    if (cut) {
      const a = await alphaAt(texPng(paint.pattern), N), b = await rgbAt(base, N);
      for (let i = 0; i < N * N; i++) if (a[i] < cut) for (let ch = 0; ch < 3; ch++) rgb[i * 3 + ch] = b[i * 3 + ch];
    }
    return sharp(rgb, { raw: { width: N, height: N, channels: 3 } }).jpeg({ quality: 85 }).toBuffer();
  }
  const baseRgb = metal ? await rgbAt(base, N) : null, metalRgb = metal ? await rgbAt(metal, N) : null;
  let pat = null, pw = 0, ph = 0;
  if (paint.pattern) {
    const img = sharp(texPng(paint.pattern)).ensureAlpha();
    const m = await img.metadata(); pw = m.width; ph = m.height; pat = await img.raw().toBuffer();
  }
  const a = (-paint.rot * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  const solid = c.slice().sort((p, q) => Math.max(...q) - Math.min(...q) - (Math.max(...p) - Math.min(...p)))[0];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    let r, g, b;
    if (!pat) [r, g, b] = paint.style === 0 ? solid : c[0];
    else {
      const u0 = (x / N - 0.5) * paint.scale, v0 = (y / N - 0.5) * paint.scale;
      let u = ca * u0 - sa * v0 + 0.5 + paint.off[0], v = sa * u0 + ca * v0 + 0.5 + paint.off[1];
      if (paint.clamp) { u = Math.min(1, Math.max(0, u)); v = Math.min(1, Math.max(0, v)); } else { u -= Math.floor(u); v -= Math.floor(v); }
      // brightest of a few taps across this pixel's footprint, so lines thinner than a pixel still show
      const fx = paint.scale / N * pw * 0.5, fy = paint.scale / N * ph * 0.5;
      let pr = 0, pg = 0, pb = 0;
      for (const [dx, dy] of [[0, 0], [fx, 0], [0, fy], [fx, fy]]) {
        const sx = (((u * pw + dx) % pw) + pw) % pw | 0, sy = (((v * ph + dy) % ph) + ph) % ph | 0;
        const k = (Math.min(ph - 1, sy) * pw + Math.min(pw - 1, sx)) * 4;
        pr = Math.max(pr, pat[k] / 255); pg = Math.max(pg, pat[k + 1] / 255); pb = Math.max(pb, pat[k + 2] / 255);
      }
      if (paint.style === 7) [r, g, b] = [pr, pg, pb];
      else {
        [r, g, b] = c[0];
        const mix = (t, cc) => { r += (cc[0] - r) * t; g += (cc[1] - g) * t; b += (cc[2] - b) * t; };
        mix(pr, c[1]); mix(pg, c[2]); mix(pb, c[3]);
      }
    }
    const d = det[i];
    r = Math.min(255, r * d * 255); g = Math.min(255, g * d * 255); b = Math.min(255, b * d * 255);
    if (metal) {
      const t = Math.min(1, Math.max(0, (metalRgb[i * 3 + 2] / 255 - 0.3) / 0.4));
      r = baseRgb[i * 3] + (r - baseRgb[i * 3]) * t; g = baseRgb[i * 3 + 1] + (g - baseRgb[i * 3 + 1]) * t; b = baseRgb[i * 3 + 2] + (b - baseRgb[i * 3 + 2]) * t;
    }
    out[i * 3] = r; out[i * 3 + 1] = g; out[i * 3 + 2] = b;
  }
  return sharp(out, { raw: { width: N, height: N, channels: 3 } }).jpeg({ quality: 85 }).toBuffer();
}

// Legacy (CS:GO-era) weapon mesh, which older skins are UV-mapped for; textures packed into the .glb as JPEGs
async function exportLegacyModel(vmdl, dest) {
  const dir = path.join(TMP, 'models');
  execFileSync(CLI, ['-i', VPK, '--vpk_filepath', vmdl, '--gltf_export_format', 'glb', '--gltf_textures_adapt', '--gltf_mesh_list', 'body_legacy', '-o', dir], { stdio: 'ignore' });
  const file = path.join(dir, vmdl.replace(/\.vmdl_c$/, '.glb'));
  const b = fs.readFileSync(file), jl = b.readUInt32LE(12), j = JSON.parse(b.slice(20, 20 + jl).toString());
  const bl = b.readUInt32LE(20 + jl);
  let bin = b.slice(20 + jl + 8, 20 + jl + 8 + bl);
  for (const m of j.meshes) m.primitives = m.primitives.filter((p) => !/sticker/.test((j.materials[p.material] || {}).name || ''));
  const paint = j.materials.findIndex((m) => !/sticker/.test(m.name || ''));
  if (paint > 0) { const [m] = j.materials.splice(paint, 1); j.materials.unshift(m); for (const me of j.meshes) for (const p of me.primitives) p.material = p.material === paint ? 0 : p.material < paint ? p.material + 1 : p.material; }
  for (const img of j.images || []) {
    if (!img.uri) continue;
    const jpg = await sharp(path.join(path.dirname(file), decodeURIComponent(img.uri))).removeAlpha().resize(1024, 1024).jpeg({ quality: 88 }).toBuffer();
    const pad = (4 - (bin.length % 4)) % 4;
    bin = Buffer.concat([bin, Buffer.alloc(pad)]);
    j.bufferViews.push({ buffer: 0, byteOffset: bin.length, byteLength: jpg.length });
    bin = Buffer.concat([bin, jpg]);
    img.bufferView = j.bufferViews.length - 1; img.mimeType = 'image/jpeg'; delete img.uri;
  }
  bin = Buffer.concat([bin, Buffer.alloc((4 - (bin.length % 4)) % 4)]);
  j.buffers[0].byteLength = bin.length;
  let json = Buffer.from(JSON.stringify(j));
  json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
  const head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
  const ch = (len, type) => { const c = Buffer.alloc(8); c.writeUInt32LE(len, 0); c.writeUInt32LE(type, 4); return c; };
  fs.writeFileSync(dest, Buffer.concat([head, ch(json.length, 0x4e4f534a), json, ch(bin.length, 0x004e4942), bin]));
}
const VMDL = {
  glock: 'weapons/models/glock18/weapon_pist_glock18.vmdl_c', deagle: 'weapons/models/deagle/weapon_pist_deagle.vmdl_c',
  mp9: 'weapons/models/mp9/weapon_smg_mp9.vmdl_c', ak: 'weapons/models/ak47/weapon_rif_ak47.vmdl_c',
  m4: 'weapons/models/m4a1_silencer/weapon_rif_m4a1_silencer.vmdl_c', awp: 'weapons/models/awp/weapon_snip_awp.vmdl_c',
  knife: 'weapons/models/knife/knife_karambit/weapon_knife_karambit.vmdl_c',
};
const LEGACY = {};
fs.mkdirSync(path.join(PUB, 'assets/skins/legacy'), { recursive: true });
for (const [wid, vmdl] of Object.entries(VMDL)) {
  const rel = wid === 'knife' ? 'assets/skins/karambit.glb' : `assets/skins/legacy/${wid}.glb`;
  if (!fs.existsSync(path.join(PUB, rel))) await exportLegacyModel(vmdl, path.join(PUB, rel));
  LEGACY[wid] = rel;
}

const hex = (c) => '#' + c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('');
const src = fs.readFileSync(DATA, 'utf8');
const data = JSON.parse(src.slice(src.indexOf('=') + 1).trim().replace(/;$/, ''));
const BASE = {
  glock: 'assets/weapons/glock.glb', deagle: 'assets/weapons/deagle.glb', mp9: 'assets/weapons/mp9.glb', ak: 'assets/weapons/ak.glb',
  m4: 'assets/weapons/m4.glb', awp: 'assets/weapons/awp.glb', knife: 'assets/skins/karambit.glb',
};
// glock.glb ships with a non-stock base texture, so detail comes from the game's own default colour maps
const STOCK = { glock: '/glock18/materials/glock_default_color', mp9: '/mp9/materials/mp9_default_color' };
for (const [wid, skins] of Object.entries(data)) {
  for (const k of skins) {
    try {
      const legacy = k.legacy || wid === 'knife', model = path.join(PUB, legacy ? LEGACY[wid] : BASE[wid]);
      const stock = !legacy && STOCK[wid] && LIST.find((p) => p.includes(STOCK[wid]) && p.endsWith('.vtex_c'));
      const base = stock ? texPng(stock.replace(/_c$/, '')) : glbTexture(model, 'baseColorTexture');
      const metalMap = glbTexture(model, 'metallicRoughnessTexture');
      const p = { ...readPaint(k.pk), pk: k.pk };
      delete k.tint; delete k.grad; delete k.tex; delete k.shape;
      k.rough = +p.rough.toFixed(2);
      if (p.style === 5 && /\/fade_/.test(p.pattern || '') && wid === 'knife') {
        // gradient along the blade from vertex colours, over a texture that is white on metal and stock elsewhere
        k.grad = [hex(p.colors[3]), hex(p.colors[2]), hex(p.colors[1])]; k.metal = 0.6;
        const white = { ...p, style: 0, pattern: null, colors: [[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]] }, file = `${wid}-${k.id}.jpg`;
        fs.writeFileSync(path.join(OUT, file), await composite(white, base, 1024, metalMap));
        k.tex = `assets/skins/tex/${file}`;
      } else if (p.style === 5 && /\/fade_/.test(p.pattern || '')) { k.grad = [hex(p.colors[3]), hex(p.colors[2]), hex(p.colors[1])]; k.metal = 0.6; }
      else {
        const N = p.style === 6 || p.style === 8 || p.style === 1 ? 2048 : 1024, file = `${wid}-${k.id}.jpg`;
        const metalOnly = p.style === 3 || p.style === 4 || wid === 'knife';
        fs.writeFileSync(path.join(OUT, file), await composite(p, base, N, metalOnly && !stock ? metalMap : null));
        k.tex = `assets/skins/tex/${file}`;
        k.metal = p.style === 3 || p.style === 4 ? 0.8 : p.style === 0 ? 0.3 : undefined;
      }
      if (legacy) k.model = LEGACY[wid] + '?v=1'; else delete k.model;
      console.log(wid.padEnd(7), k.name.padEnd(22), 'style', p.style, k.tex || 'gradient');
    } catch (e) { console.warn(wid, k.name, 'FAILED', e.message); }
  }
}
fs.writeFileSync(DATA, src.slice(0, src.indexOf('window.SKIN_DATA=')) + 'window.SKIN_DATA=' + JSON.stringify(data) + ';\n');
