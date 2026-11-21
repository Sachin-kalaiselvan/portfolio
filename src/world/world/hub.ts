import { BoxGeometry, Group, Mesh, type Material } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Builder, flag, figure, streetLight, tree, type Materials } from './kit';
import { BOARD_HEIGHT } from './layout';
import { dampAngle, easeOut } from '../core/maths';

/**
 * The hub: a tower crane beside a tower that's still going up. Each project a
 * visitor discovers lifts one more floor into place. When every district has
 * been visited, the tower is topped out with a cobalt flag.
 */
export const TOWER = { x: -6, z: 3, w: 9, d: 9, floorH: 2.6, floors: 12, baseFloors: 4 };
export const CRANE = { x: 8, z: -6, height: 34, jib: 30, counter: 10 };
const REACH = Math.hypot(TOWER.x - CRANE.x, TOWER.z - CRANE.z);

function box(w: number, h: number, d: number, x: number, y: number, z: number, rx = 0, rz = 0) {
  const g = new BoxGeometry(w, h, d);
  if (rx) g.rotateX(rx);
  if (rz) g.rotateZ(rz);
  g.translate(x, y, z);
  return g;
}

/** A square lattice section: 4 chords with zigzag bracing on each face. */
function lattice(size: number, length: number, axis: 'y' | 'x', bars = 0.12) {
  const parts = [];
  const n = Math.max(2, Math.round(length / size));
  const seg = length / n;
  const h = size / 2;
  for (const [a, b] of [
    [-h, -h],
    [-h, h],
    [h, -h],
    [h, h],
  ]) {
    parts.push(axis === 'y' ? box(bars, length, bars, a, length / 2, b) : box(length, bars, bars, length / 2, a, b));
  }
  const diag = Math.hypot(size, seg);
  const ang = Math.atan2(size, seg);
  for (let i = 0; i < n; i++) {
    const m = seg * (i + 0.5);
    const s = i % 2 ? 1 : -1;
    if (axis === 'y') {
      parts.push(box(bars * 0.7, diag, bars * 0.7, 0, m, h, 0, s * ang));
      parts.push(box(bars * 0.7, diag, bars * 0.7, 0, m, -h, 0, -s * ang));
      parts.push(box(bars * 0.7, diag, bars * 0.7, h, m, 0, s * ang, 0));
      parts.push(box(bars * 0.7, diag, bars * 0.7, -h, m, 0, -s * ang, 0));
    } else {
      parts.push(box(diag, bars * 0.7, bars * 0.7, m, 0, h, 0, s * (Math.PI / 2 - ang)));
      parts.push(box(diag, bars * 0.7, bars * 0.7, m, 0, -h, 0, -s * (Math.PI / 2 - ang)));
    }
  }
  return mergeGeometries(parts.map((g) => g.toNonIndexed()));
}

export class Hub {
  readonly group = new Group();
  readonly builder: Builder;
  private jib = new Group();
  private hook = new Mesh();
  private floors: Mesh[] = [];
  /** The lift core: always a little ahead of the floors, as on a real site. */
  private core: Mesh;
  private shown = TOWER.baseFloors;
  private lifting: { index: number; t: number } | null = null;
  private flagGroup = new Group();
  private jibAngle = Math.atan2(-(TOWER.z - CRANE.z), TOWER.x - CRANE.x);
  private jibTarget = Math.atan2(-(TOWER.z - CRANE.z), TOWER.x - CRANE.x);
  toppedOut = false;

