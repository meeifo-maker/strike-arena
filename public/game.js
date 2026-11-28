
(function(){
const $=id=>document.getElementById(id);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;
document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0xcdd5d6);scene.fog=new THREE.Fog(0xcdd5d6,30,100);
const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.05,400);camera.rotation.order='YXZ';scene.add(camera);
scene.add(new THREE.HemisphereLight(0xdfeaff,0x887766,.55));
const sun=new THREE.DirectionalLight(0xfff0d0,1.2);sun.position.set(25,40,15);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);const sh=sun.shadow.camera;sh.left=sh.bottom=-42;sh.right=sh.top=42;sh.near=1;sh.far=120;sun.shadow.bias=-.0005;scene.add(sun);
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});

// Map
function mkTex(col,rep,seam){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle=col;x.fillRect(0,0,256,256);
for(let i=0;i<9000;i++){const v=Math.random()*60-30;const w=v>0?255:0;x.fillStyle='rgba('+w+','+w+','+w+','+Math.abs(v)/200+')';x.fillRect(Math.random()*256,Math.random()*256,1+Math.random()*2,1+Math.random()*2)}
if(seam){x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=3;for(let i=0;i<=256;i+=64){x.beginPath();x.moveTo(0,i);x.lineTo(256,i);x.stroke();x.beginPath();x.moveTo(i,0);x.lineTo(i,256);x.stroke()}}
const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep,rep);t.anisotropy=8;return t}
const TX=[mkTex('#b39d78',1,true),mkTex('#8a6a3f',1,true),mkTex('#6d7b66',1,false)];
const skc=document.createElement('canvas');skc.width=4;skc.height=256;{const x=skc.getContext('2d'),g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#3f74b5');g.addColorStop(.5,'#9cc0e0');g.addColorStop(.52,'#d8c9a8');g.addColorStop(1,'#d8c9a8');x.fillStyle=g;x.fillRect(0,0,4,256)}
const skyT=new THREE.CanvasTexture(skc);const skyMesh=new THREE.Mesh(new THREE.SphereGeometry(150,16,12),new THREE.MeshBasicMaterial({map:skyT,side:THREE.BackSide,fog:false}));scene.add(skyMesh);
const preArena=new Set(scene.children);try{const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromEquirectangular(skyT).texture;pm.dispose()}catch(e){}
const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,60),(()=>{const t=mkTex('#cdb287',14,false);return new THREE.MeshStandardMaterial({map:t,bumpMap:t,bumpScale:2,roughness:.95})})());
floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const boxes=[],boxMeshes=[];
const defs=[[0,-30,60,1,6],[0,30,60,1,6],[-30,0,1,60,6],[30,0,1,60,6],
[-19,4,1,14,3],[19,4,1,14,3],[-10,-10,6,1,2],[10,-10,6,1,2],[0,-14,8,1,2.2],[-26,-12,1,10,3],[26,0,1,10,3],[-8,13,3,3,1.8],[8,13,3,3,1.8],[0,9,2,2,1.2],[-12,5,2,2,1.2],[12,5,2,2,1.2]];
defs.forEach((d,i)=>{const wall=i<4;
const m=new THREE.Mesh(new THREE.BoxGeometry(d[2],d[4],d[3]),mt(wall?0:1+i%2,Math.max(d[2],d[3]),d[4]));
m.position.set(d[0],d[4]/2,d[1]);m.castShadow=m.receiveShadow=true;scene.add(m);boxMeshes.push(m);boxes.push({x:d[0],z:d[1],w:d[2],d:d[3],h:d[4]});});
function mt(i,w,h){const t=TX[i].clone();t.needsUpdate=true;t.repeat.set(w/4,h/4);return new THREE.MeshStandardMaterial({map:t,bumpMap:t,bumpScale:1.5,roughness:.92,metalness:0})}
function addB(x,z,w,d,y0,h,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y0+h/2,z);o.castShadow=o.receiveShadow=true;scene.add(o);boxMeshes.push(o);return o}
function solid(x,z,w,d,y0,h,m){boxes.push({x,z,w,d,h:y0+h});return addB(x,z,w,d,y0,h,m)}
// CT building with door, window and roof
solid(-14.5,-17,3,.4,0,3.2,mt(0,3,3.2));solid(-6.5,-17,9,.4,0,3.2,mt(0,9,3.2));addB(-12,-17,2,.4,2.4,.8,mt(0,2,.8));
solid(-9,-27,14,.4,0,3.2,mt(0,14,3.2));solid(-2,-22,.4,10,0,3.2,mt(0,10,3.2));
solid(-16,-25.5,.4,3,0,3.2,mt(0,3,3.2));solid(-16,-22.5,.4,3,0,1,mt(0,3,1));addB(-16,-22.5,.4,3,2.3,.9,mt(0,3,.9));solid(-16,-19,.4,4,0,3.2,mt(0,4,3.2));
addB(-9,-22,14.4,10.4,3.2,.3,mt(2,14,10));
[[-3,20],[-1.8,20],[24,-8],[6,-24],[-5,-25],[-13,-24]].forEach((c,i)=>{solid(c[0],c[1],1.2,1.2,0,1.2,mt(1,1.2,1.2));if(i%2==0)addB(c[0],c[1],1,1,1.2,1,mt(1,1,1))});
function barrel(x,z,c){const m=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.9,16),new THREE.MeshStandardMaterial({color:c,metalness:.5,roughness:.5}));m.position.set(x,.45,z);m.castShadow=m.receiveShadow=true;
[-.25,.25].forEach(y=>{const r=new THREE.Mesh(new THREE.TorusGeometry(.305,.015,6,16),new THREE.MeshStandardMaterial({color:0x222,roughness:.6}));r.rotation.x=Math.PI/2;r.position.y=y;m.add(r)});scene.add(m);boxMeshes.push(m);boxes.push({x,z,w:.6,d:.6})}
barrel(8,-12,0x2a4d8f);barrel(8.9,-11.6,0xb03a2a);barrel(-24,14,0x3f6b3a);barrel(15,23,0xb03a2a);barrel(-12,-20,0x2a4d8f);
function sandbags(x,z,len,ax){const m=new THREE.MeshLambertMaterial({map:mkTex('#b8a67a',1,false)}),n=Math.round(len/.55);
for(let l=0;l<2;l++)for(let i=0;i<n;i++){const o=new THREE.Mesh(new THREE.BoxGeometry(.52,.22,.34),m),p=(i-(n-1)/2)*.55+(l?.27:0);o.position.set(ax?x+p:x,.11+l*.22,ax?z:z+p);o.rotation.y=(ax?0:Math.PI/2)+(Math.random()-.5)*.15;o.castShadow=o.receiveShadow=true;scene.add(o);boxMeshes.push(o)}
boxes.push(ax?{x,z,w:len,d:.4}:{x,z,w:.4,d:len})}
sandbags(-4,3.4,4,true);sandbags(14,18,5,true);sandbags(-26,-10,4,false);
{const paint=new THREE.MeshStandardMaterial({color:0x7a1c1c,metalness:.7,roughness:.3}),glass=new THREE.MeshStandardMaterial({color:0x0e1a24,metalness:.9,roughness:.1}),tire=new THREE.MeshStandardMaterial({color:0x111,roughness:.9});
solid(-20,22,4.2,1.8,.3,.7,paint);addB(-20.2,22,2.2,1.6,1,.6,glass);
[[-1.4,-.9],[-1.4,.9],[1.4,-.9],[1.4,.9]].forEach(w=>{const t=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.24,14),tire);t.rotation.x=Math.PI/2;t.position.set(-20+w[0],.35,22+w[1]);t.castShadow=true;scene.add(t)})}
for(let i=0;i<14;i++){const p=new THREE.Mesh(new THREE.CircleGeometry(1.5+Math.random()*3,14),new THREE.MeshLambertMaterial({color:0x7d6840,transparent:true,opacity:.22,polygonOffset:true,polygonOffsetFactor:-1}));p.rotation.x=-Math.PI/2;p.position.set((Math.random()-.5)*56,.01,(Math.random()-.5)*56);p.receiveShadow=true;scene.add(p)}
function winTex(col){const c=document.createElement('canvas');c.width=128;c.height=256;const x=c.getContext('2d');x.fillStyle=col;x.fillRect(0,0,128,256);for(let r=0;r<16;r++)for(let q=0;q<6;q++){x.fillStyle=Math.random()<.3?'#e9d27a':'#1d2733';x.fillRect(8+q*20,6+r*15,12,9)}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
for(let i=0;i<20;i++){const a=i/20*Math.PI*2+Math.random()*.2,r=68+Math.random()*25,w=10+Math.random()*12,h=14+Math.random()*34;const t=winTex(['#8c8f91','#a39a8a','#7d848c'][i%3]);t.repeat.set(w/14,h/16);const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),new THREE.MeshLambertMaterial({map:t}));b.position.set(Math.cos(a)*r,h/2,Math.sin(a)*r);scene.add(b)}
{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,250,220,1)');g.addColorStop(.2,'rgba(255,230,160,.5)');g.addColorStop(1,'rgba(255,220,150,0)');x.fillStyle=g;x.fillRect(0,0,128,128);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),blending:THREE.AdditiveBlending,fog:false,depthWrite:false}));sp.position.set(25,40,15).normalize().multiplyScalar(140);sp.scale.set(60,60,1);scene.add(sp)}
function lamp(x,z){const m=new THREE.MeshStandardMaterial({color:0x2d3035,metalness:.7,roughness:.5}),p=new THREE.Mesh(new THREE.CylinderGeometry(.06,.09,5,8),m);p.position.set(x,2.5,z);p.castShadow=true;const arm=new THREE.Mesh(new THREE.BoxGeometry(.9,.07,.1),m);arm.position.set(.4,2.5,0);p.add(arm);const bulb=new THREE.Mesh(new THREE.BoxGeometry(.3,.08,.18),new THREE.MeshBasicMaterial({color:0xfff2c0}));bulb.position.set(.8,2.45,0);p.add(bulb);scene.add(p);boxMeshes.push(p);boxes.push({x,z,w:.25,d:.25,h:5})}
lamp(-8,22);lamp(14,-4);lamp(-16,-12);lamp(2,10);
[[24,-3,.8],[-5,-21,.6],[-14,-19,.7],[25,-12,.9]].forEach(c=>{solid(c[0],c[1],c[2],c[2],0,c[2],mt(1,c[2],c[2]))});
// New structures
{const W0=(x,z,w,d,h)=>solid(x,z,w,d,0,h,mt(0,Math.max(w,d),h)),CR=(x,z,s)=>solid(x,z,s,s,0,s,mt(1,s,s));
// central building (doors front/back/sides)
W0(-3.75,2,4.5,.4,3.2);W0(3.75,2,4.5,.4,3.2);W0(-3.75,-6,4.5,.4,3.2);W0(3.75,-6,4.5,.4,3.2);
W0(-6,-4.75,.4,2.5,3.2);W0(-6,.75,.4,2.5,3.2);W0(6,-4.75,.4,2.5,3.2);W0(6,.75,.4,2.5,3.2);
addB(0,2,3.2,.4,2.4,.8,mt(0,3,.8));addB(0,-6,3.2,.4,2.4,.8,mt(0,3,.8));addB(-6,-2,.4,3.2,2.4,.8,mt(0,3,.8));addB(6,-2,.4,3.2,2.4,.8,mt(0,3,.8));
addB(0,-2,12.4,8.4,3.2,.3,mt(2,12,8));CR(-3,-2,1.4);CR(3.5,-3.5,1.2);
// east platform with stairs and rails
solid(20,-18,8,8,0,1.75,mt(2,8,1.75));[1,2,3,4].forEach(k=>solid(16-.35-.7*(4-k),-18,.7,3,0,.35*k,mt(1,.7,.35*k)));
solid(20,-21.7,8,.4,1.75,1,mt(0,8,1));solid(23.8,-18,.4,8,1.75,1,mt(0,8,1));
// warehouse (south-east)
W0(19.5,14,3,.4,3.2);W0(26,14,4,.4,3.2);W0(18,20,.4,12,3.2);W0(23,26,10,.4,3.2);W0(28,20,.4,12,3.2);
addB(22.5,14,3,.4,2.4,.8,mt(0,3,.8));addB(23,20,10.4,12.4,3.2,.3,mt(2,10,12));CR(23,19,1.5);CR(25.5,22,1.2);CR(20,23,1.2);
// carport over the car
[[-23,20],[-17,20],[-23,24],[-17,24]].forEach(p=>solid(p[0],p[1],.4,.4,0,3,mt(0,.4,3)));addB(-20,22,7,5,3,.3,mt(2,7,5));
// jersey barriers
solid(-12,19,3,.6,0,1,mt(0,3,1));solid(12,22,3,.6,0,1,mt(0,3,1));solid(0,17,3,.6,0,1,mt(0,3,1))}
const arenaObjs=scene.children.filter(o=>!preArena.has(o)&&!o.isSprite),arenaBoxes=boxes.slice(),arenaBoxMeshes=boxMeshes.slice();
// Loaded maps (mapworld.js). Spawn points are Mirage's own, converted to this file's coordinates.
const MAPS={mirage:{name:'Mirage',file:'assets/maps/mirage.bin',key:'map-mirage-v1',
  t:{x:23.9,y:-4.19,z:57.7,look:[0,57.7],r:5},ct:{x:-22.7,y:-6.81,z:-13.2,look:[-40,-13],r:5},
  // From tools/find-ladders.cjs: [x, z, widthAxis (0=x,1=z), width, yBottom, yTop]
  ladders:[[18.25,0.21,0,0.96,-6.72,-1.35],[18.17,1.35,0,0.96,-6.72,-1.35],[17.4,-0.21,1,0.97,-6.59,-1.18],[17.48,-1.4,1,0.97,-6.59,-1.18],[20.42,-0.19,1,0.97,-6.59,-1.18],[17.35,3.66,1,0.46,-4.75,-0.86],[21.94,-0.22,1,0.96,-4.43,0.98],[21.84,-1.44,1,0.97,-4.43,0.98],[-5.23,-5.91,1,0.97,-4.02,1.39],[0.42,-5.36,0,0.96,-4.02,1.4],[1.83,-5.91,1,0.97,-4.02,1.4],[-25.69,33.02,0,0.96,-4.02,7.08],[-28.33,33.02,0,0.96,-4.02,7.08],[-29.34,33.02,0,0.97,-4.02,1.4],[-9.2,52.31,1,0.96,3.09,8.5],[-9.2,54.08,1,0.96,3.09,8.5],[-9.2,55.46,1,0.97,3.09,14.19],[-9.2,57.28,1,0.96,3.09,14.19]]},
  dust2:{name:'Dust 2',file:'assets/maps/dust2.bin',key:'map-dust2-v1',t:{x:4.4,y:6.53,z:51.4,look:[4,20],r:5},ct:{x:8.2,y:2.77,z:-21.1,look:[4,10],r:5},ladders:[]}};
let mapId=(()=>{try{const m=localStorage.getItem('strike_map');return m==='arena'||MAPS[m]?m:'mirage'}catch(e){return'mirage'}})();
const mapW={},mapSt={};let world=null;
function mapReady(id){id=id||mapId;return id==='arena'||mapSt[id]==='ready'||mapSt[id]==='failed'}
function hits(x,z,r,y){if(world)return world.blocked(x,z,r,(y||0)+world.STEP,(y||0)+1.7);for(const b of boxes)if(Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r&&!(y!==undefined&&b.h&&y+.4>=b.h))return true;return false}
function move(o,dx,dz,r){if(world){const px=o.x,pz=o.z,y=o.y||0;o.x+=dx;o.z+=dz;world.push(o,r,y+world.STEP,y+(o===P&&crouch?1.15:1.7));
// Never step over a spot with no floor at all (inside a wall/prop shell or off the map): you'd fall out of the world
if(world.ground(o.x,o.z,y+world.STEP)<-1e8&&world.ground(px,pz,y+world.STEP)>-1e8){o.x=px;o.z=pz}return}if(!hits(o.x+dx,o.z,r,o.y))o.x+=dx;if(!hits(o.x,o.z+dz,r,o.y))o.z+=dz}
// Wedged inside geometry (walls push back every step): hop to the nearest open floor, else respawn
let stuckT=0;
function unstick(o){if(!world)return;const y=o.y||0;
// Pressing into a wall isn't stuck: only act when no direction at all is open
for(let a=0;a<8;a++){const x=o.x+Math.cos(a*Math.PI/4)*.3,z=o.z+Math.sin(a*Math.PI/4)*.3,g=world.ground(x,z,y+world.STEP);
if(g>-1e8&&!world.blocked(x,z,.4,g+world.STEP,g+1.7))return}
for(let rad=.5;rad<=5;rad+=.5)for(let a=0;a<16;a++){const x=o.x+Math.cos(a*Math.PI/8)*rad,z=o.z+Math.sin(a*Math.PI/8)*rad,g=world.ground(x,z,y+1.5);
if(g>-1e8&&g>y-4&&!world.blocked(x,z,.45,g+world.STEP,g+1.7)){o.x=x;o.z=z;o.y=g;o.vy=0;return}}
const sp=takeSpot(online?myTeam:'t');if(sp){o.x=sp[0];o.y=sp[1];o.z=sp[2];o.vy=0}}
// Ladder whose climb zone contains feet position (x,y,z); `dir` gets the unit vector from the player toward the rungs.
// Scaffold ladders stand close together, so where zones overlap the one most in front of the view (yaw) wins.
function ladderAt(x,y,z,dir,cur,yaw){if(!world||!world.ladders)return null;let best=null,bs=-1e9,bx=0,bz=0;
const lx_=-Math.sin(yaw||0),lz_=-Math.cos(yaw||0);
for(const L of cur?[cur].concat(world.ladders):world.ladders){const[lx,lz,ax,w,y0,y1]=L;
// reach is generous because scaffold braces often cross in front of the rungs at knee height
const t=ax?z-lz:x-lx,n=ax?x-lx:z-lz;if(Math.abs(t)>w/2+.1||Math.abs(n)>1.1||y<y0-.9||y>y1+1.35)continue;
const dx=ax?-Math.sign(n)||1:0,dz=ax?0:-Math.sign(n)||1,s=L===cur?1e9:lx_*dx+lz_*dz-Math.abs(n)*.3;
if(s>bs){bs=s;best=L;bx=dx;bz=dz}}
if(best&&dir){dir.x=bx;dir.z=bz}return best}
// Floor height under (x,z) reachable from height y (walks up steps, falls down ledges)
function groundAt(x,z,y){if(world){const g=world.ground(x,z,y+world.STEP);return g>-1e8?g:world.yMin-20}return 0}

// Gun
const gun=new THREE.Group();
// Parent of the viewmodel; scale.x=-1 mirrors gun + arms for left-handed mode
const vmRoot=new THREE.Group();vmRoot.add(gun);let leftHand=false,inspT=0,swing=null,swingSide=1;
// While dead: first-person view from a living teammate; the viewmodel shows their gun (specId) instead of ours
let specId=null,specBot=null,specYaw=0;function vmId(){return specId||cur}
const specMsg=document.createElement('div');specMsg.textContent='You died, you are currently spectating';
specMsg.style.cssText='position:fixed;left:0;right:0;top:20%;text-align:center;font:900 48px/1.15 system-ui,Segoe UI,sans-serif;color:#fff;text-shadow:0 3px 14px #000,0 0 3px #000;pointer-events:none;z-index:20;display:none';
document.body.appendChild(specMsg);
const flash=new THREE.Mesh(new THREE.OctahedronGeometry(.035,0).scale(1,1,2.2),new THREE.MeshBasicMaterial({color:0xffc860,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));flash.position.z=-.35;flash.visible=false;
const MT={s:new THREE.MeshStandardMaterial({color:0x2a2c30,metalness:.85,roughness:.38}),d:new THREE.MeshStandardMaterial({color:0x17181b,metalness:.3,roughness:.6}),w:new THREE.MeshStandardMaterial({map:mkTex('#74401f',1,false),roughness:.65}),g:new THREE.MeshStandardMaterial({color:0x17181b,roughness:.8}),l:new THREE.MeshStandardMaterial({color:0x3a4234,roughness:.9}),b:new THREE.MeshStandardMaterial({color:0x0e0e10,metalness:.6,roughness:.45}),o:new THREE.MeshStandardMaterial({color:0x4a5238,roughness:.6})};
const W={
// rate = seconds between shots (CS2 cycle times). rs = extra spread per consecutive shot, capped at sc shots.
// vk = how hard the view model jumps up per shot.
glock:{n:'Glock-18',price:0,slot:2,mag:20,res:120,rate:.15,auto:false,dmg:28,base:.003,mv:.03,rs:.0028,sc:6,kick:.55,vk:.55,rl:2.2,spd:1,kill:300},
deagle:{n:'Desert Eagle',price:700,slot:2,mag:7,res:35,rate:.225,auto:false,dmg:55,base:.003,mv:.04,rs:.014,sc:3,kick:2.6,vk:1.6,rl:2.2,spd:.97,kill:300},
mp9:{n:'MP9',price:1250,slot:1,mag:30,res:120,rate:.07,auto:true,dmg:26,base:.003,mv:.012,rs:.0026,sc:12,kick:.5,vk:.35,rl:2.1,spd:1.05,kill:600},
m4:{n:'M4A1-S',price:2900,slot:1,mag:20,res:80,rate:.1,auto:true,dmg:33,base:.0015,mv:.03,rs:.0024,sc:12,kick:.8,vk:.45,rl:2.3,spd:.95,kill:300},
ak:{n:'AK-47',price:2700,slot:1,mag:30,res:90,rate:.1,auto:true,dmg:36,base:.0015,mv:.035,rs:.0034,sc:12,kick:1.1,vk:.6,rl:2.4,spd:.92,kill:300},
awp:{n:'AWP',price:4750,slot:1,mag:5,res:30,rate:1.46,auto:false,dmg:115,base:.0002,mv:.07,rs:0,sc:1,kick:5,vk:2.2,rl:3.2,spd:.8,scope:true,kill:100}};
// ---------- Skins + coins. Coins are only earned in offline bot matches; equipped skins are sent to online opponents ----------
const SKIN_CATS=[['Pistols',['glock','deagle']],['SMGs',['mp9']],['Rifles',['ak','m4']],['Snipers',['awp']],['Knives',['knife']]];
// skin: {id,name,value, tint?:'#rrggbb', metal?, rough?, tex?:'assets/skins/....jpg'} — a skin with neither keeps the stock look
// model: replaces the weapon's mesh (fix = extra hold rotation/offset for that model, s = scale; model must be centred on its origin)
const SKINS={};for(const [,ids] of SKIN_CATS)for(const id of ids)SKINS[id]=[{id:'base',name:'Base',value:0}];
// Orientation baked in fist space by seatKnifeInFist — only scale here
const KARAMBIT_FIX={s:.8};
if(window.SKIN_DATA)for(const wid in SKIN_DATA)if(SKINS[wid])for(const k of SKIN_DATA[wid])if(!SKINS[wid].some(q=>q.id===k.id)){
  const o=Object.assign({},k);if(/karambit/i.test(o.model||'')&&!o.fix)o.fix=KARAMBIT_FIX;SKINS[wid].push(o)}
// Emotes: pose(t) gives wrist targets h, elbow pole p and palm direction in rig space (+X right, +Y up, −Z forward), c = finger curl
const HANG=s=>({h:[s*.24,.9,.03],p:[0,0,1],palm:[-s,0,0],c:.3});
const EMOTES=[
{id:'wave',name:'Wave',icon:'👋',value:0,dur:2.6,pose:t=>({r:{h:[.36+.1*Math.sin(t*8),1.86,-.08],p:[1,-.6,.3],palm:[0,0,-1],c:0},l:HANG(-1)})},
{id:'salute',name:'Salute',icon:'🫡',value:0,dur:2.4,pose:t=>({r:{h:[.12,1.74,-.14],p:[1,.1,-.1],palm:[0,-.4,-1],c:0},l:HANG(-1)})},
{id:'cheer',name:'Cheer',icon:'🙌',value:0,dur:2.6,pose:t=>{const w=Math.sin(t*7);return{r:{h:[.26+.04*w,2.02+.05*w,-.05],p:[1,0,.2],palm:[0,0,-1],c:.6},l:{h:[-.26-.04*w,2.02-.05*w,-.05],p:[-1,0,.2],palm:[0,0,-1],c:.6},bob:Math.abs(Math.sin(t*5))*.1}}},
{id:'clap',name:'Clap',icon:'👏',value:100,dur:2.8,pose:t=>{const o=.04+.12*Math.abs(Math.sin(t*7));return{r:{h:[o,1.32,-.32],p:[1,-1,.3],palm:[-1,0,0],c:0},l:{h:[-o,1.32,-.32],p:[-1,-1,.3],palm:[1,0,0],c:0}}}},
{id:'shrug',name:'Shrug',icon:'🤷',value:150,dur:2.2,pose:t=>({r:{h:[.42,1.08,-.22],p:[.3,-1,.4],palm:[0,1,0],c:0},l:{h:[-.42,1.08,-.22],p:[-.3,-1,.4],palm:[0,1,0],c:0},bob:-.03})},
{id:'flex',name:'Flex',icon:'💪',value:250,dur:2.8,pose:t=>{const k=.02*Math.sin(t*6);return{r:{h:[.36,1.68+k,-.02],p:[1,-.7,0],palm:[-1,0,0],c:1},l:{h:[-.36,1.68+k,-.02],p:[-1,-.7,0],palm:[1,0,0],c:1}}}},
{id:'dance',name:'Dance',icon:'💃',value:400,dur:6.5,pose:t=>{const ph=t*7;return{r:{h:[.3,1.45+.38*Math.sin(ph),-.18],p:[1,-.5,.2],palm:[0,0,-1],c:.6},l:{h:[-.3,1.45-.38*Math.sin(ph),-.18],p:[-1,-.5,.2],palm:[0,0,-1],c:.6},bob:Math.abs(Math.sin(ph))*.07,ry:.35*Math.sin(t*3.5),rz:.07*Math.sin(ph)}}}];
const EMOTE={};for(const e of EMOTES)EMOTE[e.id]=e;
const EM={on:false,id:null,seq:0,av:null,yaw:0,pitch:0},EW={open:false,list:[],x:0,y:0,sel:-1};
const SKIN_TPL={},skinLoading={};
function skinModel(id){const k=skinDef(id,vmSkin(id));if(!k||!k.model)return null;if(SKIN_TPL[k.model])return SKIN_TPL[k.model];
  if(!skinLoading[k.model]&&THREE.GLTFLoader){skinLoading[k.model]=1;fetch(k.model).then(r=>{if(!r.ok)throw new Error(r.status);return r.arrayBuffer()}).then(parseGlb).then(g=>{SKIN_TPL[k.model]=prepareWeapon(g.scene,WEAPON_FILES[id]?WEAPON_FILES[id].kind:'knife',id);if(vmId()===id)buildModel(id)}).catch(e=>{console.warn('skin load failed',k.model,e);skinLoading[k.model]=0})}return null}
const COIN={kill:2,round:5,match:100};
let prof={coins:0,owned:{},eq:{}};try{const p=JSON.parse(localStorage.getItem('strikeProfile')||'null');if(p&&typeof p==='object')prof=Object.assign(prof,p)}catch(e){}
const profKey=()=>'strikeProfile'+(typeof ACC!=='undefined'&&ACC.user?':'+ACC.user.uid:'');
function saveProf(){try{localStorage.setItem(profKey(),JSON.stringify(prof))}catch(e){}if(typeof cloudSave==='function')cloudSave()}
function skinDef(wid,sid){const l=SKINS[wid];return l?(l.find(k=>k.id===sid)||l[0]):null}
function ownsSkin(wid,sid){const k=SKINS[wid]&&SKINS[wid].find(q=>q.id===sid);return !!k&&(k.value<=0||!!prof.owned[wid+':'+sid])}
function ownsEmote(id){const e=EMOTE[id];return !!e&&(e.value<=0||!!prof.owned['emote:'+id])}
function eqSkin(wid){const sid=prof.eq[wid];return sid&&ownsSkin(wid,sid)?sid:'base'}
function earnsCoins(){return !online&&!party}
function addCoins(n){if(!earnsCoins()||!n)return;prof.coins+=n;saveProf();updCoins()}
function updCoins(){const e=document.getElementById('mm-coins');if(e)e.textContent=prof.coins}
const skinTexCache={};
function skinTex(url){if(!skinTexCache[url]){const t=new THREE.TextureLoader().load(url);t.flipY=false;skinTexCache[url]=t}return skinTexCache[url]}
// grad: colours along the weapon's length, muzzle/tip first (same left→right order as the skin's preview image)
function applySkin(root,wid,sid){if(!root)return;const k=skinDef(wid,sid),skip=[viewGlove,viewHandsRoot,viewHandPlate,flash].filter(Boolean),meshes=[];
const walk=o=>{if(skip.includes(o))return;if(o.isMesh){if(o.userData.baseMat===undefined){o.userData.baseMat=o.material;o.userData.baseGeo=o.geometry}meshes.push(o)}for(const c of o.children)walk(c)};walk(root);
// Knife may be parented under the fist (inside viewGlove) — still skin it
if(root.userData&&root.userData.wpnHold)walk(root.userData.wpnHold);
const grad=k&&k.grad&&k.grad.length>1?k.grad.map(h=>new THREE.Color(h)):null,v=new THREE.Vector3(),mt=new THREE.Matrix4();let ax=2,lo=0,hi=1;
if(grad){root.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(root.matrixWorld).invert(),bx=new THREE.Box3();
  for(const o of meshes){if(o.userData.noSkin)continue;const p=o.userData.baseGeo.attributes.position;mt.multiplyMatrices(inv,o.matrixWorld);o.userData.skM=mt.clone();for(let i=0;i<p.count;i+=5)bx.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(mt))}
  const s=bx.getSize(new THREE.Vector3());ax=s.x>s.y&&s.x>s.z?0:s.y>s.z?1:2;lo=bx.min.getComponent(ax);hi=bx.max.getComponent(ax)}
for(const o of meshes){if(o.userData.noSkin)continue;const u=o.userData;if(o.geometry!==u.baseGeo){o.geometry.dispose();o.geometry=u.baseGeo}
  if(!k||(!k.tint&&!k.tex&&!grad)){o.material=u.baseMat;continue}
  const b=Array.isArray(u.baseMat)?u.baseMat[0]:u.baseMat,m=b.clone();
  if(grad){const g=u.baseGeo.clone(),p=g.attributes.position,cols=new Float32Array(p.count*3),c=new THREE.Color(),n=grad.length-1;
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(u.skM);const t=Math.min(1,Math.max(0,(v.getComponent(ax)-lo)/(hi-lo||1)))*n,j=Math.min(n-1,Math.floor(t));c.copy(grad[j]).lerp(grad[j+1],t-j);cols[i*3]=c.r;cols[i*3+1]=c.g;cols[i*3+2]=c.b}
    g.setAttribute('color',new THREE.BufferAttribute(cols,3));o.geometry=g;m.vertexColors=true;m.color=new THREE.Color(1,1,1);m.map=null}
  else if(k.tint)m.color=new THREE.Color(k.tint);
  if(k.metal!=null&&'metalness' in m)m.metalness=grad?Math.min(k.metal,.7):k.metal;if(k.rough!=null&&'roughness' in m)m.roughness=k.rough;if(k.tex){m.map=skinTex(k.tex);m.color=new THREE.Color(1,1,1)}m.needsUpdate=true;o.material=m}}
