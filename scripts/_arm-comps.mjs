import fs from 'fs';
const b=fs.readFileSync('public/assets/viewhands/arms.glb');const jl=b.readUInt32LE(12);const j=JSON.parse(b.slice(20,20+jl).toString());const bin=20+jl+8;
const pr=j.meshes[0].primitives[0];const acc=j.accessors[pr.attributes.POSITION];const v=j.bufferViews[acc.bufferView];
const f=new Float32Array(b.buffer.slice(b.byteOffset+bin+(v.byteOffset||0)),0,acc.count*3);
const ia=j.accessors[pr.indices],iv=j.bufferViews[ia.bufferView];const I=ia.componentType===5125?new Uint32Array(b.buffer.slice(b.byteOffset+bin+(iv.byteOffset||0)+(ia.byteOffset||0)),0,ia.count):new Uint16Array(b.buffer.slice(b.byteOffset+bin+(iv.byteOffset||0)+(ia.byteOffset||0)),0,ia.count);
const mul=(a,c)=>{const r=new Array(16).fill(0);for(let i=0;i<4;i++)for(let k=0;k<4;k++)for(let l=0;l<4;l++)r[k*4+i]+=a[l*4+i]*c[k*4+l];return r};
let W=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];for(const n of [0,1,2,3,4])if(j.nodes[n].matrix)W=mul(W,j.nodes[n].matrix);
const P=[];for(let i=0;i<acc.count;i++){const x=f[i*3],y=f[i*3+1],z=f[i*3+2];P.push([W[0]*x+W[4]*y+W[8]*z+W[12],W[1]*x+W[5]*y+W[9]*z+W[13],W[2]*x+W[6]*y+W[10]*z+W[14]])}
for(const s of ['R','L']){const sg=s==='R'?1:-1;const keep=[];for(let t=0;t<I.length;t+=3){const zs=P[I[t]][2]+P[I[t+1]][2]+P[I[t+2]][2];if((zs<0)===(s==='R'))keep.push(I[t],I[t+1],I[t+2])}
let cz=0,n=0;for(const i of keep)if(P[i][1]>.285){cz+=P[i][2];n++}cz/=n;
const thumb=i=>{const y=P[i][1];return y>.08&&y<.34&&(P[i][2]-cz)*sg>.13};const hand=[];for(let t=0;t<keep.length;t+=3)if(!thumb(keep[t])&&!thumb(keep[t+1])&&!thumb(keep[t+2]))hand.push(keep[t],keep[t+1],keep[t+2]);
// connected components by shared vertex index AND shared position
const key=i=>P[i].map(x=>x.toFixed(4)).join(',');const par=new Map();const find=a=>{while(par.get(a)!==a){par.set(a,par.get(par.get(a)));a=par.get(a)}return a};const uni=(a,c)=>{a=find(a);c=find(c);if(a!==c)par.set(a,c)};
for(const i of hand){const k=key(i);if(!par.has(k))par.set(k,k)}for(let t=0;t<hand.length;t+=3){uni(key(hand[t]),key(hand[t+1]));uni(key(hand[t]),key(hand[t+2]))}
const comp=new Map();for(const i of hand){const r=find(key(i));if(!comp.has(r))comp.set(r,[]);comp.get(r).push(P[i])}
console.log(s,'cz',cz.toFixed(3),'components',comp.size);
for(const [k,pts] of comp){const mn=[0,1,2].map(a=>Math.min(...pts.map(p=>p[a])).toFixed(3)),mx=[0,1,2].map(a=>Math.max(...pts.map(p=>p[a])).toFixed(3));if(pts.length<3000)console.log(' n',pts.length,'min',mn.join(' '),'max',mx.join(' '))}}


