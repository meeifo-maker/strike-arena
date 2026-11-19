import puppeteer from 'puppeteer-core';
import fs from 'fs';

// Usage: node scripts/vm-preview.mjs <id[,id...]> <outPrefix> [variants.json]
// variants.json: { "<id>": [ARM_WPN[id] override, ...] }; each renders to <outPrefix>-<id>-<n>.png
// Needs the localhost-only window.__ev hook in index.html (game code lives in a closure).
const [ids, out, vfile] = process.argv.slice(2);
const V = vfile ? Function('return ' + fs.readFileSync(vfile, 'utf8'))() : {};
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'],
  defaultViewport: { width: 960, height: 540 },
  protocolTimeout: 600000,
});
const page = await browser.newPage();
page.on('pageerror', e => console.log('pageerror', e.message));
// headless Chrome can't reach the CDNs here; serve cached copies (see %TEMP%\vmcdn)
const cdn = `${process.env.TEMP}\\vmcdn\\`;
await page.setRequestInterception(true);
page.on('request', r => {
  const name = r.url().split('/').pop();
  if (/cdnjs|jsdelivr/.test(r.url()) && fs.existsSync(cdn + name)) r.respond({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(cdn + name) });
  else if (/^https?:\/\/(?!localhost)/.test(r.url())) r.abort();
  else r.continue();
});
await page.goto('http://localhost:8123/', { waitUntil: 'load', timeout: 300000 });
const ev = (code) => page.evaluate((c) => window.__ev ? window.__ev(c) : 'nohook', code);
const list = ids.split(',');
const need = JSON.stringify(list);
for (let t = 0; ; t++) {
  const st = await ev(`'assets:'+assetsReady()+' wpn:'+${need}.filter(i=>WEAPON_TPL[i]||!WEAPON_FILES[i]).length+' arms:'+gloveState`);
  if (st === `assets:true wpn:${list.length} arms:ready`) break;
  if (t % 10 === 0) console.log('waiting', st);
  if (t > 300) throw new Error('timed out: ' + st);
  await new Promise(r => setTimeout(r, 2000));
}
await ev(`document.getElementById('ov').click()`);
await new Promise(r => setTimeout(r, 500));
for (const id of list) {
  await ev(`(()=>{const id=${JSON.stringify(id)};if(id in nades)nades[id]=3;inv[id]={ammo:W[id].mag||1,reserve:W[id].res||0};setWeapon(id);freezeT=1e9;P.pitch=-.15;for(const b of bots)if(b.g)b.g.visible=false})()`);
  await new Promise(r => setTimeout(r, 800));
  console.log(id, 'magGrip', await ev(`JSON.stringify((g=>g&&{at:g.at.map(v=>+v.toFixed(3)),up:g.up.map(v=>+v.toFixed(3))})(magGrip()))`));
  console.log(id, 'gunBox', await ev(`(()=>{gun.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(gun.matrixWorld).invert(),b=new THREE.Box3(),v=new THREE.Vector3();
gun.traverse(o=>{if(!o.isMesh||o===flash)return;for(let q=o;q&&q!==gun;q=q.parent)if(q.userData&&q.userData.viewHands)return;const a=o.geometry.attributes.position,m=new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld);for(let i=0;i<a.count;i+=7)b.expandByPoint(v.fromBufferAttribute(a,i).applyMatrix4(m))});
return JSON.stringify({min:b.min.toArray().map(x=>+x.toFixed(3)),max:b.max.toArray().map(x=>+x.toFixed(3))})})()`));
  const vars = V[id] || [null];
  for (let n = 0; n < vars.length; n++) {
    await ev(`(()=>{const v=${JSON.stringify(vars[n])},id=${JSON.stringify(id)};if(v){if(v.__vp){Object.assign(VIEW_POSE[viewCat(id)],v.__vp);delete v.__vp}ARM_WPN[id]=v}window.reposeArms()})()`);
    await new Promise(r => setTimeout(r, 600));
    const path = `${out}-${id}-${n}.png`;
    await page.screenshot({ path, clip: process.env.VM_CLIP ? JSON.parse(process.env.VM_CLIP) : { x: 300, y: 170, width: 660, height: 370 } });
    console.log('shot', path, JSON.stringify(vars[n]));
  }
}
await browser.close();