function vmSkin(id){if(specId)return specBot&&specBot.st&&specBot.st.w===id&&specBot.st.sk||'base';return eqSkin(id)}
function applyRemoteSkin(b,r){const u=b.g&&b.g.userData;if(!u||!u.gun)return;const gw=b.team==='t'?'ak':'m4',sid=r.w===gw&&r.sk?r.sk:'base',key=u.gun.uuid+':'+sid;if(b.skKey===key)return;b.skKey=key;const k=skinDef(gw,sid);applySkin(u.gun,gw,k&&k.model?'base':sid)}
let custom=null,cfgM={id:'ak',size:1,rot:0,x:0,y:0,z:-.1},nades={he:1,flash:1,smoke:1},cur='glock',scoped=false,crouch=false,semiLock=false,armor=0,money=800,wins=0,loses=0,lossStreak=0,freezeT=0,buyT=0,buyOpen=false,inv={glock:{ammo:20,reserve:120}},roundKills=0;
function fitWeaponToBox(obj,want){obj.position.set(0,0,0);obj.rotation.set(0,0,0);obj.quaternion.identity();obj.scale.set(1,1,1);obj.updateMatrixWorld(true);
const recenter=()=>{obj.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(obj);obj.position.sub(b.getCenter(new THREE.Vector3()));obj.updateMatrixWorld(true)};
const worldRollZ=a=>{obj.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),a));obj.updateMatrixWorld(true);recenter()};
recenter();let box=new THREE.Box3().setFromObject(obj),size=box.getSize(new THREE.Vector3());
// Longest AABB axis → −Z (barrel at crosshair)
const ax=[[size.x,new THREE.Vector3(1,0,0)],[size.y,new THREE.Vector3(0,1,0)],[size.z,new THREE.Vector3(0,0,1)]].sort((a,b)=>b[0]-a[0]);
obj.quaternion.setFromUnitVectors(ax[0][1],new THREE.Vector3(0,0,-1));obj.updateMatrixWorld(true);recenter();
box=new THREE.Box3().setFromObject(obj);size=box.getSize(new THREE.Vector3());
// World-space roll around barrel so height ≥ width (local multiply was swinging barrel onto X)
if(size.x>size.y){worldRollZ(Math.PI/2);box=new THREE.Box3().setFromObject(obj);size=box.getSize(new THREE.Vector3())}
const longest=Math.max(size.x,size.y,size.z)||1;obj.scale.setScalar(want/longest);obj.updateMatrixWorld(true);recenter();
box=new THREE.Box3().setFromObject(obj);size=box.getSize(new THREE.Vector3());
if(size.y>size.z*1.05){obj.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2));obj.updateMatrixWorld(true);recenter();box=new THREE.Box3().setFromObject(obj);size=box.getSize(new THREE.Vector3());const l=Math.max(size.x,size.y,size.z)||1;obj.scale.multiplyScalar(want/l);obj.updateMatrixWorld(true);recenter();box=new THREE.Box3().setFromObject(obj);size=box.getSize(new THREE.Vector3());if(size.x>size.y)worldRollZ(Math.PI/2)}
obj.updateMatrixWorld(true);const final=new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());return Math.max(final.x,final.y,final.z)}
function cloneWeapon(tpl){return tpl.clone(true)}
// Declared early — buildModel('glock') runs before the skins loader block
let ctSkinTpl=null,tSkinTpl=null,ctSkinState='loading',tSkinState='loading';
const WEAPON_FIX={glock:{rx:0,ry:0,rz:0},deagle:{rx:0,ry:0,rz:0},mp9:{rx:0,ry:0,rz:0},m4:{rx:0,ry:0,rz:0},ak:{z:.05},awp:{rx:0,ry:0,rz:0},he:{rx:0,ry:0,rz:0},flash:{rx:0,ry:0,rz:0},smoke:{rx:0,ry:0,rz:0}};
function placeLoadedWeapon(id){const sk=skinDef(id,vmSkin(id)),tpl=skinModel(id)||WEAPON_TPL[id];if(!tpl)return false;const w=cloneWeapon(tpl);
const want={ak:.6,m4:.6,awp:.7,mp9:.42,deagle:.2,glock:.18,he:.1,flash:.1,smoke:.1,knife:tpl.userData.karambit?.2:.3}[id]||.36;
const base=tpl.userData.lenZ||.5;w.scale.multiplyScalar(want/base);
const f=(tpl!==WEAPON_TPL[id]&&sk&&sk.fix)||(tpl.userData.karambit&&KARAMBIT_FIX)||WEAPON_FIX[id]||{};if(f.s)w.scale.multiplyScalar(f.s);const hold=new THREE.Group();hold.add(w);
const cat=viewCat(id),vp=VIEW_POSE[cat]||VIEW_POSE.rifle;
hold.rotation.set(f.rx||0,f.ry||0,f.rz||0);
const off=vp.hold||[0,0,0];hold.position.set(off[0],off[1],off[2]);hold.position.x+=f.x||0;hold.position.y+=f.y||0;hold.position.z+=f.z||0;
gun.add(hold);gun.add(flash);gun.userData.wpnHold=hold;
flash.position.set(0,.02,-want*.55);gun.scale.setScalar(1);gun.userData.loaded=true;gun.userData.viewCat=cat;gun.userData.karambit=!!tpl.userData.karambit;return true}
// Parent knife into the fist. Fist local: +Y = out through the fingers (tip must stay on +Y).
function clearFistExtras(fist,keep){if(!fist)return;for(let i=fist.children.length-1;i>=0;i--){const ch=fist.children[i];if(ch.isMesh||ch===keep)continue;fist.remove(ch)}}
function seatKnifeInFist(){if(!gun||!viewGlove)return;const hold=gun.userData.wpnHold,fist=viewGlove.userData.arms&&viewGlove.userData.arms.K;
  if(!hold)return;
  if(viewCat(vmId())!=='knife'||!fist){if(hold.parent&&hold.parent!==gun)gun.attach(hold);clearFistExtras(fist);return}
  clearFistExtras(fist,hold);
  if(hold.parent!==fist)fist.add(hold);
  // Ring in the knuckle curl. Hand pose untouched — only the knife rotates.
  const kar=!!gun.userData.karambit;
  hold.position.set(0,.01,0);
  // karambit: tip left (fist +X), flat toward camera, sharp edge facing left
  hold.rotation.set(kar?0:Math.PI/2,0,kar?-Math.PI/2:0);
  hold.scale.set(1,1,1)}
