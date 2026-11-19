import { WEAPONS } from "./config.js";

export function createLoadout(team) {
  const pistol = team === "CT" ? "usp" : "glock";
  return {
    knife: makeInstance("knife"),
    secondary: makeInstance(pistol),
    primary: null,
    active: "secondary",
    armor: 0,
    helmet: false,
  };
}

export function makeInstance(id) {
  const def = WEAPONS[id];
  return {
    id,
    def,
    clip: def.clip === Infinity ? Infinity : def.clip,
    reserve: def.reserve === Infinity ? Infinity : def.reserve,
    cooldown: 0,
    reloading: false,
    reloadTimer: 0,
    recoilPitch: 0,
    shotsFired: 0,
  };
}

export function getActiveWeapon(loadout) {
  return loadout[loadout.active];
}

export function switchSlot(loadout, slot) {
  if (slot === "primary" && !loadout.primary) return false;
  if (!loadout[slot]) return false;
  const w = getActiveWeapon(loadout);
  if (w) {
    w.reloading = false;
    w.reloadTimer = 0;
  }
  loadout.active = slot;
  return true;
}

const SLOT_ORDER = ["primary", "secondary", "knife"];

export function cycleSlot(loadout, dir) {
  const available = SLOT_ORDER.filter((slot) => loadout[slot]);
  if (available.length < 2) return false;
  const i = available.indexOf(loadout.active);
  const next = available[(i + (dir > 0 ? 1 : -1) + available.length) % available.length];
  return switchSlot(loadout, next);
}

export function startReload(weapon) {
  if (!weapon || weapon.def.clip === Infinity) return false;
  if (weapon.reloading) return false;
  if (weapon.clip >= weapon.def.clip) return false;
  if (weapon.reserve <= 0) return false;
  weapon.reloading = true;
  weapon.reloadTimer = weapon.def.reloadTime;
  weapon.shotsFired = 0;
  return true;
}

export function updateWeapon(weapon, dt) {
  if (!weapon) return;
  if (weapon.cooldown > 0) weapon.cooldown -= dt;
  if (weapon.recoilPitch > 0) {
    weapon.recoilPitch = Math.max(0, weapon.recoilPitch - dt * 1.8);
  }
  if (weapon.reloading) {
    weapon.reloadTimer -= dt;
    if (weapon.reloadTimer <= 0) {
      const need = weapon.def.clip - weapon.clip;
      const take = Math.min(need, weapon.reserve);
      weapon.clip += take;
      weapon.reserve -= take;
      weapon.reloading = false;
    }
  }
}

export function canFire(weapon) {
  if (!weapon) return false;
  if (weapon.reloading) return false;
  if (weapon.cooldown > 0) return false;
  if (weapon.def.clip !== Infinity && weapon.clip <= 0) return false;
  return true;
}

export function fireWeapon(weapon, moving, walking, crouching) {
  if (!canFire(weapon)) return null;
  const def = weapon.def;
  weapon.cooldown = 1 / def.fireRate;
  if (def.clip !== Infinity) weapon.clip -= 1;
  weapon.shotsFired += 1;
  weapon.recoilPitch += def.recoil * (1 + weapon.shotsFired * 0.08);

  let spread = def.spread + weapon.shotsFired * def.recoil * 0.15;
  if (moving) spread += def.moveInaccuracy * (walking ? 0.35 : 1);
  if (crouching) spread *= 0.65;
  if (!moving && crouching) spread *= 0.75;

  const pellets = def.pellets || 1;
  const rays = [];
  for (let i = 0; i < pellets; i++) {
    const ax = (Math.random() - 0.5) * spread * 2;
    const ay = (Math.random() - 0.5) * spread * 2 - weapon.recoilPitch * 0.35;
    rays.push({ ax, ay });
  }
  return { rays, damage: def.damage, armorPen: def.armorPen, range: def.range, killReward: def.killReward, name: def.name };
}

export function applyDamage(target, damage, armorPen, headshot) {
  let dmg = damage * (headshot ? 4 : 1);
  if (headshot && target.helmet) {
    dmg *= 0.75;
  }
  if (target.armor > 0) {
    const absorbed = dmg * (1 - armorPen) * 0.5;
    const toArmor = Math.min(target.armor, absorbed * 0.5 + dmg * 0.2);
    target.armor = Math.max(0, target.armor - toArmor);
    dmg = dmg * armorPen + dmg * (1 - armorPen) * 0.15;
  }
  target.hp -= dmg;
  return dmg;
}
