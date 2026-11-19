import fs from 'fs';

const swaps = [
  [
    `// at = palm centre, f = finger direction, p = palm normal (the side that faces the grip).`,
    `// Fingers are bent shut around an axis; at = where that axis (the grip) sits,
// f = wrist-to-knuckle direction, p = palm normal (the side that faces the grip).`
  ],
  [
    'pistol:{R:{at:[.028,-.008,.055],f:[0,.4,-.92],p:[-1,0,0]},L:{at:[-.028,-.014,.06],f:[0,.4,-.92],p:[1,0,0]}},',
    'pistol:{R:{at:[0,-.02,.045],f:[-.1,.3,-.95],p:[-1,0,0]},L:{at:[-.006,-.045,.035],f:[.12,.3,-.95],p:[1,0,0]}},'
  ],
  ['smg:{L:{at:[-.012,-.025,-.09],f:[.45,.35,-.82],p:[.35,.94,0]}},', 'smg:{L:{at:[0,.005,-.09],f:[.55,.25,-.8],p:[-.2,1,0]}},'],
  ['rifle:{L:{at:[-.016,-.032,-.13],f:[.45,.35,-.82],p:[.35,.94,0]}},', 'rifle:{L:{at:[0,.01,-.13],f:[.55,.25,-.8],p:[-.2,1,0]}},'],
  ['sniper:{L:{at:[-.016,-.03,-.16],f:[.45,.35,-.82],p:[.35,.94,0]}},', 'sniper:{L:{at:[0,.01,-.16],f:[.55,.25,-.8],p:[-.2,1,0]}},'],
  ['nade:{R:{at:[.03,-.02,.02],f:[0,.6,-.8],p:[-1,0,0]}},', 'nade:{R:{at:[0,-.01,.02],f:[-.1,.3,-.95],p:[-1,0,0]}},'],
  ['knife:{R:{at:[.03,-.02,.02],f:[0,.6,-.8],p:[-1,0,0]}}};', 'knife:{R:{at:[0,-.01,.02],f:[-.1,.3,-.95],p:[-1,0,0]}}};'],
  ['const ARM_SCALE=.42;', '// knuckle line height, finger centre-line x and curl radius, in the model\'s rest-pose units\nconst ARM_SCALE=.42,ARM_KN=.285,ARM_FX=.025,ARM_CR=.075;'],
  [
    `const pc=new THREE.Vector3();let n=0;for(const i of keep){const y=pos.getY(i);if(y>.1&&y<.28){pc.x+=pos.getX(i);pc.y+=y;pc.z+=pos.getZ(i);n++}}pc.divideScalar(n||1);
const g=geo.clone();g.setIndex(keep);g.translate(-pc.x,-pc.y,-pc.z);`,
    `let cz=0,n=0;for(const i of keep)if(pos.getY(i)>ARM_KN){cz+=pos.getZ(i);n++}cz/=n||1;
const g=geo.clone();curlFingers(g);g.setIndex(keep);g.translate(-(ARM_FX-ARM_CR),-ARM_KN,-cz);`
  ],
  [
    'const _ax=new THREE.Vector3(),',
    `function curlFingers(g){const p=g.attributes.position,nm=g.attributes.normal,tg=g.attributes.tangent;
for(let i=0;i<p.count;i++){const d=p.getY(i)-ARM_KN;if(d<=0)continue;const t=d/ARM_CR,c=Math.cos(t),s=Math.sin(t),r=ARM_CR+p.getX(i)-ARM_FX;
p.setXY(i,ARM_FX-ARM_CR+r*c,ARM_KN+r*s);for(const a of [nm,tg])if(a){const x=a.getX(i),y=a.getY(i);a.setXY(i,x*c-y*s,x*s+y*c)}}}
const _ax=new THREE.Vector3(),`
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
