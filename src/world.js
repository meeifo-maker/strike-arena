import * as THREE from "three";

const WALL_MAT = new THREE.MeshStandardMaterial({
  color: 0x3a4654,
  roughness: 0.85,
  metalness: 0.1,
});
const FLOOR_MAT = new THREE.MeshStandardMaterial({
  color: 0x2a3038,
  roughness: 0.95,
  metalness: 0.05,
});
const ACCENT_CT = new THREE.MeshStandardMaterial({
  color: 0x2c5a7a,
  roughness: 0.7,
  metalness: 0.2,
});
const ACCENT_T = new THREE.MeshStandardMaterial({
  color: 0x6b5420,
  roughness: 0.7,
  metalness: 0.2,
});
const BOX_MAT = new THREE.MeshStandardMaterial({
  color: 0x4a5560,
  roughness: 0.8,
  metalness: 0.15,
});

function box(w, h, d, x, y, z, mat = WALL_MAT) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return { mesh, min: new THREE.Vector3(x - w / 2, y - h / 2, z - d / 2), max: new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2) };
}

export class World {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.spawns = { CT: [], T: [] };
    this.build();
  }

  addCollider(entry) {
    this.scene.add(entry.mesh);
    this.colliders.push({ min: entry.min, max: entry.max });
  }

  build() {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), FLOOR_MAT);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const grid = new THREE.GridHelper(80, 40, 0x1a222c, 0x1a222c);
    grid.position.y = 0.01;
    this.scene.add(grid);

    // Outer walls
    this.addCollider(box(80, 5, 1, 0, 2.5, -30));
    this.addCollider(box(80, 5, 1, 0, 2.5, 30));
    this.addCollider(box(1, 5, 60, -40, 2.5, 0));
    this.addCollider(box(1, 5, 60, 40, 2.5, 0));

    // Mid connectors / cover
    this.addCollider(box(12, 3.2, 1.2, -8, 1.6, 0, BOX_MAT));
    this.addCollider(box(12, 3.2, 1.2, 8, 1.6, 0, BOX_MAT));
    this.addCollider(box(1.2, 3.2, 10, 0, 1.6, -8, BOX_MAT));
    this.addCollider(box(1.2, 3.2, 10, 0, 1.6, 8, BOX_MAT));

    // Site A (CT side-ish negative Z)
    this.addCollider(box(8, 2.4, 1, -18, 1.2, -18, ACCENT_CT));
    this.addCollider(box(1, 2.4, 8, -22, 1.2, -14, ACCENT_CT));
    this.addCollider(box(6, 1.2, 3, -14, 0.6, -22, BOX_MAT));
    this.addCollider(box(3, 2, 3, -6, 1, -20, BOX_MAT));

    // Site B (positive X)
    this.addCollider(box(8, 2.4, 1, 18, 1.2, 18, ACCENT_T));
    this.addCollider(box(1, 2.4, 8, 22, 1.2, 14, ACCENT_T));
    this.addCollider(box(6, 1.2, 3, 14, 0.6, 22, BOX_MAT));
    this.addCollider(box(3, 2, 3, 6, 1, 20, BOX_MAT));

    // Long corridor walls
    this.addCollider(box(1.5, 3.5, 18, -28, 1.75, -5, WALL_MAT));
    this.addCollider(box(1.5, 3.5, 18, 28, 1.75, 5, WALL_MAT));
    this.addCollider(box(18, 3.5, 1.5, -5, 1.75, -24, WALL_MAT));
    this.addCollider(box(18, 3.5, 1.5, 5, 1.75, 24, WALL_MAT));

    // Ramp-like blocks / crates
    const crates = [
      [-12, 0.6, -6, 2.2, 1.2, 2.2],
      [-10, 1.3, -6, 1.6, 1.2, 1.6],
      [12, 0.6, 6, 2.2, 1.2, 2.2],
      [10, 1.3, 6, 1.6, 1.2, 1.6],
      [-20, 0.7, 8, 2.5, 1.4, 2.5],
      [20, 0.7, -8, 2.5, 1.4, 2.5],
      [0, 0.5, -16, 3, 1, 2],
      [0, 0.5, 16, 3, 1, 2],
    ];
    for (const [x, y, z, w, h, d] of crates) {
      this.addCollider(box(w, h, d, x, y, z, BOX_MAT));
    }

    // Ambient props (non-blocking markers)
    const lightPole = (x, z) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x22262c })
      );
      pole.position.set(x, 2, z);
      pole.castShadow = true;
      this.scene.add(pole);
      const lamp = new THREE.PointLight(0xffe6c2, 1.2, 18, 2);
      lamp.position.set(x, 3.8, z);
      this.scene.add(lamp);
    };
    lightPole(-25, -20);
    lightPole(25, 20);
    lightPole(-25, 20);
    lightPole(25, -20);
    lightPole(0, 0);

    // Spawns
    this.spawns.CT = [
      { x: -30, z: -22, yaw: Math.PI / 4 },
      { x: -32, z: -18, yaw: Math.PI / 4 },
      { x: -28, z: -20, yaw: Math.PI / 4 },
      { x: -34, z: -24, yaw: Math.PI / 4 },
      { x: -26, z: -24, yaw: Math.PI / 4 },
    ];
    this.spawns.T = [
      { x: 30, z: 22, yaw: (-3 * Math.PI) / 4 },
      { x: 32, z: 18, yaw: (-3 * Math.PI) / 4 },
      { x: 28, z: 20, yaw: (-3 * Math.PI) / 4 },
      { x: 34, z: 24, yaw: (-3 * Math.PI) / 4 },
      { x: 26, z: 24, yaw: (-3 * Math.PI) / 4 },
    ];

    // Site floor markers
    const aSite = new THREE.Mesh(
      new THREE.CircleGeometry(3.5, 24),
      new THREE.MeshStandardMaterial({ color: 0x1e4d6b, transparent: true, opacity: 0.35 })
    );
    aSite.rotation.x = -Math.PI / 2;
    aSite.position.set(-16, 0.02, -16);
    this.scene.add(aSite);

    const bSite = new THREE.Mesh(
      new THREE.CircleGeometry(3.5, 24),
      new THREE.MeshStandardMaterial({ color: 0x6b4e14, transparent: true, opacity: 0.35 })
    );
    bSite.rotation.x = -Math.PI / 2;
    bSite.position.set(16, 0.02, 16);
    this.scene.add(bSite);
  }

  resolveCircle(x, z, radius, y = 0.9) {
    let nx = x;
    let nz = z;
    for (const c of this.colliders) {
      if (y < c.min.y - 0.2 || y > c.max.y + 0.2) continue;
      const cx = Math.max(c.min.x, Math.min(nx, c.max.x));
      const cz = Math.max(c.min.z, Math.min(nz, c.max.z));
      const dx = nx - cx;
      const dz = nz - cz;
      const dist2 = dx * dx + dz * dz;
      if (dist2 < radius * radius) {
        if (dist2 < 1e-8) {
          // Push out along shortest axis
          const left = nx - c.min.x;
          const right = c.max.x - nx;
          const down = nz - c.min.z;
          const up = c.max.z - nz;
          const m = Math.min(left, right, down, up);
          if (m === left) nx = c.min.x - radius;
          else if (m === right) nx = c.max.x + radius;
          else if (m === down) nz = c.min.z - radius;
          else nz = c.max.z + radius;
        } else {
          const dist = Math.sqrt(dist2);
          const push = (radius - dist) / dist;
          nx += dx * push;
          nz += dz * push;
        }
      }
    }
    nx = Math.max(-39.2, Math.min(39.2, nx));
    nz = Math.max(-29.2, Math.min(29.2, nz));
    return { x: nx, z: nz };
  }

  /** Simple ground height — flat map with crate tops optional later */
  groundHeight(_x, _z) {
    return 0;
  }
}