function viewCat(id){if(id==='awp')return'sniper';if(id==='mp9')return'smg';if(id==='glock'||id==='deagle')return'pistol';if(id==='he'||id==='flash'||id==='smoke')return'nade';if(id==='knife')return'knife';return'rifle'}
const VIEW_POSE={
// Gun points at crosshair. Hands are huge + low so sleeves exit the BOTTOM of the screen.
// Rifle hand sits under handguard (forward), not on the stock.
pistol:{gx:.15,gy:-.1,gz:-.32,tip:-.03,hx:.2,hy:-.25,hz:-.4,psx:.3,psy:.23},
smg:{gx:.21,gy:-.17,gz:-.3,tip:.02,hold:[0,0,0],hx:.15,hy:-.33,hz:-.4,psx:.22,psy:.44,over:1},
rifle:{gx:.2,gy:-.14,gz:-.32,tip:.02,hold:[0,0,0],hx:.16,hy:-.327,hz:-.4,psx:.23,psy:.46,over:1},
sniper:{gx:.23,gy:-.19,gz:-.34,tip:.015,hold:[0,0,0],hx:.17,hy:-.33,hz:-.4,psx:.23,psy:.46,over:1},
nade:{gx:.12,gy:-.07,gz:-.3,tip:-.04,hx:.1,hy:-.46,hz:-.38,psx:.85,psy:.78},
knife:{gx:.14,gy:-.1,gz:-.28,tip:.15,ry:.4,hx:.1,hy:-.46,hz:-.36,psx:.8,psy:.75}
};
// AK: mag + barrel on screen (not stock). Slight pull-in; don't over-zoom or the mag clips off.
const VIEW_Z={ak:.04};
const VM_ZOOM={rifle:1.12},VM_DROP={};
const HAND_TEX={pistol:null,rifle:null};let handTexLoading=false,viewHandPlate=null,viewHandsRoot=null;
function handPlateKey(cat){return(cat==='rifle'||cat==='smg'||cat==='sniper')?'rifle':'pistol'}
function loadHandTextures(){if(handTexLoading||(HAND_TEX.pistol&&HAND_TEX.rifle))return;handTexLoading=true;
const v='?v=28',files={pistol:'assets/viewhands/pistol.png',rifle:'assets/viewhands/rifle.png'};
const set=(k,t)=>{t.encoding=THREE.sRGBEncoding;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;t.needsUpdate=true;HAND_TEX[k]=t;mountViewHands()};
(async()=>{for(const k of Object.keys(files)){try{const buf=await loadAssetBuf([files[k]+v,'./'+files[k]+v,'/'+files[k]+v],'tex-'+k+'-v28');
const url=URL.createObjectURL(new Blob([buf],{type:'image/png'}));new THREE.TextureLoader().load(url,t=>{set(k,t);URL.revokeObjectURL(url)},undefined,()=>URL.revokeObjectURL(url))}catch(e){new THREE.TextureLoader().load(files[k]+v,t=>set(k,t))}}})()}
// 3D arms viewmodel: one static mesh holding both arms, split and posed rigidly in gun space.
// Fingers are bent shut around an axis; at = where that axis (the grip) sits,
// f = wrist-to-knuckle direction, p = palm normal (the side that faces the grip).
const ARM_POSE={
pistol:{R:{at:[0,-.02,.045],f:[-.1,.3,-.95],p:[-1,0,0]},L:{at:[-.006,-.045,.035],f:[.12,.3,-.95],p:[1,0,0]}},
smg:{L:{at:[0,.005,-.09],f:[.55,.25,-.8],p:[-.2,1,0]}},
rifle:{L:{mag:1,at:[0,-.06,-.02],up:[0,.88,.47],p:[1,0,0]}},
sniper:{L:{at:[0,.01,-.16],f:[.55,.25,-.8],p:[-.2,1,0]}},
nade:{R:{at:[0,-.01,.02],f:[-.1,.3,-.95],p:[-1,0,0]}},
// knife: fist lower-right (knife is parented here); open left hand on the left
knife:{K:{at:[.04,-.02,.06],f:[.3,.6,-.5],p:[.85,-.4,.15]},O:{cam:1,at:[-.22,-.15,-.3],f:[.3,.9,-.2],p:[.5,0,-.8]}}};
// knuckle line height, finger centre-line x and curl radius, in the model's rest-pose units
const ARM_SCALE=.42,ARM_KN=.285,ARM_FX=.025,ARM_CR=.075;
let gloveTpl=null,gloveState='idle',viewGlove=null;
function loadGloves(){if(gloveState!=='idle'||!THREE.GLTFLoader)return;gloveState='loading';
(async()=>{try{const buf=await loadAssetBuf(['./assets/viewhands/arms.glb','/assets/viewhands/arms.glb','assets/viewhands/arms.glb'],'arms-glb-v1');
const g=await parseGlb(buf);gloveTpl=g.scene;gloveState='ready';mountViewHands();feed('Arms ready')}catch(e){console.warn('arms failed',e);gloveState='failed'}})()}
function buildGlove(){gloveTpl.updateMatrixWorld(true);let src=null;gloveTpl.traverse(o=>{if(o.isMesh&&!src)src=o});
const geo=src.geometry.clone();geo.applyMatrix4(src.matrixWorld);
const pos=geo.attributes.position,idx=geo.index?geo.index.array:null,tri=idx?idx.length/3:pos.count/3;
const root=new THREE.Group();root.name='arms';root.userData={viewHands:true,arms:{},cat:null};
// rest pose: right arm on -Z, left arm on +Z, fingers along +Y, palms facing -X
// O = open left hand (fingers straight, thumb kept) for poses where it isn't gripping anything; K = right fist that keeps its thumb, for thin knife handles
for(const s of ['R','L','O','K']){const keep=[],side=s==='O'?'L':s==='K'?'R':s,open=s==='O';
for(let t=0;t<tri;t++){const a=idx?idx[t*3]:t*3,b=idx?idx[t*3+1]:t*3+1,c=idx?idx[t*3+2]:t*3+2;if((pos.getZ(a)+pos.getZ(b)+pos.getZ(c)<0)===(side==='R'))keep.push(a,b,c)}
let cz=0,n=0;for(const i of keep)if(pos.getY(i)>ARM_KN){cz+=pos.getZ(i);n++}cz/=n||1;
// drop the thumb: it can't bend, and in every grip it pokes through the gun
const sg=side==='R'?1:-1,thumb=i=>{const y=pos.getY(i);return y>.08&&y<.34&&(pos.getZ(i)-cz)*sg>.13},hand=[];
for(let t=0;t<keep.length;t+=3)if(open||s==='K'||!thumb(keep[t])&&!thumb(keep[t+1])&&!thumb(keep[t+2]))hand.push(keep[t],keep[t+1],keep[t+2]);
const g=geo.clone();stretchSleeve(g);if(!open)curlFingers(g);g.setIndex(hand);g.translate(-(ARM_FX-ARM_CR),-ARM_KN,-cz);
const mesh=new THREE.Mesh(g,src.material);mesh.frustumCulled=false;mesh.renderOrder=6;mesh.scale.setScalar(ARM_SCALE);
const pivot=new THREE.Group();pivot.add(mesh);root.add(pivot);root.userData.arms[s]=pivot}
return root}
// The source forearm is cut off ~23cm behind the knuckles, which ends mid-screen; lengthen it so the sleeve runs off the edge
const ARM_SLEEVE=-.1,ARM_STRETCH=3.2;
function stretchSleeve(g){const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);if(y<ARM_SLEEVE)p.setY(i,ARM_SLEEVE+(y-ARM_SLEEVE)*ARM_STRETCH)}g.computeBoundingSphere()}
function curlFingers(g){const p=g.attributes.position,nm=g.attributes.normal,tg=g.attributes.tangent;
for(let i=0;i<p.count;i++){const y0=p.getY(i),d=y0-ARM_KN;if(d<=0)continue;const t=d/ARM_CR,c=Math.cos(t),s=Math.sin(t),r=ARM_CR+p.getX(i)-ARM_FX;
p.setXY(i,ARM_FX-ARM_CR+r*c,ARM_KN+r*s);for(const a of [nm,tg])if(a){const x=a.getX(i),y=a.getY(i);a.setXY(i,x*c-y*s,x*s+y*c)}}}
// Front edge and tilt of the magazine in gun space, measured from the lower middle of the gun mesh
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
const _ax=new THREE.Vector3(),_ay=new THREE.Vector3(),_az=new THREE.Vector3(),_am=new THREE.Matrix4();
// per-weapon overrides, merged per hand over the category pose
const ARM_WPN={
// AK: right on pistol grip, left cups handguard from screen-left (f/p — must clear rifle `up` or palm floats under the gun)
ak:{R:{at:[0,-.03,.048],f:[-.12,.4,-.9],p:[-1,.05,0]},L:{mag:0,up:0,at:[0,.028,-.12],f:[.55,.28,-.78],p:[-.15,1,0]},O:null,K:null},
m4:{L:{at:[0,-.02,0],up:[0,1,.26],p:[1,0,0]},O:null,K:null},
awp:{L:{at:[0,-.015,-.11],up:[0,.1,-1],p:[-1,1.2,0]},O:null,K:null},
// right hand on the magazine grip, left on the front vertical grip
mp9:{R:{at:[0,-.045,-.05],f:[-.1,.4,-.9],p:[-1,0,0]},L:{at:[0,-.01,-.168],f:[.35,.35,-.87],p:[1,0,.4]},O:null,K:null}};
function poseArms(cat){if(!viewGlove)return;const u=viewGlove.userData,key=cat+':'+vmId()+':v4';if(u.cat===key)return;u.cat=key;
const B=ARM_POSE[cat]||ARM_POSE.rifle,X=ARM_WPN[vmId()]||{},P={};
for(const s of ['L','R','O','K']){if(X[s]===null||!(B[s]||X[s]))continue;const c=Object.assign({},B[s],X[s]);
  // Weapon f/p grip wins over category mag `up` — leftover up made the AK left hand float palm-up
  if(X[s]&&(X[s].f||X[s].up===0))delete c.up;P[s]=c}
// Hard-reset every arm, then enable only what this weapon needs (kills floating knife/open hands on the AK)
for(const s of ['L','R','O','K']){const pv=u.arms[s];if(!pv)continue;pv.visible=false;pv.scale.set(1,1,1);pv.position.set(0,0,0);pv.quaternion.identity();pv.traverse(o=>{if(o.isMesh)o.visible=false})}
for(const s of ['L','R','O','K']){const pv=u.arms[s],c=P[s];if(!pv||!c)continue;pv.visible=true;pv.traverse(o=>{if(o.isMesh)o.visible=true});
// cam: at/f/p are in camera space (screen-anchored), so undo the gun's rest pose
if(c.cam){const vp=VIEW_POSE[cat]||VIEW_POSE.rifle,q=new THREE.Quaternion().setFromEuler(new THREE.Euler(vp.tip||0,vp.ry||0,vp.rz||0)).invert(),
o=new THREE.Vector3(vp.gx,vp.gy-(VM_DROP[cat]||0),vp.gz+(VIEW_Z[vmId()]||0)).multiplyScalar(1/(VM_ZOOM[cat]||1));
pv.position.fromArray(c.at).sub(o).applyQuaternion(q);_ay.fromArray(c.f).normalize().applyQuaternion(q);_ax.fromArray(c.p).applyQuaternion(q);
_ax.addScaledVector(_ay,-_ax.dot(_ay)).normalize().negate();_az.crossVectors(_ax,_ay);_am.makeBasis(_ax,_ay,_az);pv.quaternion.setFromRotationMatrix(_am);pv.userData.camL=new THREE.Matrix4().compose(pv.position,pv.quaternion,pv.scale);continue}
pv.userData.camL=null;
if(c.up){const g=c.mag&&magGrip(),at=g?g.at:c.at;_ax.fromArray(c.p).negate().normalize();_az.fromArray(g?g.up:c.up).multiplyScalar(s==='L'?-1:1);_az.addScaledVector(_ax,-_az.dot(_ax)).normalize();
_ay.crossVectors(_az,_ax);_am.makeBasis(_ax,_ay,_az);pv.quaternion.setFromRotationMatrix(_am);pv.position.fromArray(at);continue}
_ay.fromArray(c.f).normalize();_ax.fromArray(c.p);_ax.addScaledVector(_ay,-_ax.dot(_ay)).normalize().negate();
_az.crossVectors(_ax,_ay);_am.makeBasis(_ax,_ay,_az);pv.quaternion.setFromRotationMatrix(_am);pv.position.fromArray(c.at)}
seatKnifeInFist()}
window.ARM_POSE=ARM_POSE;window.ARM_WPN=ARM_WPN;window.magGrip=magGrip;window.reposeArms=()=>{if(viewGlove){viewGlove.userData.cat=null;poseArms(viewCat(vmId()))}};
function mountViewHands(){if(!camera)return;loadGloves();loadHandTextures();
try{
if(!viewHandsRoot){viewHandsRoot=new THREE.Group();viewHandsRoot.name='viewHands';vmRoot.add(viewHandsRoot)}
if(viewHandPlate){if(viewHandPlate.parent)viewHandPlate.parent.remove(viewHandPlate);viewHandPlate=null}
for(let i=viewHandsRoot.children.length-1;i>=0;i--)viewHandsRoot.remove(viewHandsRoot.children[i]);
if(gun)for(let i=gun.children.length-1;i>=0;i--){const c=gun.children[i];if(c.userData&&c.userData.viewHands)gun.remove(c)}
const cat=viewCat(vmId()),vp=VIEW_POSE[cat]||VIEW_POSE.rifle,key=handPlateKey(cat),tex=HAND_TEX[key];
if(gloveState==='ready'){if(!viewGlove)viewGlove=buildGlove();if(gun){gun.add(viewGlove);viewGlove.userData.cat=null}
if(gun){gun.traverse(o=>{if(o.isMesh){o.renderOrder=6;if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms){m.depthTest=true;m.depthWrite=true;m.transparent=false}}}});gun.userData.viewCat=cat}
viewGlove.scale.setScalar(1/(gun.scale.x||1));poseArms(cat);seatKnifeInFist();window.__vh={cat,arms:true};return}
if(!tex){if(gun)gun.userData.viewCat=cat;return}
// No depthTest — hands always from bottom of screen; gun draws on top via renderOrder
const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false,side:THREE.FrontSide,alphaTest:.12});
const plate=new THREE.Mesh(new THREE.PlaneGeometry(vp.psx||.9,vp.psy||.85),mat);
plate.userData.viewHands=true;plate.userData.handKey=key;
plate.position.set(vp.hx??.1,vp.hy??-.5,vp.hz??-.42);
plate.frustumCulled=false;plate.renderOrder=vp.over?10:2;viewHandsRoot.add(plate);viewHandPlate=plate;
if(gun){gun.traverse(o=>{if(o.isMesh&&!o.userData.viewHands){o.renderOrder=6;if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms){m.depthTest=true;m.depthWrite=true;m.transparent=false}}}});gun.userData.viewCat=cat}
window.__vh={cat,key,pos:plate.position.toArray(),size:[vp.psx,vp.psy]}}catch(err){console.warn('viewHands failed',err)}}
function buildModel(id){buildModelRaw(id);applySkin(gun,id,vmSkin(id))}
function buildModelRaw(id){while(gun.children.length)gun.remove(gun.children[0]);gun.userData.loaded=false;gun.userData.karambit=0;gun.userData.wpnHold=null;if(custom&&cfgM.id===id){gun.add(custom.root);gun.add(flash);placeCustom();scoped=false;mountViewHands();return}if(placeLoadedWeapon(id)){scoped=false;mountViewHands();return}const BD={ak:buildAK,m4:buildM4,glock:buildGlock2,deagle:buildDeagle2,mp9:buildMP9,awp:buildAWP,knife:buildKnife,he:()=>buildNade2('he'),flash:()=>buildNade2('flash'),smoke:()=>buildNade2('smoke')};scoped=false;if(BD[id])BD[id]();mountViewHands()}
function setWeapon(id){if(inv[cur]){inv[cur].ammo=ammo;inv[cur].reserve=reserve}cur=id;inspT=0;swing=null;ammo=inv[id].ammo;reserve=inv[id].reserve;reloading=0;buildModel(id);updHud()}
function cycleWeapons(dir){const owned=[];for(const k of Object.keys(W)){if(!inv[k])continue;if(W[k].nade&&(!(k in nades)||nades[k]<=0))continue;owned.push(k)}owned.sort((a,b)=>(W[a].slot-W[b].slot)||a.localeCompare(b));if(owned.length<2)return;let i=owned.indexOf(cur);if(i<0)i=0;const n=owned[(i+dir+owned.length*10)%owned.length];if(n!==cur)setWeapon(n)}
function grainTex(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#7a4220';x.fillRect(0,0,256,256);
for(let i=0;i<140;i++){x.strokeStyle='rgba('+(Math.random()<.55?'45,20,6':'180,115,62')+','+(.08+Math.random()*.22)+')';x.lineWidth=.5+Math.random()*2.2;x.beginPath();const y=Math.random()*256;x.moveTo(0,y);for(let q=1;q<=8;q++)x.lineTo(q*32,y+Math.sin(q*1.3+i)*5);x.stroke()}
const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
function wornTex(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#8c8c8c';x.fillRect(0,0,256,256);
for(let i=0;i<260;i++){const v=Math.random()<.5?255:30;x.strokeStyle='rgba('+v+','+v+','+v+','+(.1+Math.random()*.25)+')';x.lineWidth=.4+Math.random();x.beginPath();const a=Math.random()*256,b=Math.random()*256,l=8+Math.random()*50,t=Math.random()*6.28;x.moveTo(a,b);x.lineTo(a+Math.cos(t)*l,b+Math.sin(t)*l);x.stroke()}
const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
function buildAK(){const wt=grainTex(),wn=wornTex();
const wood=new THREE.MeshStandardMaterial({map:wt,bumpMap:wt,bumpScale:.4,roughness:.5,metalness:.05}),st=new THREE.MeshStandardMaterial({color:0x3a3c41,metalness:.92,roughness:.42,roughnessMap:wn,bumpMap:wn,bumpScale:.2}),bk=new THREE.MeshStandardMaterial({color:0x121316,metalness:.7,roughness:.5,roughnessMap:wn});
const B=(w,h,d,m,x,y,z,rx,ry)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.rotation.set(rx||0,ry||0,0);gun.add(o);return o};
const C=(r,l,m,x,y,z,sz)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,l,14),m);o.rotation.x=Math.PI/2;o.position.set(x,y,z);if(sz)o.scale.z=sz;gun.add(o);return o};
B(.064,.078,.36,st,0,0,-.02);B(.058,.03,.34,st,0,.052,-.02);
for(let i=0;i<6;i++)B(.062,.007,.012,st,0,.069,-.15+i*.045);
B(.004,.03,.07,bk,.033,.025,-.04);
for(const sx of [-1,1])for(let i=0;i<4;i++)B(.005,.01,.01,st,sx*.033,.02,-.14+i*.08);
B(.03,.028,.05,st,0,.082,-.13);B(.024,.006,.07,st,0,.1,-.1,-.25);
B(.004,.012,.14,st,.034,0,-.02);B(.012,.014,.03,st,.04,.04,-.07);
B(.05,.058,.05,bk,0,.022,-.5);B(.028,.075,.028,st,0,.05,-.86);C(.018,.034,bk,0,.092,-.86);
C(.014,.34,st,0,.05,-.46);
B(.056,.03,.26,wood,0,.066,-.4);for(let i=0;i<4;i++)B(.02,.004,.014,bk,0,.082,-.3-i*.045);
C(.034,.27,wood,0,-.012,-.42,.78);C(.037,.014,st,0,-.012,-.555,.78);C(.037,.014,st,0,-.012,-.29,.78);
C(.0105,.42,st,0,0,-.73);C(.016,.06,bk,0,0,-.92);C(.0125,.025,st,0,0,-.89);C(.005,.28,st,0,-.043,-.42);B(.012,.02,.03,st,0,-.02,-.56);
B(.04,.105,.055,bk,0,-.095,.1,-.3);
const tg=new THREE.Mesh(new THREE.TorusGeometry(.03,.004,6,14),st);tg.rotation.y=Math.PI/2;tg.position.set(0,-.06,.03);gun.add(tg);B(.006,.03,.008,st,0,-.05,.035,.3);
let a=.05,y=-.045,z=-.105;for(let i=0;i<5;i++){B(.046,.06,.076,st,0,y,z,a);if(i%2==0)B(.048,.006,.078,bk,0,y,z,a);y-=.058*Math.cos(a);z-=.058*Math.sin(a);a+=.13}
B(.05,.07,.1,wood,0,-.01,.17);B(.045,.1,.2,wood,0,-.025,.31,.04);B(.05,.115,.018,st,0,-.03,.425,.04);
B(.07,.075,.075,MT.g,0,-.1,.09);B(.075,.075,.34,MT.l,.03,-.17,.32,-.15);B(.085,.07,.13,MT.g,0,-.045,-.42);B(.07,.07,.42,MT.l,-.07,-.09,-.2,0,-.28);
flash.position.set(0,.01,-.97);gun.add(flash);gun.scale.setScalar(.78)}
Object.assign(W,{knife:{n:'Knife',price:0,slot:3,mag:1,res:0,rate:.55,auto:false,melee:true,dmg:50,spd:1.1,rl:1,kill:1500,base:0,mv:0,rs:0,kick:0},he:{n:'HE Grenade',price:300,slot:4,mag:1,res:0,rate:.8,auto:false,nade:true,spd:1,rl:1,kill:300,dmg:0,base:0,mv:0,rs:0,kick:0},flash:{n:'Flashbang',price:200,slot:4,mag:1,res:0,rate:.8,auto:false,nade:true,spd:1,rl:1,kill:300,dmg:0,base:0,mv:0,rs:0,kick:0},smoke:{n:'Smoke Grenade',price:300,slot:4,mag:1,res:0,rate:.8,auto:false,nade:true,spd:1,rl:1,kill:300,dmg:0,base:0,mv:0,rs:0,kick:0}});
const G={he:{n:'HE Grenade',price:300},flash:{n:'Flashbang',price:200},smoke:{n:'Smoke Grenade',price:300}};
function kit(t){const wn=wornTex(),g=t||gun;
const st=new THREE.MeshStandardMaterial({color:0x3a3c41,metalness:.92,roughness:.42,roughnessMap:wn,bumpMap:wn,bumpScale:.2}),bk=new THREE.MeshStandardMaterial({color:0x121316,metalness:.7,roughness:.5,roughnessMap:wn}),pl=new THREE.MeshStandardMaterial({color:0x1c1d20,roughness:.75,metalness:.1}),ol=new THREE.MeshStandardMaterial({color:0x4a5238,roughness:.65});
const B=(w,h,d,m,x,y,z,rx,ry)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.rotation.set(rx||0,ry||0,0);g.add(o);return o};
const C=(r,l,m,x,y,z,sz)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,l,14),m);o.rotation.x=Math.PI/2;o.position.set(x,y,z);if(sz)o.scale.z=sz;g.add(o);return o};
const V=(r,h,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,14),m);o.position.set(x,y,z);g.add(o);return o};
const hd=(rz,lz,ly)=>{B(.07,.075,.075,MT.g,0,-.1,rz);B(.075,.075,.34,MT.l,.03,-.17,rz+.23,-.15);B(.085,.07,.13,MT.g,0,ly,lz);B(.07,.07,.42,MT.l,-.07,ly-.045,lz+.22,0,-.28)};
const tg=(y,z)=>{const q=new THREE.Mesh(new THREE.TorusGeometry(.03,.004,6,14),st);q.rotation.y=Math.PI/2;q.position.set(0,y,z);g.add(q)};
const end=(fz,s)=>{flash.position.set(0,.02,fz);g.add(flash);g.scale.setScalar(s)};
return{st,bk,pl,ol,B,C,V,hd,tg,end}}
function buildM4(){const{st,bk,pl,B,C,hd,tg,end}=kit();
B(.058,.07,.3,bk,0,.01,-.02);B(.056,.06,.22,bk,0,-.04,.02);B(.02,.018,.32,st,0,.056,-.04);for(let i=0;i<8;i++)B(.022,.006,.008,st,0,.067,-.18+i*.035);
B(.012,.04,.02,bk,0,.078,.1);B(.012,.045,.01,bk,0,.075,-.4);C(.034,.32,pl,0,.005,-.4);C(.036,.012,bk,0,.005,-.25);C(.036,.012,bk,0,.005,-.55);
C(.01,.2,st,0,.005,-.62);C(.022,.3,bk,0,.005,-.8);B(.04,.14,.058,bk,0,-.12,-.03,.1);B(.042,.01,.06,pl,0,-.195,-.05,.1);
B(.04,.1,.05,pl,0,-.09,.1,-.3);tg(-.06,.03);C(.022,.15,bk,0,.01,.18);B(.05,.085,.17,pl,0,-.025,.28);B(.05,.1,.03,pl,0,-.03,.375);B(.004,.025,.06,bk,.03,.025,-.04);B(.03,.012,.02,bk,0,.052,.12);
hd(.1,-.4,-.04);end(-1.02,.78)}
function buildMP9(){const{st,bk,pl,B,C,hd,tg,end}=kit();
B(.055,.08,.26,pl,0,0,-.02);B(.03,.015,.24,st,0,.047,-.02);for(let i=0;i<6;i++)B(.032,.005,.01,bk,0,.056,-.12+i*.04);
B(.012,.03,.012,bk,0,.065,-.12);B(.012,.03,.012,bk,0,.065,.07);C(.016,.14,bk,0,.01,-.24);C(.012,.04,st,0,.01,-.33);B(.03,.06,.06,pl,0,-.07,-.14);
B(.004,.03,.18,st,.02,0,.22);B(.004,.03,.18,st,-.02,0,.22);B(.045,.05,.01,pl,0,0,.31);
B(.04,.12,.05,pl,0,-.1,.04,-.15);B(.035,.18,.045,bk,0,-.15,-.06);B(.037,.01,.047,pl,0,-.24,-.06);tg(-.06,0);hd(.04,-.2,-.05);end(-.4,1)}
function buildAWP(){const{st,bk,pl,ol,B,C,hd,end}=kit(),lens=new THREE.MeshStandardMaterial({color:0x1b3a52,metalness:1,roughness:.04});
B(.055,.08,.3,ol,0,0,0);B(.05,.1,.35,ol,0,-.03,.3);B(.05,.03,.12,ol,0,.04,.3);B(.05,.115,.02,bk,0,-.03,.48);
C(.012,.6,st,0,.015,-.6);C(.02,.07,bk,0,.015,-.95);for(let i=0;i<3;i++)B(.046,.006,.01,st,0,.015,-.93+i*.02);
C(.025,.28,bk,0,.085,-.05);C(.034,.05,bk,0,.085,-.22);C(.03,.04,bk,0,.085,.12);C(.02,.003,lens,0,.085,-.248);
B(.012,.022,.012,bk,0,.113,-.05);B(.022,.012,.012,bk,.03,.087,-.05);B(.02,.03,.03,bk,0,.06,-.12);B(.02,.03,.03,bk,0,.06,.02);
B(.06,.01,.01,st,.04,.03,.06);B(.018,.018,.018,bk,.075,.03,.06);B(.035,.07,.1,bk,0,-.06,-.02);B(.035,.1,.05,ol,0,-.08,.12,-.25);
hd(.12,-.35,-.05);end(-1,.7)}
function buildKnife(){const kg=new THREE.Group();gun.add(kg);kg.rotation.x=.2;const{st,bk,pl,B}=kit(kg);
const sh=new THREE.Shape();sh.moveTo(0,.014);sh.lineTo(.15,.016);sh.quadraticCurveTo(.21,.014,.235,-.008);sh.quadraticCurveTo(.2,-.02,.15,-.022);sh.lineTo(0,-.02);sh.lineTo(0,.014);
const bl=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.004,bevelEnabled:false}),st);bl.rotation.y=Math.PI/2;bl.position.set(-.002,0,-.07);kg.add(bl);
B(.026,.036,.13,pl,0,0,0);for(let i=0;i<4;i++)B(.028,.038,.004,bk,0,0,-.04+i*.025);B(.022,.05,.01,st,0,0,-.07);B(.03,.04,.012,st,0,0,.068);
for(let i=0;i<5;i++)B(.004,.006,.01,bk,0,.015,-.12-i*.02);B(.0015,.006,.15,bk,.003,.002,-.17);
gun.scale.setScalar(1)}
const nl=[],smokeMeshes=[],smokeL=[],efx=[],nadeN=new THREE.Vector3();let blindT=0;
function equipKnife(){inv.knife=inv.knife||{ammo:1,reserve:0};if(cur!=='knife')setWeapon('knife')}
function equipNade(id){if(nades[id]<=0){feed('No '+G[id].n+' — buy one with B');return}inv[id]=inv[id]||{ammo:1,reserve:0};if(cur!==id)setWeapon(id)}
function back(){if(inv[cur])return;swap(1);if(!inv[cur])swap(2);if(!inv[cur])equipKnife()}
// Knife swings: keyframes are [progress, x,y,z, rx,ry,rz] offsets on the viewmodel; light slashes alternate sides
const SWING={light:{dur:.42,keys:[[0,0,0,0,0,0,0],[.2,.05,.04,0,-.2,-.3,-.5],[.5,-.15,-.09,-.07,.45,.55,.85],[1,0,0,0,0,0,0]]},
heavy:{dur:.95,keys:[[0,0,0,0,0,0,0],[.32,.03,.03,.04,-.4,.1,.2],[.46,-.05,.02,-.15,.08,-.1,-.15],[.62,-.05,.02,-.14,.06,-.1,-.15],[1,0,0,0,0,0,0]]}};
// The open hand is camera-anchored but parented to the gun: undo the swing offset on it so only the knife moves
const _hm1=new THREE.Matrix4(),_hm2=new THREE.Matrix4(),_hm3=new THREE.Matrix4(),_hv=new THREE.Vector3(),_hq=new THREE.Quaternion(),_he=new THREE.Euler();
function holdOpenHand(sw,z){const pv=viewGlove&&viewGlove.userData.arms&&viewGlove.userData.arms.O;if(!pv||!pv.visible||!pv.userData.camL)return;
if(!sw){if(pv.userData.swung){pv.userData.camL.decompose(pv.position,pv.quaternion,pv.scale);pv.userData.swung=false}return}
gun.updateMatrix();gun.updateMatrixWorld(true);
_hv.set(gun.position.x-sw[0]*z,gun.position.y-sw[1]*z,gun.position.z-sw[2]*z);_hq.setFromEuler(_he.set(gun.rotation.x-sw[3],gun.rotation.y-sw[4],gun.rotation.z-sw[5]));
_hm2.compose(_hv,_hq,gun.scale);
_hm3.copy(gun.matrixWorld).invert().multiply(pv.parent.matrixWorld);
_hm1.copy(gun.matrix).invert().multiply(_hm2).multiply(_hm3);
_hm1.premultiply(_hm2.copy(_hm3).invert()).multiply(pv.userData.camL);
_hm1.decompose(pv.position,pv.quaternion,pv.scale);pv.userData.swung=true}
function swingPose(dt){if(!swing)return null;const S=SWING[swing.type];swing.t+=dt;const p=Math.min(1,swing.t/S.dur),k=S.keys;if(p>=1){swing=null;return null}
let i=0;while(i<k.length-2&&p>k[i+1][0])i++;const a=k[i],b=k[i+1],u=(p-a[0])/(b[0]-a[0]),e=u*u*(3-2*u),m=swing.side;
return a.slice(1).map((v,j)=>{const r=v+(b[j+1]-v)*e;return j===0||j===4||j===5?r*m:r})}
function knifeHit(dmgB,dmgH,range){const dir=tmp.set(0,0,-1).applyQuaternion(camera.quaternion).clone();
if(online){onlineHitscan(dir,range,dmgB,dmgH);return}
ray.set(camera.position,dir);ray.far=range;
const hs=ray.intersectObjects(boxMeshes.concat(botMeshes),false);
if(hs.length){const o=hs[0].object;if(o.userData.bot&&o.userData.bot.alive){const b=o.userData.bot,dmg=o.userData.head?dmgH:dmgB;
if(party&&b.net){ptHit(b,o.userData.head,dmg,hs[0].point);return}b.hp-=dmg;b.seen=1;b.stun=.4;burst(hs[0].point,10,0x7a0c0c,3);snd(.25,.05,900);
$('hit').style.opacity=1;setTimeout(()=>$('hit').style.opacity=0,80);if(b.hp<=0)killBot(b,o.userData.head)}else{burst(hs[0].point,4,0xc9b88a,2);snd(.08,.04,3500)}}}
function slash(){fireCd=.5;inspT=0;swingSide=-swingSide;swing={type:'light',t:0,side:swingSide};snd(.12,.08,2500);knifeHit(50,100,2.8)}
function stab(){if(fireCd>0||freezeT>0||P.dead)return;fireCd=1.1;mouseDown=false;inspT=0;swing={type:'heavy',t:0,side:1};snd(.1,.12,1400);
const id=cur;setTimeout(()=>{if(cur!==id||P.dead||state!=='play')return;snd(.18,.07,1800);knifeHit(90,180,2.4)},400)}
function nadeMesh(id){return new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.12,10),new THREE.MeshStandardMaterial({color:{he:0x3f5a2f,flash:0xcfd2d6,smoke:0x7c8a95}[id],metalness:.6,roughness:.4}))}
function throwNade(){const id=cur;if(nades[id]<=0)return;nades[id]--;fireCd=.8;kick=1;snd(.15,.1,800);
const dir=new THREE.Vector3(0,.12,-1).applyQuaternion(camera.quaternion).normalize();
const m=nadeMesh(id),v=dir.clone().multiplyScalar(15),fuse=id==='he'?1.7:id==='flash'?1.5:1.2;
m.position.copy(camera.position).addScaledVector(dir,.6);m.position.y-=.1;scene.add(m);nl.push({m,v,t:fuse,type:id});
if(party)ptSend({t:'throw',rd:round,kind:id,x:m.position.x,y:m.position.y,z:m.position.z,vx:v.x,vy:v.y,vz:v.z,fuse});else if(online&&window.Netplay&&Netplay.connected)Netplay.send({t:'throw',kind:id,x:m.position.x,y:m.position.y,z:m.position.z,vx:v.x,vy:v.y,vz:v.z,fuse});
if(nades[id]<=0){delete inv[id];setTimeout(back,350)}updHud()}
function spawnSmokeCloud(p){
for(let j=0;j<16;j++){const r=1.6+Math.random()*.9,s=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),new THREE.MeshBasicMaterial({color:0xb8bcc0,transparent:true,opacity:.75,depthWrite:false,side:THREE.DoubleSide}));s.position.set(p.x+(Math.random()-.5)*4,world?p.y+.7+Math.random()*1.6:Math.max(.8,p.y+Math.random()*2),p.z+(Math.random()-.5)*4);s.scale.setScalar(.1);scene.add(s);smokeMeshes.push(s);smokeL.push({m:s,t:0,life:16})}
}
function applyFlashLocal(p){
const d=p.distanceTo(camera.position);if(d>=36)return;
// Online: still flash through soft cover so peer flashes always land
if(!online&&!los(p,camera.position))return;
const to=p.clone().sub(camera.position).normalize();
const fw=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).dot(to);
const power=online?(2.2+3.5*Math.max(0,fw))*(1-d/36):(1+4*Math.max(0,fw))*(1-d/30);
blindT=Math.max(blindT,power);$('fl').style.opacity=Math.min(1,blindT*.9);
}
function applyHeLocal(p){
const dp=p.distanceTo(camera.position);if(dp>=9)return;
if(!online&&!los(p,camera.position))return;
let dm=120*(1-dp/9);if(armor>0){armor=Math.max(0,armor-dm*.5);dm*=.5}
P.hp-=dm;$('dmg').style.boxShadow='inset 0 0 160px 40px rgba(220,0,0,.7)';setTimeout(()=>$('dmg').style.boxShadow='inset 0 0 160px 40px rgba(220,0,0,0)',300);updHud();
if(P.hp<=0&&!P.dead)playerDown();
}
function boom(type,p,fromNet){
if(!fromNet&&party)ptSend({t:'nade',rd:round,kind:type,x:+p.x,y:+p.y,z:+p.z});
else if(!fromNet&&online&&window.Netplay&&Netplay.connected){
  // Use `kind` — PeerJS/binary packs can mishandle a bare `type` field
  Netplay.send({t:'nade',kind:type,nadeType:type,x:+p.x,y:+p.y,z:+p.z});
}
if(type==='he'){burst(p,26,0xff9a30,10);burst(p,12,0x333333,6);snd(1,.6,700);const L=new THREE.PointLight(0xffaa55,8,20);L.position.copy(p);scene.add(L);setTimeout(()=>scene.remove(L),140);
const f=new THREE.Mesh(new THREE.SphereGeometry(.5,12,10),new THREE.MeshBasicMaterial({color:0xffa040,transparent:true,opacity:.9,depthWrite:false}));f.position.copy(p);scene.add(f);efx.push({m:f,t:.35,max:.35,s:6});
for(const b of bots){if(!b.alive||(b.team!=='ct'&&!b.net)||(party&&!b.enemy))continue;const bv=new THREE.Vector3(b.x,(b.y||0)+1.1,b.z),d=bv.distanceTo(p);if(d<8){const dmg=Math.round(130*(1-d/8));
// Online: only the thrower deals HE to the peer via hit msg — never kill netBot on fromNet
if(b.net&&party){if(!fromNet&&b.enemy)ptSend({t:'phit',to:b.pid,dmg,head:false,rd:round})}else if(b.net&&online&&window.Netplay){if(!fromNet){Netplay.send({t:'hit',dmg:dmg,head:false,rd:round});b.hp-=dmg}}
else{b.hp-=dmg;b.seen=1;b.stun=.5;if(b.hp<=0)killBot(b,false)}}}
applyHeLocal(p)}
else if(type==='flash'){snd(.8,.3,6000);burst(p,14,0xffffff,8);const L=new THREE.PointLight(0xffffff,12,30);L.position.copy(p);scene.add(L);setTimeout(()=>scene.remove(L),160);
applyFlashLocal(p);
for(const b of bots){if(!b.alive||b.net||b.team!=='ct')continue;const bv=new THREE.Vector3(b.x,(b.y||0)+1.5,b.z),dd=bv.distanceTo(p);if(dd<28)b.blind=4*(1-dd/28)+1}}
else{snd(.4,.25,1500);spawnSmokeCloud(p)}}
function updNades(dt){
for(let i=nl.length-1;i>=0;i--){const n=nl[i],p=n.m.position;n.t-=dt;n.v.y-=18*dt;
if(world){const vl=n.v.length(),stp=vl*dt;
if(stp>1e-6){const dx=n.v.x/vl,dy=n.v.y/vl,dz=n.v.z/vl,h=world.raycast(p.x,p.y,p.z,dx,dy,dz,stp+.06);
if(h){const N=world.N,k=h.tri*3;nadeN.set(N[k],N[k+1],N[k+2]);if(nadeN.x*dx+nadeN.y*dy+nadeN.z*dz>0)nadeN.negate();
const go=Math.max(0,h.t-.06);p.x+=dx*go;p.y+=dy*go;p.z+=dz*go;
n.v.addScaledVector(nadeN,-1.45*n.v.dot(nadeN)).multiplyScalar(.72);if(nadeN.y>.6&&Math.abs(n.v.y)<1)n.v.y=0}
else p.addScaledVector(n.v,dt)}}
else{if(hits(p.x+n.v.x*dt,p.z,.1,p.y))n.v.x*=-.5;else p.x+=n.v.x*dt;if(hits(p.x,p.z+n.v.z*dt,.1,p.y))n.v.z*=-.5;else p.z+=n.v.z*dt;
p.y+=n.v.y*dt;if(p.y<.08){p.y=.08;n.v.y*=-.4;n.v.x*=.7;n.v.z*=.7;if(Math.abs(n.v.y)<.8)n.v.y=0}}
n.m.rotation.x+=dt*6;if(n.t<=0){nl.splice(i,1);scene.remove(n.m);if(!n.net)boom(n.type,p.clone())}}
for(let i=smokeL.length-1;i>=0;i--){const s=smokeL[i];s.t+=dt;s.m.scale.setScalar(.1+.9*Math.min(1,s.t/1.4));if(s.t>s.life-2)s.m.material.opacity=Math.max(0,.75*(s.life-s.t)/2);if(s.t>=s.life){scene.remove(s.m);smokeMeshes.splice(smokeMeshes.indexOf(s.m),1);smokeL.splice(i,1)}}
for(let i=efx.length-1;i>=0;i--){const e=efx[i];e.t-=dt;const k=1-e.t/e.max;e.m.scale.setScalar(1+e.s*k);e.m.material.opacity=Math.max(0,.9*(1-k));if(e.t<=0){scene.remove(e.m);efx.splice(i,1)}}
blindT=Math.max(0,blindT-dt);$('fl').style.opacity=Math.min(1,blindT*.9)}
function pistolHands(B){const g=MT.g,l=MT.l;
B(.05,.09,.05,g,.005,-.075,.075);for(let i=0;i<3;i++)B(.042,.017,.036,g,0,-.05-i*.02,.008);B(.016,.016,.07,g,.033,-.03,.04);B(.075,.075,.34,l,.04,-.15,.28,-.15);
B(.03,.08,.05,g,-.038,-.075,.06);for(let i=0;i<3;i++)B(.03,.017,.036,g,-.034,-.05-i*.02,.01);B(.014,.014,.085,g,-.026,-.002,-.02);B(.07,.07,.38,l,-.11,-.12,.25,0,-.3)}
function buildGlock2(){const{st,bk,pl,B,C,end}=kit(),wh=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x777777});
B(.032,.04,.2,bk,0,.025,-.04);B(.026,.006,.2,bk,0,.047,-.04);B(.03,.03,.01,bk,0,.03,-.145,.3);
for(let i=0;i<5;i++)B(.034,.03,.004,st,0,.027,.045+i*.01);for(let i=0;i<3;i++)B(.034,.03,.004,st,0,.027,-.11-i*.01);
B(.034,.014,.05,st,0,.038,-.02);B(.004,.008,.012,st,.012,.04,-.01);C(.009,.03,st,0,.025,-.15);C(.0055,.006,bk,0,.025,-.166);
B(.014,.012,.01,bk,0,.053,.07);B(.003,.003,.002,wh,-.004,.056,.076);B(.003,.003,.002,wh,.004,.056,.076);B(.008,.012,.008,bk,0,.053,-.13);B(.004,.004,.003,wh,0,.057,-.133);
B(.03,.032,.17,pl,0,-.005,-.02);for(let i=0;i<3;i++)B(.034,.004,.01,bk,0,-.014,-.07-i*.02);
B(.004,.01,.03,st,.017,0,-.01);B(.004,.01,.012,st,.017,0,-.075);
B(.034,.1,.05,pl,0,-.07,.04,-.12);for(let r=0;r<4;r++)for(const s of [-1,1])B(.004,.012,.04,bk,s*.018,-.05-r*.02,.036,-.12);
B(.036,.012,.056,pl,0,-.122,.056,-.12);B(.032,.01,.052,bk,0,-.132,.06,-.12);
B(.02,.008,.05,pl,0,-.025,-.03);B(.02,.02,.008,pl,0,-.015,-.055);B(.006,.022,.008,st,0,-.022,-.015,.2);
pistolHands(B);end(-.2,1.4)}
function buildDeagle2(){const{bk,pl,B,C,end}=kit(),wh=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x888888}),gold=new THREE.MeshStandardMaterial({color:0xb08a3a,metalness:.95,roughness:.28}),metal=new THREE.MeshStandardMaterial({color:0x3a3c41,metalness:.9,roughness:.35});
// slim slide — smaller than before so it doesn't fill the FOV
B(.034,.04,.18,metal,0,.028,0);B(.032,.036,.06,metal,0,.026,-.11);B(.036,.012,.18,metal,0,.05,0);
for(let i=0;i<6;i++)B(.014,.007,.005,bk,0,.054,-.08+i*.022);
for(let i=0;i<4;i++)B(.036,.022,.0035,bk,0,.028,.05+i*.012);
B(.036,.012,.045,bk,0,.038,-.01);B(.005,.014,.028,metal,.02,.012,0);B(.004,.01,.024,metal,.02,-.004,-.03);
// muzzle
C(.011,.028,metal,0,.022,-.155);C(.008,.014,bk,0,.022,-.17);C(.013,.008,gold,0,.022,-.176);
// sights
B(.022,.01,.01,bk,0,.058,.065);B(.003,.003,.002,wh,-.006,.063,.07);B(.003,.003,.002,wh,.006,.063,.07);B(.009,.014,.008,bk,0,.06,-.12);B(.003,.004,.002,wh,0,.067,-.122);
B(.01,.008,.012,gold,0,.04,.08);
// frame
B(.032,.036,.14,bk,0,-.01,0);B(.03,.028,.05,pl,0,-.006,-.09);B(.036,.01,.06,metal,0,.008,.015);
// trigger
B(.018,.008,.035,pl,0,-.024,0);B(.016,.018,.008,pl,0,-.018,-.03);B(.005,.018,.007,metal,0,-.028,-.008,.25);B(.022,.006,.022,bk,0,-.045,0);
// grip
B(.036,.1,.05,pl,0,-.075,.04,-.1);for(let r=0;r<4;r++)for(const s of [-1,1])B(.004,.014,.04,bk,s*.02,-.04-r*.018,.04,-.1);
B(.034,.008,.05,metal,0,-.125,.05,-.1);B(.038,.005,.052,gold,0,-.07,.04,-.1);
B(.026,.035,.014,pl,0,-.035,.08,-.03);B(.016,.024,.018,bk,0,-.014,.07);
B(.03,.024,.04,bk,0,.012,.095);B(.028,.016,.028,pl,0,0,.12);
pistolHands(B);end(-.19,1.05)}
function nadeHands(B){const g=MT.g;B(.07,.08,.04,g,.01,-.01,.055);for(let i=0;i<4;i++)B(.014,.016,.05,g,-.03+i*.018,-.04,.02);B(.016,.016,.05,g,.03,.03,.03,0,-.5);B(.075,.075,.36,MT.l,.03,-.1,.27,-.2)}
function buildNade2(type){const{st,bk,B,V}=kit(),brass=new THREE.MeshStandardMaterial({color:0xb08a3a,metalness:.9,roughness:.35}),gm=new THREE.MeshStandardMaterial({color:{he:0x3f5a2f,flash:0xc9ccd0,smoke:0x6f7c86}[type],roughness:.5,metalness:type==='he'?.25:.65});
let top=.07,sx=.052;
if(type==='he'){const b=new THREE.Mesh(new THREE.SphereGeometry(.045,18,14),gm);b.scale.y=1.2;gun.add(b);
for(let r=-2;r<=2;r++){const y=r*.02,rad=.045*Math.sqrt(Math.max(0,1-Math.pow(y/.054,2)));for(let k=0;k<10;k++){const a=k/10*Math.PI*2+(r%2?.31:0),c=new THREE.Mesh(new THREE.BoxGeometry(.016,.014,.016),gm);c.position.set(Math.cos(a)*rad,y,Math.sin(a)*rad);c.rotation.y=-a;gun.add(c)}}
V(.016,.025,bk,0,.065,0);V(.011,.03,brass,0,.088,0);top=.075}
else{const h=type==='flash'?.15:.14,r=type==='flash'?.03:.032;V(r,h,gm,0,0,0);V(r*.92,.02,bk,0,h/2+.008,0);V(r*1.02,.02,bk,0,-h/2-.005,0);V(.011,.02,brass,0,h/2+.028,0);top=h/2+.018;sx=r+.008;
if(type==='flash'){for(let row=0;row<3;row++)for(let k=0;k<12;k++){const a=k/12*Math.PI*2,c=new THREE.Mesh(new THREE.BoxGeometry(.004,.01,.008),bk);c.position.set(Math.cos(a)*(r+.001),.045-row*.035,Math.sin(a)*(r+.001));c.rotation.y=-a;gun.add(c)}}
else{V(r+.001,.03,new THREE.MeshStandardMaterial({color:0xd9b53a,roughness:.6}),0,.02,0);for(let k=0;k<6;k++){const a=k/6*Math.PI*2,c=new THREE.Mesh(new THREE.BoxGeometry(.008,.004,.008),bk);c.position.set(Math.cos(a)*.016,h/2+.011,Math.sin(a)*.016);gun.add(c)}}}
B(.008,top*2+.02,.022,st,sx,0,0);B(sx+.004,.008,.022,st,sx/2,top+.004,0);
const pr=new THREE.Mesh(new THREE.TorusGeometry(.014,.0025,6,14),st);pr.position.set(sx+.025,top-.005,0);pr.rotation.y=Math.PI/2;gun.add(pr);B(.025,.003,.003,st,sx+.012,top-.005,0);
nadeHands(B);gun.scale.setScalar(1.5)}
function swap(s){for(const k in inv)if(W[k].slot===s&&k!==cur){setWeapon(k);return}}
function toggleHand(){leftHand=!leftHand;vmRoot.scale.x=leftHand?-1:1;save();feed(leftHand?'Left hand':'Right hand')}
// Inspect: swing the gun to show one side then the other; any action cancels it
const INSPECT=2.4;
function startInspect(){if(P.dead||reloading>0||scoped||!gun.visible)return;inspT=INSPECT}
// Guns lying on the floor, from G or from killed players. Walk over one to take it if that slot is empty.
const drops=[],DROP_LEN={ak:.87,m4:.85,awp:1.1,mp9:.45,deagle:.27,glock:.2};let pickCd=0;
function dropMesh(id){const tpl=WEAPON_TPL[id]||BOT_GUN_TPL[id];if(!tpl)return null;const m=fitTpGun(cloneWeapon(tpl)),f=(DROP_LEN[id]||.5)/.75;
m.scale.multiplyScalar(f);m.position.multiplyScalar(f);m.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false}});
const side=new THREE.Group();side.rotation.z=Math.PI/2;side.add(m);const g=new THREE.Group();g.add(side);g.updateMatrixWorld(true);
side.position.y=-new THREE.Box3().setFromObject(side).min.y;return g}
function spawnDrop(id,ammo,reserve,x,y,z,vx=0,vy=0,vz=0){const g=dropMesh(id);if(!g)return;
if(drops.length>=30){const o=drops.shift();scene.remove(o.g)}
g.position.set(x,y,z);g.rotation.y=Math.random()*Math.PI*2;scene.add(g);drops.push({id,ammo,reserve,g,vx,vy,vz,rest:false})}
function clearDrops(){for(const d of drops)scene.remove(d.g);drops.length=0}
function dropWeapon(){if(P.dead||!inv[cur])return;const w=W[cur];if(w.melee||w.nade||(w.slot!==1&&w.slot!==2))return;
const id=cur,d=inv[id];d.ammo=ammo;d.reserve=reserve;delete inv[id];inspT=0;scoped=false;
const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),up=Math.sin(P.pitch);
spawnDrop(id,d.ammo,d.reserve,P.x+fx*.5,P.y+P.h-.35,P.z+fz*.5,fx*4,2+up*4,fz*4);pickCd=1;
const ks=Object.keys(inv),next=ks.find(k=>W[k].slot===1)||ks.find(k=>W[k].slot===2);
if(next)setWeapon(next);else{inv.knife=inv.knife||{ammo:1,reserve:0};setWeapon('knife')}feed('Dropped '+w.n)}
function updDrops(dt){pickCd-=dt;
for(let i=drops.length-1;i>=0;i--){const d=drops[i],p=d.g.position;
if(!d.rest){d.vy-=20*dt;const nx=p.x+d.vx*dt,nz=p.z+d.vz*dt;
if(world&&world.blocked(nx,nz,.12,p.y+.05,p.y+.4)){d.vx*=-.3;d.vz*=-.3}else{p.x=nx;p.z=nz}
p.y+=d.vy*dt;const gr=groundAt(p.x,p.z,p.y);if(p.y<=gr){p.y=gr;if(d.vy<-3){d.vy*=-.25;d.vx*=.5;d.vz*=.5}else{d.vy=0;d.rest=true}}}
if(P.dead||pickCd>0||Math.hypot(P.x-p.x,P.z-p.z)>1||Math.abs(P.y-p.y)>1.5)continue;
const s=W[d.id].slot;if(Object.keys(inv).some(k=>W[k].slot===s))continue;
inv[d.id]={ammo:d.ammo,reserve:d.reserve};scene.remove(d.g);drops.splice(i,1);setWeapon(d.id);feed('Picked up '+W[d.id].n)}}
const SH=['deagle','mp9','m4','ak','awp','armor','he','flash','smoke'];
function renderBuy(){let h='<b>BUY MENU</b> — money <b style=color:#7CFF6B>$'+money+'</b><br><br>';SH.forEach((id,i)=>{const g=G[id],nm=id==='armor'?'Kevlar Vest':g?g.n:W[id].n,pr=id==='armor'?650:g?g.price:W[id].price,own=id==='armor'?armor>=100:g?nades[id]>=(id==='flash'?2:1):!!inv[id];h+='<div class=bi data-i='+i+' style=opacity:'+((money>=pr&&!own)?1:.4)+'>['+(i+1)+'] '+nm+' — $'+pr+(own?' (owned)':'')+'</div>'});h+='<br><small>Press 1–9 to buy · B to close</small>';h+='<br><button id=bc>Close (B / Esc)</button>';$('buy').innerHTML=h;$('buy').querySelectorAll('.bi').forEach(d=>d.onclick=()=>buyItem(+d.dataset.i));$('bc').onclick=closeBuy;$('buy').insertAdjacentHTML('afterbegin','<button class=x id=bx>×</button>');$('bx').onclick=closeBuy}
function openBuy(){if(buyT<=0){feed('Buy time is over');return}buyOpen=true;mouseDown=false;semiLock=false;renderBuy();$('buy').style.display='block';try{document.exitPointerLock()}catch(e){}}
function closeBuy(){buyOpen=false;mouseDown=false;semiLock=false;menuGrace=performance.now()+350;$('buy').style.display='none';if(state==='play')try{const p=renderer.domElement.requestPointerLock();if(p&&p.catch)p.catch(()=>{})}catch(e){}}
function buyItem(i){const id=SH[i];if(buyT<=0)return;
if(G[id]){const g=G[id];if(nades[id]>=(id==='flash'?2:1)||money<g.price)return;money-=g.price;nades[id]++}else if(id==='armor'){if(armor>=100||money<650)return;money-=650;armor=100}
else{const w=W[id];if(money<w.price||inv[id])return;money-=w.price;for(const k in inv)if(W[k].slot===w.slot)delete inv[k];inv[id]={ammo:w.mag,reserve:w.res};setWeapon(id)}renderBuy();updHud()}
function afterLoss(){P.x=0;P.z=25;P.yaw=0;P.pitch=0;P.hp=100;armor=0;nades={he:0,flash:0,smoke:0};inv={glock:{ammo:20,reserve:120},knife:{ammo:1,reserve:0}};setWeapon('glock');round++;startRound();state='play'}

