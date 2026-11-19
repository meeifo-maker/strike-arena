import fs from 'fs';

const R = (at) => `{at:${JSON.stringify(at)},f:[0,.25,-.97],p:[-1,0,0]}`;
const L = (at) => `{at:${JSON.stringify(at)},f:[.25,.5,-.83],p:[.7,.7,0]}`;
const newPose = `const ARM_POSE={
pistol:{R:${R([0, -.028, .058])},L:{at:[-.006,-.045,.05],f:[0,.2,-.98],p:[1,0,0]}},
smg:{R:${R([0, -.045, -.06])},L:${L([0, .025, -.12])}},
rifle:{R:${R([-.006, -.018, .12])},L:${L([-.006, .055, -.11])}},
sniper:{R:${R([0, -.035, .17])},L:${L([0, -.01, -.12])}},
m4:{R:${R([0, -.02, .145])},L:${L([0, .033, -.07])}},
nade:{R:${R([0, -.02, .02])}},
knife:{R:${R([0, -.02, .02])}}};`;

for (const f of ['public/index.html', 'strike.html']) {
  let s = fs.readFileSync(f, 'utf8');
  const a = s.indexOf('const ARM_POSE={');
  const b = s.indexOf('}}};', a);
  if (a < 0 || b < 0) throw new Error(`${f}: ARM_POSE not found`);
  s = s.slice(0, a) + newPose + s.slice(b + 4);
  const x = `function poseArms(cat){if(!viewGlove)return;const P=ARM_POSE[cat]||ARM_POSE.rifle,u=viewGlove.userData;if(u.cat===cat)return;u.cat=cat;`;
  const y = `function poseArms(cat){if(!viewGlove)return;const k=ARM_POSE[cur]?cur:cat,P=ARM_POSE[k]||ARM_POSE.rifle,u=viewGlove.userData;if(u.cat===k)return;u.cat=k;`;
  if (!s.includes(x)) throw new Error(`${f}: poseArms header missing`);
  s = s.replace(x, y);
  fs.writeFileSync(f, s);
  console.log('patched', f);
}
