import * as THREE from "three";
import { MOVEMENT, TEAM } from "./config.js";
import {
  createLoadout,
  getActiveWeapon,
  switchSlot,
  cycleSlot,
  startReload,
  updateWeapon,
  fireWeapon,
  applyDamage,
  makeInstance,
} from "./weapons.js";

function teamColor(team) {
  return team === TEAM.CT ? 0x4a90c8 : 0xc4a035;
}

export function createPawn(scene, team, name, isPlayer = false) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: teamColor(team),
    roughness: 0.7,
    metalness: 0.2,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1e24, roughness: 0.9 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.35), bodyMat);
  torso.position.y = 1.15;
  torso.castShadow = true;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), dark);
  head.position.y = 1.65;
  head.castShadow = true;
  group.add(head);

  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), dark);
  legs.position.y = 0.4;
  legs.castShadow = true;
  group.add(legs);

  if (isPlayer) group.visible = false;
  scene.add(group);

  return {
    name,
    team,
    isPlayer,
    mesh: group,
    head,
    torso,
    alive: true,
    hp: 100,
    armor: 0,
    helmet: false,
    money: 800,
    pos: new THREE.Vector3(0, 0, 0),
    vel: new THREE.Vector3(0, 0, 0),
    yaw: 0,
    pitch: 0,
    crouching: false,
    onGround: true,
    eyeHeight: MOVEMENT.eyeHeight,
    loadout: createLoadout(team),
    kills: 0,
    deaths: 0,
    lastAttacker: null,
  };
}

export function syncLoadoutArmor(pawn) {
  pawn.armor = pawn.loadout.armor;
  pawn.helmet = pawn.loadout.helmet;
}

export function respawnPawn(pawn, spawn, keepGuns = true) {
  pawn.alive = true;
  pawn.hp = 100;
  pawn.pos.set(spawn.x, 0, spawn.z);
  pawn.vel.set(0, 0, 0);
  pawn.yaw = spawn.yaw;
  pawn.pitch = 0;
  pawn.crouching = false;
  pawn.mesh.visible = !pawn.isPlayer;
  pawn.mesh.position.copy(pawn.pos);
  if (!keepGuns) {
    pawn.loadout = createLoadout(pawn.team);
  } else {
    // Reset ammo on alive weapons, keep purchases
    for (const slot of ["primary", "secondary", "knife"]) {
      const w = pawn.loadout[slot];
      if (!w) continue;
      w.clip = w.def.clip === Infinity ? Infinity : w.def.clip;
      // Keep reserve as-is for realism-ish mid-game; top up a bit
      if (w.def.reserve !== Infinity) {
        w.reserve = Math.max(w.reserve, Math.floor(w.def.reserve * 0.5));
      }
      w.reloading = false;
      w.cooldown = 0;
      w.shotsFired = 0;
      w.recoilPitch = 0;
    }
    if (!pawn.loadout.secondary) {
      pawn.loadout.secondary = makeInstance(pawn.team === "CT" ? "usp" : "glock");
    }
    pawn.loadout.active = pawn.loadout.primary ? "primary" : "secondary";
  }
  syncLoadoutArmor(pawn);
}

