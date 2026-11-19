import fs from 'fs';
const swaps=[
["let cz=0,n=0;for(const i of keep)if(pos.getY(i)>ARM_KN){cz+=pos.getZ(i);n++}cz/=n||1;\nconst g=geo.clone();curlFingers(g,cz,s==='R'?1:-1);g.setIndex(keep);",
 "let cz=0,n=0;for(const i of keep)if(pos.getY(i)>ARM_KN){cz+=pos.getZ(i);n++}cz/=n||1;\n// drop the thumb: it can't bend, and in every grip it pokes through the gun\nconst sg=s==='R'?1:-1,thumb=i=>{const y=pos.getY(i);return y>.08&&y<=ARM_KN&&(pos.getZ(i)-cz)*sg>.13},hand=[];\nfor(let t=0;t<keep.length;t+=3)if(!thumb(keep[t])&&!thumb(keep[t+1])&&!thumb(keep[t+2]))hand.push(keep[t],keep[t+1],keep[t+2]);\nconst g=geo.clone();curlFingers(g);g.setIndex(hand);"],
["// sg: +1 when the thumb sits toward +Z (right arm), -1 toward -Z (left arm)\nfunction curlFingers(g,cz,sg){const p=g.attributes.position,nm=g.attributes.normal,tg=g.attributes.tangent;\nconst tx=-.03,ty=.17,tz=cz+sg*.1;\nfor(let i=0;i<p.count;i++){const y0=p.getY(i),di=(p.getZ(i)-cz)*sg;\nif(y0>.08&&y0<=ARM_KN&&di>.1){const w=Math.min(1,(di-.1)/.06),k=1-w*w*(3-2*w);\np.setXYZ(i,tx+(p.getX(i)-tx)*k,ty+(y0-ty)*k,tz+(p.getZ(i)-tz)*k);continue}\nconst d=y0-ARM_KN;",
 "function curlFingers(g){const p=g.attributes.position,nm=g.attributes.normal,tg=g.attributes.tangent;\nfor(let i=0;i<p.count;i++){const y0=p.getY(i),d=y0-ARM_KN;"],
];
for(const f of ['public/index.html','strike.html']){let s=fs.readFileSync(f,'utf8');const eol=s.includes('\r\n')?'\r\n':'\n';
for(const [a,b] of swaps){const A=a.replace(/\n/g,eol);if(!s.includes(A))throw new Error(f+' missing '+a.slice(0,50));s=s.replace(A,b.replace(/\n/g,eol))}
fs.writeFileSync(f,s);console.log('patched',f)}
