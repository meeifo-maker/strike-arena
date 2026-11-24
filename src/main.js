import * as THREE from "three";
import { Input } from "./input.js";
import { World } from "./world.js";
import { UI } from "./ui.js";
import { BotController } from "./bots.js";
import { ECONOMY, ROUND, TEAM, BUY_CATEGORIES } from "./config.js";
import {
  createPawn,
  respawnPawn,
  updatePawnMovement,
  updatePawnCombat,
  tryFire,
  tryReload,
  trySwitch,
  tryCycle,
  hurtPawn,
  getEyePosition,
  getLookDirection,
  syncLoadoutArmor,
} from "./entities.js";
import { getActiveWeapon } from "./weapons.js";

const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87a0b5);
scene.fog = new THREE.Fog(0x87a0b5, 40, 95);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 200);
setMenuCamera();

const hemi = new THREE.HemisphereLight(0xbdd4ea, 0x3a3030, 0.85);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d6, 1.15);
sun.position.set(30, 50, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 120;
sun.shadow.camera.left = -50;
sun.shadow.camera.right = 50;
sun.shadow.camera.top = 50;
sun.shadow.camera.bottom = -50;
scene.add(sun);

const world = new World(scene);
const input = new Input();
const ui = new UI(input);

const gunView = createViewmodel();
camera.add(gunView);
scene.add(camera);

let player = null;
let pawns = [];
let bots = [];
let running = false;
let paused = false;
let match = {
  round: 1,
  ctScore: 0,
  tScore: 0,
  phase: "freeze", // freeze | live | end
  timeLeft: ROUND.freezeTime,
  lossStreakCT: 0,
  lossStreakT: 0,
  buyAllowed: true,
};

const raycaster = new THREE.Raycaster();
const _eye = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _hit = new THREE.Vector3();
let muzzleFlash = 0;
let bobPhase = 0;
let sensitivity = 0.0022;

ui.onPlay = () => startMatch();
ui.onResume = () => {
  paused = false;
  ui.closePause();
  ui.closeControls();
  lockPointer();
};
ui.onRestart = () => {
  ui.closePause();
  ui.closeControls();
  startMatch();
};
ui.onMainMenu = () => returnToMainMenu();
ui.onBuy = (id) => {
  if (!player) return;
  if (id == null) {
    ui.renderBuyItems(player);
    return;
  }
  if (ui.tryBuy(player, id)) {
    syncLoadoutArmor(player);
    ui.updateHud(player, match);
    ui.renderBuyItems(player);
  }
};

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

canvas.addEventListener("click", () => {
  if (running && !ui.anyMenuOpen()) lockPointer();
});

document.addEventListener("pointerlockchange", () => {
  if (!document.pointerLockElement && running && !ui.anyMenuOpen() && !paused) {
    // Ignore unlock caused by opening buy/controls menus
    if (ui.buyOpen || ui.controlsOpen) return;
    paused = true;
    ui.openPause();
  }
});

function lockPointer() {
  canvas.requestPointerLock?.();
}

function createViewmodel() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x1c2228, roughness: 0.5, metalness: 0.6 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.55), mat);
  body.position.set(0.22, -0.22, -0.45);
  g.add(body);
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.35), mat);
  barrel.position.set(0.22, -0.18, -0.75);
  g.add(barrel);
  const hand = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x3d2a1f })
  );
  hand.position.set(0.18, -0.28, -0.35);
  g.add(hand);
  g.visible = false;
  return g;
}

function setMenuCamera() {
  camera.position.set(-18, 12, 22);
  camera.lookAt(0, 1.5, 0);
}

function clearMatchActors() {
  for (const p of pawns) scene.remove(p.mesh);
  pawns = [];
  bots = [];
  player = null;
  gunView.visible = false;
}

function returnToMainMenu() {
  running = false;
  paused = false;
  clearMatchActors();
  document.exitPointerLock?.();
  setMenuCamera();
  ui.showMainMenu();
}