  constructor(mats: Materials, detail: boolean, shadows: boolean) {
    const b = (this.builder = new Builder(detail));
    // Tower base and core.
    b.collider(TOWER.x, 0, TOWER.z, TOWER.w, TOWER.floors * TOWER.floorH, TOWER.d);
    b.massing.push({ x: TOWER.x, z: TOWER.z, w: TOWER.w, d: TOWER.d, h: TOWER.baseFloors * TOWER.floorH, ry: 0 });
    // Crane base.
    b.collider(CRANE.x, 0, CRANE.z, 3.2, 2.2, 3.2);
    b.massing.push({ x: CRANE.x, z: CRANE.z, w: 2.2, d: 2.2, h: CRANE.height, ry: 0 });
    b.box('ink', CRANE.x, 0, CRANE.z, 3.2, 0.8, 3.2);
    if (detail) {
      for (const [x, z] of [
        [-16, -14],
        [16, 14],
        [-16, 14],
        [16, -14],
      ])
        tree(b, x, z, 1.2, x > 0);
      for (let a = 0; a < 8; a++) streetLight(b, Math.cos(a * 0.785 + 0.39) * 21, Math.sin(a * 0.785 + 0.39) * 21, -a * 0.785);
      figure(b, -1, -8, 0.5);
      figure(b, 2, 9, 2);
      figure(b, -12, 6, 4);
    }
    this.group.add(b.build(mats, shadows));

    // Crane: mast (lattice), slewing jib group with counter-jib, cab, trolley and hook.
    const steel = mats.cobalt;
    const mast = new Mesh(lattice(2.2, CRANE.height, 'y', 0.16), steel);
    mast.position.set(CRANE.x, BOARD_HEIGHT + 0.8, CRANE.z);
    mast.castShadow = shadows;
    this.group.add(mast);
    this.jib.position.set(CRANE.x, BOARD_HEIGHT + 0.8 + CRANE.height, CRANE.z);
    const jibMesh = new Mesh(lattice(1.6, CRANE.jib, 'x', 0.12), steel);
    jibMesh.position.y = 1.2;
    const counter = new Mesh(lattice(1.6, CRANE.counter, 'x', 0.12), steel);
    counter.position.set(-CRANE.counter, 1.2, 0);
    const weight = new Mesh(new BoxGeometry(2.6, 2, 2.2), mats.massing);
    weight.position.set(-CRANE.counter + 1.6, 0.6, 0);
    const cab = new Mesh(new BoxGeometry(2, 2, 1.8), mats.card);
    cab.position.set(0.6, -0.6, 1.9);
    const apex = new Mesh(lattice(1.2, 6, 'y', 0.1), steel);
    apex.position.y = 1.2;
    const trolley = new Mesh(new BoxGeometry(1.2, 0.5, 1.4), mats.ink);
    trolley.position.set(REACH, 0.4, 0);
    this.hook.geometry = new BoxGeometry(0.06, 1, 0.06);
    this.hook.material = mats.ink;
    for (const m of [jibMesh, counter, weight, cab, apex]) m.castShadow = shadows;
    this.jib.add(jibMesh, counter, weight, cab, apex, trolley, this.hook);
    this.group.add(this.jib);

    this.core = new Mesh(new BoxGeometry(3, 1, 3).translate(0, 0.5, 0), mats.massing);
    this.core.position.set(TOWER.x, BOARD_HEIGHT, TOWER.z);
    this.core.castShadow = shadows;
    this.group.add(this.core);

    // Tower floors: separate meshes so each can be lifted into place.
    for (let i = 0; i < TOWER.floors; i++) {
      const g = mergeGeometries([
        box(TOWER.w, 0.35, TOWER.d, 0, 0, 0).toNonIndexed(),
        box(TOWER.w - 0.8, TOWER.floorH - 0.35, 0.12, 0, (TOWER.floorH - 0.35) / 2 + 0.17, TOWER.d / 2 - 0.4).toNonIndexed(),
        box(TOWER.w - 0.8, TOWER.floorH - 0.35, 0.12, 0, (TOWER.floorH - 0.35) / 2 + 0.17, -TOWER.d / 2 + 0.4).toNonIndexed(),
        box(0.12, TOWER.floorH - 0.35, TOWER.d - 0.8, TOWER.w / 2 - 0.4, (TOWER.floorH - 0.35) / 2 + 0.17, 0).toNonIndexed(),
        box(0.12, TOWER.floorH - 0.35, TOWER.d - 0.8, -TOWER.w / 2 + 0.4, (TOWER.floorH - 0.35) / 2 + 0.17, 0).toNonIndexed(),
      ]);
      const floor = new Mesh(g, (i % 2 ? mats.card : mats.cardShade) as Material);
      floor.position.set(TOWER.x, BOARD_HEIGHT + i * TOWER.floorH, TOWER.z);
      floor.castShadow = shadows;
      floor.receiveShadow = shadows;
      floor.visible = i < this.shown;
      this.floors.push(floor);
      this.group.add(floor);
    }
    const fb = new Builder(detail);
    flag(fb, TOWER.x + TOWER.w / 2 - 0.6, TOWER.floors * TOWER.floorH, TOWER.z + TOWER.d / 2 - 0.6, 'cobalt', 3.2);
    this.flagGroup = fb.build(mats, shadows);
    this.flagGroup.visible = false;
    this.group.add(this.flagGroup);
    this.positionHook();
    this.core.scale.y = (this.shown + 1.5) * TOWER.floorH;
  }

