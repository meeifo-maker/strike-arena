import fs from 'fs';

const swaps = [
  [
    `pos.needsUpdate=true}`,
    `pos.needsUpdate=true}
// Swing the thumb (palm side, near the index) from its splayed rest direction to lie along the fingers.
function foldThumbs(geo){const pos=geo.attributes.position,nor=geo.attributes.normal,tan=geo.attributes.tangent,v=new THREE.Vector3(),q=new THREE.Quaternion(),Q={},B={};
for(const s of [-1,1]){Q[s]=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(-.55,.59,-.62*s).normalize(),new THREE.Vector3(-.3,.95,.14*s).normalize());B[s]=new THREE.Vector3(-.06,.18,.24*s)}
const I=new THREE.Quaternion();
for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),s=z<0?-1:1;if(x>-.06||y<.12||y>KNUCKLE_Y||Math.abs(z)>.3)continue;
const t=Math.min(1,(-.06-x)/.03),w=t*t*(3-2*t);q.copy(I).slerp(Q[s],w);
v.set(x,y,z).sub(B[s]).applyQuaternion(q).add(B[s]);pos.setXYZ(i,v.x,v.y,v.z);
if(nor){v.set(nor.getX(i),nor.getY(i),nor.getZ(i)).applyQuaternion(q);nor.setXYZ(i,v.x,v.y,v.z)}
if(tan){v.set(tan.getX(i),tan.getY(i),tan.getZ(i)).applyQuaternion(q);tan.setXYZ(i,v.x,v.y,v.z)}}
pos.needsUpdate=true}`
  ],
  [`curlFingers(geo);`, `curlFingers(geo);foldThumbs(geo);`]
];

for (const f of ['public/index.html', 'strike.html']) {
  let s = fs.readFileSync(f, 'utf8');
  const eol = s.includes('\r\n') ? '\r\n' : '\n';
  for (const [x, y] of swaps) {
    if (s.split(x).length !== 2) throw new Error(`${f}: expected one match for ${x.slice(0, 50)}`);
    s = s.replace(x, y.replace(/\n/g, eol));
  }
  fs.writeFileSync(f, s);
  console.log('patched', f);
}