function captureGunTemplate(id){while(gun.children.length)gun.remove(gun.children[0]);const BD={ak:buildAK,m4:buildM4};if(BD[id])BD[id]();const tpl=new THREE.Group();[...gun.children].forEach(c=>{gun.remove(c);if(c===flash)return;tpl.add(c)});gun.add(flash);gun.scale.setScalar(1);const kill=[];tpl.traverse(o=>{if(o.isMesh&&(o.material===MT.g||o.material===MT.l))kill.push(o)});kill.forEach(o=>{if(o.parent)o.parent.remove(o)});return tpl}
const BOT_GUN_TPL={ak:captureGunTemplate('ak'),m4:captureGunTemplate('m4')};
const WEAPON_TPL={};let weaponsLeft=0,weaponsState='loading';
const WEAPON_FILES={glock:{file:'glock.glb',kind:'pistol',key:'wpn-glock-v1'},ak:{file:'ak.glb',kind:'rifle',key:'wpn-ak-v3'},m4:{file:'m4.glb',kind:'rifle',key:'wpn-m4-v3'},deagle:{file:'deagle.glb',kind:'pistol',key:'wpn-deagle-v3'},awp:{file:'awp.glb',kind:'rifle',key:'wpn-awp-v3'},mp9:{file:'mp9.glb',kind:'smg',key:'wpn-mp9-v3'},he:{file:'he.glb',kind:'nade',key:'wpn-he-v3'},flash:{file:'flash.glb',kind:'nade',key:'wpn-flash-v3'},smoke:{file:'smoke.glb',kind:'nade',key:'wpn-smoke-v3'},knife:{file:'knife.glb',kind:'knife',key:'wpn-knife-ct-v1'}};
buildModel('glock');
const DK={fwd:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD',jump:'Space',duck:'ControlLeft',walk:'ShiftLeft',fire:'Mouse0',scope:'Mouse2',reload:'KeyR',buy:'KeyB',slot1:'Digit1',slot2:'Digit2',knife:'Digit3',he:'Digit6',flash:'Digit7',smoke:'Digit8',inspect:'KeyF',drop:'KeyG',hand:'KeyH',emote:'KeyT'};
const ACT=[['fwd','Move forward'],['back','Move back'],['left','Move left'],['right','Move right'],['jump','Jump'],['duck','Duck'],['walk','Walk (quiet)'],['fire','Fire'],['scope','Scope (sniper)'],['reload','Reload'],['buy','Buy menu'],['slot1','Primary weapon'],['slot2','Pistol'],['knife','Knife'],['he','Grenade'],['flash','Flashbang'],['smoke','Smoke grenade'],['inspect','Inspect weapon'],['drop','Drop weapon'],['hand','Switch hand'],['emote','Emote wheel (hold)']];
let K=Object.assign({},DK),sens=1,rebind=null,bindUntil=0;
try{const s=JSON.parse(localStorage.getItem('strikeCfg')||'null');if(s){Object.assign(K,s.K);sens=s.sens||1;leftHand=!!s.lh}}catch(e){}
function save(){try{localStorage.setItem('strikeCfg',JSON.stringify({K,sens,lh:leftHand}))}catch(e){}}
function lab(c){return ({Mouse0:'Left Click',Mouse1:'Middle Click',Mouse2:'Right Click',Space:'Space',ControlLeft:'Left Ctrl',ControlRight:'Right Ctrl',ShiftLeft:'Left Shift',ShiftRight:'Right Shift',AltLeft:'Left Alt'})[c]||c.replace('Key','').replace('Digit','').replace('Arrow','')}
function renderSet(){let h='<b style=font-size:22px>CONTROLS</b><br><br><table>';
ACT.forEach(a=>{h+='<tr><td>'+a[1]+'</td><td><button data-a='+a[0]+'>'+(rebind===a[0]?'Press a key…':lab(K[a[0]]))+'</button></td></tr>'});
h+='</table><br>Mouse sensitivity <input id=sens type=range min=.3 max=3 step=.1 value='+sens+'> <span id=sv>'+sens+'</span><br><small>Click a button, then press a key or mouse button (Esc cancels). Press Esc or Close to leave this menu.</small><br><br><button id=rst>Reset defaults</button> <button id=cl>Close</button>';
$('set').innerHTML=h;$('set').insertAdjacentHTML('afterbegin','<button class=x id=sx>×</button>');$('sx').onclick=()=>{rebind=null;$('set').style.display='none'};
$('set').querySelectorAll('button[data-a]').forEach(b=>b.onclick=()=>{if(performance.now()<bindUntil)return;rebind=b.dataset.a;renderSet()});
$('sens').oninput=e=>{sens=+e.target.value;$('sv').textContent=sens;save()};
$('rst').onclick=()=>{K=Object.assign({},DK);sens=1;rebind=null;save();renderSet()};
$('cl').onclick=()=>{rebind=null;$('set').style.display='none'}}
$('cfg').onclick=()=>{mouseDown=false;semiLock=false;renderSet();$('set').style.display='block';try{document.exitPointerLock()}catch(e){}};
function placeCustom(){const c=custom;if(!c||cfgM.id!==cur)return;const r=c.root,sc=c.base*cfgM.size;r.rotation.y=cfgM.rot*Math.PI/2;r.scale.setScalar(sc);r.position.set(cfgM.x,cfgM.y,cfgM.z);const half=(cfgM.rot%2?c.sz.x:c.sz.z)/2*sc;flash.position.set(cfgM.x,cfgM.y,cfgM.z-half);gun.scale.setScalar(1)}
function loadModelFiles(files){const map={};let main=null;for(const f of files){map[f.name]=URL.createObjectURL(f);if(/\.(glb|gltf)$/i.test(f.name))main=f}
if(!main){$('ms').textContent='No .glb or .gltf file selected.';return}
if(!THREE.GLTFLoader){$('ms').textContent='The model loader did not load. Check your connection and reload.';return}
const mgr=new THREE.LoadingManager();mgr.setURLModifier(u=>{const n=decodeURIComponent(u.split('/').pop().split('?')[0]);return map[n]||u});
$('ms').textContent='Loading…';
new THREE.GLTFLoader(mgr).load(map[main.name],g=>{const sc=g.scene;sc.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(sc),ct=b.getCenter(new THREE.Vector3()),sz=b.getSize(new THREE.Vector3());sc.position.sub(ct);const root=new THREE.Group();root.add(sc);root.traverse(o=>{if(o.isMesh)o.frustumCulled=false});
custom={root,base:1/Math.max(sz.x,sz.y,sz.z),sz};cfgM.id=cur;cfgM.size=1;cfgM.x=0;cfgM.y=0;cfgM.z=-.1;cfgM.rot=(sz.x>sz.z*1.2&&sz.x>=sz.y)?1:0;buildModel(cur);renderMdl('Loaded '+main.name+'. Adjust it below.')},undefined,()=>{$('ms').textContent='Could not load that file. For a .gltf, also select its .bin and texture files.'})}
function renderMdl(msg){const o=Object.keys(W).map(k=>'<option value='+k+(cfgM.id===k?' selected':'')+'>'+W[k].n+'</option>').join('');
const sl=(id,lab,mn,mx,st,v)=>'<tr><td>'+lab+'</td><td><input type=range id='+id+' min='+mn+' max='+mx+' step='+st+' value='+v+'></td></tr>';
$('mdl').innerHTML='<button class=x id=mcl>×</button><b style=font-size:22px>LOAD 3D MODEL</b><br><br>Pick a <b>.glb</b>, or a <b>.gltf</b> together with its .bin and texture files (select several at once).<br><br><input type=file id=mf accept=.glb,.gltf,.bin,.png,.jpg,.jpeg multiple><br><br><div id=ms>'+(msg||(custom?'Model loaded.':'No model loaded.'))+'</div><br><table><tr><td>Use for</td><td><select id=mw>'+o+'</select></td></tr>'+sl('msz','Size',.2,3,.05,cfgM.size)+sl('mxx','Left / right',-1,1,.01,cfgM.x)+sl('myy','Up / down',-1,1,.01,cfgM.y)+sl('mzz','Forward / back',-1.5,1.5,.01,cfgM.z)+'</table><br><button id=mr>Rotate 90°</button> <button id=mfl>Flip 180°</button> <button id=mrm>Remove model</button><br><br><small>Switch to that weapon in game (keys 1 / 2) to see it. Credit the model’s author if its license asks for it.</small>';
$('mcl').onclick=()=>{$('mdl').style.display='none'};
$('mf').onchange=e=>loadModelFiles(e.target.files);
$('mw').onchange=e=>{cfgM.id=e.target.value;buildModel(cur)};
[['msz','size'],['mxx','x'],['myy','y'],['mzz','z']].forEach(a=>{$(a[0]).oninput=e=>{cfgM[a[1]]=+e.target.value;placeCustom()}});
$('mr').onclick=()=>{cfgM.rot=(cfgM.rot+1)%4;placeCustom()};
$('mfl').onclick=()=>{cfgM.rot=(cfgM.rot+2)%4;placeCustom()};
$('mrm').onclick=()=>{custom=null;buildModel(cur);renderMdl('Model removed.')}}
$('ldm').onclick=()=>{mouseDown=false;semiLock=false;renderMdl();$('mdl').style.display='block';try{document.exitPointerLock()}catch(e){}};
let menuGrace=0;
function menuOpen(){return escMenu||buyOpen||$('set').style.display==='block'||$('mdl').style.display==='block'||($('mm')&&$('mm').style.display!=='none')||($('lobby')&&$('lobby').style.display==='flex')||($('party')&&$('party').style.display==='flex')||($('ov')&&$('ov').style.display!=='none'&&state!=='play')}
let gameMode='arena',online=false,myTeam='t',netBot=null,netSendT=0,netReady=false,peerReady=false,escMenu=false;
let party=false;
const PT={players:[],host:false,started:false,remotes:new Map(),sendT:0,lastHit:null,sentReady:false,backToLobby:false,exit:false};
const ovHome=$('ov').innerHTML;
function briefingHtml(){const mode=gameMode==='online'
?`<p>Online <b>1v1</b> — you are <b style="color:${myTeam==='t'?'#ff9a2e':'#6aa8ff'}">${myTeam==='t'?'Terrorist':'Counter-Terrorist'}</b>. First to 5 round wins. Invite link match.</p>`
:gameMode==='1v1'
?`<p>You are a <b>Terrorist</b> (orange) in a <b>1v1</b> duel. Eliminate the <span style="color:#6aa8ff;font-weight:700">Counter-Terrorist</span> (blue) bot. First to 5 round wins.</p>`
:`<p>You are a <b>Terrorist</b> (orange) with 4 bot teammates. Eliminate every <span style="color:#6aa8ff;font-weight:700">Counter-Terrorist</span> (blue) to win the round. Up to 8 rounds — first to 5 wins.</p>`;
return `<h1>STRIKE: ARENA</h1>${mode}<p><b>WASD</b> move · <b>Mouse</b> aim (or <b>arrow keys</b>) · <b>Click</b> fire · <b>R</b> reload · <b>Shift</b> walk (more accurate)</p><p><b>Space</b> jump · <b>Ctrl</b> duck (very accurate) · running is inaccurate · frozen for <b>5s</b> at round start, then you can move — buy stays open for <b>40s</b></p><p><b>B</b> buy menu · <b>1/2</b> switch gun · <b>Scroll wheel</b> cycle weapons · <b>Right-click</b> scope (sniper) · change any key with <b>⚙ Controls</b></p><p>Kills, round wins and round losses earn money.</p><p id="loadst" style="margin-top:12px;opacity:.85"></p><p id="playhint" style="margin-top:10px;font-size:20px"></p><button id="ov-back" type="button">← Main Menu</button>`}
function showMainMenu(){if(party||PT.players.length)ptDetach();if($('party'))$('party').style.display='none';state='menu';hadLock=false;escMenu=false;online=false;netBot=null;netReady=peerReady=false;document.body.classList.remove('play');try{document.exitPointerLock()}catch(e){}
$('set').style.display='none';$('mdl').style.display='none';if($('lobby'))$('lobby').style.display='none';rebind=null;$('ov').style.display='none';$('mm').style.display='flex';updCoins();
if(window.Netplay)Netplay.leave();
try{history.replaceState({},'',location.pathname)}catch(e){}}
function goPlayBriefing(mode){gameMode=mode||'arena';if(mode!=='online')online=false;$('mm').style.display='none';if($('lobby'))$('lobby').style.display='none';$('ov').innerHTML=briefingHtml();$('ov').style.display='flex';refreshLoadUi();
const back=$('ov-back');if(back)back.onclick=e=>{e.stopPropagation();showMainMenu()}}
$('mm-play').onclick=()=>goPlayBriefing('arena');
const mmMap=$('mm-map');if(mmMap){updMapBtn();mmMap.onclick=()=>{const L=['arena',...Object.keys(MAPS)];setMapChoice(L[(L.indexOf(mapId)+1)%L.length])}}
const mm1=$('mm-1v1');if(mm1)mm1.onclick=()=>goPlayBriefing('1v1');
$('mm-ctrl').onclick=()=>{mouseDown=false;semiLock=false;renderSet();$('set').style.display='block'};
$('mm-model').onclick=()=>{mouseDown=false;semiLock=false;renderMdl();$('mdl').style.display='block'};
let skCat=0;
function renderSkins(){updCoins();const cats=$('sk-cats'),list=$('sk-list');if(!cats||!list)return;
  const tabs=SKIN_CATS.map(c=>c[0]).concat('Emotes');
  cats.innerHTML=tabs.map((c,i)=>'<button type="button" data-i="'+i+'"'+(i===skCat?' class="on"':'')+'>'+c+'</button>').join('');
  cats.querySelectorAll('button').forEach(b=>b.onclick=()=>{skCat=+b.dataset.i;renderSkins()});
  if(!SKIN_CATS[skCat]){
    list.innerHTML='<div class="sk-em"><h4>Emotes</h4><p>Hold <b>'+lab(K.emote)+'</b> in a match to open the emote wheel</p><div class="sk-egrid">'+EMOTES.map(e=>{const own=ownsEmote(e.id);
      return '<div class="sk-card'+(own?' eq':'')+'"><div class="sk-prev em">'+e.icon+'</div><div class="sk-info"><b>'+e.name+'</b><span>Value: '+e.value+' <i class="coin"></i></span>'
        +(own?'<button type="button" disabled>Owned</button>':'<button type="button" class="buy" data-e="'+e.id+'"'+(prof.coins<e.value?' disabled':'')+'>Unlock</button>')+'</div></div>'}).join('')+'</div></div>';
    list.querySelectorAll('button[data-e]').forEach(b=>b.onclick=()=>{const e=EMOTE[b.dataset.e];if(!e||ownsEmote(e.id)||prof.coins<e.value)return;prof.coins-=e.value;prof.owned['emote:'+e.id]=1;saveProf();renderSkins()});
    return}
  list.innerHTML=SKIN_CATS[skCat][1].map(wid=>'<div class="sk-wpn"><h4>'+W[wid].n+'</h4><div class="sk-grid">'+SKINS[wid].map(k=>{
    const own=ownsSkin(wid,k.id),eq=eqSkin(wid)===k.id,data=' data-w="'+wid+'" data-s="'+k.id+'"';
    const bc=k.rc||k.tint;
    return '<div class="sk-card'+(eq?' eq':'')+'"><div class="sk-prev"'+(bc?' style="border-bottom-color:'+bc+'"':'')+'>'+(k.img?'<img alt="" loading="lazy" src="'+k.img+'">':W[wid].n.toUpperCase())+'</div><div class="sk-info"><b>'+k.name+'</b>'+(k.rarity?'<em style="color:'+k.rc+'">'+k.rarity+'</em>':'')+'<span>Value: '+k.value+' <i class="coin"></i></span>'
      +(eq?'<button type="button" disabled>Equipped</button>':own?'<button type="button" data-a="eq"'+data+'>Equip</button>':'<button type="button" class="buy" data-a="buy"'+data+(prof.coins<k.value?' disabled':'')+'>Unlock</button>')+'</div></div>'}).join('')+'</div></div>').join('');
  list.querySelectorAll('button[data-a]').forEach(b=>b.onclick=()=>{const w=b.dataset.w,sid=b.dataset.s,k=skinDef(w,sid);if(!k)return;
    if(b.dataset.a==='buy'){if(prof.coins<k.value)return;prof.coins-=k.value;prof.owned[w+':'+sid]=1}
    prof.eq[w]=sid;saveProf();if(cur===w)buildModel(cur);renderSkins()})}
function mmTab(t){document.querySelectorAll('#mm nav button[data-tab]').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));document.querySelectorAll('#mm .tab').forEach(x=>x.classList.toggle('on',x.id==='tab-'+t));if(t==='skins')renderSkins()}
document.querySelectorAll('#mm nav button[data-tab]').forEach(b=>b.onclick=()=>mmTab(b.dataset.tab));
updCoins();
// ---------- Google sign-in: each account's coins + skins live in Realtime Database at /users/<uid> ----------
const FB_CFG={apiKey:'AIzaSyCX4y4YmsgxfgwLIvwxd9Vj7jaIedqx_c0',authDomain:'strike-arena-ethan.firebaseapp.com',databaseURL:'https://strike-arena-ethan-default-rtdb.europe-west1.firebasedatabase.app',projectId:'strike-arena-ethan',appId:'1:577505418950:web:e46a6d3f6c8f5ffdc381c7'};
const acEsc=t=>String(t).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const ACC={user:null,ref:null,state:'loading',saveT:0,synced:false};
function loadScript(src){return new Promise((res,rej)=>{const e=document.createElement('script');e.src=src;e.onload=res;e.onerror=()=>rej(new Error('failed to load '+src));document.head.appendChild(e)})}
let fbP=null;
function fbLoad(){if(fbP)return fbP;const b='https://www.gstatic.com/firebasejs/10.14.1/';
  fbP=loadScript(b+'firebase-app-compat.js').then(()=>Promise.all([loadScript(b+'firebase-auth-compat.js'),loadScript(b+'firebase-database-compat.js')])).then(()=>{if(!firebase.apps.length)firebase.initializeApp(FB_CFG);return firebase});
  fbP.catch(()=>{fbP=null});return fbP}
function normProf(p){p=p&&typeof p==='object'?p:{};return{coins:Math.max(0,Math.floor(+p.coins||0)),owned:p.owned&&typeof p.owned==='object'?p.owned:{},eq:p.eq&&typeof p.eq==='object'?p.eq:{},updated:+p.updated||0}}
function readLocal(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}}
function cloudSave(){if(!ACC.user||!ACC.ref||!ACC.synced)return;clearTimeout(ACC.saveT);ACC.saveT=setTimeout(()=>{prof.updated=Date.now();
  const data={coins:Math.max(0,Math.floor(prof.coins)),owned:prof.owned,eq:prof.eq,updated:prof.updated};try{localStorage.setItem(profKey(),JSON.stringify(prof))}catch(e){}
  ACC.ref.set(data).then(()=>{ACC.state='saved';renderAcct()}).catch(e=>{console.warn('cloud save failed',e);ACC.state='error';renderAcct()})},800)}
function profChanged(){updCoins();if($('tab-skins')&&$('tab-skins').classList.contains('on'))renderSkins();if(gun.visible||state==='play')buildModel(vmId())}
function onAuth(user){ACC.user=user||null;ACC.ref=null;ACC.synced=false;
  if(!user){prof=normProf(readLocal('strikeProfile'));ACC.state='out';renderAcct();profChanged();return}
  ACC.state='syncing';renderAcct();
  const key='strikeProfile:'+user.uid,cache=readLocal(key);ACC.ref=firebase.database().ref('users/'+user.uid);
  ACC.ref.get().then(snap=>{if(ACC.user!==user)return;
    if(snap.exists()){const cloud=normProf(snap.val()),c=cache&&normProf(cache);prof=c&&c.updated>cloud.updated?c:cloud}
    else prof=normProf(cache||readLocal('strikeProfile'));
    ACC.synced=true;saveProf();profChanged();ACC.state='saved';renderAcct();
    const nm=$('pt-name');if(nm&&(!nm.value||/^Player( \d+)?$/.test(nm.value)))nm.value=(user.displayName||'').split(' ')[0].slice(0,16)||nm.value;
  }).catch(e=>{console.warn('profile load failed',e);if(ACC.user!==user)return;prof=normProf(cache||readLocal('strikeProfile'));ACC.synced=true;profChanged();ACC.state='error';renderAcct()})}
const G_ICON='<svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.8 6C12.3 13.4 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17z"/><path fill="#FBBC05" d="M10.4 28.8c-.5-1.4-.8-3-.8-4.8s.3-3.3.8-4.8l-7.8-6C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.7-3.9-13.6-9.5l-7.8 6C6.6 42.6 14.6 48 24 48z"/></svg>';
function renderAcct(){const el=$('mm-acct');if(!el)return;const u=ACC.user;
  if(!u){el.innerHTML='<button type="button" id="mm-signin"'+(ACC.state==='loading'?' disabled':'')+'>'+G_ICON+(ACC.state==='unavailable'?'Sign-in unavailable':'Sign in with Google')+'</button>';
    el.title='Sign in to save your coins and skins to your Google account';const b=$('mm-signin');if(b)b.onclick=signIn;return}
  const sv={syncing:'Syncing…',saved:'Saved to account',error:'Not saved — offline?'}[ACC.state]||'';
  el.innerHTML=(u.photoURL?'<img alt="" referrerpolicy="no-referrer" src="'+acEsc(u.photoURL)+'">':'')+'<div><div class="nm">'+acEsc(u.displayName||u.email||'Player')+'</div><div class="sv">'+sv+'</div></div><button type="button" class="out" id="mm-signout">Sign out</button>';
  el.title=u.email||'';$('mm-signout').onclick=()=>{clearTimeout(ACC.saveT);firebase.auth().signOut()}}
function signIn(){const b=$('mm-signin');if(b)b.disabled=true;
  fbLoad().then(fb=>{const pr=new fb.auth.GoogleAuthProvider();return fb.auth().signInWithPopup(pr).catch(e=>{if(e&&e.code==='auth/popup-blocked')return fb.auth().signInWithRedirect(pr);throw e})})
  .catch(e=>{console.warn('sign-in failed',e);if(e&&e.code!=='auth/popup-closed-by-user'&&e.code!=='auth/cancelled-popup-request')feed('Sign-in failed: '+((e&&e.message)||'try again'));renderAcct()})}
renderAcct();
fbLoad().then(fb=>{fb.auth().onAuthStateChanged(onAuth)}).catch(e=>{console.warn('Firebase unavailable',e);ACC.state='unavailable';renderAcct()});

// mode: true = host, false = joining from an invite link, 'code' = type in a friend's room code
function showLobby(mode){
  if(!$('lobby')||!window.Netplay){feed('Online play unavailable');return}
  const asHost=mode===true,byCode=mode==='code';
  $('mm').style.display='none';$('ov').style.display='none';$('lobby').style.display='flex';
  $('lb-start').style.display='none';$('lb-link').textContent='';$('lb-status').textContent='';
  $('lb-code').style.display='none';$('lb-code').textContent='';$('lb-join').style.display=byCode?'flex':'none';$('lb-copy').style.display=asHost?'':'none';
  if($('lb-retry'))$('lb-retry').style.display='none';
  $('lb-role').textContent=asHost?'Creating private room…':byCode?"Enter your friend's room code":'Joining friend…';
  if(byCode){Netplay.leave();$('lb-input').value='';setTimeout(()=>$('lb-input').focus(),0)}
  Netplay.onStatus=(s,d)=>{$('lb-status').textContent=d||s};
  Netplay.onConnected=()=>{
    peerReady=false;netReady=false;peerBuildBad=false;
    if(Netplay.role==='host')Netplay.send({t:'askready',build:BUILD});
    sendReady();updLobby();
  };
  Netplay.onDisconnected=()=>{
    if(state==='play'&&online){
      escMenu=false;hadLock=false;state='menu';
      try{document.exitPointerLock()}catch(e){}
      showOv('VICTORY','Opponent left — you win<br><br><b>Click to return</b>');
      return;
    }
    peerReady=netReady=false;
    $('lb-status').textContent='Opponent disconnected';$('lb-start').style.display='none';
  };
  Netplay.onMessage=onNetMessage;
  if(asHost){
    Netplay.createRoom().then(()=>{
      const url=Netplay.inviteUrl();
      $('lb-link').textContent=url;
      $('lb-code').textContent=Netplay.room;$('lb-code').style.display='block';
      $('lb-role').textContent='Give your friend this code (Join by code) or send the link';
      $('lb-status').textContent='Waiting for friend… keep this tab open';
    }).catch((e)=>{$('lb-status').textContent='Host failed: '+(e&&e.message||'retry')});
  }
}
// netReady: we told the peer our models are loaded · peerReady: the peer told us theirs are
// Both players must run the same build — an unrefreshed tab silently breaks round/hit sync
const BUILD='code2';let peerBuildBad=false;
function sendReady(){if(window.Netplay&&Netplay.connected&&assetsReady()&&!netReady)netReady=Netplay.send({t:'ready',build:BUILD})}
function updLobby(){
  if(!$('lobby')||$('lobby').style.display!=='flex'||!window.Netplay||!Netplay.connected)return;
  const me=assetsReady(),b=$('lb-start');b.style.display='inline-block';
  if(peerBuildBad){b.disabled=true;b.style.opacity=.5;b.textContent='Versions differ';
    $('lb-status').textContent='You and your friend are on different versions — BOTH refresh the page (Ctrl+F5), then make a new invite';return}
  if(Netplay.role==='host'){const ok=me&&peerReady;b.disabled=!ok;b.style.opacity=ok?1:.5;b.textContent=ok?'Start match':'Waiting for models…';
    $('lb-status').textContent=!me?'Opponent connected — loading your models…':!peerReady?'Opponent connected — waiting for their models to load…':'Opponent ready!'}
  else{b.disabled=true;b.style.opacity=.5;b.textContent='Ready — wait for host';
    $('lb-status').textContent=me?'Connected — waiting for host to start':'Connected — loading models…'}
}
function beginOnlineMatch(){
  if(!Netplay.connected||Netplay.role!=='host'||!assetsReady()||!peerReady)return;
  online=true;gameMode='online';myTeam='t';
  Netplay.send({t:'start',build:BUILD,map:mapId});startOnlineGame();
}
function startOnlineGame(){
  $('ov').style.display='none';$('mm').style.display='none';if($('lobby'))$('lobby').style.display='none';
  document.body.classList.add('play');
  try{ac=ac||new (window.AudioContext||window.webkitAudioContext)()}catch(err){}
  try{const p=cv.requestPointerLock&&cv.requestPointerLock();if(p&&p.catch)p.catch(()=>{})}catch(err){}
  resetGame();
  setTimeout(()=>{if(state==='play'&&document.pointerLockElement!==cv)feed('Click the screen to lock your aim')},400);
}
function onNetMessage(msg){
  if(!msg||typeof msg!=='object')return;
  // PeerJS json may wrap once
  if(msg.data&&msg.data.t)msg=msg.data;
  if(!msg.t)return;
  if(msg.t==='ready'){if(msg.build!==BUILD)peerBuildBad=true;else peerReady=true;updLobby();return}
  if(msg.t==='askready'){if(msg.build!==BUILD){peerBuildBad=true;updLobby();return}netReady=false;sendReady();return}
  if(msg.t==='start'&&Netplay.role==='guest'){if(msg.build!==BUILD){peerBuildBad=true;updLobby();return}
    online=true;gameMode='online';myTeam='ct';
    if(msg.map&&(msg.map==='arena'||MAPS[msg.map])&&msg.map!==mapId){mapId=msg.map;if(mapId!=='arena')loadMap(mapId);updMapBtn()}
    const go=()=>{if(!assetsReady()){setTimeout(go,200);return}startOnlineGame()};go();return}
  // Packets tagged with an older round (hit/killed/state still in flight) must not leak into this one
  if(msg.rd!=null&&msg.rd!==round&&(msg.t==='hit'||msg.t==='killed'))return;
  if(msg.t==='hit'){
    online=true;if(P.dead)return;
    let dmg=Number(msg.dmg)||0;if(dmg<=0)return;
    if(armor>0){const soak=dmg*.5;armor=Math.max(0,armor-soak);dmg-=soak*.5}
    P.hp-=dmg;$('hit').style.opacity=1;setTimeout(()=>$('hit').style.opacity=0,80);
    $('dmg').style.boxShadow='inset 0 0 160px 40px rgba(220,0,0,.55)';setTimeout(()=>$('dmg').style.boxShadow='inset 0 0 160px 40px rgba(220,0,0,0)',250);
    snd(.3,.05,900);feed('Hit! −'+Math.round(dmg));updHud();
    if(P.hp<=0&&!P.dead)playerDown();
    return;
  }
  if(msg.t==='nade'){
    online=true;
    const p=new THREE.Vector3(Number(msg.x)||0,Number(msg.y)||0,Number(msg.z)||0);
    const kind=msg.kind||msg.nadeType||msg.type||'smoke';
    const fi=nl.findIndex(n=>n.net&&n.type===kind);if(fi>=0){scene.remove(nl[fi].m);nl.splice(fi,1)}
    boom(kind,p,true);
    return;
  }
  if(msg.t==='throw'){
    const kind=msg.kind||'smoke';if(!G[kind])return;
    const m=nadeMesh(kind);m.position.set(Number(msg.x)||0,Number(msg.y)||0,Number(msg.z)||0);scene.add(m);
    // Visual only — the thrower's {t:'nade'} packet triggers the real detonation
    nl.push({m,v:new THREE.Vector3(Number(msg.vx)||0,Number(msg.vy)||0,Number(msg.vz)||0),t:(Number(msg.fuse)||1.5)+2,type:kind,net:true});
    return;
  }
  if(msg.t==='forfeit'){
    online=true;escMenu=false;hadLock=false;
    try{document.exitPointerLock()}catch(e){}
    state='menu';
    if(window.Netplay)Netplay.leave(false);
    showOv('VICTORY','Opponent quit — you win<br><br><b>Click to return</b>');
    return;
  }
  if(msg.t==='killed'&&netBot&&netBot.alive){killBot(netBot,!!msg.head,false);checkOnlineRound();return}
  if(msg.t==='round'&&Netplay.role==='guest'){
    wins=msg.wins|0;loses=msg.loses|0;
    if(msg.youWin){lossStreak=0;money=Math.min(16000,money+3250)}else{lossStreak++;money=Math.min(16000,money+1400+Math.min(lossStreak-1,4)*500)}
    showWinBanner(msg.youWin?myTeam==='t':myTeam==='ct');
    if(msg.phase==='end'){state='menu';hadLock=false;escMenu=false;try{document.exitPointerLock()}catch(e){}
      showOv(msg.youWin?'VICTORY':'DEFEAT','Online 1v1 · <b style="color:#ff9a2e">'+wins+'</b> – <b style="color:#6aa8ff">'+loses+'</b><br><br><b>Click to return</b>')}
    else{round=msg.round|0;roundTimer=3;feed(msg.youWin?'Round won!':'Round lost — next round soon');updHud()}
  }
}
const mmOnline=$('mm-online');
if(mmOnline)mmOnline.onclick=()=>showLobby(true);
if($('mm-join'))$('mm-join').onclick=()=>showLobby('code');
function joinByCode(){const c=Netplay.cleanCode($('lb-input').value);$('lb-input').value=c;
  if(c.length!==Netplay.CODE_LEN){$('lb-status').textContent='Codes are '+Netplay.CODE_LEN+' letters';return}
  $('lb-role').textContent='Joining room '+c+'…';$('lb-status').textContent='Connecting to host…';
  Netplay.joinCode(c).then(()=>{$('lb-join').style.display='none';$('lb-role').textContent='In room '+c;sendReady();updLobby()})
  .catch(()=>{Netplay.leave(false);$('lb-role').textContent="Enter your friend's room code";$('lb-input').focus();$('lb-input').select()})}
