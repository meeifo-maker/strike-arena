import * as THREE from "three";
import { WEAPONS } from "./config.js";
import { getActiveWeapon, canFire, makeInstance } from "./weapons.js";
import {
  updatePawnMovement,
  updatePawnCombat,
  tryFire,
  tryReload,
  trySwitch,
  getEyePosition,
  getLookDirection,
} from "./entities.js";

const TMP = new THREE.Vector3();
const TMP2 = new THREE.Vector3();
const TMP3 = new THREE.Vector3();

export class BotController {
  constructor(pawn, enemies, world) {
    this.pawn = pawn;
    this.enemies = enemies;
    this.world = world;
    this.state = "patrol";
    this.target = null;
    this.waypoint = null;
    this.burstTimer = 0;
    this.strafeSign = Math.random() > 0.5 ? 1 : -1;
    this.strafeTimer = 0;
    this.buyDone = false;
    this.waypoints = this.buildWaypoints();
  }

  buildWaypoints() {
    const pts = [];
    for (let i = 0; i < 18; i++) {
      pts.push({ x: (Math.random() - 0.5) * 70, z: (Math.random() - 0.5) * 50 });
    }
    pts.push({ x: -16, z: -16 }, { x: 16, z: 16 }, { x: 0, z: 0 }, { x: -20, z: 10 }, { x: 20, z: -10 });
    return pts;
  }

  pickWaypoint() {
    this.waypoint = this.waypoints[Math.floor(Math.random() * this.waypoints.length)];
  }

  resetRound() {
    this.state = "patrol";
    this.target = null;
    this.buyDone = false;
    this.pickWaypoint();
  }

  maybeBuy(canBuy) {
    if (!canBuy || this.buyDone) return;
    this.buyDone = true;
    const p = this.pawn;

    if (p.money >= 1000 && p.loadout.armor < 50) {
      p.money -= 1000;
      p.loadout.armor = 100;
      p.loadout.helmet = true;
      p.armor = 100;
      p.helmet = true;
    } else if (p.money >= 650 && p.loadout.armor < 50) {
      p.money -= 650;
      p.loadout.armor = 100;
      p.armor = 100;
    }

    if (!p.loadout.primary) {
      const options =
        p.team === "CT"
          ? ["m4a4", "famas", "ump45", "mp9"]
          : ["ak47", "galil", "ump45", "mac10"];
      for (const id of options) {
        const def = WEAPONS[id];
        if (def && p.money >= def.price) {
          p.money -= def.price;
          p.loadout.primary = makeInstance(id);
          p.loadout.active = "primary";
          break;
        }
      }
    }
  }

  visibleEnemy() {
    const eye = getEyePosition(this.pawn, TMP);
    let best = null;
    let bestDist = Infinity;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const targetEye = getEyePosition(e, TMP3);
      const to = TMP2.copy(targetEye).sub(eye);
      const dist = to.length();
      if (dist > 70) continue;
      if (!hasLOS(this.world, eye, targetEye)) continue;
      getLookDirection(this.pawn, TMP2);
      const dir = targetEye.clone().sub(eye).normalize();
      if (TMP2.dot(dir) < 0.25 && dist > 8) continue;
      if (dist < bestDist) {
        bestDist = dist;
        best = e;
      }
    }
    return best;
  }

  aimAt(target, dt) {
    const eye = getEyePosition(this.pawn, TMP);
    const aim = getEyePosition(target, TMP2);
    aim.x += (Math.random() - 0.5) * 0.3;
    aim.y += (Math.random() - 0.5) * 0.25;
    const dir = aim.sub(eye);
    const yaw = Math.atan2(-dir.x, -dir.z);
    const pitch = Math.atan2(dir.y, Math.hypot(dir.x, dir.z));
    const turn = Math.min(1, dt * (3.2 + Math.random()));
    this.pawn.yaw = lerpAngle(this.pawn.yaw, yaw, turn);
    this.pawn.pitch = THREE.MathUtils.lerp(
      this.pawn.pitch,
      THREE.MathUtils.clamp(pitch, -1.3, 1.3),
      turn
    );
  }

  update(dt, frozen, canBuy) {
    const p = this.pawn;
    if (!p.alive) return null;

    this.maybeBuy(canBuy);
    updatePawnCombat(p, dt);

    if (frozen) {
      updatePawnMovement(p, { x: 0, z: 0 }, false, false, false, this.world, dt, true);
      return null;
    }

    this.strafeTimer -= dt;
    if (this.strafeTimer <= 0) {
      this.strafeSign *= -1;
      this.strafeTimer = 0.6 + Math.random() * 1.2;
    }

    const enemy = this.visibleEnemy();
    if (enemy) {
      this.target = enemy;
      this.state = "fight";
    } else if (this.state === "fight") {
      this.state = "patrol";
      this.target = null;
    }

    let input = { x: 0, z: 0 };
    let duck = false;
    let walk = false;
    let shot = null;

    if (this.state === "fight" && this.target?.alive) {
      this.aimAt(this.target, dt);
      const dist = p.pos.distanceTo(this.target.pos);
      input.x = this.strafeSign * 0.85;
      input.z = dist > 18 ? 1 : dist < 8 ? -0.4 : 0.2;
      duck = dist > 12 && Math.random() < 0.015;

      const w = getActiveWeapon(p.loadout);
      if (w && w.clip === 0) tryReload(p);
      if (p.loadout.primary) trySwitch(p, "primary");
      else trySwitch(p, "secondary");

      const yawTo = Math.atan2(-(this.target.pos.x - p.pos.x), -(this.target.pos.z - p.pos.z));
      if (canFire(w) && Math.abs(angleDiff(p.yaw, yawTo)) < 0.4) {
        this.burstTimer -= dt;
        if (this.burstTimer <= 0) {
          shot = tryFire(p, true, false);
          this.burstTimer = w?.def.automatic ? 0 : 0.12 + Math.random() * 0.25;
        }
      }
    } else {
      if (!this.waypoint) this.pickWaypoint();
      const dx = this.waypoint.x - p.pos.x;
      const dz = this.waypoint.z - p.pos.z;
      if (Math.hypot(dx, dz) < 1.5) this.pickWaypoint();
      else {
        p.yaw = lerpAngle(p.yaw, Math.atan2(-dx, -dz), Math.min(1, dt * 2.5));
        input.z = 1;
        walk = Math.random() < 0.02;
      }
      const w = getActiveWeapon(p.loadout);
      if (w && w.def.clip !== Infinity && w.clip < w.def.clip * 0.4 && w.reserve > 0) {
        tryReload(p);
      }
    }

    const move = updatePawnMovement(p, input, false, duck, walk, this.world, dt, false);
    return shot ? { shot, moving: move.moving, walking: move.walking } : null;
  }
}

function lerpAngle(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function angleDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function hasLOS(world, from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  const dist = Math.hypot(dx, dy, dz);
  const steps = Math.ceil(dist / 0.5);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = from.x + dx * t;
    const y = from.y + dy * t;
    const z = from.z + dz * t;
    for (const c of world.colliders) {
      if (x >= c.min.x && x <= c.max.x && y >= c.min.y && y <= c.max.y && z >= c.min.z && z <= c.max.z) {
        return false;
      }
    }
  }
  return true;
}
