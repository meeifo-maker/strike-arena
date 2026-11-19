import fs from 'fs';

const swaps = [
  ['pistol:{R:{at:[.035,-.035,.04],f:[0,.6,-.8],p:[-1,0,0]},L:{at:[-.035,-.04,.045],f:[0,.6,-.8],p:[1,0,0]}},',
   'pistol:{R:{at:[.028,-.008,.055],f:[0,.4,-.92],p:[-1,0,0]},L:{at:[-.028,-.014,.06],f:[0,.4,-.92],p:[1,0,0]}},'],
  ['smg:{R:{at:[.032,-.045,.05],f:[0,.2,-.98],p:[-1,0,0]},L:', 'smg:{L:'],
  ['rifle:{R:{at:[.035,-.05,.07],f:[0,.2,-.98],p:[-1,0,0]},L:', 'rifle:{L:'],
  ['sniper:{R:{at:[.035,-.055,.09],f:[0,.2,-.98],p:[-1,0,0]},L:', 'sniper:{L:'],
  ['smg:{gx:.19,gy:-.16,gz:-.4,', 'smg:{gx:.21,gy:-.17,gz:-.3,'],
  ['rifle:{gx:.2,gy:-.17,gz:-.42,', 'rifle:{gx:.22,gy:-.18,gz:-.3,'],
  ['sniper:{gx:.21,gy:-.18,gz:-.46,', 'sniper:{gx:.23,gy:-.19,gz:-.34,'],
];

for (const f of ['public/index.html', 'strike.html']) {
  let s = fs.readFileSync(f, 'utf8');
  for (const [a, b] of swaps) {
    if (!s.includes(a)) throw new Error(`${f}: missing ${a.slice(0, 50)}`);
    s = s.replace(a, b);
  }
  fs.writeFileSync(f, s);
  console.log('patched', f);
}
