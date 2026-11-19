import fs from 'fs';
const swaps=[
['function poseArms(cat){if(!viewGlove)return;const P=ARM_POSE[cat]||ARM_POSE.rifle,u=viewGlove.userData;if(u.cat===cat)return;u.cat=cat;',
 "// per-weapon overrides, merged per hand over the category pose\nconst ARM_WPN={ak:{},m4:{},awp:{},mp9:{}};\nfunction poseArms(cat){if(!viewGlove)return;const u=viewGlove.userData,key=cat+':'+cur;if(u.cat===key)return;u.cat=key;\nconst B=ARM_POSE[cat]||ARM_POSE.rifle,X=ARM_WPN[cur]||{},P={};for(const s of ['L','R'])if(B[s]||X[s])P[s]=Object.assign({},B[s],X[s]);"],
['window.ARM_POSE=ARM_POSE;','window.ARM_POSE=ARM_POSE;window.ARM_WPN=ARM_WPN;window.magGrip=magGrip;'],
];
for(const f of ['public/index.html','strike.html']){let s=fs.readFileSync(f,'utf8');const eol=s.includes('\r\n')?'\r\n':'\n';
for(const [a,b] of swaps){const A=a.replace(/\n/g,eol);if(!s.includes(A))throw new Error(f+' missing '+a.slice(0,50));s=s.replace(A,b.replace(/\n/g,eol))}
fs.writeFileSync(f,s);console.log('patched',f)}
