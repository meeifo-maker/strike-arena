import { WEAPONS, BUY_CATEGORIES } from "./config.js";
import { makeInstance, getActiveWeapon } from "./weapons.js";

export class UI {
  constructor(input) {
    this.input = input;
    this.buyCategory = "rifles";
    this.buyOpen = false;
    this.controlsOpen = false;
    this.pauseOpen = false;
    this.onBuy = null;
    this.onResume = null;
    this.onRestart = null;

    this.els = {
      hud: document.getElementById("hud"),
      start: document.getElementById("start-screen"),
      play: document.getElementById("play-btn"),
      hp: document.getElementById("hp"),
      armor: document.getElementById("armor"),
      money: document.getElementById("money"),
      clip: document.getElementById("ammo-clip"),
      reserve: document.getElementById("ammo-reserve"),
      weaponName: document.getElementById("weapon-name"),
      ctScore: document.getElementById("ct-score"),
      tScore: document.getElementById("t-score"),
      timer: document.getElementById("timer"),
      roundNum: document.getElementById("round-num"),
      killfeed: document.getElementById("killfeed"),
      center: document.getElementById("center-msg"),
      buy: document.getElementById("buy-menu"),
      buyCats: document.getElementById("buy-categories"),
      buyItems: document.getElementById("buy-items"),
      buyMoney: document.getElementById("buy-money"),
      controls: document.getElementById("controls-menu"),
      bindings: document.getElementById("bindings-list"),
      resetBinds: document.getElementById("reset-binds"),
      pause: document.getElementById("pause-menu"),
      resume: document.getElementById("resume-btn"),
      controlsBtn: document.getElementById("controls-btn"),
      restart: document.getElementById("restart-btn"),
    };

    this.els.play.addEventListener("click", () => this.onPlay?.());
    this.els.resume.addEventListener("click", () => this.onResume?.());
    this.els.restart.addEventListener("click", () => this.onRestart?.());
    this.els.controlsBtn.addEventListener("click", () => this.openControls());
    this.els.resetBinds.addEventListener("click", () => {
      this.input.reset();
      this.renderBindings();
    });

    this.input.onBindChange = () => this.renderBindings();
    this.renderBuyCategories();
    this.renderBindings();
  }

  showHud() {
    this.els.start.classList.add("hidden");
    this.els.hud.classList.remove("hidden");
  }

  updateHud(player, match) {
    this.els.hp.textContent = Math.max(0, Math.ceil(player.hp));
    this.els.armor.textContent = Math.max(0, Math.ceil(player.armor));
    this.els.money.textContent = Math.floor(player.money);
    this.els.ctScore.textContent = match.ctScore;
    this.els.tScore.textContent = match.tScore;
    this.els.roundNum.textContent = match.round;
    this.els.timer.textContent = formatTime(match.timeLeft);

    const w = getActiveWeapon(player.loadout);
    if (w) {
      this.els.weaponName.textContent = w.def.name;
      if (w.def.clip === Infinity) {
        this.els.clip.textContent = "—";
        this.els.reserve.textContent = "—";
      } else {
        this.els.clip.textContent = w.clip;
        this.els.reserve.textContent = w.reserve;
      }
    }
    if (this.buyOpen) {
      this.els.buyMoney.textContent = Math.floor(player.money);
      this.renderBuyItems(player);
    }
  }

  showMessage(text, ms = 2200) {
    this.els.center.textContent = text;
    this.els.center.classList.add("show");
    clearTimeout(this._msgTimer);
    this._msgTimer = setTimeout(() => this.els.center.classList.remove("show"), ms);
  }

  addKill(attacker, victim, weapon) {
    const row = document.createElement("div");
    row.className = "kill-entry";
    row.textContent = `${attacker}  [${weapon}]  ${victim}`;
    this.els.killfeed.prepend(row);
    setTimeout(() => row.remove(), 4000);
  }

