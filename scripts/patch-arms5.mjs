import fs from 'fs';

const swaps = [
  ['rifle:{L:{at:[0,.01,-.13],f:[.55,.25,-.8],p:[-.2,1,0]}},', 'rifle:{L:{mag:1,at:[0,-.06,-.02],up:[0,.88,.47],p:[1,0,0]}},'],
  [
    'const _ax=new THREE.Vector3(),',
    `// Front edge and tilt of the magazine in gun space, measured from the lower middle of the gun mesh
function magGrip(){if(!gun)return null;gun.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(gun.matrixWorld).invert(),m=new THREE.Matrix4(),v=new THREE.Vector3(),P=[];
gun.traverse(o=>{if(!o.isMesh||o===flash||!o.geometry)return;for(let q=o;q&&q!==gun;q=q.parent)if(q.userData&&q.userData.viewHands)return;
const a=o.geometry.attributes.position;if(!a)return;m.multiplyMatrices(inv,o.matrixWorld);const st=Math.max(1,Math.floor(a.count/3000));for(let i=0;i<a.count;i+=st){v.fromBufferAttribute(a,i).applyMatrix4(m);P.push(v.clone())}});
if(P.length<50)return null;let y0=1e9,y1=-1e9,z0=1e9,z1=-1e9;for(const p of P){y0=Math.min(y0,p.y);y1=Math.max(y1,p.y);z0=Math.min(z0,p.z);z1=Math.max(z1,p.z)}
const L=z1-z0,H=y1-y0,C=P.filter(p=>p.z>z0+.38*L&&p.z<z0+.62*L&&p.y<y0+.45*H);if(C.length<10)return null;
let cy0=1e9,cy1=-1e9;for(const p of C){cy0=Math.min(cy0,p.y);cy1=Math.max(cy1,p.y)}const band=C.filter(p=>p.y>cy0+.45*(cy1-cy0)&&p.y<cy0+.8*(cy1-cy0));if(band.length<5)return null;
let x=0,y=0,fz=1e9;for(const p of band){x+=p.x;y+=p.y;fz=Math.min(fz,p.z)}x/=band.length;y/=band.length;
let my=0,mz=0;for(const p of C){my+=p.y;mz+=p.z}my/=C.length;mz/=C.length;let sy=0,syz=0;for(const p of C){sy+=(p.y-my)**2;syz+=(p.y-my)*(p.z-mz)}
const s=Math.max(-1,Math.min(1,sy?syz/sy:0));
return{at:[x,y,fz+.018],up:[0,1,s]}}
const _ax=new THREE.Vector3(),`
  ],
  [
    `_ay.fromArray(c.f).normalize();_ax.fromArray(c.p);`,
    `if(c.up){const g=c.mag&&magGrip(),at=g?g.at:c.at;_ax.fromArray(c.p).negate().normalize();_az.fromArray(g?g.up:c.up).multiplyScalar(s==='L'?-1:1);_az.addScaledVector(_ax,-_az.dot(_ax)).normalize();
_ay.crossVectors(_az,_ax);_am.makeBasis(_ax,_ay,_az);pv.quaternion.setFromRotationMatrix(_am);pv.position.fromArray(at);continue}
_ay.fromArray(c.f).normalize();_ax.fromArray(c.p);`
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
