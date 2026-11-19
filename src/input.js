import { DEFAULT_BINDS, BIND_LABELS } from "./config.js";

const STORAGE_KEY = "cs2-arena-binds";

export class Input {
  constructor() {
    this.binds = { ...DEFAULT_BINDS };
    this.load();
    this.keys = new Set();
    this.mouseButtons = new Set();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.wheel = 0;
    this.listening = null;
    this.onBindChange = null;

    window.addEventListener("keydown", (e) => this.onKeyDown(e));
    window.addEventListener("keyup", (e) => this.onKeyUp(e));
    window.addEventListener("mousedown", (e) => {
      if (this.listening) {
        e.preventDefault();
        this.setBind(this.listening, `Mouse${e.button}`);
        return;
      }
      this.mouseButtons.add(`Mouse${e.button}`);
    });
    window.addEventListener("mouseup", (e) => {
      this.mouseButtons.delete(`Mouse${e.button}`);
    });
    window.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement) {
        this.mouseDX += e.movementX;
        this.mouseDY += e.movementY;
      }
    });
    window.addEventListener(
      "wheel",
      (e) => {
        if (!document.pointerLockElement) return;
        e.preventDefault();
        // One notch per event; sign matches CS (down = next)
        const step = Math.sign(e.deltaY);
        if (step) this.wheel += step;
      },
      { passive: false }
    );
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.binds = { ...DEFAULT_BINDS, ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.binds));
  }

  reset() {
    this.binds = { ...DEFAULT_BINDS };
    this.save();
    this.onBindChange?.();
  }

  setBind(action, code) {
    for (const [k, v] of Object.entries(this.binds)) {
      if (v === code && k !== action) this.binds[k] = "";
    }
    this.binds[action] = code;
    this.listening = null;
    this.save();
    this.onBindChange?.();
  }

  startListen(action) {
    this.listening = action;
    this.onBindChange?.();
  }

  onKeyDown(e) {
    if (this.listening) {
      e.preventDefault();
      if (e.code === "Escape") {
        this.listening = null;
        this.onBindChange?.();
        return;
      }
      this.setBind(this.listening, e.code);
      return;
    }
    this.keys.add(e.code);
  }

  onKeyUp(e) {
    this.keys.delete(e.code);
  }

  down(action) {
    const code = this.binds[action];
    if (!code) return false;
    if (code.startsWith("Mouse")) return this.mouseButtons.has(code);
    return this.keys.has(code);
  }

  consumeMouseDelta() {
    const dx = this.mouseDX;
    const dy = this.mouseDY;
    this.mouseDX = 0;
    this.mouseDY = 0;
    return { dx, dy };
  }

  consumeWheel() {
    const w = this.wheel;
    this.wheel = 0;
    return w;
  }

  codeLabel(code) {
    if (!code) return "—";
    if (code.startsWith("Mouse")) {
      const n = code.slice(5);
      return ["LMB", "MMB", "RMB"][Number(n)] || code;
    }
    return code
      .replace("Key", "")
      .replace("Digit", "")
      .replace("Left", "")
      .replace("Right", "")
      .replace("Control", "Ctrl")
      .replace("Shift", "Shift")
      .replace("Space", "Space");
  }

  getBindingRows() {
    return Object.keys(BIND_LABELS).map((action) => ({
      action,
      label: BIND_LABELS[action],
      code: this.binds[action],
      display: this.codeLabel(this.binds[action]),
      listening: this.listening === action,
    }));
  }
}
