import fs from 'fs';

const swaps = [
  [
    `function curlFingers(g){const p=g.attributes.position,nm=g.attributes.normal,tg=g.attributes.tangent;
for(let i=0;i<p.count;i++){const d=p.getY(i)-ARM_KN;if(d<=0)continue;`,
    `// sg: +1 when the thumb sits toward +Z (right arm), -1 toward -Z (left arm)
function curlFingers(g,cz,sg){const p=g.attributes.position,nm=g.attributes.normal,tg=g.attributes.tangent;
const ty=.17,tz=cz+sg*.12,ta=-sg*1.3;
for(let i=0;i<p.count;i++){const y0=p.getY(i),di=(p.getZ(i)-cz)*sg;
if(y0>.08&&y0<=ARM_KN&&di>.1){const w=Math.min(1,(di-.1)/.06),a=ta*w*w*(3-2*w),c=Math.cos(a),s=Math.sin(a),dy=y0-ty,dz=p.getZ(i)-tz;
p.setY(i,ty+dy*c-dz*s);p.setZ(i,tz+dy*s+dz*c);for(const v of [nm,tg])if(v){const y=v.getY(i),z=v.getZ(i);v.setY(i,y*c-z*s);v.setZ(i,y*s+z*c)}continue}
const d=y0-ARM_KN;if(d<=0)continue;`
  ],
  ['const g=geo.clone();curlFingers(g);', "const g=geo.clone();curlFingers(g,cz,s==='R'?1:-1);"],
];

for (const f of ['public/index.html', 'strike.html']) {
  let s = fs.readFileSync(f, 'utf8');
  const eol = s.includes('\r\n') ? '\r\n' : '\n';
  for (const [a, b] of swaps) {
    const A = a.replace(/\n/g, eol);
    if (!s.includes(A)) throw new Error(`${f}: missing ${a.slice(0, 60)}`);
    s = s.replace(A, b.replace(/\n/g, eol));
  }
  fs.writeFileSync(f, s);
  console.log('patched', f);
}