function startMatch() {
  // cleanup
  clearMatchActors();

  player = createPawn(scene, TEAM.CT, "You", true);
  player.money = ECONOMY.startMoney;
  const ctBots = [];
  const tBots = [];

  for (let i = 0; i < 4; i++) {
    ctBots.push(createPawn(scene, TEAM.CT, `CT Bot ${i + 1}`));
  }
  for (let i = 0; i < 5; i++) {
    tBots.push(createPawn(scene, TEAM.T, `T Bot ${i + 1}`));
  }

  pawns = [player, ...ctBots, ...tBots];
  for (const p of pawns) p.money = ECONOMY.startMoney;

  const enemiesOf = (pawn) => pawns.filter((o) => o.team !== pawn.team);

  for (const b of [...ctBots, ...tBots]) {
    bots.push(new BotController(b, enemiesOf(b), world));
  }

  match = {
    round: 1,
    ctScore: 0,
    tScore: 0,
    phase: "freeze",
    timeLeft: ROUND.freezeTime,
    lossStreakCT: 0,
    lossStreakT: 0,
    buyAllowed: true,
  };

  beginRound(true);
  running = true;
  paused = false;
  gunView.visible = true;
  ui.hideMainMenu();
  ui.showHud();
  ui.closeBuy();
  ui.closePause();
  ui.closeControls();
  ui.showMessage("MATCH START — YOU ARE CT", 2500);
  lockPointer();
}

function beginRound(fresh = false) {
  match.phase = "freeze";
  match.timeLeft = ROUND.freezeTime;
  match.buyAllowed = true;

  const keepGuns = !fresh && match.round > 1;
  // On pistol round / first: reset loadouts money already set
  if (fresh) {
    for (const p of pawns) {
      p.money = ECONOMY.startMoney;
      p.loadout.primary = null;
      p.loadout.armor = 0;
      p.loadout.helmet = false;
    }
  }

  const ctSpawns = [...world.spawns.CT];
  const tSpawns = [...world.spawns.T];
  let ci = 0;
  let ti = 0;
  for (const p of pawns) {
    const spawn = p.team === TEAM.CT ? ctSpawns[ci++ % ctSpawns.length] : tSpawns[ti++ % tSpawns.length];
    respawnPawn(p, spawn, keepGuns && !fresh);
  }

  for (const b of bots) b.resetRound();
  ui.showMessage(`ROUND ${match.round}`, 1800);
}

function addMoney(pawn, amount) {
  pawn.money = Math.min(ECONOMY.maxMoney, pawn.money + amount);
}

function endRound(winner) {
  match.phase = "end";
  match.timeLeft = ROUND.endDelay;
  match.buyAllowed = false;

  if (winner === TEAM.CT) {
    match.ctScore += 1;
    match.lossStreakCT = 0;
    match.lossStreakT = Math.min(4, match.lossStreakT + 1);
  } else {
    match.tScore += 1;
    match.lossStreakT = 0;
    match.lossStreakCT = Math.min(4, match.lossStreakCT + 1);
  }

  for (const p of pawns) {
    if (p.team === winner) addMoney(p, ECONOMY.winReward);
    else {
      const streak = p.team === TEAM.CT ? match.lossStreakCT : match.lossStreakT;
      addMoney(p, ECONOMY.lossRewards[streak]);
    }
  }

  ui.showMessage(
    `${winner} WINS THE ROUND\n+$${ECONOMY.winReward} / loss bonus`,
    2800
  );

  if (match.ctScore >= ROUND.winScore || match.tScore >= ROUND.winScore) {
    setTimeout(() => {
      const w = match.ctScore > match.tScore ? "CT" : "T";
      ui.showMessage(`MATCH OVER — ${w} WINS`, 5000);
    }, 500);
  }
}

function checkRoundWin() {
  if (match.phase !== "live") return;
  const ctAlive = pawns.filter((p) => p.team === TEAM.CT && p.alive).length;
  const tAlive = pawns.filter((p) => p.team === TEAM.T && p.alive).length;
  if (tAlive === 0) endRound(TEAM.CT);
  else if (ctAlive === 0) endRound(TEAM.T);
}

