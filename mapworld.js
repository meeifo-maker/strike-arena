/* Triangle-mesh maps (Mirage): rendering, collision, raycasts and bot navigation.
   Map files are produced by tools/build-map.cjs. */
(function (global) {
  const CELL = 2; // collision grid cell size (m)
  const NAV = 0.6; // nav grid spacing (m)
  const STEP = 0.55; // highest ledge a player walks up without jumping
  const WALK = 0.5; // normal.y above this is floor, below -WALK is ceiling, between is wall
  const LEVELS = 4; // stacked floors kept per nav column
  const NAV_R = 0.35; // clearance a nav node needs from walls

  function parse(buf) {
    const dv = new DataView(buf);
    if (String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3)) !== 'SAM1') throw new Error('not a map file');
    const vc = dv.getUint32(4, true), tc = dv.getUint32(8, true), mn = [], mx = [];
    for (let i = 0; i < 3; i++) { mn.push(dv.getFloat32(12 + i * 4, true)); mx.push(dv.getFloat32(24 + i * 4, true)) }
    let o = 36;
    const q = new Uint16Array(buf, o, vc * 3); o += vc * 6;
    const nrm = new Int8Array(buf, o, vc * 3); o += vc * 3;
    const surf = new Uint8Array(buf, o, vc); o += vc;
    o = (o + 3) & ~3;
    const idx = new Uint32Array(buf, o, tc * 3);
    const pos = new Float32Array(vc * 3);
    for (let i = 0; i < vc * 3; i++) { const c = i % 3; pos[i] = mn[c] + (q[i] / 65535) * (mx[c] - mn[c]) }
    return { vc, tc, min: mn, max: mx, pos, nrm, surf, idx };
  }

  function World(d) {
    this.d = d;
    const { tc, pos, nrm, idx, min, max } = d;
    const T = (this.T = new Float32Array(tc * 9)), B = (this.B = new Float32Array(tc * 6)), N = (this.N = new Float32Array(tc * 3));
    const ok = new Uint8Array(tc);
    for (let t = 0; t < tc; t++) {
      const a = idx[t * 3] * 3, b = idx[t * 3 + 1] * 3, c = idx[t * 3 + 2] * 3, o = t * 9;
      T[o] = pos[a]; T[o + 1] = pos[a + 1]; T[o + 2] = pos[a + 2];
      T[o + 3] = pos[b]; T[o + 4] = pos[b + 1]; T[o + 5] = pos[b + 2];
      T[o + 6] = pos[c]; T[o + 7] = pos[c + 1]; T[o + 8] = pos[c + 2];
      const ux = T[o + 3] - T[o], uy = T[o + 4] - T[o + 1], uz = T[o + 5] - T[o + 2], vx = T[o + 6] - T[o], vy = T[o + 7] - T[o + 1], vz = T[o + 8] - T[o + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz);
      if (l < 1e-6) continue;
      nx /= l; ny /= l; nz /= l;
      // Winding isn't reliable in exported maps; the baked vertex normals say which way a face points
      const sx = nrm[a] + nrm[b] + nrm[c], sy = nrm[a + 1] + nrm[b + 1] + nrm[c + 1], sz = nrm[a + 2] + nrm[b + 2] + nrm[c + 2];
      if (nx * sx + ny * sy + nz * sz < 0) { nx = -nx; ny = -ny; nz = -nz }
      N[t * 3] = nx; N[t * 3 + 1] = ny; N[t * 3 + 2] = nz;
      const bo = t * 6;
      B[bo] = Math.min(T[o], T[o + 3], T[o + 6]); B[bo + 1] = Math.max(T[o], T[o + 3], T[o + 6]);
      B[bo + 2] = Math.min(T[o + 1], T[o + 4], T[o + 7]); B[bo + 3] = Math.max(T[o + 1], T[o + 4], T[o + 7]);
      B[bo + 4] = Math.min(T[o + 2], T[o + 5], T[o + 8]); B[bo + 5] = Math.max(T[o + 2], T[o + 5], T[o + 8]);
      ok[t] = 1;
    }
    this.x0 = min[0]; this.z0 = min[2]; this.yMin = min[1]; this.yMax = max[1];
    const gw = (this.gw = Math.ceil((max[0] - min[0]) / CELL) + 1), gh = (this.gh = Math.ceil((max[2] - min[2]) / CELL) + 1);
    const cnt = new Uint32Array(gw * gh + 1);
    const span = (t, f) => {
      const bo = t * 6, i0 = Math.floor((B[bo] - this.x0) / CELL), i1 = Math.floor((B[bo + 1] - this.x0) / CELL), j0 = Math.floor((B[bo + 4] - this.z0) / CELL), j1 = Math.floor((B[bo + 5] - this.z0) / CELL);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) f(j * gw + i);
    };
    for (let t = 0; t < tc; t++) if (ok[t]) span(t, (c) => cnt[c + 1]++);
    for (let c = 0; c < gw * gh; c++) cnt[c + 1] += cnt[c];
    const fill = cnt.slice(0, gw * gh), list = new Uint32Array(cnt[gw * gh]);
    for (let t = 0; t < tc; t++) if (ok[t]) span(t, (c) => { list[fill[c]++] = t });
    this.start = cnt; this.list = list;
    this.stamp = new Uint32Array(tc); this.sid = 0;
  }
  const W = World.prototype;
  W.cell = function (x, z) {
    const i = Math.floor((x - this.x0) / CELL), j = Math.floor((z - this.z0) / CELL);
    return i < 0 || j < 0 || i >= this.gw || j >= this.gh ? -1 : j * this.gw + i;
  };
  W.nextStamp = function () { if (++this.sid > 4e9) { this.stamp.fill(0); this.sid = 1 } return this.sid };
  // Height of triangle t's plane under (x,z), or NaN if (x,z) is outside it
  W.heightOn = function (t, x, z) {
    const T = this.T, o = t * 9, ax = T[o], az = T[o + 2], bx = T[o + 3], bz = T[o + 5], cx = T[o + 6], cz = T[o + 8];
    const d1 = (x - bx) * (az - bz) - (ax - bx) * (z - bz), d2 = (x - cx) * (bz - cz) - (bx - cx) * (z - cz), d3 = (x - ax) * (cz - az) - (cx - ax) * (z - az);
    if ((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)) return NaN;
    const N = this.N, ny = N[t * 3 + 1];
    if (Math.abs(ny) < 1e-4) return NaN;
    return T[o + 1] - (N[t * 3] * (x - ax) + N[t * 3 + 2] * (z - az)) / ny;
  };
  // Highest floor at (x,z) that is not above yTop
  W.ground = function (x, z, yTop) {
    const c = this.cell(x, z);
    if (c < 0) return -Infinity;
    const { B, N, list, start } = this;
    let best = -Infinity;
    for (let k = start[c], e = start[c + 1]; k < e; k++) {
      const t = list[k], bo = t * 6;
      if (N[t * 3 + 1] < WALK || B[bo + 2] > yTop || x < B[bo] || x > B[bo + 1] || z < B[bo + 4] || z > B[bo + 5]) continue;
      const h = this.heightOn(t, x, z);
      if (h <= yTop + 1e-3 && h > best) best = h;
    }
    return best;
  };
  // Lowest ceiling at (x,z) that is not below yBot
  W.ceiling = function (x, z, yBot) {
    const c = this.cell(x, z);
    if (c < 0) return Infinity;
    const { B, N, list, start } = this;
    let best = Infinity;
    for (let k = start[c], e = start[c + 1]; k < e; k++) {
      const t = list[k], bo = t * 6;
      if (N[t * 3 + 1] > -WALK || B[bo + 3] < yBot || x < B[bo] || x > B[bo + 1] || z < B[bo + 4] || z > B[bo + 5]) continue;
      const h = this.heightOn(t, x, z);
      if (h >= yBot && h < best) best = h;
    }
    return best;
  };

  // Walls: the part of each steep triangle inside the body's height band, as seen from above, pushes a
  // vertical cylinder of radius r out. Returns true if the cylinder overlapped anything.
  const CP = new Float64Array(30), CQ = new Float64Array(30);
  function clipBand(T, o, y0, y1) {
    let n = 3;
    for (let k = 0; k < 9; k++) CP[k] = T[o + k];
    for (let pass = 0; pass < 2; pass++) {
      const lim = pass ? y1 : y0, sg = pass ? -1 : 1;
      let m = 0;
      for (let i = 0; i < n; i++) {
        const a = i * 3, b = ((i + 1) % n) * 3, da = (CP[a + 1] - lim) * sg, db = (CP[b + 1] - lim) * sg;
        if (da >= 0) { CQ[m * 3] = CP[a]; CQ[m * 3 + 1] = CP[a + 1]; CQ[m * 3 + 2] = CP[a + 2]; m++ }
        if ((da >= 0) !== (db >= 0)) {
          const s = da / (da - db);
          CQ[m * 3] = CP[a] + (CP[b] - CP[a]) * s; CQ[m * 3 + 1] = lim; CQ[m * 3 + 2] = CP[a + 2] + (CP[b + 2] - CP[a + 2]) * s; m++;
        }
      }
      for (let k = 0; k < m * 3; k++) CP[k] = CQ[k];
      n = m;
      if (!n) return 0;
    }
    return n;
  }
  W.solve = function (o, r, y0, y1, apply) {
    const { B, N, T, list, start } = this;
    let any = false;
    for (let iter = 0; iter < (apply ? 3 : 1); iter++) {
      const sid = this.nextStamp();
      let moved = false;
      const i0 = Math.floor((o.x - r - this.x0) / CELL), i1 = Math.floor((o.x + r - this.x0) / CELL), j0 = Math.floor((o.z - r - this.z0) / CELL), j1 = Math.floor((o.z + r - this.z0) / CELL);
      for (let j = Math.max(0, j0); j <= Math.min(this.gh - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(this.gw - 1, i1); i++) {
        const c = j * this.gw + i;
        for (let k = start[c], e = start[c + 1]; k < e; k++) {
          const t = list[k];
          if (this.stamp[t] === sid) continue;
          this.stamp[t] = sid;
          const ny = N[t * 3 + 1], bo = t * 6;
          if (ny > WALK || ny < -WALK || B[bo + 3] < y0 || B[bo + 2] > y1 || o.x + r < B[bo] || o.x - r > B[bo + 1] || o.z + r < B[bo + 4] || o.z - r > B[bo + 5]) continue;
          const n = clipBand(T, t * 9, y0, y1);
          if (!n) continue;
          // closest point of the clipped polygon's outline (top view) to the body centre
          let bd = Infinity, bx = 0, bz = 0;
          for (let a = 0; a < n; a++) {
            const ax = CP[a * 3], az = CP[a * 3 + 2], b = (a + 1) % n, ex = CP[b * 3] - ax, ez = CP[b * 3 + 2] - az, ll = ex * ex + ez * ez;
            let s = ll > 1e-12 ? ((o.x - ax) * ex + (o.z - az) * ez) / ll : 0;
            s = s < 0 ? 0 : s > 1 ? 1 : s;
            const px = ax + ex * s, pz = az + ez * s, dd = (o.x - px) * (o.x - px) + (o.z - pz) * (o.z - pz);
            if (dd < bd) { bd = dd; bx = px; bz = pz }
          }
          const d = Math.sqrt(bd);
          if (d >= r) continue;
          any = true;
          if (!apply) return true;
          let px, pz;
          if (d > 1e-5) { px = (o.x - bx) / d; pz = (o.z - bz) / d } else {
            const nx = N[t * 3], nz = N[t * 3 + 2], l = Math.hypot(nx, nz) || 1; px = nx / l; pz = nz / l;
          }
          o.x += px * (r - d + 1e-4); o.z += pz * (r - d + 1e-4); moved = true;
        }
      }
      if (!moved) break;
    }
    return any;
  };
  W.push = function (o, r, y0, y1) { return this.solve(o, r, y0, y1, true) };
  W.blocked = function (x, z, r, y0, y1) { return this.solve({ x, z }, r, y0, y1, false) };

  // Nearest hit along a ray; returns {t, tri} or null. Walks the grid cells the ray crosses (top view).
  W.raycast = function (ox, oy, oz, dx, dy, dz, far) {
    const { T, list, start } = this;
    const sid = this.nextStamp();
    let best = far, bt = -1;
    let i = Math.floor((ox - this.x0) / CELL), j = Math.floor((oz - this.z0) / CELL);
    const si = dx > 0 ? 1 : -1, sj = dz > 0 ? 1 : -1;
    const tdx = Math.abs(dx) > 1e-9 ? CELL / Math.abs(dx) : Infinity, tdz = Math.abs(dz) > 1e-9 ? CELL / Math.abs(dz) : Infinity;
    let tx = Math.abs(dx) > 1e-9 ? ((i + (dx > 0 ? 1 : 0)) * CELL + this.x0 - ox) / dx : Infinity;
    let tz = Math.abs(dz) > 1e-9 ? ((j + (dz > 0 ? 1 : 0)) * CELL + this.z0 - oz) / dz : Infinity;
    let tEnter = 0;
    for (let guard = this.gw + this.gh + 4; guard > 0 && tEnter <= best; guard--) {
      if (i >= 0 && j >= 0 && i < this.gw && j < this.gh) {
        const c = j * this.gw + i;
        for (let k = start[c], e = start[c + 1]; k < e; k++) {
          const t = list[k];
          if (this.stamp[t] === sid) continue;
          this.stamp[t] = sid;
          const o = t * 9;
          const e1x = T[o + 3] - T[o], e1y = T[o + 4] - T[o + 1], e1z = T[o + 5] - T[o + 2], e2x = T[o + 6] - T[o], e2y = T[o + 7] - T[o + 1], e2z = T[o + 8] - T[o + 2];
          const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x, det = e1x * px + e1y * py + e1z * pz;
          if (det > -1e-9 && det < 1e-9) continue;
          const inv = 1 / det, sx = ox - T[o], sy = oy - T[o + 1], sz = oz - T[o + 2], u = (sx * px + sy * py + sz * pz) * inv;
          if (u < 0 || u > 1) continue;
          const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x, v = (dx * qx + dy * qy + dz * qz) * inv;
          if (v < 0 || u + v > 1) continue;
          const tt = (e2x * qx + e2y * qy + e2z * qz) * inv;
          if (tt > 1e-4 && tt < best) { best = tt; bt = t }
        }
      } else if ((i < 0 && si < 0) || (j < 0 && sj < 0) || (i >= this.gw && si > 0) || (j >= this.gh && sj > 0)) break;
      if (tx < tz) { tEnter = tx; tx += tdx; i += si } else { tEnter = tz; tz += tdz; j += sj }
    }
    return bt < 0 ? null : { t: best, tri: bt };
  };

  // ---------- navigation: grid of standable spots, up to LEVELS stacked floors per column ----------
  W.buildNav = function (onDone) {
    const nw = (this.nw = Math.floor((this.gw * CELL) / NAV)), nh = (this.nh = Math.floor((this.gh * CELL) / NAV));
    const H = (this.navH = new Float32Array(nw * nh * LEVELS).fill(NaN));
    const { B, N, list, start } = this, ups = [], all = [];
    let col = 0;
    const slice = () => {
      const until = performance.now() + 25;
      for (; col < nw * nh && performance.now() < until; col++) {
        const ci = col % nw, cj = (col / nw) | 0, x = this.x0 + (ci + 0.5) * NAV, z = this.z0 + (cj + 0.5) * NAV, c = this.cell(x, z);
        if (c < 0) continue;
        ups.length = 0; all.length = 0;
        for (let k = start[c], e = start[c + 1]; k < e; k++) {
          const t = list[k], bo = t * 6, ny = N[t * 3 + 1];
          if (ny < WALK && ny > -WALK) continue;
          if (x < B[bo] || x > B[bo + 1] || z < B[bo + 4] || z > B[bo + 5]) continue;
          const h = this.heightOn(t, x, z);
          if (h !== h) continue;
          all.push(h);
          if (ny >= WALK) ups.push(h);
        }
        ups.sort((a, b) => b - a);
        let lv = 0, last = Infinity;
        for (const h of ups) {
          if (lv >= LEVELS) break;
          if (last - h < 0.1) continue;
          last = h;
          let clear = true;
          for (const q of all) if (q > h + 0.08 && q < h + 1.75) { clear = false; break }
          if (!clear || this.blocked(x, z, NAV_R, h + STEP, h + 1.7)) continue;
          H[col * LEVELS + lv++] = h;
        }
      }
      if (col < nw * nh) setTimeout(slice, 0);
      else { this.navReady = true; onDone && onDone() }
    };
    slice();
  };
  W.navXZ = function (n) { const col = (n / LEVELS) | 0; return [this.x0 + ((col % this.nw) + 0.5) * NAV, this.navH[n], this.z0 + (((col / this.nw) | 0) + 0.5) * NAV] };
  // Nav node nearest to a point, preferring the floor closest in height
  W.nearestNode = function (x, y, z, rad) {
    const ci = Math.floor((x - this.x0) / NAV), cj = Math.floor((z - this.z0) / NAV), R = rad || 4, H = this.navH;
    let best = -1, bd = Infinity;
    for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) {
      const i = ci + di, j = cj + dj;
      if (i < 0 || j < 0 || i >= this.nw || j >= this.nh) continue;
      for (let l = 0; l < LEVELS; l++) {
        const n = (j * this.nw + i) * LEVELS + l, h = H[n];
        if (h !== h) break;
        const dh = Math.abs(h - y), d = (di * di + dj * dj) * NAV * NAV + dh * dh * 4 + (dh > 1.2 ? 100 : 0);
        if (d < bd) { bd = d; best = n }
      }
    }
    return best;
  };
  // A* over the nav grid. Typed-array heap and no per-node allocation: a cross-map search must fit in a frame.
  W.findPath = function (x0, y0, z0, x1, y1, z1) {
    if (!this.navReady) return null;
    const s = this.nearestNode(x0, y0, z0, 4), g = this.nearestNode(x1, y1, z1, 6);
    if (s < 0 || g < 0) return null;
    const H = this.navH, total = H.length, nw = this.nw, nh = this.nh;
    if (!this.gS) { this.gS = new Float32Array(total); this.from = new Int32Array(total); this.seen = new Uint32Array(total); this.closed = new Uint32Array(total); this.seenId = 0; this.hk = new Float32Array(1 << 16); this.hv = new Int32Array(1 << 16) }
    const id = ++this.seenId, gS = this.gS, from = this.from, seen = this.seen, closed = this.closed;
    let hk = this.hk, hv = this.hv, hn = 0;
    const gc = g >> 2, gi = gc % nw, gj = (gc / nw) | 0, gy = H[g];
    const heur = (i, j, y) => { const dx = (i - gi) * NAV, dz = (j - gj) * NAV, dy = (y - gy) * 2; return Math.sqrt(dx * dx + dz * dz + dy * dy) };
    const push = (f, n) => {
      if (hn >= hk.length) { const k2 = new Float32Array(hk.length * 2), v2 = new Int32Array(hk.length * 2); k2.set(hk); v2.set(hv); this.hk = hk = k2; this.hv = hv = v2 }
      let i = hn++;
      while (i > 0) { const p = (i - 1) >> 1; if (hk[p] <= f) break; hk[i] = hk[p]; hv[i] = hv[p]; i = p }
      hk[i] = f; hv[i] = n;
    };
    const pop = () => {
      const top = hv[0], lk = hk[--hn], lv = hv[hn];
      let i = 0;
      for (;;) { let c = i * 2 + 1; if (c >= hn) break; if (c + 1 < hn && hk[c + 1] < hk[c]) c++; if (hk[c] >= lk) break; hk[i] = hk[c]; hv[i] = hv[c]; i = c }
      hk[i] = lk; hv[i] = lv;
      return top;
    };
    const sc = s >> 2;
    seen[s] = id; gS[s] = 0; from[s] = -1; push(heur(sc % nw, (sc / nw) | 0, H[s]), s);
    let found = false, expanded = 0;
    while (hn && expanded < 40000) {
      const n = pop();
      if (n === g) { found = true; break }
      if (closed[n] === id) continue;
      closed[n] = id; expanded++;
      const col = n >> 2, ci = col % nw, cj = (col / nw) | 0, h = H[n], gn = gS[n];
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const m = this.step(ci + di, cj + dj, h);
        if (m < 0 || closed[m] === id) continue;
        if (di && dj && (this.step(ci + di, cj, h) < 0 || this.step(ci, cj + dj, h) < 0)) continue;
        const hm = H[m], cost = gn + (di && dj ? NAV * 1.4142 : NAV) + Math.abs(hm - h) * 1.5;
        if (seen[m] === id && gS[m] <= cost) continue;
        seen[m] = id; gS[m] = cost; from[m] = n;
        push(cost + heur(ci + di, cj + dj, hm), m);
      }
    }
    if (!found) return null;
    const pts = [];
    for (let n = g; n >= 0; n = from[n]) pts.push(this.navXZ(n));
    pts.reverse();
    return this.simplify(pts);
  };
  // Node in column (i,j) reachable from height h by walking (step up ≤ STEP) or dropping (≤ 3m)
  W.step = function (i, j, h) {
    if (i < 0 || j < 0 || i >= this.nw || j >= this.nh) return -1;
    const H = this.navH, base = (j * this.nw + i) * LEVELS;
    let best = -1, bd = Infinity;
    for (let l = 0; l < LEVELS; l++) {
      const g = H[base + l];
      if (g !== g) break;
      const up = g - h;
      if (up > STEP || up < -3) continue;
      const d = up < 0 ? -up : up;
      if (d < bd) { bd = d; best = base + l }
    }
    return best;
  };
  // Straight walk from a to b stays on standable nav spots at a continuous height
  W.walkable = function (a, b) {
    const d = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.ceil(d / (NAV * 0.5));
    let y = a[1];
    for (let k = 1; k <= n; k++) {
      const s = k / n, i = Math.floor((a[0] + (b[0] - a[0]) * s - this.x0) / NAV), j = Math.floor((a[2] + (b[2] - a[2]) * s - this.z0) / NAV);
      const m = this.step(i, j, y);
      if (m < 0 || this.navH[m] < y - 0.6) return false;
      y = this.navH[m];
    }
    return Math.abs(y - b[1]) < 0.6;
  };
  // Drop waypoints that a straight walk can skip
  W.simplify = function (pts) {
    if (pts.length < 3) return pts;
    const out = [pts[0]];
    let i = 0;
    while (i < pts.length - 1) {
      let j = i + 1;
      while (j + 1 < pts.length && j - i < 30 && this.walkable(pts[i], pts[j + 1])) j++;
      out.push(pts[j]); i = j;
    }
    return out;
  };
  // Random standable spots within rad of (x,z), near height y, spread at least gap apart
  W.spotsNear = function (x, y, z, rad, count, gap) {
    const cand = [], R = Math.ceil(rad / NAV), ci = Math.floor((x - this.x0) / NAV), cj = Math.floor((z - this.z0) / NAV), H = this.navH;
    for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) {
      if ((di * di + dj * dj) * NAV * NAV > rad * rad) continue;
      const i = ci + di, j = cj + dj;
      if (i < 0 || j < 0 || i >= this.nw || j >= this.nh) continue;
      for (let l = 0; l < LEVELS; l++) { const n = (j * this.nw + i) * LEVELS + l, h = H[n]; if (h !== h) break; if (Math.abs(h - y) < 1.5) cand.push(this.navXZ(n)) }
    }
    for (let k = cand.length - 1; k > 0; k--) { const r = (Math.random() * (k + 1)) | 0; [cand[k], cand[r]] = [cand[r], cand[k]] }
    const out = [];
    for (const p of cand) { if (out.length >= count) break; if (out.every((q) => Math.hypot(q[0] - p[0], q[2] - p[2]) >= gap)) out.push(p) }
    return out;
  };

  // ---------- rendering ----------
  const SURF_RGB = [[0.76, 0.66, 0.52], [0.83, 0.76, 0.64], [0.3, 0.27, 0.24], [0.5, 0.34, 0.2], [0.42, 0.44, 0.47]];
  function canvasTex(draw, size) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    draw(c.getContext('2d'), size);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
  }
  function speckle(x, s, n, a) { for (let i = 0; i < n; i++) { x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '0,0,0' : '255,255,255') + ',' + Math.random() * a + ')'; x.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 2) } }
  // Sandstone blocks (walls) and worn paving (floors); greyscale, tinted per surface by vertex colour
  const wallTex = () => canvasTex((x, s) => {
    x.fillStyle = '#e8e8e8'; x.fillRect(0, 0, s, s);
    for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '120,110,100' : '255,255,255') + ',' + Math.random() * 0.12 + ')'; x.beginPath(); x.ellipse(Math.random() * s, Math.random() * s, 20 + Math.random() * 70, 10 + Math.random() * 40, Math.random() * 3, 0, 7); x.fill() }
    speckle(x, s, 9000, 0.08);
    x.strokeStyle = 'rgba(70,60,50,.28)'; x.lineWidth = 2;
    const rows = 4, bh = s / rows;
    for (let r = 0; r < rows; r++) { const y = r * bh; x.beginPath(); x.moveTo(0, y); x.lineTo(s, y); x.stroke(); const off = r % 2 ? s / 4 : 0; for (let q = 0; q < 2; q++) { const xx = off + q * s / 2; x.beginPath(); x.moveTo(xx, y); x.lineTo(xx, y + bh); x.stroke() } }
  }, 512);
  const floorTex = () => canvasTex((x, s) => {
    x.fillStyle = '#d0d0d0'; x.fillRect(0, 0, s, s);
    const n = 4, w = s / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const v = 190 + Math.random() * 50 | 0; x.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; x.fillRect(i * w + 2, j * w + 2, w - 4, w - 4) }
    speckle(x, s, 12000, 0.1);
    for (let i = 0; i < 18; i++) { x.fillStyle = 'rgba(90,80,70,' + Math.random() * 0.1 + ')'; x.beginPath(); x.ellipse(Math.random() * s, Math.random() * s, 15 + Math.random() * 50, 8 + Math.random() * 30, Math.random() * 3, 0, 7); x.fill() }
  }, 512);
  function makeMaterial() {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0, envMapIntensity: 0.5 });
    const tWall = wallTex(), tFloor = floorTex();
    m.onBeforeCompile = (sh) => {
      sh.uniforms.tWall = { value: tWall }; sh.uniforms.tFloor = { value: tFloor };
      sh.vertexShader = 'varying vec3 vWP;\nvarying vec3 vWN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP=(modelMatrix*vec4(position,1.)).xyz;vWN=normalize(mat3(modelMatrix)*normal);');
      sh.fragmentShader = 'uniform sampler2D tWall;\nuniform sampler2D tFloor;\nvarying vec3 vWP;\nvarying vec3 vWN;\n' + sh.fragmentShader.replace('#include <map_fragment>', [
        'vec3 bw=pow(abs(normalize(vWN)),vec3(4.));bw/=bw.x+bw.y+bw.z;',
        'vec3 wc=texture2D(tWall,vec2(vWP.z,vWP.y)*.42).rgb*bw.x+texture2D(tWall,vWP.xz*.42).rgb*bw.y+texture2D(tWall,vec2(vWP.x,vWP.y)*.42).rgb*bw.z;',
        'vec3 fc=texture2D(tFloor,vWP.xz*.5).rgb*vec3(.93,.9,.86);',
        'diffuseColor.rgb*=mix(wc,fc,smoothstep(.65,.9,vWN.y));',
      ].join('\n'));
    };
    return m;
  }
  function buildMeshes(d, chunks) {
    const { vc, tc, pos, nrm, surf, idx, min, max } = d;
    const geoPos = new THREE.BufferAttribute(pos, 3), geoN = new THREE.BufferAttribute(nrm, 3, true);
    const col = new Uint8Array(vc * 3);
    for (let i = 0; i < vc; i++) { const c = SURF_RGB[surf[i]] || SURF_RGB[0]; col[i * 3] = c[0] * 255; col[i * 3 + 1] = c[1] * 255; col[i * 3 + 2] = c[2] * 255 }
    const geoC = new THREE.BufferAttribute(col, 3, true);
    const sx = (max[0] - min[0]) / chunks, sz = (max[2] - min[2]) / chunks, buckets = Array.from({ length: chunks * chunks }, () => []);
    for (let t = 0; t < tc; t++) {
      const a = idx[t * 3] * 3, b = idx[t * 3 + 1] * 3, c = idx[t * 3 + 2] * 3;
      const cx = (pos[a] + pos[b] + pos[c]) / 3, cz = (pos[a + 2] + pos[b + 2] + pos[c + 2]) / 3;
      const i = Math.min(chunks - 1, Math.max(0, ((cx - min[0]) / sx) | 0)), j = Math.min(chunks - 1, Math.max(0, ((cz - min[2]) / sz) | 0));
      buckets[j * chunks + i].push(t);
    }
    const mat = makeMaterial(), meshes = [];
    for (const tris of buckets) {
      if (!tris.length) continue;
      const ix = new Uint32Array(tris.length * 3), box = new THREE.Box3();
      const v = new THREE.Vector3();
      tris.forEach((t, k) => { for (let q = 0; q < 3; q++) { const vi = idx[t * 3 + q]; ix[k * 3 + q] = vi; box.expandByPoint(v.set(pos[vi * 3], pos[vi * 3 + 1], pos[vi * 3 + 2])) } });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', geoPos); g.setAttribute('normal', geoN); g.setAttribute('color', geoC); g.setIndex(new THREE.BufferAttribute(ix, 1));
      g.boundingBox = box; g.boundingSphere = box.getBoundingSphere(new THREE.Sphere());
      const m = new THREE.Mesh(g, mat);
      m.castShadow = m.receiveShadow = true; m.matrixAutoUpdate = false;
      meshes.push(m);
    }
    return meshes;
  }

  // Raycaster stand-in so existing intersectObjects(...) calls hit the map through the grid
  function makeProxy(world) {
    const proxy = new THREE.Object3D();
    proxy.name = 'mapCollision';
    proxy.raycast = (rc, out) => {
      const r = rc.ray, far = Math.min(rc.far, 1000);
      const h = world.raycast(r.origin.x, r.origin.y, r.origin.z, r.direction.x, r.direction.y, r.direction.z, far);
      if (!h || h.t < rc.near) return;
      const N = world.N, nm = new THREE.Vector3(N[h.tri * 3], N[h.tri * 3 + 1], N[h.tri * 3 + 2]);
      if (nm.dot(r.direction) > 0) nm.negate();
      out.push({ distance: h.t, point: r.at(h.t, new THREE.Vector3()), object: proxy, face: { normal: nm } });
    };
    return proxy;
  }

  function load(buf, opts) {
    const d = parse(buf), world = new World(d);
    world.meshes = buildMeshes(d, (opts && opts.chunks) || 6);
    world.proxy = makeProxy(world);
    world.STEP = STEP;
    return world;
  }

  global.MapWorld = { load, parse, World };
})(typeof window !== 'undefined' ? window : globalThis);