  toggleBuy(player, allowed) {
    if (this.buyOpen) {
      this.closeBuy();
      return;
    }
    if (!allowed) {
      this.showMessage("BUY TIME OVER", 1200);
      return;
    }
    this.closePause();
    this.closeControls();
    this.buyOpen = true;
    this.els.buy.classList.remove("hidden");
    this.els.buyMoney.textContent = Math.floor(player.money);
    this.renderBuyItems(player);
    // Flag before unlock so pointerlockchange does not open pause
    document.exitPointerLock?.();
  }

  closeBuy() {
    this.buyOpen = false;
    this.els.buy.classList.add("hidden");
  }

  isBlockingGameplay() {
    return this.buyOpen || this.controlsOpen || this.pauseOpen;
  }

  renderBuyCategories() {
    this.els.buyCats.innerHTML = "";
    BUY_CATEGORIES.forEach((c, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cat-btn" + (c.id === this.buyCategory ? " active" : "");
      btn.textContent = c.label;
      btn.addEventListener("click", () => {
        this.buyCategory = c.id;
        this.renderBuyCategories();
        this.onBuy?.(null);
      });
      this.els.buyCats.appendChild(btn);
      // number hotkeys handled in main via Digit1-5 while buy open
      btn.dataset.index = String(i + 1);
    });
  }

  setBuyCategoryByIndex(index, player) {
    const cat = BUY_CATEGORIES[index - 1];
    if (!cat) return;
    this.buyCategory = cat.id;
    this.renderBuyCategories();
    this.renderBuyItems(player);
  }

  renderBuyItems(player) {
    this.els.buyItems.innerHTML = "";
    const items = Object.values(WEAPONS).filter((w) => {
      if (w.category !== this.buyCategory) return false;
      if (w.team && w.team !== player.team) return false;
      if (w.id === "knife") return false;
      return true;
    });

    items.forEach((def, idx) => {
      const row = document.createElement("div");
      const cannot = player.money < def.price || !player.alive;
      row.className = "buy-item" + (cannot ? " disabled" : "");
      row.innerHTML = `<span>${idx + 1}. ${def.name}</span><span class="price">$${def.price}</span>`;
      row.addEventListener("click", () => {
        if (!cannot) this.onBuy?.(def.id);
      });
      this.els.buyItems.appendChild(row);
    });
  }

  tryBuy(player, weaponId) {
    const def = WEAPONS[weaponId];
    if (!def || player.money < def.price || !player.alive) return false;

    if (def.slot === "gear") {
      if (def.armor) {
        player.loadout.armor = def.armor;
        player.armor = def.armor;
      }
      if (def.helmet) {
        player.loadout.helmet = true;
        player.helmet = true;
      }
      player.money -= def.price;
      return true;
    }

    const inst = makeInstance(weaponId);
    if (def.slot === "primary") {
      player.loadout.primary = inst;
      player.loadout.active = "primary";
    } else if (def.slot === "secondary") {
      player.loadout.secondary = inst;
      player.loadout.active = "secondary";
    }
    player.money -= def.price;
    return true;
  }

  openPause() {
    this.closeBuy();
    this.pauseOpen = true;
    this.els.pause.classList.remove("hidden");
    document.exitPointerLock?.();
  }

  closePause() {
    this.pauseOpen = false;
    this.els.pause.classList.add("hidden");
  }

  openControls() {
    this.controlsOpen = true;
    this.els.controls.classList.remove("hidden");
    this.els.pause.classList.add("hidden");
    this.renderBindings();
  }

  closeControls() {
    this.controlsOpen = false;
    this.input.listening = null;
    this.els.controls.classList.add("hidden");
  }

  renderBindings() {
    this.els.bindings.innerHTML = "";
    for (const row of this.input.getBindingRows()) {
      const el = document.createElement("div");
      el.className = "binding-row";
      const key = document.createElement("button");
      key.type = "button";
      key.className = "key" + (row.listening ? " listening" : "");
      key.textContent = row.listening ? "Press key…" : row.display;
      key.addEventListener("click", () => this.input.startListen(row.action));
      el.innerHTML = `<span class="action">${row.label}</span>`;
      el.appendChild(key);
      this.els.bindings.appendChild(el);
    }
  }

  anyMenuOpen() {
    return this.buyOpen || this.controlsOpen || this.pauseOpen;
  }
}

function formatTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
