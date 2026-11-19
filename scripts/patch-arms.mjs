import fs from 'fs';

const armCode = `// 3D arms viewmodel: one static mesh holding both arms, split and posed rigidly in gun space.
// at = palm centre, f = finger direction, p = palm normal (the side that faces the grip).
const ARM_POSE={
pistol:{R:{at:[.035,-.035,.04],f:[0,.6,-.8],p:[-1,0,0]},L:{at:[-.035,-.04,.045],f:[0,.6,-.8],p:[1,0,0]}},
smg:{R:{at:[.032,-.045,.05],f:[0,.2,-.98],p:[-1,0,0]},L:{at:[-.012,-.025,-.09],f:[.45,.35,-.82],p:[.35,.94,0]}},
rifle:{R:{at:[.035,-.05,.07],f:[0,.2,-.98],p:[-1,0,0]},L:{at:[-.016,-.032,-.13],f:[.45,.35,-.82],p:[.35,.94,0]}},
sniper:{R:{at:[.035,-.055,.09],f:[0,.2,-.98],p:[-1,0,0]},L:{at:[-.016,-.03,-.16],f:[.45,.35,-.82],p:[.35,.94,0]}},
nade:{R:{at:[.03,-.02,.02],f:[0,.6,-.8],p:[-1,0,0]}},
knife:{R:{at:[.03,-.02,.02],f:[0,.6,-.8],p:[-1,0,0]}}};
const ARM_SCALE=.42;
let gloveTpl=null,gloveState='idle',viewGlove=null;
function loadGloves(){if(gloveState!=='idle'||!THREE.GLTFLoader)return;gloveState='loading';
new THREE.GLTFLoader().load('assets/viewhands/arms.glb',g=>{gloveTpl=g.scene;gloveState='ready';mountViewHands()},undefined,e=>{console.warn('arms failed',e);gloveState='failed'})}
function buildGlove(){gloveTpl.updateMatrixWorld(true);let src=null;gloveTpl.traverse(o=>{if(o.isMesh&&!src)src=o});
const geo=src.geometry.clone();geo.applyMatrix4(src.matrixWorld);
const pos=geo.attributes.position,idx=geo.index?geo.index.array:null,tri=idx?idx.length/3:pos.count/3;
const root=new THREE.Group();root.name='arms';root.userData={viewHands:true,arms:{},cat:null};
// rest pose: right arm on -Z, left arm on +Z, fingers along +Y, palms facing -X
for(const s of ['R','L']){const keep=[];
for(let t=0;t<tri;t++){const a=idx?idx[t*3]:t*3,b=idx?idx[t*3+1]:t*3+1,c=idx?idx[t*3+2]:t*3+2;if((pos.getZ(a)+pos.getZ(b)+pos.getZ(c)<0)===(s==='R'))keep.push(a,b,c)}
const pc=new THREE.Vector3();let n=0;for(const i of keep){const y=pos.getY(i);if(y>.1&&y<.28){pc.x+=pos.getX(i);pc.y+=y;pc.z+=pos.getZ(i);n++}}pc.divideScalar(n||1);
const g=geo.clone();g.setIndex(keep);g.translate(-pc.x,-pc.y,-pc.z);
const mesh=new THREE.Mesh(g,src.material);mesh.frustumCulled=false;mesh.renderOrder=6;mesh.scale.setScalar(ARM_SCALE);
const pivot=new THREE.Group();pivot.add(mesh);root.add(pivot);root.userData.arms[s]=pivot}
return root}
const _ax=new THREE.Vector3(),_ay=new THREE.Vector3(),_az=new THREE.Vector3(),_am=new THREE.Matrix4();
function poseArms(cat){if(!viewGlove)return;const P=ARM_POSE[cat]||ARM_POSE.rifle,u=viewGlove.userData;if(u.cat===cat)return;u.cat=cat;
for(const s of ['L','R']){const pv=u.arms[s],c=P[s];if(!pv)continue;pv.visible=!!c;if(!c)continue;
_ay.fromArray(c.f).normalize();_ax.fromArray(c.p);_ax.addScaledVector(_ay,-_ax.dot(_ay)).normalize().negate();
_az.crossVectors(_ax,_ay);_am.makeBasis(_ax,_ay,_az);pv.quaternion.setFromRotationMatrix(_am);pv.position.fromArray(c.at)}}
window.ARM_POSE=ARM_POSE;window.reposeArms=()=>{if(viewGlove){viewGlove.userData.cat=null;poseArms(viewCat(cur))}};
`;

for (const f of ['public/index.html', 'strike.html']) {
  let s = fs.readFileSync(f, 'utf8');
  const eol = s.includes('\r\n') ? '\r\n' : '\n';
  const a = s.indexOf('// 3D glove viewmodel:');
  const b = s.indexOf('function mountViewHands(){');
  if (a < 0 || b < 0 || b < a) throw new Error(`${f}: glove block markers missing`);
  s = s.slice(0, a) + armCode.replace(/\n/g, eol) + s.slice(b);

  const swaps = [
    [
      "if(gloveState==='ready'){if(!viewGlove)viewGlove=buildGlove();viewHandsRoot.add(viewGlove);",
      "if(gloveState==='ready'){if(!viewGlove)viewGlove=buildGlove();if(gun){gun.add(viewGlove);viewGlove.userData.cat=null}"
    ],
    ['fitGlove(cat);window.__vh={cat,glove:true};return}', 'poseArms(cat);window.__vh={cat,arms:true};return}'],
    [
      'if(viewGlove&&viewGlove.parent){viewGlove.visible=gun.visible;if(gun.userData.viewCat!==cat)mountViewHands();fitGlove(cat)}',
      'if(viewGlove&&viewGlove.parent===gun){if(gun.userData.viewCat!==cat)mountViewHands()}'
    ]
  ];
  for (const [x, y] of swaps) {
    if (!s.includes(x)) throw new Error(`${f}: missing ${x.slice(0, 60)}`);
    s = s.replace(x, y);
  }
  if (/fitGlove|GLOVE_GRIP|gloves\.glb/.test(s)) throw new Error(`${f}: stale glove references remain`);
  fs.writeFileSync(f, s);
  console.log('patched', f);
}
