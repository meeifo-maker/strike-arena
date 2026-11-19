import fs from 'fs';

const swaps = [
  [
    `const ty=.17,tz=cz+sg*.12,ta=-sg*1.3;`,
    `const tx=-.03,ty=.17,tz=cz+sg*.1;`
  ],
  [
    `if(y0>.08&&y0<=ARM_KN&&di>.1){const w=Math.min(1,(di-.1)/.06),a=ta*w*w*(3-2*w),c=Math.cos(a),s=Math.sin(a),dy=y0-ty,dz=p.getZ(i)-tz;
p.setY(i,ty+dy*c-dz*s);p.setZ(i,tz+dy*s+dz*c);for(const v of [nm,tg])if(v){const y=v.getY(i),z=v.getZ(i);v.setY(i,y*c-z*s);v.setZ(i,y*s+z*c)}continue}`,
    `if(y0>.08&&y0<=ARM_KN&&di>.1){const w=Math.min(1,(di-.1)/.08),k=1-.6*w*w*(3-2*w);
p.setXYZ(i,tx+(p.getX(i)-tx)*k,ty+(y0-ty)*k,tz+(p.getZ(i)-tz)*k);continue}`
  ],
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