if($('lb-go'))$('lb-go').onclick=joinByCode;
if($('lb-input')){$('lb-input').addEventListener('focus',e=>e.target.select());$('lb-input').addEventListener('input',e=>{const t=e.target,c=Netplay.cleanCode(t.value);if(t.value!==c)t.value=c});
  $('lb-input').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')joinByCode();else if(e.key==='Escape')showMainMenu()})}
if($('lb-back'))$('lb-back').onclick=()=>showMainMenu();
if($('lb-copy'))$('lb-copy').onclick=()=>{const t=Netplay.inviteUrl();if(!t)return;navigator.clipboard&&navigator.clipboard.writeText(t).then(()=>$('lb-status').textContent='Link copied!').catch(()=>{$('lb-status').textContent=t})};
if($('lb-start'))$('lb-start').onclick=()=>beginOnlineMatch();

// Auto-join invite links
function tryJoinInvite(inv){
  if(!inv||!inv.host||!window.Netplay)return;
  showLobby(false);$('lb-role').textContent='Joining'+(inv.room?' room '+inv.room:'')+'…';
  if($('lb-retry'))$('lb-retry').style.display='none';
  $('lb-status').textContent='Connecting to host…';
  Netplay.joinRoom(inv.room||'JOIN',inv.host).then(()=>{
    $('lb-link').textContent=location.href;
    sendReady();updLobby();
    if($('lb-retry'))$('lb-retry').style.display='none';
  }).catch(()=>{if($('lb-retry'))$('lb-retry').style.display='inline-block'})
}
// ---------- Private lobby: up to 10 players pick a team, no bots. The host relays every message. ----------
const ptEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ptName=()=>(($('pt-name')&&$('pt-name').value)||'').trim().slice(0,16)||'Player';
function ptSend(msg){if(!window.Netplay||!Netplay.connected)return false;msg.from=Netplay.myId;return Netplay.send(msg)}
function ptCounts(list){let t=0,c=0;for(const p of list)if(p.team==='t')t++;else c++;return{t,c}}
function ptCanMove(id,team){const n=ptCounts(PT.players.map(p=>p.id===id?{team}:p));return Math.abs(n.t-n.c)<=2}
function ptPlayer(id){return PT.players.find(p=>p.id===id)}
function ptBroadcastLobby(){if(!PT.host)return;Netplay.broadcast({t:'plobby',players:PT.players,from:'host'});renderParty()}
function renderParty(){
  const me=Netplay.myId,list=PT.players,mine=ptPlayer(me);
  $('pt-teams').style.display=list.length?'flex':'none';
  const row=p=>'<div class="pl'+(p.id===me?' me':'')+'">'+ptEsc(p.name)+(p.id==='host'?' <small>(host)</small>':'')+(p.ready?'':' <small>loading…</small>')+'</div>';
  const col=team=>list.filter(p=>p.team===team).map(row).join('')||'<small style="opacity:.5">empty</small>';
  $('pt-t').innerHTML=col('t');$('pt-ct').innerHTML=col('ct');
  for(const [id,team] of [['pt-jt','t'],['pt-jct','ct']]){const b=$(id),full=mine&&mine.team!==team&&!ptCanMove(me,team);
    b.disabled=!mine||mine.team===team||full;b.title=full?'Teams can differ by at most 2 players':''}
  const n=ptCounts(list),allReady=list.every(p=>p.ready);
  if(PT.host){const b=$('pt-start');b.style.display='';b.disabled=!(n.t&&n.c&&Math.abs(n.t-n.c)<=2&&allReady);
    $('pt-status').textContent=!n.t||!n.c?'Both teams need at least one player':!allReady?'Waiting for everyone to load…':list.length+' players — ready to start'}
  else{$('pt-start').style.display='none';$('pt-status').textContent=mine?'Waiting for the host to start':'Joining…'}
}
function showParty(mode){
  if(!window.Netplay){feed('Online play unavailable');return}
  if(window.Netplay)Netplay.leave(false);
  party=false;online=false;netBot=null;
  PT.players=[];PT.host=mode==='host';PT.started=false;PT.sentReady=false;PT.backToLobby=false;
  $('mm').style.display='none';$('ov').style.display='none';if($('lobby'))$('lobby').style.display='none';$('party').style.display='flex';
  $('pt-code').textContent='';$('pt-link').textContent='';$('pt-status').textContent='';$('pt-copy').style.display='none';$('pt-start').style.display='none';
  $('pt-teams').style.display='none';$('pt-join').style.display=mode==='code'?'flex':'none';
  if(!$('pt-name').value){let n='';try{n=localStorage.getItem('strikeName')||''}catch(e){}$('pt-name').value=n||'Player '+(10+Math.floor(Math.random()*90))}
  Netplay.onStatus=(s,d)=>{if(!PT.players.length&&d)$('pt-status').textContent=d};
  Netplay.onMessage=onPartyMessage;Netplay.onPeerJoin=null;Netplay.onPeerLeave=ptPeerLeft;
  Netplay.onConnected=()=>{if(!PT.host)ptSend({t:'phello',name:ptName(),build:BUILD,ready:assetsReady()})};
  Netplay.onDisconnected=ptHostGone;
  if(PT.host){$('pt-role').textContent='Creating lobby…';
    Netplay.createRoom(0,true).then(()=>{
      PT.players=[{id:'host',name:ptName(),team:'t',ready:assetsReady()}];
      $('pt-code').textContent=Netplay.room;$('pt-link').textContent=Netplay.inviteUrl();$('pt-copy').style.display='';
      $('pt-role').textContent='Friends join with this code (Join private lobby) or the invite link';renderParty();
    }).catch(e=>{$('pt-role').textContent='';$('pt-status').textContent='Could not create lobby: '+((e&&e.message)||'try again')})}
  else if(mode==='code'){$('pt-role').textContent='Enter the lobby code';$('pt-input').value='';setTimeout(()=>$('pt-input').focus(),0)}
  else{$('pt-role').textContent='Joining lobby '+(mode.room||'')+'…';
    Netplay.joinRoom(mode.room,mode.host,true).catch(()=>{$('pt-status').textContent='Could not reach that lobby — check the host still has it open'})}
}
function ptJoinCode(){
  const c=Netplay.cleanCode($('pt-input').value);$('pt-input').value=c;
  if(c.length!==Netplay.CODE_LEN){$('pt-status').textContent='Lobby codes are '+Netplay.CODE_LEN+' letters';return}
  $('pt-role').textContent='Joining lobby '+c+'…';$('pt-status').textContent='Connecting…';$('pt-join').style.display='none';
  Netplay.joinCode(c,true).catch(()=>{$('pt-join').style.display='flex';$('pt-role').textContent='Enter the lobby code';$('pt-status').textContent='No lobby with that code'})
}
function ptPick(team){
  if(PT.host){const me=ptPlayer('host');if(me&&me.team!==team&&ptCanMove('host',team)){me.team=team;ptBroadcastLobby()}}
  else ptSend({t:'pteam',team});
}
function ptStart(){
  if(!PT.host)return;const n=ptCounts(PT.players);
  if(!n.t||!n.c||Math.abs(n.t-n.c)>2||!PT.players.every(p=>p.ready))return;
  const msg={t:'pstart',map:mapId,players:PT.players,from:'host'};Netplay.broadcast(msg);ptHandle(msg);
}
function ptDetach(){party=false;PT.players=[];PT.remotes.clear();if(window.Netplay){Netplay.onPeerLeave=null;Netplay.onDisconnected=null;Netplay.onMessage=null;Netplay.leave(false)}}
function ptLeave(){PT.exit=false;PT.backToLobby=false;ptDetach();showMainMenu()}
function ptBackToLobby(){PT.backToLobby=false;party=false;PT.started=false;state='menu';clearBots();PT.remotes.clear();
  $('ov').style.display='none';$('party').style.display='flex';document.body.classList.remove('play');renderParty()}
function ptHostGone(){
  if(PT.host)return;
  if(PT.backToLobby){PT.backToLobby=false;PT.exit=true;party=false;return}
  if(party&&state==='play'){party=false;state='menu';hadLock=false;escMenu=false;try{document.exitPointerLock()}catch(e){}PT.exit=true;showOv('LOBBY CLOSED','The host left the lobby<br><br><b>Click to return</b>');return}
  if($('party').style.display==='flex'&&PT.players.length){PT.players=[];renderParty();$('pt-status').textContent='The host closed the lobby'}
}
function ptPeerLeft(id){
  if(!PT.host)return;const p=ptPlayer(id);if(!p)return;
  PT.players=PT.players.filter(q=>q.id!==id);ptBroadcastLobby();
  if(party){const msg={t:'pgone',id,from:'host'};Netplay.broadcast(msg);ptHandle(msg)}
}
function onPartyMessage(msg){
  if(!msg||typeof msg!=='object')return;if(msg.data&&msg.data.t)msg=msg.data;if(!msg.t)return;
  if(PT.host){const from=msg.from,p=ptPlayer(from);
    if(msg.t==='phello'){
      if(msg.build!==BUILD){Netplay.sendTo(from,{t:'pkick',why:'version'});return}
      if(PT.started){Netplay.sendTo(from,{t:'pkick',why:'started'});return}
      if(!p){if(PT.players.length>=10){Netplay.sendTo(from,{t:'pkick',why:'full'});return}
        const n=ptCounts(PT.players);PT.players.push({id:from,name:String(msg.name||'Player').slice(0,16),team:n.t<=n.c?'t':'ct',ready:!!msg.ready})}
      ptBroadcastLobby();return}
    if(msg.t==='pteam'){if(p&&!PT.started&&(msg.team==='t'||msg.team==='ct')&&p.team!==msg.team){
      if(ptCanMove(from,msg.team)){p.team=msg.team;ptBroadcastLobby()}else Netplay.sendTo(from,{t:'perr',why:'Teams can only differ by 2 players'})}return}
    if(msg.t==='pready'){if(p&&!p.ready){p.ready=true;ptBroadcastLobby()}return}
    if(msg.t==='pname'){if(p){p.name=String(msg.name||'Player').slice(0,16);ptBroadcastLobby()}return}
    if(!p)return;
    Netplay.broadcast(msg,from);
  }
  ptHandle(msg);
}
function ptHandle(msg){
  const me=Netplay.myId,from=msg.from;
  if(msg.t==='plobby'){PT.players=Array.isArray(msg.players)?msg.players:[];if(!party)renderParty();return}
  if(msg.t==='pkick'){const why={full:'That lobby is full',started:'That match already started',version:'Version mismatch — refresh the page (Ctrl+F5)'}[msg.why]||'Removed from lobby';
    Netplay.leave(false);PT.players=[];renderParty();$('pt-status').textContent=why;return}
  if(msg.t==='perr'){$('pt-status').textContent=msg.why||'';return}
  if(msg.t==='pstart'){PT.players=msg.players||PT.players;PT.started=true;const mine=ptPlayer(me);if(!mine)return;
    party=true;online=false;netBot=null;gameMode='party';myTeam=mine.team;
    if(msg.map&&(msg.map==='arena'||MAPS[msg.map])&&msg.map!==mapId){mapId=msg.map;if(mapId!=='arena')loadMap(mapId);updMapBtn()}
    const go=()=>{if(!assetsReady()){setTimeout(go,200);return}ptStartGame()};go();return}
  if(!party)return;
  if(msg.t==='pgone'){const b=PT.remotes.get(msg.id),p=ptPlayer(msg.id);
    if(b){b.alive=false;scene.remove(b.g);[b.body,b.head,...b.g.userData.limbs].forEach(m=>{let i=botMeshes.indexOf(m);if(i>=0)botMeshes.splice(i,1);i=allyMeshes.indexOf(m);if(i>=0)allyMeshes.splice(i,1)});
      const bi=bots.indexOf(b);if(bi>=0)bots.splice(bi,1);PT.remotes.delete(msg.id)}
    PT.players=PT.players.filter(q=>q.id!==msg.id);feed((p?p.name:'A player')+' left');updHud();checkPartyRound();return}
  if(msg.rd!=null&&msg.rd!==round)return;
  if(msg.t==='pst'){const b=PT.remotes.get(from);if(b)b.st=msg;return}
  if(msg.t==='phit'){
    if(msg.to!==me||P.dead||state!=='play')return;
    let dmg=Number(msg.dmg)||0;if(dmg<=0)return;
    if(armor>0){const soak=dmg*.5;armor=Math.max(0,armor-soak);dmg-=soak*.5}
    P.hp-=dmg;PT.lastHit={by:from,head:!!msg.head};$('hit').style.opacity=1;setTimeout(()=>$('hit').style.opacity=0,80);
    $('dmg').style.boxShadow='inset 0 0 160px 40px rgba(220,0,0,.55)';setTimeout(()=>$('dmg').style.boxShadow='inset 0 0 160px 40px rgba(220,0,0,0)',250);
    snd(.3,.05,900);updHud();if(P.hp<=0&&!P.dead)playerDown();return}
  if(msg.t==='pkill'){const b=PT.remotes.get(from);if(!b||!b.alive)return;
    const mine=msg.by===me,killer=mine?'You':((ptPlayer(msg.by)||{}).name||'Someone');
    killBot(b,!!msg.head,!mine);feed(killer+' killed '+(b.name||'a player')+(msg.head?' ★':''));checkPartyRound();return}
  if(msg.t==='pround'){ptRound(msg);return}
  if(msg.t==='throw'){const kind=msg.kind||'smoke';if(!G[kind])return;
    const m=nadeMesh(kind);m.position.set(Number(msg.x)||0,Number(msg.y)||0,Number(msg.z)||0);scene.add(m);
    nl.push({m,v:new THREE.Vector3(Number(msg.vx)||0,Number(msg.vy)||0,Number(msg.vz)||0),t:(Number(msg.fuse)||1.5)+2,type:kind,net:true,from});return}
  if(msg.t==='nade'){const kind=msg.kind||'smoke',p=new THREE.Vector3(Number(msg.x)||0,Number(msg.y)||0,Number(msg.z)||0);
    const fi=nl.findIndex(n=>n.net&&n.type===kind&&n.from===from);if(fi>=0){scene.remove(nl[fi].m);nl.splice(fi,1)}
    if(kind==='he'&&from!==me)PT.lastHit={by:from,head:false};boom(kind,p,true);return}
}
function ptStartGame(){
  $('ov').style.display='none';$('mm').style.display='none';$('party').style.display='none';
  document.body.classList.add('play');
  try{ac=ac||new (window.AudioContext||window.webkitAudioContext)()}catch(err){}
  try{const p=cv.requestPointerLock&&cv.requestPointerLock();if(p&&p.catch)p.catch(()=>{})}catch(err){}
  resetGame();
  setTimeout(()=>{if(state==='play'&&document.pointerLockElement!==cv)feed('Click the screen to lock your aim')},400);
}
function ptSpot(id){
  const p=ptPlayer(id);if(!p)return null;
  const idx=PT.players.filter(q=>q.team===p.team).indexOf(p),pool=spawnPools&&spawnPools[p.team];
  if(pool&&pool.length)return pool[idx%pool.length];
  return [(idx-2)*2.2,0,p.team==='t'?25:-22];
}
function ptClassify(b){
  for(const m of [b.body,b.head,...b.g.userData.limbs]){let i=botMeshes.indexOf(m);if(i>=0)botMeshes.splice(i,1);i=allyMeshes.indexOf(m);if(i>=0)allyMeshes.splice(i,1);(b.enemy?botMeshes:allyMeshes).push(m)}
}
function ptSpawnAvatars(){
  PT.remotes.clear();
  for(const p of PT.players){if(p.id===Netplay.myId)continue;
    const sp=ptSpot(p.id)||[0,0,0],b=attachBot(buildBot(p.team),p.team,sp[0],sp[2],{net:true},false);
    b.net=true;b.pid=p.id;b.name=p.name;b.enemy=p.team!==myTeam;b.alive=true;b.hp=100;b.crouch=false;b.st=null;
    b.y=sp[1];b.g.position.y=sp[1];b.g.rotation.y=spawnYaw(p.team,sp[0],sp[2]);
    ptClassify(b);bots.push(b);PT.remotes.set(p.id,b);
    const u=b.g.userData;if(u&&(!u.gun||!u.gun.parent)&&u.rig){const m=mountBotGun(u.rig,u.model,p.team,u.bones||{});u.gun=m.rg;u.fl=m.fl}
  }
}
function ptHit(b,hd,dmg,pt){
  ptSend({t:'phit',to:b.pid,dmg,head:!!hd,rd:round});
  burst(pt,16,0x7a0c0c,4);snd(hd?.3:.2,.04,hd?5000:900);
  $('hit').style.opacity=1;setTimeout(()=>$('hit').style.opacity=0,80);
}
function syncParty(dt){
  if(!party||!window.Netplay||!Netplay.connected)return;
  PT.sendT-=dt;if(PT.sendT<=0){PT.sendT=.05;ptSend({t:'pst',sk:eqSkin(cur),rd:round,x:P.x,y:P.y,z:P.z,yaw:EM.on?EM.yaw:P.yaw,pitch:EM.on?EM.pitch:P.pitch,em:EM.on?EM.id+':'+EM.seq:'',alive:!P.dead,crouch:!!crouch,w:cur,speed:P.speed||0})}
  const k=Math.min(1,dt*18);
  for(const b of PT.remotes.values()){const r=b.st;if(!b.alive||!r)continue;
    b.x+=(r.x-b.x)*k;b.z+=(r.z-b.z)*k;b.y=(b.y||0)+((r.y||0)-(b.y||0))*k;b.crouch=!!r.crouch;
    b.g.position.set(b.x,b.y,b.z);b.g.rotation.y=r.yaw||0;
    const u=b.g.userData;if(u&&u.rig)u.rig.scale.y=r.crouch?.7:1;applyRemoteSkin(b,r);
    if(b.body)b.body.updateMatrixWorld(true);if(b.head)b.head.updateMatrixWorld(true);
    animBot(b,(r.speed||0)>.15?Math.sin(performance.now()/170)*.55:0,dt);remoteEmote(b,r.em,dt)}
}
function ptAlive(team){let n=myTeam===team&&!P.dead&&P.hp>0?1:0;for(const b of PT.remotes.values())if(b.team===team&&b.alive)n++;return n}
function checkPartyRound(){
  if(!party||!PT.host||state!=='play'||roundTimer>0)return;
  const t=ptAlive('t'),c=ptAlive('ct');if(t&&c)return;
  const msg={t:'pround',win:t?'t':'ct',rd:round,from:'host'};Netplay.broadcast(msg);ptRound(msg);
}
function ptRound(msg){
  if(roundTimer>0||state!=='play')return;
  if(msg.win==='t')wins++;else loses++;
  const won=msg.win===myTeam;let lb=0;
  if(won){lossStreak=0;money=Math.min(16000,money+3250)}else{lossStreak++;lb=1400+Math.min(lossStreak-1,4)*500;money=Math.min(16000,money+lb)}
  updHud();showWinBanner(msg.win==='t');
  const n=ptCounts(PT.players);
  if(wins>4||loses>4||wins+loses>=8||!n.t||!n.c){state='menu';hadLock=false;escMenu=false;try{document.exitPointerLock()}catch(e){}
    const mine=myTeam==='t'?wins:loses,theirs=myTeam==='t'?loses:wins;PT.backToLobby=true;
    showOv(mine>theirs?'VICTORY':(mine===theirs?'DRAW':'DEFEAT'),'Private lobby · Terrorists <b style="color:#ff9a2e">'+wins+'</b> – <b style="color:#6aa8ff">'+loses+'</b> Counter-Terrorists<br><br><b>Click to return to the lobby</b>');return}
  roundTimer=3;feed(won?'Round won! +$3250 — next round soon':'Round lost +$'+lb+' — next round soon');
}
setInterval(()=>{
  if(!window.Netplay||!$('party')||$('party').style.display!=='flex'||!assetsReady())return;
  if(PT.host){const me=ptPlayer('host');if(me&&!me.ready){me.ready=true;ptBroadcastLobby()}}
  else if(!PT.sentReady){const me=ptPlayer(Netplay.myId);if(me&&!me.ready){PT.sentReady=true;ptSend({t:'pready'})}}
},1000);
if($('mm-party'))$('mm-party').onclick=()=>showParty('host');
if($('mm-pjoin'))$('mm-pjoin').onclick=()=>showParty('code');
if($('pt-go'))$('pt-go').onclick=ptJoinCode;
if($('pt-input'))$('pt-input').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')ptJoinCode()});
if($('pt-name')){$('pt-name').addEventListener('keydown',e=>e.stopPropagation());
  $('pt-name').addEventListener('change',()=>{const n=ptName();try{localStorage.setItem('strikeName',n)}catch(e){}
    if(PT.host){const me=ptPlayer('host');if(me){me.name=n;ptBroadcastLobby()}}else ptSend({t:'pname',name:n})})}
if($('pt-jt'))$('pt-jt').onclick=()=>ptPick('t');
if($('pt-jct'))$('pt-jct').onclick=()=>ptPick('ct');
if($('pt-start'))$('pt-start').onclick=ptStart;
if($('pt-back'))$('pt-back').onclick=ptLeave;
if($('pt-copy'))$('pt-copy').onclick=()=>{const u=$('pt-link').textContent;const done=()=>{$('pt-copy').textContent='Copied!';setTimeout(()=>$('pt-copy').textContent='Copy invite link',1500)};
  if(navigator.clipboard)navigator.clipboard.writeText(u).then(done,()=>{});else done()};
(function(){const inv=window.Netplay&&Netplay.parseInvite();if(!inv||!inv.host)return;if(inv.multi){showParty(inv);return}tryJoinInvite(inv);
  if($('lb-retry'))$('lb-retry').onclick=()=>{const again=Netplay.parseInvite()||inv;tryJoinInvite(again)}
})();
function closeMenus(){let closed=false;if(buyOpen){buyOpen=false;$('buy').style.display='none';closed=true}if($('set').style.display==='block'){$('set').style.display='none';rebind=null;closed=true}if($('mdl').style.display==='block'){$('mdl').style.display='none';closed=true}if(closed)menuGrace=performance.now()+250;return closed}
function quitMatch(){
  if(party){ptLeave();return}
  if(online&&window.Netplay&&Netplay.connected)Netplay.send({t:'forfeit'});
  showMainMenu();
}
function down(c){keys[c]=true;
if(rebind){if(c!=='Escape'){for(const a in K)if(K[a]===c)K[a]=K[rebind];K[rebind]=c;save();bindUntil=performance.now()+350}rebind=null;renderSet();return}
if(c==='Escape'){if(closeMenus())return;if(escMenu){closeEscMenu(true);return}if(state!=='play')return;if(performance.now()<menuGrace)return;showEscMenu();return}
if(state!=='play'||escMenu)return;
if(EW.open){if(c===K.fire)closeWheel(true);return}
if(c===K.emote){if(!P.dead&&!buyOpen&&!menuOpen()&&document.pointerLockElement===renderer.domElement)openWheel();return}
if(EM.on&&!c.startsWith('Arrow')){stopEmote();if(c===K.fire||c===K.scope)return}
if(c===K.fire){if(buyOpen||menuOpen()||document.pointerLockElement!==renderer.domElement||performance.now()<menuGrace)return;mouseDown=true}
if(c===K.scope&&W[cur].melee&&!buyOpen&&!menuOpen()&&document.pointerLockElement===renderer.domElement&&performance.now()>=menuGrace)stab();
if(c===K.scope&&W[cur].scope&&reloading<=0)scoped=!scoped;
if(c===K.reload)reload();
if(c===K.buy){buyOpen?closeBuy():openBuy()}
else if(buyOpen&&/^Digit[1-9]$/.test(c))buyItem(+c.slice(5)-1);
else if(c===K.slot1)swap(1);else if(c===K.slot2)swap(2);else if(c===K.knife)equipKnife();else if(c===K.he)equipNade('he');else if(c===K.flash)equipNade('flash');else if(c===K.smoke)equipNade('smoke');
else if(c===K.hand)toggleHand();else if(c===K.drop)dropWeapon();else if(c===K.inspect)startInspect()}
function up(c){keys[c]=false;if(c===K.emote)closeWheel(true);if(c===K.fire){mouseDown=false;semiLock=false}}
addEventListener('blur',()=>{closeWheel(false);for(const k in keys)keys[k]=false;mouseDown=false});
addEventListener('wheel',e=>{if(state!=='play'||buyOpen||P.dead||$('set').style.display==='block'||$('mdl').style.display==='block')return;e.preventDefault();const d=Math.sign(e.deltaY);if(d)cycleWeapons(d)},{passive:false});
renderer.domElement.addEventListener('click',()=>{if(state==='play'&&!buyOpen&&document.pointerLockElement!==renderer.domElement)try{const p=renderer.domElement.requestPointerLock();if(p&&p.catch)p.catch(()=>{})}catch(e){}});gun.position.set(.1,-.12,-.36);camera.add(vmRoot);vmRoot.scale.x=leftHand?-1:1;loadHandTextures();const mlight=new THREE.PointLight(0xffa040,0,10);mlight.position.set(.1,-.1,-.9);camera.add(mlight);

// State
const P={x:0,z:25,yaw:0,pitch:0,hp:100,speed:0,h:1.6,y:0,vy:0,gnd:true,dead:false};
let ammo=20,reserve=120,reloading=0,fireCd=0,recoil=0,round=1,kills=0,state='menu',roundTimer=0,hadLock=false,kick=0,vkick=0;
const keys={};let mouseDown=false;let stepT=0,ladCd=0;const ldir={x:0,z:0};let mx=innerWidth/2,my=innerHeight/2;let swX=0,swY=0,lyaw=0,lpit=0,bobT=0,bobA=0;
const bots=[],botMeshes=[],allyMeshes=[];
const ray=new THREE.Raycaster();

function miniAK(){const k=new THREE.Group(),dk=new THREE.MeshStandardMaterial({color:0x1b1c1f,metalness:.6,roughness:.4}),wd=new THREE.MeshStandardMaterial({color:0x6b3a1e,roughness:.7});
const add=(g,m,x,y,z,rx)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);if(rx)o.rotation.x=rx;k.add(o)};
add(new THREE.BoxGeometry(.05,.07,.35),dk,0,0,0);add(new THREE.BoxGeometry(.045,.05,.3),wd,0,-.005,-.32);add(new THREE.BoxGeometry(.04,.09,.22),wd,0,-.02,.28);add(new THREE.CylinderGeometry(.01,.01,.3,6),dk,0,0,-.6,Math.PI/2);add(new THREE.BoxGeometry(.04,.16,.06),dk,0,-.11,-.08,.25);return k}
const BG={};function G_(k,f){return BG[k]||(BG[k]=f())}
const cyl=(a,b,h,s)=>G_('c'+[a,b,h,s],()=>new THREE.CylinderGeometry(a,b,h,s||14)),sph=(r,w,h)=>G_('s'+[r,w,h],()=>new THREE.SphereGeometry(r,w||16,h||12)),bx=(w,h,d)=>G_('b'+[w,h,d],()=>new THREE.BoxGeometry(w,h,d));
const HIT=new THREE.MeshBasicMaterial({visible:false}),FLM=new THREE.MeshBasicMaterial({color:0xffc860});
function fabTex(base,blots){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,128,128);
blots.forEach(col=>{x.fillStyle=col;for(let i=0;i<14;i++){x.beginPath();x.ellipse(Math.random()*128,Math.random()*128,6+Math.random()*16,4+Math.random()*10,Math.random()*3,0,7);x.fill()}});
for(let i=0;i<2500;i++){x.fillStyle='rgba('+(Math.random()<.5?'0,0,0':'255,255,255')+','+Math.random()*.07+')';x.fillRect(Math.random()*128,Math.random()*128,1,1)}
x.strokeStyle='rgba(0,0,0,.07)';for(let i=0;i<128;i+=3){x.beginPath();x.moveTo(i,0);x.lineTo(i,128);x.stroke()}
const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t}
function teamMats(team){return G_('m'+team,()=>{const T=team==='t',ut=fabTex(T?'#c8651a':'#27487c',T?['#9a4a12','#e08a3c','#6e3a16']:['#1a2f55','#3a5c94','#142340']),M=o=>new THREE.MeshStandardMaterial(o);
return{uni:M({map:ut,bumpMap:ut,bumpScale:.6,roughness:.9}),vest:M({color:T?0x2a2622:0x14171d,roughness:.8,bumpMap:ut,bumpScale:.8}),pouch:M({color:T?0x3a342b:0x1d222b,roughness:.85}),glove:M({color:0x15161a,roughness:.7}),boot:M({color:0x1b1613,roughness:.55,metalness:.05}),metal:M({color:0x2c2e32,metalness:.9,roughness:.4}),polymer:M({color:0x1a1b1e,roughness:.6,metalness:.2}),helm:M({color:0x20272f,roughness:.5,metalness:.15}),accent:M({color:T?0xff8a1f:0x3f8cff,roughness:.6}),mask:M({color:0x1a1816,roughness:.95,bumpMap:ut,bumpScale:.4,side:THREE.DoubleSide}),lens:M({color:0x0a141c,metalness:1,roughness:.08})}})}
function ik(sp,tg,l1,l2,pole){const d=tg.clone().sub(sp),D=Math.min(d.length(),(l1+l2)*.985);d.normalize();const a=(l1*l1-l2*l2+D*D)/(2*D),h=Math.sqrt(Math.max(0,l1*l1-a*a)),pv=pole.clone().sub(d.clone().multiplyScalar(pole.dot(d))).normalize(),el=sp.clone().addScaledVector(d,a).addScaledVector(pv,h),dn=new THREE.Vector3(0,-1,0),
q1=new THREE.Quaternion().setFromUnitVectors(dn,el.clone().sub(sp).normalize()),q2=new THREE.Quaternion().setFromUnitVectors(dn,sp.clone().addScaledVector(d,D).sub(el).normalize());return{q1,q2:q1.clone().invert().multiply(q2)}}
const SKIN_IDB='strikeArena',SKIN_STORE='models',CT_KEY='sas-ct-glb-v1',T_KEY='phoenix-t-glb-v1';
function skinsReady(){return ctSkinState!=='loading'&&tSkinState!=='loading'}
function weaponsReady(){return weaponsState!=='loading'}
function assetsReady(){return skinsReady()&&weaponsReady()&&mapReady()}
function markAssetsLocal(){try{localStorage.setItem('strike_assets_v4','1');localStorage.setItem('strike_ct_ready',ctSkinState==='ready'?'1':'0');localStorage.setItem('strike_t_ready',tSkinState==='ready'?'1':'0');localStorage.setItem('strike_weapons_ready',Object.keys(WEAPON_TPL).length?'1':'0')}catch(e){}}
function setLoadMsg(t){const el=$('loadst');if(el)el.innerHTML=t;updPlayHint()}
function updPlayHint(){const el=$('playhint');if(!el)return;if(assetsReady()){el.style.opacity='1';el.innerHTML='<b>Click to play</b>'}
else{el.style.opacity='.45';el.innerHTML='<b>Waiting for models…</b>'}}
function idbOpen(){return new Promise((res,rej)=>{const r=indexedDB.open(SKIN_IDB,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(SKIN_STORE))db.createObjectStore(SKIN_STORE)};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function idbGet(key){return idbOpen().then(db=>new Promise((res,rej)=>{const q=db.transaction(SKIN_STORE,'readonly').objectStore(SKIN_STORE).get(key);q.onsuccess=()=>res(q.result||null);q.onerror=()=>rej(q.error)}))}
function idbSet(key,val){return idbOpen().then(db=>new Promise((res,rej)=>{const q=db.transaction(SKIN_STORE,'readwrite').objectStore(SKIN_STORE).put(val,key);q.onsuccess=()=>res();q.onerror=()=>rej(q.error)}))}
// Models are too big for localStorage (~5MB). IndexedDB + Cache API keep them on disk after first download.
async function toArrayBuffer(data){if(!data)return null;if(data instanceof ArrayBuffer)return data;if(ArrayBuffer.isView(data))return data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);if(typeof Blob!=='undefined'&&data instanceof Blob)return data.arrayBuffer();return null}
function assetBytes(data){if(!data)return 0;if(data.byteLength!=null)return data.byteLength;if(data.size!=null)return data.size;return 0}
function isGlb(buf){if(!buf||assetBytes(buf)<12)return false;const u=new Uint8Array(buf instanceof ArrayBuffer?buf:buf.buffer||buf);return u[0]===0x67&&u[1]===0x6c&&u[2]===0x54&&u[3]===0x46}
async function idbDel(key){try{const db=await idbOpen();await new Promise((res,rej)=>{const q=db.transaction(SKIN_STORE,'readwrite').objectStore(SKIN_STORE).delete(key);q.onsuccess=()=>res();q.onerror=()=>rej(q.error)})}catch(e){}}
async function persistAsset(key,buf){try{await idbSet(key,buf);localStorage.setItem('strike_saved_'+key,'1')}catch(e){console.warn('persist failed',key,e)}}
async function loadAssetBuf(urls,key,onProgress){const wantGlb=/\.glb|glb-/.test(key)||/glb/.test(key);
try{const hit=await idbGet(key),ab=await toArrayBuffer(hit);if(ab&&assetBytes(ab)>64&&(!wantGlb||isGlb(ab)))return ab;if(ab)await idbDel(key)}catch(e){}
let lastErr=null;for(const url of urls){try{const r=await fetch(url);if(!r.ok)throw new Error('HTTP '+r.status);const total=+r.headers.get('content-length')||0;let buf;if(onProgress&&r.body&&total){const reader=r.body.getReader();let got=0;const chunks=[];for(;;){const{done,value}=await reader.read();if(done)break;chunks.push(value);got+=value.length;onProgress(got,total)}const out=new Uint8Array(got);let off=0;for(const c of chunks){out.set(c,off);off+=c.length}buf=out.buffer}else buf=await r.arrayBuffer();if(assetBytes(buf)<64)throw new Error('empty');if(wantGlb&&!isGlb(buf))throw new Error('not glb');await persistAsset(key,buf);return buf}catch(e){lastErr=e}}throw lastErr||new Error('asset missing: '+key)}
function prepareAgentSkin(scene){const sc=scene;sc.position.set(0,0,0);sc.rotation.set(0,0,0);sc.scale.set(1,1,1);
// Undo exporter-baked inch scale on children (SAS); Phoenix Sketchfab is already meters — don't force 0.0254.
sc.traverse(o=>{if(o!==sc&&o.scale&&Math.abs(o.scale.x-0.0254)<0.002&&Math.abs(o.scale.y-0.0254)<0.002&&Math.abs(o.scale.z-0.0254)<0.002)o.scale.set(1,1,1)});
sc.updateMatrixWorld(true);
sc.traverse(o=>{if(o.isSkinnedMesh&&o.skeleton){o.frustumCulled=false;o.bindMode='attached';o.skeleton.update()}if(o.isMesh){o.castShadow=true;o.frustumCulled=false;o.visible=true;const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{if(!m)return;if(m.map){m.map.encoding=THREE.sRGBEncoding;m.map.needsUpdate=true}m.side=THREE.DoubleSide;m.transparent=false;m.opacity=1;m.depthWrite=true;m.needsUpdate=true})}});
const wp=new THREE.Vector3();
// Body bones only — Phoenix also has eye/IK/root-motion helper bones far from the body that skew size and centering
const bodyBone=o=>o.isBone&&/^(pelvis|spine|neck|head|clavicle|arm|hand|leg|ankle|ball)/i.test(o.name)&&!/_end|iktarget|offset/i.test(o.name);
const boneSpan=()=>{let minY=Infinity,maxY=-Infinity;sc.updateMatrixWorld(true);sc.traverse(o=>{if(!bodyBone(o))return;o.getWorldPosition(wp);if(wp.y<minY)minY=wp.y;if(wp.y>maxY)maxY=wp.y});return(maxY>minY)?(maxY-minY):0};
let boneH=boneSpan();
if(boneH>8){sc.scale.setScalar(0.0254);boneH=boneSpan()}// inches → meters
else if(boneH>0&&boneH<0.35){sc.scale.setScalar(1.8/boneH);boneH=boneSpan()}
if(boneH>0.05){sc.scale.multiplyScalar(1.8/boneH);sc.updateMatrixWorld(true)}
const box=new THREE.Box3();sc.updateMatrixWorld(true);sc.traverse(o=>{if(bodyBone(o)){o.getWorldPosition(wp);box.expandByPoint(wp)}});
if(!box.isEmpty()){sc.position.x-=(box.min.x+box.max.x)/2;sc.position.z-=(box.min.z+box.max.z)/2;sc.position.y-=box.min.y}
return sc}
function cloneAgentModel(tpl){if(!tpl)throw new Error('no skin');const model=THREE.SkeletonUtils&&THREE.SkeletonUtils.clone?THREE.SkeletonUtils.clone(tpl):tpl.clone(true);model.traverse(o=>{if(o.isSkinnedMesh){o.frustumCulled=false;o.visible=true}if(o.isMesh){o.visible=true;o.castShadow=true;o.frustumCulled=false}});return model}
function findBone(root,name){let exact=null,soft=null;const re=new RegExp('^'+name+'_\\d+$','i');
root.traverse(o=>{if(!o.isBone)return;if(o.name===name)exact=exact||o;else if(re.test(o.name)&&!/twist|end|ik|jiggle|hier/i.test(o.name))soft=soft||o});return exact||soft}
function botGunTpl(team){const id=team==='t'?'ak':'m4';return WEAPON_TPL[id]||BOT_GUN_TPL[id]}
function fitTpGun(gun){gun.position.set(0,0,0);gun.updateMatrixWorld(true);
let box=new THREE.Box3().setFromObject(gun),sz=box.getSize(new THREE.Vector3()),long=Math.max(sz.x,sz.y,sz.z,.001);
gun.scale.multiplyScalar(.75/long);gun.updateMatrixWorld(true);
box.setFromObject(gun);const mid=box.getCenter(new THREE.Vector3());gun.position.set(-mid.x,-mid.y,-mid.z);return gun}
function mountBotGun(rig,model,team,bones){const gun=fitTpGun(cloneWeapon(botGunTpl(team)));
gun.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.visible=true;o.renderOrder=2}});
// Chest-mounted, muzzle along the bot's forward (-Z); the arms are then IK'd onto it.
const hold=new THREE.Group();hold.position.set(.1,1.25,-.3);hold.rotation.set(.04,0,0);
hold.add(gun);rig.add(hold);
// Flash lives on the holder, not the gun: weapon models are scaled ~25x, which made it a 3m sphere
rig.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(hold.matrixWorld).invert(),gb=new THREE.Box3().setFromObject(gun).applyMatrix4(inv),ws=new THREE.Vector3().setFromMatrixScale(hold.matrixWorld);
const fl=new THREE.Mesh(sph(.05,8,6),FLM);fl.position.set((gb.min.x+gb.max.x)/2,gb.max.y-(gb.max.y-gb.min.y)*.3,gb.min.z-.03/ws.z);fl.scale.set(1/ws.x,1/ws.y,1/ws.z);fl.visible=false;hold.add(fl);
return{rg:hold,fl}}
function alignBoneAxis(bone,worldTarget){if(!bone||!bone.parent)return;const child=bone.children.find(c=>c.isBone);if(!child||child.position.lengthSq()<1e-10)return;
const axis=alignBoneAxis._a||(alignBoneAxis._a=new THREE.Vector3()),o=alignBoneAxis._o||(alignBoneAxis._o=new THREE.Vector3());
const want=alignBoneAxis._w||(alignBoneAxis._w=new THREE.Vector3()),cur=alignBoneAxis._c||(alignBoneAxis._c=new THREE.Vector3());
const wq=alignBoneAxis._wq||(alignBoneAxis._wq=new THREE.Quaternion()),pq=alignBoneAxis._pq||(alignBoneAxis._pq=new THREE.Quaternion()),dq=alignBoneAxis._dq||(alignBoneAxis._dq=new THREE.Quaternion());
axis.copy(child.position).normalize();bone.updateMatrixWorld(true);bone.getWorldPosition(o);bone.getWorldQuaternion(wq);
cur.copy(axis).applyQuaternion(wq).normalize();want.copy(worldTarget).sub(o);if(want.lengthSq()<1e-10)return;want.normalize();
dq.setFromUnitVectors(cur,want);wq.premultiply(dq);bone.parent.getWorldQuaternion(pq);bone.quaternion.copy(pq.invert().multiply(wq))}
// Both CS2 rigs share bone names but not rest orientations or proportions, so everything the arm solve needs
// (segment lengths, which way each palm faces) is measured once from the bot's own rest pose.
function measureArms(u){const m=u.model,bn=u.bones,A={},rigQ=new THREE.Quaternion(),q=new THREE.Quaternion();
m.updateMatrixWorld(true);u.rig.getWorldQuaternion(rigQ);
for(const s of ['l','r']){const up=bn['arm_upper_'+s],lo=bn['arm_lower_'+s],hd=findBone(m,'hand_'+s);if(!up||!lo||!hd)continue;
const ps=up.getWorldPosition(new THREE.Vector3()),pe=lo.getWorldPosition(new THREE.Vector3()),ph=hd.getWorldPosition(new THREE.Vector3());
// A-pose palms face the thighs, i.e. inward toward the centre line; kept in forearm space so it follows the arm
lo.getWorldQuaternion(q);const palm=new THREE.Vector3(s==='r'?-1:1,0,0).applyQuaternion(rigQ).applyQuaternion(q.invert());
const fingers=[];for(const f of ['index','middle','ring','pinky'])for(const k of [0,1,2]){const fb=findBone(m,'finger_'+f+'_'+k+'_'+s);if(fb)fingers.push({b:fb,q:fb.quaternion.clone()})}
A[s]={up,lo,l1:Math.max(ps.distanceTo(pe),.05),l2:Math.max(pe.distanceTo(ph),.05),palm,fingers}}
return A}
const _pa=[...Array(16)].map(()=>new THREE.Vector3()),_pq=[...Array(4)].map(()=>new THREE.Quaternion());
function rotateBoneWorld(bone,axisW,ang){bone.getWorldQuaternion(_pq[0]);_pq[1].setFromAxisAngle(axisW,ang);_pq[0].premultiply(_pq[1]);
bone.parent.getWorldQuaternion(_pq[2]);bone.quaternion.copy(_pq[2].invert().multiply(_pq[0]));bone.updateMatrixWorld(true)}
// Wrist targets in hold space (unscaled, gun centred, 0.75m long, muzzle −Z); the hand mesh extends ~10cm past
// the wrist, so these sit behind the pistol grip and handguard. Not the gun mesh's own space — the loaded
// weapon root carries a large import scale.
const GRIP={r:[0,.01,.19],l:[0,0,-.06]},FINGER_CURL=.55;
function poseArmsToGun(u,gunHold){const rest=u.restQ,bn=u.bones;if(!gunHold||!rest)return;
['arm_upper_l','arm_upper_r','arm_lower_l','arm_lower_r'].forEach(k=>{if(bn[k]&&rest[k]){bn[k].quaternion.copy(rest[k].q);bn[k].scale.copy(rest[k].s)}});
const A=u.arms||(u.arms=measureArms(u));
for(const s in A)for(const f of A[s].fingers)f.b.quaternion.copy(f.q);
gunHold.updateMatrixWorld(true);u.rig.getWorldQuaternion(_pq[3]);
const [T,S,E,dir,pole,right,upV,cur,want,back]=_pa;
right.set(1,0,0).applyQuaternion(_pq[3]);upV.set(0,1,0).applyQuaternion(_pq[3]);back.set(0,0,1).applyQuaternion(_pq[3]);
for(const s of ['r','l']){const a=A[s];if(!a)continue;const side=s==='r'?1:-1;
T.fromArray(GRIP[s]).applyMatrix4(gunHold.matrixWorld);a.up.updateMatrixWorld(true);a.up.getWorldPosition(S);
dir.copy(T).sub(S);const len=dir.length()||1;dir.divideScalar(len);
const reach=Math.min(Math.max(len,Math.abs(a.l1-a.l2)+.02),(a.l1+a.l2)*.97);
// Elbows hang down and out to the side, slightly back — never across the chest
pole.copy(upV).negate().addScaledVector(right,side*.7).addScaledVector(back,.3);
pole.addScaledVector(dir,-pole.dot(dir));if(pole.lengthSq()<1e-6)pole.copy(right).multiplyScalar(side);pole.normalize();
const along=(a.l1*a.l1-a.l2*a.l2+reach*reach)/(2*reach),h=Math.sqrt(Math.max(0,a.l1*a.l1-along*along));
E.copy(S).addScaledVector(dir,along).addScaledVector(pole,h);T.copy(S).addScaledVector(dir,reach);
alignBoneAxis(a.up,E);a.lo.updateMatrixWorld(true);alignBoneAxis(a.lo,T);a.lo.updateMatrixWorld(true);
// Roll the forearm about its own axis: right palm faces the pistol grip (inward), left palm cups the handguard (up)
const fore=_pa[10].copy(T).sub(a.lo.getWorldPosition(_pa[11])).normalize();
a.lo.getWorldQuaternion(_pq[3]);cur.copy(a.palm).applyQuaternion(_pq[3]);
if(s==='r')want.copy(right).negate();else want.copy(upV).addScaledVector(right,.4);
cur.addScaledVector(fore,-cur.dot(fore));want.addScaledVector(fore,-want.dot(fore));
if(cur.lengthSq()>1e-6&&want.lengthSq()>1e-6){cur.normalize();want.normalize();rotateBoneWorld(a.lo,fore,Math.atan2(_pa[11].crossVectors(cur,want).dot(fore),cur.dot(want)))}
// Curl the fingers toward the palm so the hands close on the gun
a.lo.getWorldQuaternion(_pq[3]);const palmW=_pa[12].copy(a.palm).applyQuaternion(_pq[3]);
for(const f of a.fingers){const fb=f.b,ch=fb.children.find(c=>c.isBone);fb.updateMatrixWorld(true);
const p0=fb.getWorldPosition(_pa[13]),fd=_pa[14];if(ch)fd.copy(ch.getWorldPosition(_pa[15])).sub(p0);else fd.copy(p0).sub(fb.parent.getWorldPosition(_pa[15]));
const ax=_pa[15].crossVectors(fd.normalize(),palmW);if(ax.lengthSq()<1e-6)continue;rotateBoneWorld(fb,ax.normalize(),FINGER_CURL)}}}
function buildSkinnedBot(team){const tpl=team==='t'?tSkinTpl:ctSkinTpl;if(!tpl)throw new Error('no '+team+' skin');
const g=new THREE.Group(),rig=new THREE.Group();g.rotation.order='YXZ';g.add(rig);
const model=cloneAgentModel(tpl);model.rotation.y=Math.PI;rig.add(model);
// Hit volumes must stay object.visible=true so Raycaster can hit them (material is invisible).
const body=new THREE.Mesh(bx(.55,.9,.4),HIT);body.position.set(0,1.15,0);rig.add(body);
const head=new THREE.Mesh(sph(.18,8,6),HIT);head.position.set(0,1.68,0);rig.add(head);
const limbs=[new THREE.Mesh(cyl(.12,.1,.95,8),HIT),new THREE.Mesh(cyl(.12,.1,.95,8),HIT)];limbs[0].position.set(-.2,.95,0);limbs[1].position.set(.2,.95,0);rig.add(limbs[0],limbs[1]);
const bones={leg_upper_l:findBone(model,'leg_upper_l'),leg_upper_r:findBone(model,'leg_upper_r'),leg_lower_l:findBone(model,'leg_lower_l'),leg_lower_r:findBone(model,'leg_lower_r'),
clavicle_l:findBone(model,'clavicle_l'),clavicle_r:findBone(model,'clavicle_r'),arm_upper_l:findBone(model,'arm_upper_l'),arm_upper_r:findBone(model,'arm_upper_r'),arm_lower_l:findBone(model,'arm_lower_l'),arm_lower_r:findBone(model,'arm_lower_r'),spine_0:findBone(model,'spine_0'),spine_1:findBone(model,'spine_1'),weapon_hand_r:findBone(model,'weapon_hand_r'),hand_r:findBone(model,'hand_r')};
const {rg,fl}=mountBotGun(rig,model,team,bones);
const legs=[{rotation:{x:0}},{rotation:{x:0}}],shins=[{rotation:{x:0}},{rotation:{x:0}}];
return{g,rig,body,head,limbs,legs,shins,fl,skinned:true,bones,model,gun:rg}}
function attachBot(r,team,x,z,keep,forceEnemy){const g=r.g;g.position.set(x,0,z);if(keep&&keep.yaw!=null)g.rotation.y=keep.yaw;scene.add(g);
const b=keep&&keep.b?keep.b:{g,x,z,hp:100,cd:1+Math.random(),sd:Math.random()<.5?1:-1,st:1+Math.random()*2,seen:0,alive:true,team};
b.g=g;b.x=x;b.z=z;b.body=r.body;b.head=r.head;b.team=team;if(keep&&keep.hp!=null)b.hp=keep.hp;
if(keep&&keep.net)b.net=true;
g.userData={legs:r.legs,shins:r.shins,limbs:r.limbs,rig:r.rig,fl:r.fl,skinned:!!r.skinned,bones:r.bones,model:r.model,gun:r.gun,restQ:null};
if(r.gun){r.gun.visible=true;r.gun.traverse(o=>{if(o.isMesh)o.visible=true})}
r.body.userData.bot=b;r.head.userData.bot=b;r.head.userData.head=true;r.limbs.forEach(q=>q.userData.bot=b);
const shootable=forceEnemy||b.net||team==='ct';
(shootable?botMeshes:allyMeshes).push(r.body,r.head,...r.limbs);return b}
function replaceTeamSkins(team){const tpl=team==='t'?tSkinTpl:ctSkinTpl;if(!tpl)return;
const old=bots.filter(b=>b.team===team&&b.alive&&!(b.g.userData&&b.g.userData.skinned));if(!old.length)return;
old.forEach(b=>{[b.body,b.head,...(b.g.userData.limbs||[])].forEach(m=>{let i=botMeshes.indexOf(m);if(i>=0)botMeshes.splice(i,1);i=allyMeshes.indexOf(m);if(i>=0)allyMeshes.splice(i,1)});scene.remove(b.g);
try{const r=buildSkinnedBot(team),nb=attachBot(r,team,b.x,b.z,{b,hp:b.hp,yaw:b.g.rotation.y,net:!!b.net},!!b.net);nb.net=!!b.net;if(nb.pid)ptClassify(nb);const idx=bots.indexOf(b);if(idx>=0)bots[idx]=nb;if(b===netBot)netBot=nb}catch(err){console.warn('replace '+team+' failed',err)}});feed((team==='t'?'Phoenix T':'SAS CT')+' skins applied');updHud()}
function parseGlb(buf){return toArrayBuffer(buf).then(ab=>new Promise((res,rej)=>{new THREE.GLTFLoader().parse(ab,'',g=>res(g),e=>rej(e))}))}
function destskinWeapon(root){root.updateMatrixWorld(true);const skins=[];root.traverse(o=>{if(o.isSkinnedMesh)skins.push(o)});
skins.forEach(sm=>{try{if(sm.skeleton)sm.skeleton.pose()}catch(e){}const mesh=new THREE.Mesh(sm.geometry,sm.material);mesh.name=sm.name;mesh.position.copy(sm.position);mesh.quaternion.copy(sm.quaternion);mesh.scale.copy(sm.scale);mesh.castShadow=true;mesh.frustumCulled=false;if(sm.parent){sm.parent.add(mesh);sm.parent.remove(sm)}});
const bones=[];root.traverse(o=>{if(o.isBone)bones.push(o)});bones.forEach(b=>{if(b.parent)b.parent.remove(b)})}
function isolateLargestMesh(root){const meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o)});if(meshes.length<2)return;
let best=null,bestV=-1;meshes.forEach(m=>{try{if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();const s=m.geometry.boundingBox.getSize(new THREE.Vector3()),v=Math.max(s.x,0.001)*Math.max(s.y,0.001)*Math.max(s.z,0.001);if(v>bestV){bestV=v;best=m}}catch(e){}});
if(!best)return;meshes.forEach(m=>{if(m!==best&&m.parent)m.parent.remove(m)})}
function prepareWeapon(scene,kind,id){const root=new THREE.Group();root.add(scene);destskinWeapon(root);
let isKaram=false;root.traverse(o=>{if(/karambit/i.test(o.name||''))isKaram=true;if(!o.isMesh)return;o.castShadow=true;o.frustumCulled=false;const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{if(!m)return;if(m.map){m.map.encoding=THREE.sRGBEncoding;m.map.needsUpdate=true}m.side=THREE.DoubleSide;m.transparent=false;m.opacity=1;m.depthWrite=true;m.needsUpdate=true})});
if(id==='smoke')isolateLargestMesh(root);
root.userData.kind=kind;
// Karambit: finger-ring at origin, tip along +Y (fist finger axis), claw along −X (toward palm/camera).
if(isKaram){root.userData.karambit=1;root.position.set(0,0,0);root.quaternion.identity();root.scale.set(1,1,1);root.updateMatrixWorld(true);
  let box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3());
  // Source: X=thickness, Y=handle→tip (ring at −Y), Z=claw depth → Ry(+π/2) keeps tip on +Y, claw on −X
  const ringLocal=new THREE.Vector3((box.min.x+box.max.x)*.5,box.min.y+size.y*.08,(box.min.z+box.max.z)*.5);
  const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(.05,Math.PI/2,0));
  root.quaternion.copy(q);root.position.copy(ringLocal).applyQuaternion(q).negate();root.updateMatrixWorld(true);
  box=new THREE.Box3().setFromObject(root);size=box.getSize(new THREE.Vector3());
  const longest=Math.max(size.x,size.y,size.z)||1,sc=.17/longest;root.scale.setScalar(sc);
  root.position.copy(ringLocal).multiplyScalar(sc).applyQuaternion(q).negate();
  root.updateMatrixWorld(true);root.userData.lenZ=.17;return root}
