import fs from 'fs';

const gloveCode = `// 3D glove viewmodel: skinned arms on the camera, wrists snapped to grip points on the gun every frame.
// R/L are wrist targets in gun space; yL/yR swing each arm around screen-up, p tilts the shoulders down.
const GLOVE_GRIP={
pistol:{R:[.004,-.05,.035],L:[-.016,-.06,.025],yL:-.9,yR:.75,p:.4,curl:2.4},
smg:{R:[0,-.06,.12],L:[-.012,-.05,-.08],yL:-1.05,yR:.6,p:.35,curl:2.2},
rifle:{R:[0,-.065,.16],L:[-.012,-.052,-.1],yL:-1.1,yR:.6,p:.35,curl:2.2},
sniper:{R:[0,-.065,.18],L:[-.012,-.052,-.13],yL:-1.1,yR:.6,p:.35,curl:2.2},
nade:{R:[0,-.035,.025],L:[-.14,-.16,.12],yL:-.6,yR:.75,p:.4,curl:2.4},
knife:{R:[0,-.03,.04],L:[-.14,-.16,.12],yL:-.6,yR:.75,p:.4,curl:2.4}};
let gloveTpl=null,gloveState='idle',viewGlove=null;
function loadGloves(){if(gloveState!=='idle'||!THREE.GLTFLoader)return;gloveState='loading';
new THREE.GLTFLoader().load('assets/viewhands/gloves.glb',g=>{gloveTpl=g.scene;gloveState='ready';mountViewHands()},undefined,e=>{console.warn('gloves failed',e);gloveState='failed'})}
function curlBone(b,k){const q=b.quaternion;if(q.w<0)q.set(-q.x,-q.y,-q.z,-q.w);const a=2*Math.acos(Math.min(1,q.w)),s=Math.sin(a/2);if(a<1e-4||s<1e-6)return;b.quaternion.setFromAxisAngle(new THREE.Vector3(q.x/s,q.y/s,q.z/s),a*k)}
function buildGlove(){const m=THREE.SkeletonUtils&&THREE.SkeletonUtils.clone?THREE.SkeletonUtils.clone(gloveTpl):gloveTpl.clone(true);
const inner=new THREE.Group();inner.add(m);
// rest pose hangs both arms down -Y with the left arm on +X; turn it into the screen with the left arm on -X
inner.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2));
inner.scale.setScalar(10);
const root=new THREE.Group();root.name='glove';root.add(inner);const arm={},fingers=[];
m.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.castShadow=false;o.receiveShadow=false;o.renderOrder=6}
if(!o.isBone)return;const n=o.name||'';let r;
if((r=n.match(/^arm_upper_([LR])_\\d/)))(arm[r[1]]=arm[r[1]]||{}).up=o;
if((r=n.match(/^hand_([LR])_\\d/)))(arm[r[1]]=arm[r[1]]||{}).hand=o;
if(/^finger_(index|middle|ring|pinky|thumb)_[012]_/.test(n))fingers.push({b:o,q:o.quaternion.clone(),thumb:n.indexOf('thumb')>=0})});
for(const s in arm){const a=arm[s];if(a.up){a.pos=a.up.position.clone();a.q=a.up.quaternion.clone()}}
root.userData={arm,fingers,curl:0};return root}
const _gv=new THREE.Vector3(),_gt=new THREE.Vector3(),_gq=new THREE.Quaternion(),_gy=new THREE.Quaternion(),_gp=new THREE.Quaternion(),_gup=new THREE.Vector3(),_grt=new THREE.Vector3();
function fitGlove(cat){if(!viewGlove||!gun)return;const g=GLOVE_GRIP[cat]||GLOVE_GRIP.rifle,u=viewGlove.userData;
if(u.curl!==g.curl){for(const f of u.fingers){f.b.quaternion.copy(f.q);curlBone(f.b,f.thumb?1+(g.curl-1)*.4:g.curl)}u.curl=g.curl}
for(const s of ['L','R']){const a=u.arm[s];if(!a||!a.up||!a.hand)continue;
a.up.position.copy(a.pos);a.up.quaternion.copy(a.q);camera.updateMatrixWorld(true);
a.up.parent.getWorldQuaternion(_gq).invert();
_gup.set(0,1,0).applyQuaternion(camera.quaternion).applyQuaternion(_gq).normalize();
_grt.set(1,0,0).applyQuaternion(camera.quaternion).applyQuaternion(_gq).normalize();
_gy.setFromAxisAngle(_gup,s==='L'?g.yL:g.yR);_gp.setFromAxisAngle(_grt,g.p);
a.up.quaternion.premultiply(_gp).premultiply(_gy);a.up.updateMatrixWorld(true);
a.hand.getWorldPosition(_gv);_gt.fromArray(g[s]);gun.localToWorld(_gt);
a.up.parent.worldToLocal(_gv);a.up.parent.worldToLocal(_gt);a.up.position.add(_gt.sub(_gv))}}
`;

const swaps = [
  ['function mountViewHands(){if(!camera)return;loadHandTextures();', gloveCode + 'function mountViewHands(){if(!camera)return;loadGloves();loadHandTextures();'],
  [
    "const cat=viewCat(cur),vp=VIEW_POSE[cat]||VIEW_POSE.rifle,key=handPlateKey(cat),tex=HAND_TEX[key];\nif(!tex){if(gun)gun.userData.viewCat=cat;return}",
    "const cat=viewCat(cur),vp=VIEW_POSE[cat]||VIEW_POSE.rifle,key=handPlateKey(cat),tex=HAND_TEX[key];\n" +
      "if(gloveState==='ready'){if(!viewGlove)viewGlove=buildGlove();viewHandsRoot.add(viewGlove);\n" +
      "if(gun){gun.traverse(o=>{if(o.isMesh){o.renderOrder=6;if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms){m.depthTest=true;m.depthWrite=true;m.transparent=false}}}});gun.userData.viewCat=cat}\n" +
      "fitGlove(cat);window.__vh={cat,glove:true};return}\n" +
      "if(!tex){if(gun)gun.userData.viewCat=cat;return}"
  ],
  [
    'if(!viewHandPlate||viewHandPlate.userData.handKey!==wantKey||gun.userData.viewCat!==cat)mountViewHands();',
    'if(viewGlove&&viewGlove.parent){viewGlove.visible=gun.visible;if(gun.userData.viewCat!==cat)mountViewHands();fitGlove(cat)}\n' +
      'else if(!viewHandPlate||viewHandPlate.userData.handKey!==wantKey||gun.userData.viewCat!==cat||gloveState===\'ready\')mountViewHands();'
  ]
];

for (const f of ['public/index.html', 'strike.html']) {
  let s = fs.readFileSync(f, 'utf8');
  const eol = s.includes('\r\n') ? '\r\n' : '\n';
  for (let [a, b] of swaps) {
    a = a.replace(/\n/g, eol);
    b = b.replace(/\n/g, eol);
    if (!s.includes(a)) throw new Error(`${f}: missing ${a.slice(0, 60)}`);
    s = s.replace(a, b);
  }
  fs.writeFileSync(f, s);
  console.log('patched', f);
}