function processShot(attacker, shotData) {
  if (!shotData?.shot) return;
  const { rays, damage, armorPen, range, killReward, name } = shotData.shot;
  muzzleFlash = 0.05;
  getEyePosition(attacker, _eye);
  getLookDirection(attacker, _dir);

  for (const ray of rays) {
    const dir = _dir.clone();
    // apply spread in view space approx
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, dir).normalize();
    dir.addScaledVector(right, ray.ax).addScaledVector(up, ray.ay).normalize();

    let best = null;
    let bestDist = range;
    for (const target of pawns) {
      if (!target.alive || target === attacker || target.team === attacker.team) continue;
      const headPos = getEyePosition(target, _hit);
      const bodyPos = target.pos.clone();
      bodyPos.y += target.crouching ? 0.7 : 1.0;

      for (const [point, isHead] of [
        [headPos, true],
        [bodyPos, false],
      ]) {
        const to = point.clone().sub(_eye);
        const dist = to.length();
        if (dist > bestDist) continue;
        const nd = to.normalize();
        if (nd.dot(dir) < 0.995 - dist * 0.00015) continue;
        // LOS
        if (!lineClear(_eye, point)) continue;
        best = { target, dist, headshot: isHead };
        bestDist = dist;
      }
    }

    // Wall block
    if (best && lineClear(_eye, getEyePosition(best.target, _hit))) {
      const result = hurtPawn(best.target, damage, armorPen, best.headshot, attacker);
      if (result.killed) {
        addMoney(attacker, killReward);
        ui.addKill(attacker.name, best.target.name, name);
        checkRoundWin();
      }
    }
  }
}