  private sizeCore(dt: number) {
    const target = Math.min(TOWER.floors, this.shown + 1.5) * TOWER.floorH;
    this.core.scale.y += (target - this.core.scale.y) * Math.min(1, dt * 2);
  }

  private positionHook() {
    const top = this.lifting ? this.lifting.index : this.shown;
    const hookY = BOARD_HEIGHT + top * TOWER.floorH + 4 - (BOARD_HEIGHT + 0.8 + CRANE.height);
    const len = Math.max(1, 1.2 - hookY);
    this.hook.scale.y = len;
    this.hook.position.set(REACH, 1.2 - len / 2, 0);
  }

  /** Number of floors shown; animated when increased. */
  setFloors(n: number, animate: boolean) {
    const target = Math.min(TOWER.floors, Math.max(TOWER.baseFloors, n));
    if (target <= this.shown) return;
    if (!animate) {
      for (let i = 0; i < TOWER.floors; i++) this.floors[i].visible = i < target;
      this.shown = target;
      this.positionHook();
      this.core.scale.y = Math.min(TOWER.floors, target + 1.5) * TOWER.floorH;
      return;
    }
    this.jibTarget = Math.atan2(-(TOWER.z - CRANE.z), TOWER.x - CRANE.x);
    this.lifting = { index: this.shown, t: 0 };
    this.shown = target;
  }

  topOut(animate: boolean) {
    this.setFloors(TOWER.floors, animate);
    this.toppedOut = true;
    this.flagGroup.visible = true;
  }

  update(dt: number, ambient: boolean) {
    if (this.lifting) {
      const L = this.lifting;
      L.t += dt / 1.6;
      const f = this.floors[L.index];
      f.visible = true;
      const k = easeOut(Math.min(1, L.t));
      f.position.y = BOARD_HEIGHT + L.index * TOWER.floorH + (1 - k) * 6;
      if (L.t >= 1) {
        f.position.y = BOARD_HEIGHT + L.index * TOWER.floorH;
        const next = L.index + 1;
        this.lifting = next < this.shown ? { index: next, t: 0 } : null;
      }
    } else if (ambient) {
      this.jibTarget += dt * 0.05;
    }
    this.jibTarget %= Math.PI * 2;
    this.jibAngle = dampAngle(this.jibAngle, this.jibTarget, 1.2, dt);
    // Jib local +X points along the jib; the trolley sits over the tower when lifting.
    this.jib.rotation.y = this.jibAngle;
    this.positionHook();
    this.sizeCore(dt);
  }

  dispose() {
    this.group.traverse((o) => (o as Mesh).geometry?.dispose());
    this.group.removeFromParent();
  }
}
