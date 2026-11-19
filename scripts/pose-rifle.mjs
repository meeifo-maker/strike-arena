import fs from 'fs';

const swaps = [
  ['const want={ak:.42,m4:.42,awp:.5,mp9:.32,', 'const want={ak:.6,m4:.6,awp:.7,mp9:.42,'],
  [
    'smg:{gx:.13,gy:-.09,gz:-.36,tip:-.03,hold:[0,-.01,-.02],hx:.08,hy:-.5,hz:-.42,psx:.9,psy:.88}',
    'smg:{gx:.19,gy:-.16,gz:-.4,tip:.02,hold:[0,0,0],hx:.15,hy:-.33,hz:-.4,psx:.22,psy:.44,over:1}'
  ],
  [
    'rifle:{gx:.14,gy:-.1,gz:-.38,tip:-.025,hold:[0,-.01,-.04],hx:.06,hy:-.52,hz:-.44,psx:.92,psy:.9}',
    'rifle:{gx:.2,gy:-.17,gz:-.42,tip:.02,hold:[0,0,0],hx:.16,hy:-.327,hz:-.4,psx:.23,psy:.46,over:1}'
  ],
  [
    'sniper:{gx:.15,gy:-.11,gz:-.42,tip:-.02,hold:[0,-.015,-.05],hx:.06,hy:-.54,hz:-.46,psx:.95,psy:.92}',
    'sniper:{gx:.21,gy:-.18,gz:-.46,tip:.015,hold:[0,0,0],hx:.17,hy:-.33,hz:-.4,psx:.23,psy:.46,over:1}'
  ],
  ['plate.renderOrder=2;viewHandsRoot.add(plate)', 'plate.renderOrder=vp.over?10:2;viewHandsRoot.add(plate)'],
  ["v='?v=26'", "v='?v=27'"]
];

for (const f of ['public/index.html', 'strike.html']) {
  let s = fs.readFileSync(f, 'utf8');
  for (const [a, b] of swaps) {
    if (!s.includes(a)) throw new Error(`${f}: missing ${a.slice(0, 40)}`);
    s = s.replace(a, b);
  }
  fs.writeFileSync(f, s);
  console.log('patched', f);
}