export function updatePawnMovement(pawn, inputDir, wantJump, wantDuck, wantWalk, world, dt, frozen) {
  if (!pawn.alive) return { moving: false, walking: false };

  const crouch = wantDuck;
  pawn.crouching = crouch;
  const targetEye = crouch ? MOVEMENT.crouchEyeHeight : MOVEMENT.eyeHeight;
  pawn.eyeHeight += (targetEye - pawn.eyeHeight) * Math.min(1, dt * 12);

  if (frozen) {
    pawn.vel.x *= Math.exp(-MOVEMENT.friction * dt);
    pawn.vel.z *= Math.exp(-MOVEMENT.friction * dt);
  } else {
    let speed = MOVEMENT.runSpeed;
    if (wantWalk) speed = MOVEMENT.walkSpeed;
    if (crouch) speed = MOVEMENT.crouchSpeed;

    const forward = new THREE.Vector3(-Math.sin(pawn.yaw), 0, -Math.cos(pawn.yaw));
    const right = new THREE.Vector3(Math.cos(pawn.yaw), 0, -Math.sin(pawn.yaw));
    const wish = new THREE.Vector3();
    wish.addScaledVector(forward, inputDir.z);
    wish.addScaledVector(right, inputDir.x);
    if (wish.lengthSq() > 1) wish.normalize();

    const accel = pawn.onGround ? MOVEMENT.accel : MOVEMENT.accel * MOVEMENT.airControl;
    if (wish.lengthSq() > 0) {
      pawn.vel.x += wish.x * accel * dt * speed;
      pawn.vel.z += wish.z * accel * dt * speed;
    }

    const horizontal = Math.hypot(pawn.vel.x, pawn.vel.z);
    if (horizontal > speed) {
      const s = speed / horizontal;
      pawn.vel.x *= s;
      pawn.vel.z *= s;
    }

    if (pawn.onGround) {
      const drag = Math.exp(-MOVEMENT.friction * dt);
      if (wish.lengthSq() < 0.01) {
        pawn.vel.x *= drag;
        pawn.vel.z *= drag;
      }
      if (wantJump) {
        pawn.vel.y = MOVEMENT.jumpForce;
        pawn.onGround = false;
      }
    }
  }

  pawn.vel.y -= MOVEMENT.gravity * dt;
  pawn.pos.x += pawn.vel.x * dt;
  pawn.pos.z += pawn.vel.z * dt;
  pawn.pos.y += pawn.vel.y * dt;

  const ground = world.groundHeight(pawn.pos.x, pawn.pos.z);
  if (pawn.pos.y <= ground) {
    pawn.pos.y = ground;
    pawn.vel.y = 0;
    pawn.onGround = true;
  }

  const radius = MOVEMENT.playerRadius;
  const resolved = world.resolveCircle(pawn.pos.x, pawn.pos.z, radius, pawn.eyeHeight);
  if (resolved.x !== pawn.pos.x || resolved.z !== pawn.pos.z) {
    pawn.vel.x *= 0.4;
    pawn.vel.z *= 0.4;
  }
  pawn.pos.x = resolved.x;
  pawn.pos.z = resolved.z;

  const h = crouch ? MOVEMENT.crouchHeight : MOVEMENT.playerHeight;
  pawn.mesh.position.set(pawn.pos.x, pawn.pos.y, pawn.pos.z);
  pawn.mesh.rotation.y = pawn.yaw;
  pawn.mesh.scale.y = h / MOVEMENT.playerHeight;

  const moving = Math.hypot(pawn.vel.x, pawn.vel.z) > 0.6;
  return { moving, walking: wantWalk && moving };
}

export function updatePawnCombat(pawn, dt) {
  if (!pawn.alive) return;
  for (const slot of ["primary", "secondary", "knife"]) {
    if (pawn.loadout[slot]) updateWeapon(pawn.loadout[slot], dt);
  }
}

export function tryFire(pawn, moving, walking) {
  if (!pawn.alive) return null;
  const weapon = getActiveWeapon(pawn.loadout);
  return fireWeapon(weapon, moving, walking, pawn.crouching);
}

export function tryReload(pawn) {
  return startReload(getActiveWeapon(pawn.loadout));
}

export function trySwitch(pawn, slot) {
  return switchSlot(pawn.loadout, slot);
}

export function tryCycle(pawn, dir) {
  return cycleSlot(pawn.loadout, dir);
}

export function hurtPawn(pawn, damage, armorPen, headshot, attacker) {
  if (!pawn.alive) return { killed: false, dmg: 0 };
  const dmg = applyDamage(pawn, damage, armorPen, headshot);
  pawn.lastAttacker = attacker;
  if (pawn.hp <= 0) {
    pawn.hp = 0;
    pawn.alive = false;
    pawn.deaths += 1;
    pawn.mesh.visible = false;
    if (attacker && attacker !== pawn) attacker.kills += 1;
    return { killed: true, dmg };
  }
  return { killed: false, dmg };
}

export function getEyePosition(pawn, out = new THREE.Vector3()) {
  return out.set(pawn.pos.x, pawn.pos.y + pawn.eyeHeight, pawn.pos.z);
}

export function getLookDirection(pawn, out = new THREE.Vector3()) {
  const cp = Math.cos(pawn.pitch);
  return out.set(-Math.sin(pawn.yaw) * cp, Math.sin(pawn.pitch), -Math.cos(pawn.yaw) * cp);
}