const want=kind==='nade'?.1:kind==='pistol'?.28:kind==='smg'?.4:.5;root.userData.lenZ=fitWeaponToBox(root,want);return root}
function refreshBotGuns(){bots.forEach(b=>{const u=b.g&&b.g.userData;if(!u||!u.rig)return;if(u.gun&&u.gun.parent)u.gun.parent.remove(u.gun);const r=mountBotGun(u.rig,u.model,b.team,u.bones||{});u.gun=r.rg;u.fl=r.fl})}
function onWeaponReady(id){if(id===vmId())buildModel(id);if(id==='ak'||id==='m4')refreshBotGuns()}
function finishWeaponSlot(){weaponsLeft=Math.max(0,weaponsLeft-1);if(!weaponsLeft){weaponsState=Object.keys(WEAPON_TPL).length?'ready':'failed';if(assetsReady())markAssetsLocal()}refreshLoadUi()}
function loadWeapon(id){const meta=WEAPON_FILES[id];if(!meta||!THREE.GLTFLoader){finishWeaponSlot();return}
const urls=['./assets/weapons/'+meta.file,'/assets/weapons/'+meta.file,'assets/weapons/'+meta.file];
(async()=>{try{const fromDisk=(()=>{try{return localStorage.getItem('strike_saved_'+meta.key)==='1'}catch(e){return false}})();
const buf=await loadAssetBuf(urls,meta.key);const g=await parseGlb(buf);WEAPON_TPL[id]=prepareWeapon(g.scene,meta.kind,id);onWeaponReady(id);finishWeaponSlot();
try{localStorage.setItem('strike_wpn_'+id,'1')}catch(e){}feed(id.toUpperCase()+(fromDisk?' (cached)':' saved'))}catch(e){console.warn(id+' load failed',e);finishWeaponSlot()}})()}
function loadAllWeapons(){const ids=Object.keys(WEAPON_FILES);weaponsLeft=ids.length;weaponsState='loading';ids.forEach(loadWeapon);refreshLoadUi()}
function refreshLoadUi(){const bits=[];if(ctSkinState==='ready')bits.push('<span style="color:#7CFF6B">SAS CT ready</span>');else if(ctSkinState==='failed')bits.push('SAS CT failed');else bits.push('SAS CT…');
if(tSkinState==='ready')bits.push('<span style="color:#7CFF6B">Phoenix T ready</span>');else if(tSkinState==='failed')bits.push('Phoenix T failed');else bits.push('Phoenix T…');
const wn=Object.keys(WEAPON_TPL).length,wt=Object.keys(WEAPON_FILES).length;if(weaponsState==='loading')bits.push('Weapons '+wn+'/'+wt);else if(wn)bits.push('<span style="color:#7CFF6B">Weapons '+wn+'/'+wt+'</span>');
else bits.push('Weapons failed');
if(mapId!=='arena'){const s=mapSt[mapId],n=MAPS[mapId].name;bits.push(s==='ready'?'<span style="color:#7CFF6B">'+n+' ready</span>':s==='failed'?n+' failed (Arena instead)':n+'…')}
const cached=(()=>{try{return localStorage.getItem('strike_assets_v4')==='1'||localStorage.getItem('strike_assets_v3')==='1'}catch(e){return false}})();
setLoadMsg(bits.join(' · ')+(assetsReady()?' — click to play':(cached?' — loading from cache…':' — please wait…')));
if(window.Netplay&&Netplay.connected){sendReady();updLobby()}}
function loadAgentSkin(kind){const isT=kind==='t',key=isT?T_KEY:CT_KEY,urls=isT?['./assets/phoenix-t.glb','/assets/phoenix-t.glb','assets/phoenix-t.glb']:['./assets/sas-ct.glb','/assets/sas-ct.glb','assets/sas-ct.glb'],label=isT?'Phoenix T':'SAS CT';
if(!THREE.GLTFLoader){if(isT)tSkinState='failed';else ctSkinState='failed';refreshLoadUi();return}
if(isT)tSkinState='loading';else ctSkinState='loading';refreshLoadUi();
(async()=>{try{const fromDisk=(()=>{try{return localStorage.getItem('strike_saved_'+key)==='1'}catch(e){return false}})();
const buf=await loadAssetBuf(urls,key,(got,total)=>setLoadMsg('Loading '+label+'… '+Math.min(99,Math.round(got/total*100))+'%'));
const g=await parseGlb(buf);if(isT){tSkinTpl=prepareAgentSkin(g.scene);tSkinState='ready';replaceTeamSkins('t');mountViewHands()}else{ctSkinTpl=prepareAgentSkin(g.scene);ctSkinState='ready';replaceTeamSkins('ct')}
try{localStorage.setItem('strike_'+kind+'_ready','1')}catch(e){}if(assetsReady())markAssetsLocal();refreshLoadUi();feed(label+(fromDisk?' ready (cached)':' ready — saved'))}catch(e){console.warn(label+' failed',e);if(isT)tSkinState='failed';else ctSkinState='failed';if(assetsReady())markAssetsLocal();refreshLoadUi();feed(label+' failed')}})()}
function loadMap(id){const meta=MAPS[id];if(!meta||mapSt[id]||!window.MapWorld)return;mapSt[id]='loading';refreshLoadUi();
(async()=>{try{const buf=await loadAssetBuf(['./'+meta.file,meta.file],meta.key,(got,total)=>setLoadMsg('Loading map '+meta.name+'… '+Math.min(99,Math.round(got/total*100))+'%'));
const w=MapWorld.load(buf);w.ladders=(meta.ladders||[]).map(L=>{L=L.slice();for(const d of[.6,-.6]){const g=w.ground(L[2]?L[0]+d:L[0],L[2]?L[1]:L[1]+d,L[4]+.85);if(g>L[4]-4)L[4]=Math.min(L[4],g)}return L});w.meshes.forEach(m=>{m.visible=false;scene.add(m)});mapW[id]=w;
w.buildNav(()=>{mapSt[id]='ready';if(mapId===id&&state!=='play')applyMap(id);if(assetsReady())markAssetsLocal();refreshLoadUi();feed(meta.name+' ready')})}
catch(e){console.warn('map '+id+' failed',e);mapSt[id]='failed';refreshLoadUi();feed(meta.name+' failed to load — using Arena')}})()}
// Swaps which world the physics, raycasts and rendering use
function applyMap(id){const w=id!=='arena'&&mapSt[id]==='ready'?mapW[id]:null;world=w;
for(const k in mapW)mapW[k].meshes.forEach(m=>m.visible=mapW[k]===w);
arenaObjs.forEach(o=>o.visible=!w);
boxes.length=0;boxMeshes.length=0;
if(w)boxMeshes.push(w.proxy);else{boxes.push(...arenaBoxes);boxMeshes.push(...arenaBoxMeshes)}
scene.fog.near=w?45:30;scene.fog.far=w?170:100;
// 4096² shadows over the full map mesh drop laptop GPUs to ~15fps; 2048² over a tighter box looks the same
const ss=w?2048:4096,sb=w?36:42;if(sun.shadow.mapSize.x!==ss){sun.shadow.mapSize.set(ss,ss);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}
sh.left=sh.bottom=-sb;sh.right=sh.top=sb;sh.updateProjectionMatrix();
if(!w){sun.position.set(25,40,15);sun.target.position.set(0,0,0);sun.target.updateMatrixWorld()}}
function setMapChoice(id){mapId=id;try{localStorage.setItem('strike_map',id)}catch(e){}if(id!=='arena')loadMap(id);applyMap(id);refreshLoadUi();updMapBtn()}
function updMapBtn(){const b=$('mm-map');if(b)b.innerHTML='<b>Map: '+(mapId==='arena'?'Arena':MAPS[mapId].name)+'</b><small>Click to change map</small>'}
function spawnOf(team){const m=world&&MAPS[mapId];return m?m[team]:null}
loadAgentSkin('ct');loadAgentSkin('t');loadAllWeapons();loadMap(mapId==='arena'?'mirage':mapId);
function buildBot(team){if(team==='ct'&&ctSkinTpl){try{return buildSkinnedBot('ct')}catch(err){console.warn('CT skin clone failed',err)}}
if(team==='t'&&tSkinTpl){try{return buildSkinnedBot('t')}catch(err){console.warn('T skin clone failed',err)}}
const m=teamMats(team),T=team==='t',g=new THREE.Group(),rig=new THREE.Group();g.rotation.order='YXZ';g.add(rig);
const skin=new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(.05+Math.random()*.03,.35+Math.random()*.25,.28+Math.random()*.38),roughness:.55}),dark=new THREE.MeshStandardMaterial({color:0x120c0a,roughness:.8}),white=new THREE.MeshStandardMaterial({color:0xe8e4dc,roughness:.3});
const add=(p,geo,mat,x,y,z,o)=>{const e=new THREE.Mesh(geo,mat);e.position.set(x,y,z);if(o){if(o.rx)e.rotation.x=o.rx;if(o.ry)e.rotation.y=o.ry;if(o.rz)e.rotation.z=o.rz;if(o.s)e.scale.set(o.s[0],o.s[1],o.s[2]);if(o.sh)e.castShadow=true}p.add(e);return e};
const hit=(p,geo,x,y,z)=>{const e=new THREE.Mesh(geo,HIT);e.position.set(x,y,z);p.add(e);return e};
const legs=[],shins=[],limbs=[];
[-1,1].forEach(sx=>{const th=new THREE.Group();th.position.set(sx*.1,.945,0);rig.add(th);legs.push(th);
add(th,cyl(.088,.065,.46,14),m.uni,0,-.22,0,{sh:1});add(th,bx(.05,.14,.12),m.pouch,sx*.092,-.2,0);
const sn=new THREE.Group();sn.position.y=-.45;th.add(sn);shins.push(sn);
add(sn,cyl(.062,.045,.44,14),m.uni,0,-.22,0,{sh:1});add(sn,bx(.1,.09,.035),m.pouch,0,.0,-.062);
add(sn,cyl(.054,.058,.13,12),m.boot,0,-.4,0);add(sn,bx(.1,.07,.27),m.boot,0,-.455,-.05,{sh:1});add(sn,bx(.106,.025,.29),m.polymer,0,-.495,-.05);
limbs.push(hit(th,cyl(.1,.07,.92,8),0,-.46,0))});
add(rig,cyl(.17,.16,.2,16),m.uni,0,.98,0,{s:[1,1,.68],sh:1});add(rig,cyl(.178,.178,.05,16),m.pouch,0,1.07,0,{s:[1,1,.72]});add(rig,bx(.05,.04,.012),m.metal,0,1.07,-.128);
[-1,1].forEach(sx=>add(rig,bx(.07,.1,.06),m.pouch,sx*.13,1.04,-.09));
add(rig,cyl(.165,.18,.2,16),m.uni,0,1.17,0,{s:[1,1,.7],sh:1});add(rig,cyl(.21,.17,.32,18),m.uni,0,1.37,0,{s:[1,1,.68],sh:1});
add(rig,cyl(.222,.19,.34,18),m.vest,0,1.34,0,{s:[1,1,.76],sh:1});[-.1,0,.1].forEach(px=>add(rig,bx(.075,.11,.045),m.pouch,px,1.28,-.175));
add(rig,bx(.14,.06,.012),m.accent,0,1.45,-.172);add(rig,bx(.3,.34,.1),m.pouch,0,1.35,.17,{sh:1});
[-1,1].forEach(sx=>add(rig,sph(.075,12,10),m.vest,sx*.215,1.51,0,{s:[1,.8,1]}));
add(rig,cyl(.088,.105,.06,14),m.uni,0,1.55,0);add(rig,cyl(.045,.052,.1,12),skin,0,1.6,0);
const body=hit(rig,bx(.5,.8,.32),0,1.18,0);
// head
const hd=new THREE.Group();hd.position.set(0,1.72,0);rig.add(hd);const HS=[.93,1.13,1.03];
add(hd,sph(.095,24,18),skin,0,0,0,{s:HS,sh:1});
[-1,1].forEach(sx=>{add(hd,sph(.02,8,6),skin,sx*.09,-.005,.005,{s:[.6,1.3,1]});add(hd,sph(.0125,10,8),white,sx*.037,.015,-.082);add(hd,sph(.0068,8,6),dark,sx*.037,.015,-.092);add(hd,bx(.042,.007,.01),dark,sx*.037,.042,-.088,{rz:-sx*.12})});
add(hd,sph(.018,8,6),skin,0,-.015,-.098,{s:[.9,1.3,1.2]});add(hd,bx(.04,.005,.006),dark,0,-.052,-.086);
if(T){const rr=.103;add(hd,G_('hood',()=>new THREE.SphereGeometry(rr,24,16,3*Math.PI/2+.5,2*Math.PI-1,0,Math.PI*.78)),m.mask,0,0,0,{s:HS});add(hd,G_('hoodF',()=>new THREE.SphereGeometry(rr,24,4,0,2*Math.PI,Math.PI*.26,Math.PI*.09)),m.mask,0,0,0,{s:HS});add(hd,G_('hoodL',()=>new THREE.SphereGeometry(rr,24,10,0,2*Math.PI,Math.PI*.6,Math.PI*.4)),m.mask,0,0,0,{s:HS});add(hd,G_('tor',()=>new THREE.TorusGeometry(.102,.007,6,24)),m.accent,0,.085,0,{rx:Math.PI/2,s:[.93,1.03,1]})}
else{add(hd,G_('helm',()=>new THREE.SphereGeometry(.113,22,12,0,2*Math.PI,0,Math.PI*.56)),m.helm,0,.012,0,{s:[.97,1.08,1.1],sh:1});add(hd,bx(.17,.045,.05),m.lens,0,.042,-.098);add(hd,G_('tor',()=>new THREE.TorusGeometry(.102,.007,6,24)),m.polymer,0,.04,0,{rx:Math.PI/2,s:[.93,1.03,1]});add(hd,bx(.04,.03,.03),m.metal,0,.108,-.09);[-1,1].forEach(sx=>add(hd,cyl(.032,.032,.03,12),m.polymer,sx*.1,0,.005,{rz:Math.PI/2}))}
const head=hit(hd,sph(.14,8,6),0,.01,0);
// rifle — same detailed models as the player viewmodel
const rg=botGunTpl(T?'t':'ct').clone(true);
rg.scale.setScalar(WEAPON_TPL[T?'ak':'m4']?1:.5);rg.position.set(.12,1.32,-.22);rg.rotation.set(.05,.05,0);rig.add(rg);
const fl=new THREE.Mesh(sph(.05,8,6),FLM);fl.position.set(0,.02,-.95);fl.visible=false;rg.add(fl);
// arms posed on the rifle
[1,-1].forEach(sx=>{const sp=new THREE.Vector3(sx*.225,1.47,0),tg=sx>0?new THREE.Vector3(.1,1.25,-.16):new THREE.Vector3(.1,1.325,-.4),r=ik(sp,tg,.3,.28,new THREE.Vector3(sx*.5,-1,.15));
const ua=new THREE.Group();ua.position.copy(sp);ua.quaternion.copy(r.q1);rig.add(ua);add(ua,sph(.062,12,10),m.uni,0,0,0);add(ua,cyl(.055,.046,.3,12),m.uni,0,-.15,0,{sh:1});
if(T&&sx<0)add(ua,cyl(.06,.06,.045,12),m.accent,0,-.1,0);
const fa=new THREE.Group();fa.position.y=-.3;fa.quaternion.copy(r.q2);ua.add(fa);add(fa,sph(.047,10,8),m.uni,0,0,0);add(fa,cyl(.046,.036,.28,12),m.uni,0,-.14,0,{sh:1});add(fa,cyl(.038,.038,.05,10),m.glove,0,-.265,0);add(fa,bx(.07,.1,.05),m.glove,0,-.33,0);
limbs.push(hit(ua,cyl(.07,.06,.6,8),0,-.3,0))});
return{g,rig,body,head,limbs,legs,shins,fl}}
function animBot(b,w,dt){const u=b.g.userData,t=performance.now()/1000,mv=w!==0;if(u.fl)u.fl.visible=performance.now()<(b.fu||0);
if(u.skinned){const bn=u.bones||{};
if(!u.restQ){u.restQ={};['clavicle_l','clavicle_r','arm_upper_l','arm_upper_r','arm_lower_l','arm_lower_r'].forEach(k=>{if(bn[k])u.restQ[k]={q:bn[k].quaternion.clone(),s:bn[k].scale.clone()}})}
if(u.gun)poseArmsToGun(u,u.gun);
u.rig.position.y=mv?Math.abs(Math.sin(t*9.2))*.03:Math.sin(t*1.6+b.sd)*.004;return}
const L=u.legs,S=u.shins;L[0].rotation.x=w;L[1].rotation.x=-w;S[0].rotation.x=-Math.max(0,-w)*1.2-.04;S[1].rotation.x=-Math.max(0,w)*1.2-.04;
u.rig.position.y=mv?Math.abs(Math.sin(t*5.9+b.sd*3))*.025:Math.sin(t*1.6+b.sd)*.004;u.rig.rotation.z=mv?Math.sin(t*5.9+b.sd*3)*.02:0}
// ---------- Emotes ----------
const _sv=[...Array(12)].map(()=>new THREE.Vector3()),_sq=new THREE.Quaternion(),_ev=[...Array(4)].map(()=>new THREE.Vector3()),_eq=new THREE.Quaternion();
// Two-bone arm solve onto a world wrist target, then forearm roll so the palm faces want, then finger curl
function solveArm(a,T,pole,want,curl){a.up.updateMatrixWorld(true);const S=a.up.getWorldPosition(_sv[0]),dir=_sv[1].copy(T).sub(S),len=dir.length()||1;dir.divideScalar(len);
const reach=Math.min(Math.max(len,Math.abs(a.l1-a.l2)+.02),(a.l1+a.l2)*.97),pl=_sv[2].copy(pole);pl.addScaledVector(dir,-pl.dot(dir));if(pl.lengthSq()<1e-6)pl.set(0,-1,0);pl.normalize();
const along=(a.l1*a.l1-a.l2*a.l2+reach*reach)/(2*reach),h=Math.sqrt(Math.max(0,a.l1*a.l1-along*along));
const E=_sv[3].copy(S).addScaledVector(dir,along).addScaledVector(pl,h),Wr=_sv[4].copy(S).addScaledVector(dir,reach);
alignBoneAxis(a.up,E);a.lo.updateMatrixWorld(true);alignBoneAxis(a.lo,Wr);a.lo.updateMatrixWorld(true);
const fore=_sv[5].copy(Wr).sub(a.lo.getWorldPosition(_sv[6])).normalize();a.lo.getWorldQuaternion(_sq);
const cur=_sv[7].copy(a.palm).applyQuaternion(_sq),wn=_sv[8].copy(want);cur.addScaledVector(fore,-cur.dot(fore));wn.addScaledVector(fore,-wn.dot(fore));
if(cur.lengthSq()>1e-6&&wn.lengthSq()>1e-6){cur.normalize();wn.normalize();rotateBoneWorld(a.lo,fore,Math.atan2(_sv[9].crossVectors(cur,wn).dot(fore),cur.dot(wn)))}
a.lo.getWorldQuaternion(_sq);const palmW=_sv[10].copy(a.palm).applyQuaternion(_sq);
for(const f of a.fingers)f.b.quaternion.copy(f.q);if(!curl)return;
for(const f of a.fingers){const fb=f.b,ch=fb.children.find(c=>c.isBone);fb.updateMatrixWorld(true);const p0=fb.getWorldPosition(_sv[11]),fd=_sv[9];
if(ch)fd.copy(ch.getWorldPosition(_sv[6])).sub(p0);else fd.copy(p0).sub(fb.parent.getWorldPosition(_sv[6]));
const ax=_sv[6].crossVectors(fd.normalize(),palmW);if(ax.lengthSq()<1e-6)continue;rotateBoneWorld(fb,ax.normalize(),FINGER_CURL*1.6*curl)}}
const lerp3=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
// Runs after animBot has put the arms on the gun; blends from that grip into the emote pose
function poseEmote(b,dt){const e=b.em,D=e&&EMOTE[e.id],u=b.g.userData;if(!D){endEmote(b);return}e.t+=dt;if(e.t>=D.dur){endEmote(b);return}
const k=Math.max(0,Math.min(1,e.t/.3,(D.dur-e.t)/.3)),a=k*k*(3-2*k),p=D.pose(e.t);
if(u.gun)u.gun.visible=a<.3;
if(!u.skinned||!u.restQ||!u.gun)return;
const A=u.arms||(u.arms=measureArms(u));u.rig.updateMatrixWorld(true);u.gun.updateMatrixWorld(true);u.rig.getWorldQuaternion(_eq);
for(const s of ['r','l']){const q=p[s],arm=A[s];if(!q||!arm)continue;const sd=s==='r'?1:-1;
const T=_ev[0].fromArray(GRIP[s]).applyMatrix4(u.gun.matrixWorld).lerp(_ev[1].fromArray(q.h).applyMatrix4(u.rig.matrixWorld),a);
const pole=_ev[2].fromArray(lerp3([sd*.7,-1,.3],q.p,a)).applyQuaternion(_eq),want=_ev[3].fromArray(lerp3(s==='r'?[-1,0,0]:[.4,1,0],q.palm,a)).applyQuaternion(_eq);
solveArm(arm,T,pole,want,(q.c==null?1:q.c)*a+(1-a))}
u.rig.position.y+=(p.bob||0)*a;u.rig.rotation.y=(p.ry||0)*a;u.rig.rotation.z=(p.rz||0)*a}
function endEmote(b){b.em=null;const u=b.g&&b.g.userData;if(!u)return;if(u.rig){u.rig.rotation.y=0;u.rig.rotation.z=0}if(u.gun)u.gun.visible=true}
function remoteEmote(b,key,dt){key=key||'';if(key!==(b.emKey||'')){b.emKey=key;if(key&&EMOTE[key.split(':')[0]])b.em={id:key.split(':')[0],t:0};else if(b.em)endEmote(b)}if(b.em)poseEmote(b,dt)}
// Local player: a third-person copy of your agent plays the emote and the camera orbits it
function startEmote(id){if(state!=='play'||P.dead||!EMOTE[id]||!ownsEmote(id))return;stopEmote();
const team=online||party?myTeam:'t',r=buildBot(team),g=r.g;g.userData={legs:r.legs,shins:r.shins,limbs:r.limbs,rig:r.rig,fl:r.fl,skinned:!!r.skinned,bones:r.bones,model:r.model,gun:r.gun,restQ:null};scene.add(g);
EM.on=true;EM.id=id;EM.seq++;EM.av={g,team,sd:0,fu:0,em:{id,t:0}};EM.yaw=P.yaw;EM.pitch=P.pitch;
P.yaw+=Math.PI;P.pitch=-.2;mouseDown=false;semiLock=false;scoped=false;inspT=0;swing=null}
function stopEmote(){if(!EM.on)return;EM.on=false;if(EM.av)scene.remove(EM.av.g);EM.av=null;P.yaw=EM.yaw;P.pitch=EM.pitch}
function updEmote(dt){const av=EM.av;if(!av){stopEmote();return}
av.g.position.set(P.x,P.y,P.z);av.g.rotation.y=EM.yaw;av.g.userData.rig.scale.y=1;animBot(av,0,dt);poseEmote(av,dt);if(!av.em){stopEmote();return}
const ty=P.y+1.25,cp=Math.cos(P.pitch),dx=-Math.sin(P.yaw)*cp,dy=Math.sin(P.pitch),dz=-Math.cos(P.yaw)*cp;let d=2.6;
ray.set(_ev[0].set(P.x,ty,P.z),_ev[1].set(-dx,-dy,-dz));ray.far=d;const hit=ray.intersectObjects(boxMeshes,false)[0];if(hit)d=Math.max(.5,hit.distance-.2);
camera.position.set(P.x-dx*d,ty-dy*d,P.z-dz*d);camera.rotation.set(P.pitch,P.yaw,0)}
function openWheel(){EW.list=EMOTES.filter(e=>ownsEmote(e.id));if(!EW.list.length)return;EW.open=true;EW.x=EW.y=0;EW.sel=-1;mouseDown=false;const el=$('emw'),n=EW.list.length;
el.innerHTML='<b id="emw-n">Emotes</b>'+EW.list.map((e,i)=>{const a=i/n*Math.PI*2-Math.PI/2;return '<div class="it" style="left:'+(170+Math.cos(a)*118).toFixed(1)+'px;top:'+(170+Math.sin(a)*118).toFixed(1)+'px">'+e.icon+'<small>'+e.name+'</small></div>'}).join('');el.style.display='block'}
function wheelMove(dx,dy){EW.x+=dx;EW.y+=dy;const L=Math.hypot(EW.x,EW.y);if(L>120){EW.x*=120/L;EW.y*=120/L}
const n=EW.list.length;let s=-1;if(L>30){const a=(Math.atan2(EW.y,EW.x)+Math.PI/2+Math.PI*4)%(Math.PI*2);s=Math.round(a/(Math.PI*2/n))%n}
if(s!==EW.sel){EW.sel=s;$('emw').querySelectorAll('.it').forEach((d,i)=>d.classList.toggle('on',i===s));$('emw-n').textContent=s>=0?EW.list[s].name:'Emotes'}}
function closeWheel(go){if(!EW.open)return;EW.open=false;$('emw').style.display='none';if(go&&EW.sel>=0)startEmote(EW.list[EW.sel].id)}
// Per-round shuffled standable spots around each team's map spawn
let spawnPools=null;
function makeSpawnPools(){spawnPools=null;if(!world)return;spawnPools={};const rnd=Math.random;if(party){let sd=round*7919+13;Math.random=()=>((sd=(sd*9301+49297)%233280)/233280)}try{for(const team of ['t','ct']){const s=spawnOf(team),p=[];for(const q of world.spotsNear(s.x,s.y,s.z,s.r,40,1.3)){if(p.length>=14)break;if(world.findPath(q[0],q[1],q[2],s.x,s.y,s.z))p.push(q)}spawnPools[team]=p.length?p:[[s.x,s.y,s.z]]}}finally{Math.random=rnd}}
function takeSpot(team){const p=spawnPools&&spawnPools[team];if(!p)return null;return p.length>1?p.shift():p[0]}
function spawnYaw(team,x,z){const s=spawnOf(team);return s?Math.atan2(x-s.look[0],z-s.look[1]):0}
function placeBot(b,sp){b.x=sp[0];b.z=sp[2];b.y=sp[1];b.vy=0;b.path=null;b.g.position.set(b.x,b.y,b.z);b.g.rotation.y=spawnYaw(b.team,b.x,b.z)+Math.PI}
function spawnBots(n,team){for(let i=0;i<n;i++){const sp=takeSpot(team);if(sp){const b=attachBot(buildBot(team),team,sp[0],sp[2]);placeBot(b,sp);bots.push(b);continue}
let x,z,t=0;do{if(team==='t'){x=(Math.random()-.5)*22;z=6+Math.random()*10}else{x=(Math.random()-.5)*52;z=-28+Math.random()*10}t++}while((hits(x,z,.8)||(team==='t'&&Math.hypot(x-P.x,z-P.z)<8))&&t<60);
const r=buildBot(team);bots.push(attachBot(r,team,x,z))}}
function clearBots(){bots.forEach(b=>scene.remove(b.g));bots.length=0;botMeshes.length=0;allyMeshes.length=0;stains.forEach(s=>scene.remove(s));stains.length=0}
function flashRoundKills(){const el=$('rkills');el.textContent=''+roundKills;el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');clearTimeout(flashRoundKills._t);flashRoundKills._t=setTimeout(()=>el.classList.remove('flash'),280)}
function showWinBanner(tWin){const el=$('winban');el.className=tWin?'t':'ct';el.querySelector('span').textContent=tWin?'TERRORISTS WIN':'COUNTER-TERRORISTS WIN';el.style.display='flex';clearTimeout(showWinBanner._t);showWinBanner._t=setTimeout(()=>{el.style.display='none'},2800)}
function spawnNetOpponent(){
  const theirTeam=myTeam==='t'?'ct':'t';
  const sp=takeSpot(theirTeam),x=sp?sp[0]:0,z=sp?sp[2]:(theirTeam==='ct'?-22:25);
  const r=buildBot(theirTeam);
  netBot=attachBot(r,theirTeam,x,z,{net:true},true);
  if(sp){netBot.y=sp[1];netBot.g.position.y=sp[1]}
  netBot.net=true;netBot.alive=true;netBot.hp=100;netBot.crouch=false;
  bots.push(netBot);
  // Ensure third-person gun is mounted once weapon assets are ready
  if(netBot.g.userData){const u=netBot.g.userData;if((!u.gun||!u.gun.parent)&&u.rig){const mounted=mountBotGun(u.rig,u.model,theirTeam,u.bones||{});u.gun=mounted.rg;u.fl=mounted.fl}}
}
function startRound(){stopEmote();closeWheel(false);clearBots();clearDrops();netBot=null;if(online&&window.Netplay)Netplay.remote=null;
for(let i=nl.length-1;i>=0;i--)if(nl[i].net){scene.remove(nl[i].m);nl.splice(i,1)}
makeSpawnPools();P.y=0;
const mySp=party?ptSpot(Netplay.myId):takeSpot(online?myTeam:'t');
if(mySp){P.x=mySp[0];P.y=mySp[1];P.z=mySp[2];P.yaw=spawnYaw(online||party?myTeam:'t',P.x,P.z)}
else if(online||party){if(myTeam==='t'){P.x=0;P.z=25;P.yaw=Math.PI}else{P.x=0;P.z=-22;P.yaw=0}}
else{P.x=0;P.z=25;P.yaw=0}
P.pitch=0;P.vy=0;P.lad=null;P.safe=null;P.hp=100;P.dead=false;scoped=false;roundTimer=0;roundKills=0;$('rkills').textContent='0';$('rkills').classList.remove('flash');
if(online)spawnNetOpponent();
else if(party)ptSpawnAvatars();
else if(gameMode==='1v1'){spawnBots(1,'ct')}else{spawnBots(4,'t');spawnBots(Math.min(3+round,8),'ct')}
for(const k in inv){inv[k].ammo=W[k].mag;inv[k].reserve=W[k].res}ammo=inv[cur].ammo;reserve=inv[cur].reserve;reloading=0;freezeT=5;buyT=40;updHud();feed((online?'Online 1v1':party?'Private lobby':gameMode==='1v1'?'1v1':'5v5')+' · '+(world?MAPS[mapId].name:'Arena')+' · Round '+round+' — freeze 5s, buy 40s')}
function resetGame(){applyMap(mapId);P.x=0;P.z=25;P.yaw=0;P.pitch=0;P.hp=100;round=1;kills=0;money=3500;wins=loses=lossStreak=0;armor=0;nades={he:1,flash:1,smoke:1};inv={glock:{ammo:20,reserve:120}};setWeapon('glock');startRound();state='play'}
function endRound(win){let lb=0;
// win = local player won this round (online) OR T won (offline)
if(online){
  if(win){if(myTeam==='t')wins++;else loses++;lossStreak=0;money=Math.min(16000,money+3250)}
  else{if(myTeam==='t')loses++;else wins++;lossStreak++;lb=1400+Math.min(lossStreak-1,4)*500;money=Math.min(16000,money+lb)}
}else if(win){wins++;lossStreak=0;money=Math.min(16000,money+3250);addCoins(COIN.round)}else{lossStreak++;loses++;lb=1400+Math.min(lossStreak-1,4)*500;money=Math.min(16000,money+lb)}
updHud();showWinBanner(online?(win?myTeam==='t':myTeam==='ct'):win);
if(online&&window.Netplay&&Netplay.role==='host'){
  const done=wins>4||loses>4||wins+loses>=8;
  Netplay.send({t:'round',phase:done?'end':'next',wins,loses,round,youWin:!win});
}
if(wins>4||loses>4||wins+loses>=8){state='menu';hadLock=false;try{document.exitPointerLock()}catch(e){}
const iWon=online?(myTeam==='t'?wins>loses:loses>wins):(wins>loses),bonus=iWon&&earnsCoins()?COIN.match:0;addCoins(bonus);
showOv(iWon?'VICTORY':(wins===loses?'DRAW':'DEFEAT'),(online?'Online 1v1 · ':'')+'Terrorists <b style="color:#ff9a2e">'+wins+'</b> – <b style="color:#6aa8ff">'+loses+'</b> Counter-Terrorists'+(bonus?'<br><b style="color:#ffd257">+'+bonus+' coins</b> for winning the match':'')+'<br><br><b>Click to play again</b>');return}
if(win){roundTimer=3;feed('Round won! +$3250'+(earnsCoins()?' · +'+COIN.round+' coins':'')+' — next round soon')}
else if(online){roundTimer=3;feed('Round lost — next round soon')}
else{state='dead';hadLock=false;try{document.exitPointerLock()}catch(e){}showOv('ROUND LOST','Loss bonus <b>+$'+lb+'</b> (a win pays $3250)<br>Score '+wins+' – '+loses+'<br><br><b>Click for next round</b>')}}
function updBar(){
  if(party){const me=window.Netplay&&Netplay.myId;
    const icons=team=>PT.players.filter(p=>p.team===team).map(p=>{const b=PT.remotes.get(p.id),alive=p.id===me?(P.hp>0&&!P.dead):!!(b&&b.alive);return '<i class="'+(team==='t'?'t':'c')+(alive?'':' d')+(p.id===me?' me':'')+'"></i>'}).join('');
    $('bar').innerHTML='<span class=sc style=color:#ff9a2e>'+wins+'</span>'+icons('t')+'<span class=rd>LOBBY · R'+round+'</span>'+icons('ct')+'<span class=sc style=color:#6aa8ff>'+loses+'</span>';return}
  if(online){
    const meAlive=P.hp>0&&!P.dead?1:0,themAlive=netBot&&netBot.alive?1:0;
    const tScore=myTeam==='t'?wins:loses,cScore=myTeam==='t'?loses:wins;
    const tLive=myTeam==='t'?meAlive:themAlive,cLive=myTeam==='ct'?meAlive:themAlive;
    $('bar').innerHTML='<span class=sc style=color:#ff9a2e>'+tScore+'</span><i class="t'+(tLive?'':' d')+(myTeam==='t'?' me':'')+'"></i><span class=rd>ONLINE · R'+round+'</span><i class="c'+(cLive?'':' d')+(myTeam==='ct'?' me':'')+'"></i><span class=sc style=color:#6aa8ff>'+cScore+'</span>';
    return}
  const t=[P.hp>0&&!P.dead?1:0,...bots.filter(b=>b.team==='t').map(b=>b.alive?1:0)],c=bots.filter(b=>b.team==='ct').map(b=>b.alive?1:0);
const ic=(a,cl,me)=>a.map((v,i)=>'<i class="'+cl+(v?'':' d')+(me&&i===0?' me':'')+'"></i>').join('');
$('bar').innerHTML='<span class=sc style=color:#ff9a2e>'+wins+'</span>'+ic(t,'t',1)+'<span class=rd>ROUND '+round+'/8</span>'+ic(c,'c',0)+'<span class=sc style=color:#6aa8ff>'+loses+'</span>'}
let feedT=0;function feed(t){$('feed').textContent=t;feedT=3}
function updHud(){updBar();$('hp').textContent='♥ '+Math.max(0,Math.ceil(P.hp))+(armor>0?'  ⛨ '+Math.ceil(armor):'');$('money').textContent='$'+money;
$('ammo').innerHTML='<small>'+W[cur].n+'</small><br>'+(W[cur].melee?'—':W[cur].nade?'x'+nades[cur]:(reloading>0?'Reloading…':ammo)+' <small>/ '+reserve+'</small>');
$('info').textContent=(online?'Online 1v1':party?'Lobby · Enemies '+bots.filter(b=>b.alive&&b.enemy).length:'Enemies '+bots.filter(b=>b.alive&&b.team==='ct').length)+' · Kills '+kills+(freezeT>0?' · FREEZE '+Math.ceil(freezeT)+'s':(buyT>0?' · BUY '+Math.ceil(buyT)+'s (B)':''))}

const fx=[],parts=[],decals=[];
const stM=new THREE.MeshBasicMaterial({color:0x5a0707,transparent:true,opacity:.9,polygonOffset:true,polygonOffsetFactor:-2,depthWrite:false}),stG=new THREE.CircleGeometry(1,10),stains=[];
function stain(x,z,s,y){const m=new THREE.Mesh(stG,stM);m.rotation.x=-Math.PI/2;m.rotation.z=Math.random()*6.28;m.scale.set(s*(.6+Math.random()*.8),s*(.6+Math.random()*.8),1);m.position.set(x,(y||0)+.015+Math.random()*.004,z);scene.add(m);stains.push(m);if(stains.length>400)scene.remove(stains.shift())}
function tracer(a,b){const m=new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),new THREE.LineBasicMaterial({color:0xffe9a0,transparent:true,opacity:.7}));m.userData.t=.06;scene.add(m);fx.push(m)}
function decal(h){const n=h.face.normal.clone().transformDirection(h.object.matrixWorld);const m=new THREE.Mesh(new THREE.CircleGeometry(.045,8),new THREE.MeshBasicMaterial({color:0x151515,transparent:true,opacity:.85,polygonOffset:true,polygonOffsetFactor:-4}));m.position.copy(h.point).addScaledVector(n,.01);m.lookAt(h.point.clone().add(n));scene.add(m);decals.push(m);if(decals.length>80)scene.remove(decals.shift())}
function burst(p,n,col,sp){const bl=col===0x7a0c0c,fy=world?groundAt(p.x,p.z,p.y):0;for(let i=0;i<n;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.04,.04,.04),new THREE.MeshBasicMaterial({color:col}));m.position.copy(p);m.userData.v=new THREE.Vector3((Math.random()-.5)*sp,Math.random()*sp*.8,(Math.random()-.5)*sp);m.userData.t=bl?1.2:.5;m.userData.blood=bl;m.userData.fy=fy;scene.add(m);parts.push(m)}}
const shG=new THREE.BoxGeometry(.009,.009,.024),shM=new THREE.MeshBasicMaterial({color:0xd4a537});
function ejectShell(){const q=camera.getWorldQuaternion(new THREE.Quaternion()),m=new THREE.Mesh(shG,shM);
m.position.copy(new THREE.Vector3(.14,-.1,-.45).applyMatrix4(camera.matrixWorld));m.quaternion.copy(q);
m.userData.v=new THREE.Vector3(1.6+Math.random()*.8,1.2+Math.random()*.6,.3).applyQuaternion(q);m.userData.t=.6;m.userData.fy=world?groundAt(m.position.x,m.position.z,m.position.y):0;scene.add(m);parts.push(m)}
// Audio
let ac,rv=null;function snd(vol,dur,freq){if(!ac)return;const n=ac.sampleRate*dur,buf=ac.createBuffer(1,n,ac.sampleRate),d=buf.getChannelData(0);
for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);
const s=ac.createBufferSource();s.buffer=buf;const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=freq;
const g=ac.createGain();g.gain.value=vol;s.connect(f);f.connect(g);if(!rv){rv=ac.createConvolver();const L=ac.sampleRate*1.2|0,bf=ac.createBuffer(2,L,ac.sampleRate);for(let c=0;c<2;c++){const dd=bf.getChannelData(c);for(let i=0;i<L;i++)dd[i]=(Math.random()*2-1)*Math.pow(1-i/L,2.5)}rv.buffer=bf;const rg=ac.createGain();rg.gain.value=.3;rv.connect(rg);rg.connect(ac.destination)}
g.connect(ac.destination);if(dur>.08){const g2=ac.createGain();g2.gain.value=vol*.6;f.connect(g2);g2.connect(rv)}s.start();
if(dur>.08&&vol>.15){const o=ac.createOscillator(),og=ac.createGain(),t0=ac.currentTime;o.frequency.setValueAtTime(140,t0);o.frequency.exponentialRampToValueAtTime(40,t0+.15);og.gain.setValueAtTime(vol*.8,t0);og.gain.exponentialRampToValueAtTime(.001,t0+.18);o.connect(og);og.connect(ac.destination);o.start();o.stop(t0+.2)}}

