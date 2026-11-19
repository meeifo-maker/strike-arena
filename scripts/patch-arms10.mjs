import fs from 'fs';
const swaps=[
["const ARM_WPN={ak:{},m4:{},awp:{},mp9:{}};",
 "const ARM_WPN={\nak:{L:{at:[0,-.035,-.05],up:[0,1,.6],p:[1,0,0]}},\nm4:{L:{at:[0,-.02,0],up:[0,1,.26],p:[1,0,0]}},\nawp:{},\nmp9:{L:null,R:{at:[0,-.005,0],f:[-.1,.4,-.9],p:[-1,0,0]}}};"],
["rifle:{gx:.22,gy:-.18,gz:-.3,","rifle:{gx:.22,gy:-.15,gz:-.3,"],
];
for(const f of ['public/index.html','strike.html']){let s=fs.readFileSync(f,'utf8');const eol=s.includes('\r\n')?'\r\n':'\n';
for(const [a,b] of swaps){if(!s.includes(a))throw new Error(f+' missing '+a.slice(0,50));s=s.replace(a,b.replace(/\n/g,eol))}
fs.writeFileSync(f,s);console.log('patched',f)}