function lineClear(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  const dist = Math.hypot(dx, dy, dz);
  const steps = Math.ceil(dist / 0.4);
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

function handleMenus(e) {
  if (!running) return;

  if (ui.buyOpen && e.code.startsWith("Digit")) {
    const n = Number(e.code.replace("Digit", ""));
    if (n >= 1 && n <= BUY_CATEGORIES.length && !e.repeat) {
      // If already on category, buy nth item via second press pattern — simpler: digits switch cats
      ui.setBuyCategoryByIndex(n, player);
    }
  }
}

window.addEventListener("keydown", (e) => {
  if (e.code === input.binds.pause || e.code === "Escape") {
    if (ui.mainMenuOpen && !ui.controlsOpen) return;
    e.preventDefault();
    if (ui.controlsOpen) {
      ui.closeControls();
      return;
    }
    if (!running) return;
    if (ui.buyOpen) {
      ui.closeBuy();
      lockPointer();
      return;
    }
    if (paused) {
      paused = false;
      ui.closePause();
      lockPointer();
    } else {
      paused = true;
      ui.openPause();
    }
    return;
  }

  if (!running || paused || ui.controlsOpen) return;

  if (!e.repeat && e.code === input.binds.buy) {
    const inBuyWindow =
      match.phase === "freeze" ||
      (match.phase === "live" && match.timeLeft > ROUND.roundTime - ROUND.buyTime);
    const wasOpen = ui.buyOpen;
    ui.toggleBuy(player, match.buyAllowed && inBuyWindow);
    if (wasOpen && !ui.buyOpen) lockPointer();
    e.preventDefault();
  }

  if (["Space", "Tab"].includes(e.code)) e.preventDefault();
});

window.addEventListener("keydown", handleMenus);

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (!running || !player) {
    if (ui.mainMenuOpen) {
      const t = now * 0.00015;
      camera.position.set(Math.cos(t) * 28, 11 + Math.sin(t * 0.7) * 1.5, Math.sin(t) * 28);
      camera.lookAt(0, 1.2, 0);
    }
    renderer.render(scene, camera);
    return;
  }

  // Always update light HUD timers visuals when menus open
  if (paused || ui.controlsOpen) {
    ui.updateHud(player, match);
    renderer.render(scene, camera);
    return;
  }

  // Match timing (keeps running during buy menu)
  match.timeLeft -= dt;
  if (match.phase === "freeze") {
    if (match.timeLeft <= 0) {
      match.phase = "live";
      match.timeLeft = ROUND.roundTime;
      ui.showMessage("FIGHT!", 1000);
    }
  } else if (match.phase === "live") {
    if (match.timeLeft <= 0) {
      // time runs out — CT win (no bomb plant: defenders win)
      endRound(TEAM.CT);
    }
    if (match.timeLeft < ROUND.roundTime - ROUND.buyTime) match.buyAllowed = false;
  } else if (match.phase === "end") {
    if (match.timeLeft <= 0) {
      if (match.ctScore >= ROUND.winScore || match.tScore >= ROUND.winScore) {
        startMatch();
        return;
      }
      match.round += 1;
      beginRound(false);
    }
  }

  if (ui.buyOpen) {
    for (const bot of bots) bot.update(dt, true, true);
    ui.updateHud(player, match);
    updateCamera(0);
    renderer.render(scene, camera);
    return;
  }

  const frozen = match.phase === "freeze" || match.phase === "end";
  const canBuy =
    match.buyAllowed &&
    (match.phase === "freeze" ||
      (match.phase === "live" && match.timeLeft > ROUND.roundTime - ROUND.buyTime));

  // Look
  if (document.pointerLockElement && player.alive) {
    const { dx, dy } = input.consumeMouseDelta();
    player.yaw -= dx * sensitivity;
    player.pitch -= dy * sensitivity;
    player.pitch = Math.max(-1.4, Math.min(1.4, player.pitch));
  } else {
    input.consumeMouseDelta();
  }

  // Player actions
  if (player.alive && !frozen) {
    if (input.down("reload")) tryReload(player);
    if (input.down("primary")) trySwitch(player, "primary");
    if (input.down("secondary")) trySwitch(player, "secondary");
    if (input.down("knife")) trySwitch(player, "knife");
    const scroll = input.consumeWheel();
    if (scroll) tryCycle(player, scroll);
  } else {
    input.consumeWheel();
  }

  updatePawnCombat(player, dt);

  const dir = {
    x: (input.down("right") ? 1 : 0) - (input.down("left") ? 1 : 0),
    z: (input.down("forward") ? 1 : 0) - (input.down("back") ? 1 : 0),
  };
  const move = updatePawnMovement(
    player,
    dir,
    input.down("jump"),
    input.down("duck"),
    input.down("walk"),
    world,
    dt,
    frozen || !player.alive
  );

  if (player.alive && !frozen && input.down("fire")) {
    const w = getActiveWeapon(player.loadout);
    if (w && (w.def.automatic || !player._firedSemi)) {
      const shot = tryFire(player, move.moving, move.walking);
      if (shot) processShot(player, { shot });
      if (w && !w.def.automatic) player._firedSemi = true;
    }
  }
  if (!input.down("fire")) player._firedSemi = false;

  // Bots
  for (const bot of bots) {
    const result = bot.update(dt, frozen, canBuy);
    if (result?.shot) processShot(bot.pawn, result);
  }

  updateCamera(dt);
  updateViewmodel(move, dt);
  ui.updateHud(player, match);
  renderer.render(scene, camera);
}

function updateCamera(dt) {
  if (!player) return;
  if (player.alive) {
    getEyePosition(player, _eye);
    camera.position.copy(_eye);
    camera.rotation.order = "YXZ";
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;
    // recoil kick
    const w = getActiveWeapon(player.loadout);
    if (w) camera.rotation.x += w.recoilPitch * 0.15;
  } else {
    // Spectator: free look at death pos
    camera.position.set(player.pos.x, player.pos.y + 1.5, player.pos.z);
  }
}

function updateViewmodel(move, dt) {
  if (!player?.alive) {
    gunView.visible = false;
    return;
  }
  gunView.visible = true;
  const speed = Math.hypot(player.vel.x, player.vel.z);
  bobPhase += dt * (move.moving ? 10 : 2);
  const bob = move.walking ? 0.004 : 0.01;
  gunView.position.x = Math.sin(bobPhase) * bob * Math.min(speed, 6);
  gunView.position.y = Math.abs(Math.cos(bobPhase)) * bob * Math.min(speed, 6);
  if (muzzleFlash > 0) {
    muzzleFlash -= dt;
    gunView.children[1].material.emissive = new THREE.Color(0xffaa44);
    gunView.children[1].material.emissiveIntensity = 2;
  } else {
    gunView.children[1].material.emissiveIntensity = 0;
  }
}

requestAnimationFrame(frame);