// Input
const cv=renderer.domElement;let lockAt=0;
$('ov').addEventListener('click',e=>{
if(e.target.closest&&(e.target.closest('#cfg')||e.target.closest('#ldm')||e.target.closest('#ov-back')||e.target.closest('#ov-quit')||e.target.closest('#ov-resume')||e.target.closest('button')))return;
if(escMenu){closeEscMenu();return}
if(state==='menu'&&!assetsReady()){setLoadMsg('Still loading models — please wait…');return}
$('set').style.display='none';$('mdl').style.display='none';rebind=null;
const prev=state;$('ov').style.display='none';$('mm').style.display='none';document.body.classList.add('play');
try{ac=ac||new (window.AudioContext||window.webkitAudioContext)()}catch(err){}
try{const p=cv.requestPointerLock&&cv.requestPointerLock();if(p&&p.catch)p.catch(()=>{})}catch(err){}
try{if(prev==='menu'){if(PT.backToLobby)ptBackToLobby();else if(online||PT.exit){PT.exit=false;showMainMenu()}else resetGame()}else if(prev==='dead')afterLoss();else state='play'}catch(err){console.error(err);state='play';feed('Failed to start — try again')}
});
$('relock').addEventListener('click',e=>{e.stopPropagation();menuGrace=performance.now()+250;try{const p=cv.requestPointerLock&&cv.requestPointerLock();if(p&&p.catch)p.catch(()=>{})}catch(err){}});
document.addEventListener('pointerlockchange',()=>{
if(document.pointerLockElement===cv){hadLock=true;lockAt=performance.now()}
else if(hadLock&&performance.now()-lockAt>400&&state==='play'&&!escMenu&&!buyOpen&&$('set').style.display!=='block'&&$('mdl').style.display!=='block'&&performance.now()>=menuGrace)showEscMenu();
});
function showEscMenu(){
  // Match keeps running (unpausable) — ESC only opens leave/resume UI
  if(state!=='play'||escMenu)return;
  escMenu=true;mouseDown=false;semiLock=false;
  document.body.classList.remove('play');
  $('mm').style.display='none';
  if($('lobby'))$('lobby').style.display='none';
  const quitLabel=online?'Quit Match (opponent wins)':'Quit Match';
  $('ov').innerHTML='<h1>LEAVE MATCH?</h1><p style="font-size:20px">Game is still running — resume or quit</p>'
    +'<div style="margin-top:22px;display:flex;flex-direction:column;gap:10px;align-items:center">'
    +'<button id="ov-resume" type="button" style="min-width:240px;padding:12px 20px;font-size:16px;font-weight:800;letter-spacing:1px;border-radius:6px;border:1px solid #ffb02e;background:#ffb02e;color:#111;cursor:pointer;pointer-events:auto">Resume</button>'
    +'<button id="ov-quit" type="button" style="min-width:240px;padding:12px 20px;font-size:16px;font-weight:800;letter-spacing:1px;border-radius:6px;border:1px solid #555;background:#2a2e36;color:#f2f2f2;cursor:pointer;pointer-events:auto">'+quitLabel+'</button>'
    +'</div>';
  $('ov').style.display='flex';
  const resume=$('ov-resume');if(resume)resume.onclick=e=>{e.stopPropagation();closeEscMenu()};
  const quit=$('ov-quit');if(quit)quit.onclick=e=>{e.stopPropagation();quitMatch()};
}
// fromEsc: Chrome treats the Esc that closed the menu as "unlock", so re-locking from it grabs and drops the
// mouse straight away. Leave it to the click-to-resume prompt instead.
function closeEscMenu(fromEsc){
  if(!escMenu)return;
  escMenu=false;$('ov').style.display='none';
  if(state==='play'&&!fromEsc){document.body.classList.add('play');try{const p=cv.requestPointerLock&&cv.requestPointerLock();if(p&&p.catch)p.catch(()=>{})}catch(err){}}
}
function showOv(h,p,paused){document.body.classList.remove('play');$('mm').style.display='none';escMenu=false;
if(paused){showEscMenu();return}
const quitBtn=state==='menu'?'<button id="ov-back" type="button">← Main Menu</button>':'';
$('ov').innerHTML='<h1>'+h+'</h1><p style="font-size:20px">'+p+'</p><p id="loadst" style="margin-top:12px;opacity:.85"></p><p id="playhint" style="margin-top:10px;font-size:20px"></p>'+quitBtn;$('ov').style.display='flex';
const back=$('ov-back');if(back)back.onclick=e=>{e.stopPropagation();showMainMenu()};
refreshLoadUi()}
addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;if(state!=='play')return;
if(document.pointerLockElement===cv&&EW.open){wheelMove(e.movementX,e.movementY);return}
if(document.pointerLockElement===cv){const ss=.0022*sens*(scoped?.3:1);P.yaw-=e.movementX*ss;P.pitch=Math.max(-1.5,Math.min(1.5,P.pitch-e.movementY*ss))}});
addEventListener('mousedown',e=>down('Mouse'+e.button));addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mouseup',e=>up('Mouse'+e.button));
addEventListener('keydown',e=>{if(rebind||(state==='play'&&(e.ctrlKey||e.code==='Space'||e.code==='Tab'||e.code.startsWith('Arrow'))))e.preventDefault();if(!e.repeat)down(e.code)});
addEventListener('keyup',e=>up(e.code));
function reload(){const w=W[cur];if(reloading>0||ammo>=w.mag||reserve<=0)return;reloading=w.rl;scoped=false;snd(.25,.06,900)}

