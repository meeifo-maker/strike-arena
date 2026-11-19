import fs from 'fs';
const swaps=[
['rifle:{gx:.22,gy:-.18,gz:-.3,','rifle:{gx:.22,gy:-.15,gz:-.3,'],
['const ARM_WPN={ak:{},m4:{},awp:{},mp9:{}};',
 "const ARM_WPN={\nak:{L:{mag:0,at:[0,-.05,-.02],up:[0,1,.45],p:[1,0,0]}},\nm4:{L:{mag:0,at:[-.002,-.028,.026],up:[0,1,.26],p:[1,0,0]}},\nawp:{L:{at:[0,-.015,-.11],up:[0,.1,-1],p:[-1,1.2,0]}},\nmp9:{L:null,R:{at:[0,-.04,-.03],f:[-.1,.28,-.95],p:[-1,0,0]}}};"],
];
for(const f of ['public/index.html','strike.html']){let s=fs.readFileSync(f,'utf8');const eol=s.includes('\r\n')?'\r\n':'\n';
for(const [a,b] of swaps){if(!s.includes(a))throw new Error(f+' missing '+a);s=s.replace(a,b.replace(/\n/g,eol))}
fs.writeFileSync(f,s);console.log('patched',f)}