// Shooting
const tmp=new THREE.Vector3();
function applyOnlineHit(hd,dmg,hitPt){
  if(!netBot||!netBot.alive||!window.Netplay||!Netplay.connected)return false;
  Netplay.send({t:'hit',dmg:dmg,head:!!hd,rd:round});
  netBot.hp-=dmg;
  const hx=netBot.x,hz=netBot.z;
  burst(hitPt,16,0x7a0c0c,4);stain(hx+(Math.random()-.5),hz+(Math.random()-.5),.12);snd(hd?.35:.2,.05,hd?5000:900);
  $('hit').style.opacity=1;setTimeout(()=>$('hit').style.opacity=0,80);
  feed(hd?'★ Hit head':('Hit −'+Math.round(dmg)));
  return true;
}
function onlineHitscan(shotDir,maxD,dmgB,dmgH){maxD=maxD||120;dmgB=dmgB||W[cur].dmg;dmgH=dmgH||dmgB*4;
  if(!online||!netBot||!netBot.alive||!window.Netplay||!Netplay.connected)return false;
  // Prefer real hit meshes (host/guest avatars) so shots don't "pass through"
  if(netBot.body)netBot.body.updateMatrixWorld(true);
  if(netBot.head)netBot.head.updateMatrixWorld(true);
  if(netBot.g)netBot.g.updateMatrixWorld(true);
  ray.set(camera.position,shotDir);ray.far=maxD;
  const targets=[];
  if(netBot.body)targets.push(netBot.body);
  if(netBot.head)targets.push(netBot.head);
  if(netBot.g&&netBot.g.userData&&netBot.g.userData.limbs)targets.push(...netBot.g.userData.limbs);
  const meshHits=targets.length?ray.intersectObjects(targets,false):[];
  if(meshHits.length){
    const wallHits=ray.intersectObjects(boxMeshes,false);
    if(!wallHits.length||wallHits[0].distance>=meshHits[0].distance-0.05){
      const o=meshHits[0].object,hd=!!o.userData.head,dmg=hd?dmgH:dmgB;
      return applyOnlineHit(hd,dmg,meshHits[0].point.clone());
    }
    return false;
  }
  // Capsule fallback when mesh volumes miss (lag / bind pose)
  const eye=camera.position;
  const hx=netBot.x,hz=netBot.z;
  const hy=(netBot.g&&netBot.g.position?netBot.g.position.y:0)+(netBot.crouch?0.85:1.25);
  const ox=hx-eye.x,oy=hy-eye.y,oz=hz-eye.z;
  const dist=Math.hypot(ox,oy,oz);if(dist<0.35||dist>maxD)return false;
  const t=Math.max(0,ox*shotDir.x+oy*shotDir.y+oz*shotDir.z);
  const cx=eye.x+shotDir.x*t,cy=eye.y+shotDir.y*t,cz=eye.z+shotDir.z*t;
  const miss=Math.hypot(cx-hx,cy-hy,cz-hz);
  const rad=netBot.crouch?1.35:1.2;
  if(miss>rad)return false;
  const wallHits=ray.intersectObjects(boxMeshes,false);
  if(wallHits.length&&wallHits[0].distance<t-0.2)return false;
  const hd=miss<0.5&&(hy-eye.y)>0.15;
  return applyOnlineHit(hd,hd?dmgH:dmgB,new THREE.Vector3(cx,cy,cz));
}
function shoot(){
if(W[cur].melee){slash();return}if(W[cur].nade){throwNade();return}ammo--;fireCd=W[cur].rate;kick=1;vkick=Math.min(vkick+(W[cur].vk||.5),2.2);flash.visible=true;flash.rotation.z=Math.random()*6.28;mlight.intensity=2.5;setTimeout(()=>{flash.visible=false;mlight.intensity=0},45);snd(.6,.22,3000);
const sp=(()=>{const w=W[cur];let b=w.base;if(w.scope&&!scoped)b=.06;const mv=P.speed>.9?1:(P.speed>0?.1:0);return (b+w.mv*mv+(P.gnd?0:.05))*(crouch?.45:1)+Math.min(recoil,w.sc||8)*w.rs*(crouch?.7:1)})();
const shotDir=tmp.set((Math.random()-.5)*2*sp,(Math.random()-.5)*2*sp,-1).normalize().applyQuaternion(camera.quaternion).clone();
ray.set(camera.position,shotDir);ray.far=100;
const end=ray.ray.at(60,new THREE.Vector3());
tracer(flash.getWorldPosition(new THREE.Vector3()),end);ejectShell();
if(online){onlineHitscan(shotDir)}
else{
const hs=ray.intersectObjects(boxMeshes.concat(botMeshes),false);
let hitBot=null,hitPt=null,hitHead=false;
for(let i=0;i<hs.length;i++){
  const o=hs[i].object;
  if(o.userData.bot&&o.userData.bot.alive){hitBot=o.userData.bot;hitPt=hs[i].point;hitHead=!!o.userData.head;break}
  if(!o.userData.bot){decal(hs[i]);burst(hs[i].point,5,0xc9b88a,2);break}
}
if(hitBot&&party&&hitBot.net){ptHit(hitBot,hitHead,hitHead?W[cur].dmg*4:W[cur].dmg,hitPt)}
else if(hitBot){const b=hitBot,hd=hitHead,dmg=hd?W[cur].dmg*4:W[cur].dmg;
b.hp-=dmg;b.seen=1;burst(hitPt,16,0x7a0c0c,4);stain(b.x+(Math.random()-.5),b.z+(Math.random()-.5),.1+Math.random()*.15,b.y||0);b.stun=.3;snd(hd?.3:.2,.04,hd?5000:900);
$('hit').style.opacity=1;$('hit').style.borderColor='';setTimeout(()=>$('hit').style.opacity=0,80);
if(b.hp<=0)killBot(b,hd)}
}
const k=Math.floor(recoil);const PAT=[0,0,.2,.3,.1,-.1,-.3,-.5,-.4,-.2,.3,.6,.7,.5,.2,-.3,-.6,-.7,-.4,.1,.5,.6,.3,0,-.3,-.5,-.3,0,.2,.3];
recoil=Math.min(recoil+1,29);P.pitch+=(k<12?.009:.0015)*W[cur].kick;P.yaw+=(PAT[k]||0)*.006*W[cur].kick+(Math.random()-.5)*.0015;
if(W[cur].scope)scoped=false;if(ammo<=0)reload();updHud()}
function killBot(b,hd,ai){b.alive=false;b.diedAt=performance.now();
if(!party){const wid=b.team==='t'?'ak':'m4',a=Math.random()*Math.PI*2;spawnDrop(wid,W[wid].mag,W[wid].res,b.x,(b.y||0)+1,b.z,Math.cos(a)*1.5,1.5,Math.sin(a)*1.5)}if(!ai){kills++;addCoins(COIN.kill);if(b.team==='ct'||(party&&b.enemy)){roundKills++;flashRoundKills()}money=Math.min(16000,money+W[cur].kill)}
[b.body,b.head,...b.g.userData.limbs].forEach(m=>{let i=botMeshes.indexOf(m);if(i>=0)botMeshes.splice(i,1);i=allyMeshes.indexOf(m);if(i>=0)allyMeshes.splice(i,1)});
for(let i=0;i<8;i++)stain(b.x+(Math.random()-.5)*1.2,b.z+(Math.random()-.5)*1.2,.12+Math.random()*.25);stain(b.x,b.z,.55);
if(!party)feed(ai?(b.team==='ct'?'A teammate got a kill':'A teammate was killed'):(hd?'★ Headshot! ':'')+'Enemy down'+(earnsCoins()?' · +'+COIN.kill+' coins':''));updHud()}
function hideViewWeapon(){
  gun.visible=false;scoped=false;$('scope').style.display='none';
  if(viewGlove)viewGlove.visible=false;
  if(viewHandPlate)viewHandPlate.visible=false;
  if(typeof viewHandsRoot!=='undefined'&&viewHandsRoot)viewHandsRoot.visible=false;
}
function playerDown(){P.hp=0;P.dead=true;P.diedAt=performance.now();mouseDown=false;scoped=false;hideViewWeapon();
// As in CS, dying drops your loadout: next round starts with the default pistol only
armor=0;nades={he:0,flash:0,smoke:0};inv={glock:{ammo:20,reserve:120}};setWeapon('glock');
feed(online?'You died':'You died — spectating teammates');
if(online&&window.Netplay){Netplay.send({t:'killed',rd:round});checkOnlineRound()}
if(party){ptSend({t:'pkill',by:PT.lastHit?PT.lastHit.by:null,head:!!(PT.lastHit&&PT.lastHit.head),rd:round});PT.lastHit=null;checkPartyRound()}}
// Host decides rounds. Called on every death (not only from the render loop, which browsers pause in hidden tabs).
function checkOnlineRound(){
  if(!online||state!=='play'||roundTimer>0||!window.Netplay||Netplay.role!=='host'||!netBot)return;
  const me=!P.dead&&P.hp>0,them=netBot.alive;
  if(me&&!them)endRound(true);else if(!me&&them)endRound(false);
  // Trade: whoever died last outlived the other
  else if(!me&&!them)endRound((P.diedAt||0)>(netBot.diedAt||0));
}
// Keep the between-rounds countdown going while the tab is hidden (requestAnimationFrame stops there)
{let bgT=performance.now();setInterval(()=>{const now=performance.now(),dt=Math.min(2,(now-bgT)/1000);bgT=now;
  if(!document.hidden||(!online&&!party)||state!=='play'||roundTimer<=0)return;
  roundTimer-=dt;if(roundTimer<=0){round++;startRound()}},250)}

// Bots (both teams)
const tv=new THREE.Vector3();
function syncNetplay(dt){
  if(!online||!window.Netplay||!Netplay.connected)return;
  netSendT-=dt;
  if(netSendT<=0){netSendT=.05;Netplay.send({t:'state',sk:eqSkin(cur),rd:round,x:P.x,z:P.z,y:P.y,yaw:EM.on?EM.yaw:P.yaw,pitch:EM.on?EM.pitch:P.pitch,em:EM.on?EM.id+':'+EM.seq:'',hp:P.hp,alive:!P.dead,crouch:!!crouch,w:cur,speed:P.speed||0})}
  const r=Netplay.remote;if(!r||!netBot||!netBot.g)return;
  // Last round's "dead" state would otherwise instantly kill the freshly spawned opponent
  if(r.rd!=null&&r.rd!==round)return;
  // Keep kill state in sync from peer HP/alive (covers missed {t:'killed'} packets)
  if(r.alive===false||(r.hp!=null&&r.hp<=0)){if(netBot.alive)killBot(netBot,false,false);return}
  if(!netBot.alive)return;
  netBot.x=r.x;netBot.z=r.z;netBot.y=r.y||0;netBot.hp=r.hp!=null?r.hp:netBot.hp;
  netBot.crouch=!!r.crouch;
  netBot.g.position.set(r.x,r.y||0,r.z);
  netBot.g.rotation.y=r.yaw||0;
  const u=netBot.g.userData,rig=u&&u.rig;
  // Hit volumes live inside the rig, so scaling it moves them down with the model
  if(rig)rig.scale.y=r.crouch?.7:1;
  // Keep hit volumes aligned with the visible avatar
  if(netBot.body)netBot.body.updateMatrixWorld(true);
  if(netBot.head)netBot.head.updateMatrixWorld(true);
  if(u&&u.gun){u.gun.visible=true;u.gun.traverse(o=>{if(o.isMesh)o.visible=true});applyRemoteSkin(netBot,r)}
  const moving=(r.speed||0)>.15;animBot(netBot,moving?Math.sin(performance.now()/170)*.55:0,dt);remoteEmote(netBot,r.em,dt);
  if(u&&u.fl)u.fl.visible=false;
}
// Path-following for bots on loaded maps; pathfinding is spread out so a frame runs at most one search
let pathBudget=0;
function botWaypoint(b,gx,gy,gz,dt){b.rp=(b.rp||0)-dt;
const stale=!b.path||b.pi>=b.path.length||Math.hypot(gx-b.pgx,gz-b.pgz)>4;
if(stale&&b.rp<=0&&pathBudget>0){pathBudget--;b.path=world.findPath(b.x,b.y||0,b.z,gx,gy,gz);b.pi=1;b.pgx=gx;b.pgz=gz;b.rp=1+Math.random()*.8}
const p=b.path;if(!p)return null;
while(b.pi<p.length&&Math.hypot(p[b.pi][0]-b.x,p[b.pi][2]-b.z)<.5)b.pi++;
return b.pi<p.length?p[b.pi]:null}
function updBots(dt){pathBudget=1;
for(const b of bots){
if(!b.alive){b.fall=Math.min(1,(b.fall||0)+dt*2.2);b.g.rotation.x=b.fall*1.5;continue}
if(b.net)continue;
if(freezeT>0){animBot(b,0,dt);continue}
const ct=b.team==='ct',by=b.y||0;bp.set(b.x,by+1.5,b.z);
// Who can this bot see? Map raycasts are costly, so each bot rescans 5x a second and keeps its target between scans
const keepTg=b.tg&&(b.tg===P?!P.dead&&ct:b.tg.alive)?b.tg:null;
let tg=keepTg,td=tg?Math.hypot(tg.x-b.x,tg.z-b.z):1e9;
b.scan=(b.scan==null?Math.random()*.2:b.scan)-dt;
if(b.scan<=0||!world){b.scan=.2;tg=null;td=1e9;
if(ct&&!P.dead){const d=Math.hypot(P.x-b.x,P.z-b.z);if(d<45){pp.set(P.x,P.y+P.h-.1,P.z);if(los(bp,pp)){tg=P;td=d}}}
for(const a of bots){if(!a.alive||a.team===b.team)continue;const d=Math.hypot(a.x-b.x,a.z-b.z);if(d<td&&d<45&&los(bp,tv.set(a.x,(a.y||0)+1.4,a.z))){tg=a;td=d}}
b.tg=tg}
let gx=0,gz=0,gy=0,gd=1e9;
if(tg){gx=tg.x;gz=tg.z;gy=tg.y||0;gd=td}else{if(ct&&!P.dead){gx=P.x;gz=P.z;gy=P.y;gd=Math.hypot(P.x-b.x,P.z-b.z)}
for(const a of bots){if(!a.alive||a.team===b.team)continue;const d=Math.hypot(a.x-b.x,a.z-b.z);if(d<gd){gd=d;gx=a.x;gz=a.z;gy=a.y||0}}}
if(gd>1e8)continue;
const dx=gx-b.x,dz=gz-b.z,dist=Math.max(.01,Math.hypot(dx,dz)),nx=dx/dist,nz=dz/dist;b.g.rotation.y=Math.atan2(dx,dz)+Math.PI;
let mx=0,mz=0;
b.st-=dt;if(b.st<=0){b.sd*=-1;b.st=.8+Math.random()*1.8}
b.ck=(b.ck||0)-dt;if(b.ck<=0){b.ck=.6;if(Math.hypot(b.x-(b.lx||1e3),b.z-(b.lz||1e3))<.5){b.sd*=-1;b.stk=1.2;b.path=null;b.rp=0}b.lx=b.x;b.lz=b.z}
if(b.stk>0)b.stk-=dt;
if(tg){if(dist>14){mx=nx;mz=nz}else if(dist<7){mx=-nx*.6;mz=-nz*.6}
mx+=-nz*b.sd*.8;mz+=nx*b.sd*.8;
b.seen+=dt;b.cd-=dt;
if(b.seen>.5&&b.cd<=0&&!(b.blind>0)){b.cd=.5+Math.random()*.9;b.fu=performance.now()+70;
const lv=.85+round*.07,vol=Math.max(.03,.4-Math.hypot(P.x-b.x,P.z-b.z)*.012);
if(tg===P){const ch=Math.max(.1,.45-dist*.011)*(crouch?.65:1)*lv;snd(vol,.14,1800);tracer(bp.clone(),new THREE.Vector3(P.x+(Math.random()-.5)*1.5,P.y+1.3+Math.random()*.4,P.z+(Math.random()-.5)*1.5));
if(Math.random()<ch){let d=9+Math.random()*5;if(armor>0){armor=Math.max(0,armor-d*.5);d*=.5}P.hp-=d;$('dmg').style.boxShadow='inset 0 0 160px 40px rgba(220,0,0,.55)';
setTimeout(()=>$('dmg').style.boxShadow='inset 0 0 160px 40px rgba(220,0,0,0)',200);if(P.hp<=0)playerDown();updHud()}}
else{const ch=Math.max(.12,.4-dist*.01)*(ct?lv:1);snd(vol*.7,.12,1800);tracer(bp.clone(),new THREE.Vector3(tg.x+(Math.random()-.5)*1.2,(tg.y||0)+1.2+Math.random()*.5,tg.z+(Math.random()-.5)*1.2));
if(Math.random()<ch){tg.hp-=ct?14:24;tg.stun=.2;burst(tv.set(tg.x,(tg.y||0)+1.3,tg.z),8,0x7a0c0c,3);if(tg.hp<=0)killBot(tg,false,true)}}}}
else{b.seen=0;mx=nx;mz=nz;
if(world){const wp=botWaypoint(b,gx,gy,gz,dt);if(wp){mx=wp[0]-b.x;mz=wp[2]-b.z;const q=Math.hypot(mx,mz)||1;mx/=q;mz/=q;b.g.rotation.y=Math.atan2(mx,mz)+Math.PI}}}
if(b.stk>0){mx=-nz*b.sd;mz=nx*b.sd}
const l=Math.hypot(mx,mz)||1;if(b.stun>0)b.stun-=dt;if(b.blind>0)b.blind-=dt;const sm=b.stun>0?.25:1;b.g.rotation.x=b.stun>0?.15:0;move(b,mx/l*2.8*sm*dt,mz/l*2.8*sm*dt,.45);
if(world){const gr=world.ground(b.x,b.z,by+world.STEP);if(gr>by-world.STEP){b.y=gr;b.vy=0}else{b.vy=(b.vy||0)-20*dt;b.y=Math.max(gr,by+b.vy*dt);if(b.y<=gr)b.vy=0}
if(b.y<world.yMin-10)placeBot(b,takeSpot(b.team)||[b.x,0,b.z])}
b.g.position.set(b.x,b.y||0,b.z);
const moving=!!(mx||mz),w=moving?Math.sin(performance.now()/170+b.sd*3)*.6:0;animBot(b,w,dt)}}

// Loop
const clock=new THREE.Clock();
function los(from,to){const d=tmp.copy(to).sub(from);const L=d.length();d.normalize();ray.set(from,d);ray.far=L;return ray.intersectObjects(boxMeshes.concat(smokeMeshes),false).length===0}
const bp=new THREE.Vector3(),pp=new THREE.Vector3();
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05);if(EM.on&&(state!=='play'||P.dead))stopEmote();if(EW.open&&(state!=='play'||P.dead||menuOpen()))closeWheel(false);document.body.classList.toggle('play',state==='play'&&!escMenu&&!buyOpen&&document.pointerLockElement===renderer.domElement&&$('set').style.display!=='block');
// Browsers refuse to re-lock right after Esc or without a click, so a menu can close with the mouse free: ask for a click
{const need=state==='play'&&!menuOpen()&&document.pointerLockElement!==cv;const rl=$('relock');if(rl&&(rl.style.display==='flex')!==need)rl.style.display=need?'flex':'none';if(need){mouseDown=false;semiLock=false}}
if(state==='play'){
// Local input blocked while ESC menu is open — match timers/bots/net keep running
if(!escMenu){
if(keys.ArrowLeft)P.yaw+=2*dt;if(keys.ArrowRight)P.yaw-=2*dt;
if(keys.ArrowUp)P.pitch=Math.min(1.5,P.pitch+1.5*dt);if(keys.ArrowDown)P.pitch=Math.max(-1.5,P.pitch-1.5*dt);
}
let fx=escMenu?0:((keys[K.right]?1:0)-(keys[K.left]?1:0)),fz=escMenu?0:((keys[K.back]?1:0)-(keys[K.fwd]?1:0));
if(P.dead||freezeT>0||EM.on){fx=0;fz=0}
crouch=!escMenu&&!!(keys[K.duck]||(K.duck==='ControlLeft'&&(keys.ControlRight||keys.KeyC)));const walk=!escMenu&&!!(keys[K.walk]||(K.walk==='ShiftLeft'&&keys.ShiftRight));
// Walking into a ladder while facing it grabs it; leaving its zone (or jumping) lets go
const lad=!P.dead&&ladCd<=0?ladderAt(P.x,P.y,P.z,ldir,P.lad,P.yaw):null;
if(!lad)P.lad=null;else if(P.lad)P.lad=lad;else if(fz<0&&-Math.sin(P.yaw)*ldir.x-Math.cos(P.yaw)*ldir.z>.35){P.lad=lad;P.ldx=ldir.x;P.ldz=ldir.z}
// Facing away from the rungs on a ladder means stepping off it (onto a deck behind, or back to the floor), not climbing
const lface=P.lad?-Math.sin(P.yaw)*P.ldx-Math.cos(P.yaw)*P.ldz:1;
const sp=(crouch?1.7:(walk?2.6:5.2))*W[cur].spd*(P.lad&&lface>=0?.4:1);
if(fx||fz){const l=Math.hypot(fx,fz);fx/=l;fz/=l;
const c=Math.cos(P.yaw),s=Math.sin(P.yaw),ox=P.x,oz=P.z,mdx=(fx*c+fz*s)*sp*dt,mdz=(-fx*s+fz*c)*sp*dt;
// On a ladder the climb code keeps the player in place; map collision would trap them behind braces at its foot
if(P.lad&&world){P.x+=mdx;P.z+=mdz;if(world.ground(P.x,P.z,P.y+world.STEP)<-1e8){P.x=ox;P.z=oz}}else move(P,mdx,mdz,.4);
if(!P.lad&&Math.hypot(P.x-ox,P.z-oz)<sp*dt*.05){stuckT+=dt;if(stuckT>.75){stuckT=0;unstick(P)}}else stuckT=0;P.speed=crouch?.35:(walk?.5:1);if(!walk&&!crouch){stepT-=dt;if(stepT<=0){stepT=.36;snd(.12,.05,500)}}}else P.speed=0;
recoil=Math.max(0,recoil-dt*(mouseDown?3:9));
fireCd-=dt;kick=Math.max(0,kick-dt*10);vkick*=Math.exp(-dt*9);
if(reloading>0){reloading-=dt;if(reloading<=0){const n=Math.min(W[cur].mag-ammo,reserve);ammo+=n;reserve-=n;reloading=0;updHud()}}
if(!escMenu&&mouseDown&&!buyOpen&&!menuOpen()&&document.pointerLockElement===cv&&!P.dead&&fireCd<=0&&reloading<=0&&ammo>0&&freezeT<=0&&performance.now()>=menuGrace&&(W[cur].auto||!semiLock)){shoot();if(!W[cur].auto)semiLock=true}
if(!escMenu&&keys[K.jump]&&P.lad&&!P.dead){P.lad=null;ladCd=.4;P.vy=3.5;P.gnd=false;move(P,-P.ldx*.35,-P.ldz*.35,.4)}
else if(!escMenu&&keys[K.jump]&&P.gnd&&!P.dead&&freezeT<=0){P.vy=7.4;P.gnd=false}
ladCd-=dt;
// W climbs toward where you look (look down to descend), S the opposite
if(world&&P.lad){const v=lface<0?0:(fz<0?1:fz>0?-1:0)*(P.pitch<-.5?-1:1)*3.4,was=P.y,L=P.lad;P.vy=0;
// climb on past the top rung up to a ledge/roof just beyond the ladder so you can step off onto it
const fa=world.ground(L[2]?L[0]+P.ldx*.45:P.x,L[2]?P.z:L[1]+P.ldz*.45,L[5]+1.3),top=fa>L[5]-1.5?Math.max(L[5],fa):L[5];
P.y=Math.min(P.y+v*dt,Math.max(was,top+.05));
// Off the ground the player is fixed to the ladder face, so braces, rails and deck edges can't shove them out of reach;
// standing at the bottom they're only kept from walking through the rungs, so they can still step away
if(P.y<top-.1){const off=-.4,hw=L[3]/2,stick=lface>=0&&(v>0||!P.gnd);if(L[2]){if(stick||(P.x-L[0])*P.ldx>off)P.x=L[0]+off*P.ldx;P.z=Math.max(L[1]-hw,Math.min(L[1]+hw,P.z))}
else{if(stick||(P.z-L[1])*P.ldz>off)P.z=L[1]+off*P.ldz;P.x=Math.max(L[0]-hw,Math.min(L[0]+hw,P.x))}}
// scaffold ladders end beside a deck rather than under a ledge: let go at the top and drop onto it
else if(v>0&&top===L[5]&&world.ground(P.x,P.z,P.y)>P.y-1.6){P.lad=null;ladCd=.5}
const gr=world.ground(P.x,P.z,Math.max(was,P.y)+.05);if(P.y<=gr){P.y=gr;P.gnd=true}else P.gnd=false;
if(v&&!P.gnd){stepT-=dt;if(stepT<=0){stepT=.3;snd(.1,.05,320)}}}
else{P.vy-=20*dt;
if(world){const was=P.y;P.y+=P.vy*dt;
if(P.vy>0){const c=world.ceiling(P.x,P.z,was+P.h);if(P.y+P.h+.08>c){P.y=Math.max(was,c-P.h-.08);P.vy=0}}
// Walls only block above STEP, so airborne players must also land on tops within STEP or they slip inside boxes
const gr=world.ground(P.x,P.z,Math.max(was,P.y)+world.STEP);
// grounded players follow stairs and slopes down instead of hopping off each step
if(P.y<=gr||(P.gnd&&P.vy<=0&&gr>was-world.STEP)){P.y=gr;P.vy=0;P.gnd=true}else P.gnd=false;
// Nothing below at all means we got inside geometry or off the map: go back to the last place we stood
if(gr<-1e8||P.y<world.yMin-10){if(P.safe){P.x=P.safe.x;P.y=P.safe.y;P.z=P.safe.z;P.gnd=true}else{const sp=takeSpot(online?myTeam:'t');if(sp){P.x=sp[0];P.y=sp[1];P.z=sp[2]}}P.vy=0}
else if(P.gnd)P.safe={x:P.x,y:P.y,z:P.z}}
else{P.y+=P.vy*dt;let gr=0;for(const b of boxes)if(b.h&&Math.abs(P.x-b.x)<b.w/2+.3&&Math.abs(P.z-b.z)<b.d/2+.3&&b.h<=P.y+.35&&b.h>gr)gr=b.h;
if(P.y<=gr){P.y=gr;P.vy=0;P.gnd=true}else P.gnd=false}}
P.h+=((crouch?1.05:1.6)-P.h)*Math.min(1,dt*12);camera.position.set(P.x,P.y+P.h+(P.gnd?Math.sin(performance.now()/110)*.025*P.speed:0),P.z);
camera.rotation.set(P.pitch,P.yaw,0);
if(EM.on)updEmote(dt);
const spec=P.dead&&!online?bots.find(b=>b.alive&&b.team===(party?myTeam:'t')):null;
if(specBot!==spec){if(specBot)specBot.g.visible=true;specBot=spec;if(spec){spec.g.visible=false;specYaw=spec.g.rotation.y}}
if(spec){const d=spec.g.rotation.y-specYaw;specYaw+=Math.atan2(Math.sin(d),Math.cos(d))*Math.min(1,dt*10);
camera.position.set(spec.x,(spec.y||0)+(spec.crouch?1.05:1.6),spec.z);camera.rotation.set(spec.st?spec.st.pitch||0:0,specYaw,0);
const wid=spec.st&&W[spec.st.w]?spec.st.w:(spec.team==='t'?'ak':'m4');if(specId!==wid){specId=wid;buildModel(wid)}}
else if(specId){specId=null;buildModel(cur)}
{const show=state==='play'&&P.dead;if((specMsg.style.display==='block')!==show)specMsg.style.display=show?'block':'none'}
camera.fov+=((scoped?18:75)-camera.fov)*Math.min(1,dt*15);camera.updateProjectionMatrix();
if((P.dead&&!spec)||EM.on){hideViewWeapon()}
else{
gun.visible=!(scoped&&camera.fov<40);$('scope').style.display=(scoped&&camera.fov<30)?'block':'none';
if(viewHandsRoot)viewHandsRoot.visible=true;
const rl=reloading>0?Math.sin(Math.min(1,1-reloading/W[cur].rl)*Math.PI):0;
const cat=viewCat(vmId()),vp=VIEW_POSE[cat]||VIEW_POSE.rifle;const gy=gun.userData.loaded||cat==='knife'?vp.gy:-.2;
lyaw=P.yaw;lpit=P.pitch;swY=0;swX=0;
const moving=P.speed>0&&(P.gnd||!world)&&!P.lad;bobA+=((moving?P.speed:0)-bobA)*Math.min(1,dt*8);if(moving)bobT+=dt*(5+4*P.speed);
const bA=bobA*(scoped?.2:1),bx=Math.sin(bobT)*.011*bA,by=-Math.abs(Math.cos(bobT))*.013*bA;
if(mouseDown||reloading>0||scoped||P.dead)inspT=0;
let ix=0,iy=0,irx=0,iry=0,irz=0,iz=0;
const swp=cat==='knife'&&!specId?swingPose(dt):(swing=null,null);if(swp){ix+=swp[0];iy+=swp[1];iz+=swp[2];irx+=swp[3];iry+=swp[4];irz+=swp[5]}
if(inspT>0){inspT-=dt;const p=1-inspT/INSPECT,sm=t=>t<=0?0:t>=1?1:t*t*(3-2*t),e=sm(p/.15)*(1-sm((p-.85)/.15)),s=sm((p-.15)/.7);
ix=-.06*e;iy=.04*e;irx=-.15*e;iry=e*(.8-1.4*s);irz=e*.35*Math.sin(Math.PI*s)}
gun.position.set(vp.gx+bx+ix,gy-(VM_DROP[cat]||0)+by+iy-rl*.05+vkick*.012,vp.gz+(VIEW_Z[vmId()]||0)+iz+kick*.005+vkick*.035).multiplyScalar(1/(VM_ZOOM[cat]||1));
gun.rotation.set((vp.tip||0)+irx+kick*.006+rl*.12+vkick*.07+by*.6,(vp.ry||0)+iry,(vp.rz||0)+irz+bx*1.4);
holdOpenHand(swp,1/(VM_ZOOM[cat]||1));
const wantKey=handPlateKey(cat);
if(viewGlove&&viewGlove.parent===gun){if(gun.userData.viewCat!==cat)mountViewHands()}
else if(!viewHandPlate||viewHandPlate.userData.handKey!==wantKey||gun.userData.viewCat!==cat||gloveState==='ready')mountViewHands();
else if(viewHandPlate){viewHandPlate.visible=gun.visible;viewHandPlate.position.set(vp.hx??.1,vp.hy??-.5,vp.hz??-.42);
if(viewHandPlate.geometry){const nw=vp.psx||.9,nh=vp.psy||.85;if(Math.abs(viewHandPlate.geometry.parameters.width-nw)>.001){viewHandPlate.geometry.dispose();viewHandPlate.geometry=new THREE.PlaneGeometry(nw,nh)}}}
if(viewGlove)viewGlove.visible=gun.visible;if(viewHandPlate)viewHandPlate.visible=gun.visible;
}
const sc=(.6+P.speed*1.6+Math.min(recoil,W[cur].sc||8)*W[cur].rs*40)*(crouch?.75:1);$('cross').style.display=scoped||EM.on?'none':'';$('cross').style.transform='scale('+sc+')';
pp.set(P.x,P.y+P.h-.1,P.z);updBots(dt);updDrops(dt);syncNetplay(dt);syncParty(dt);
if(freezeT>0){freezeT-=dt;if(freezeT<=0){freezeT=0;feed('Move! Buy open '+(Math.ceil(buyT))+'s');updHud()}}
if(buyT>0){buyT-=dt;if(buyT<=0){buyT=0;closeBuy();feed('Buy time over');updHud()}else if(freezeT<=0)updHud()}
if(roundTimer>0){roundTimer-=dt;if(roundTimer<=0){round++;startRound()}}
else if(online)checkOnlineRound();
else if(party)checkPartyRound();
else if(!online&&bots.length){const ctA=bots.some(b=>b.alive&&b.team==='ct'),tA=(!P.dead&&P.hp>0)||bots.some(b=>b.alive&&b.team==='t');if(!ctA)endRound(true);else if(!tA)endRound(false)}
if(feedT>0){feedT-=dt;if(feedT<=0)$('feed').textContent=''}
}
for(let i=fx.length-1;i>=0;i--){const m=fx[i];m.userData.t-=dt;m.material.opacity=Math.max(0,m.userData.t*10);if(m.userData.t<=0){scene.remove(m);m.geometry.dispose();fx.splice(i,1)}}
for(let i=parts.length-1;i>=0;i--){const m=parts[i],u=m.userData;u.t-=dt;u.v.y-=9*dt;m.position.addScaledVector(u.v,dt);if(u.t<=0||m.position.y<u.fy){if(u.blood&&m.position.y<u.fy+.6&&Math.random()<.6)stain(m.position.x,m.position.z,.05+Math.random()*.1,u.fy);scene.remove(m);parts.splice(i,1)}}
updNades(dt);skyMesh.position.copy(camera.position);
// Shadow box (±42m) travels with the player on big maps; snapped so shadows don't shimmer
if(world){const sx=Math.round(P.x/4)*4,sz=Math.round(P.z/4)*4,sy=Math.round(P.y);sun.position.set(sx+25,sy+40,sz+15);sun.target.position.set(sx,sy,sz);sun.target.updateMatrixWorld()}
renderer.render(scene,camera)}
camera.position.set(0,1.6,25);loop();updHud();if(location.hostname==='localhost')window.__ev=s=>eval(s);
})();
