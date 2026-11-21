import { BoxGeometry, CylinderGeometry, Group, Mesh, Quaternion, type Material, type Scene } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Builder, disposeGroup, type Materials } from './kit';
import { BOARD_HEIGHT, DISTRICTS, districtAt, type DistrictDef, type DistrictId } from './layout';
import type { BoardMark, DistrictBuild, DistrictContext, PropSpec, Spot } from './district';
import { buildIndustrial } from '../districts/industrial';
import { buildCity } from '../districts/city';
import { buildEngineering } from '../districts/engineering';
import { buildExperiment } from '../districts/experiment';
import { buildPersonal } from '../districts/personal';
import { GROUPS, type Physics } from '../physics/Physics';
import type { Massing } from './board';

const BUILDS: Record<DistrictId, DistrictBuild> = {
  industrial: buildIndustrial,
  city: buildCity,
  engineering: buildEngineering,
  experiment: buildExperiment,
  personal: buildPersonal,
};

/** Unload a district this far beyond the load radius, so it doesn't flicker at the edge. */
const HYSTERESIS = 20;

interface DistrictSlot {
  def: DistrictDef;
  proxy: Group;
  detail: Group | null;
  tight: boolean;
}

interface Prop {
  mesh: Mesh;
  body: import('@dimforge/rapier3d-compat').RigidBody;
  home: { x: number; y: number; z: number };
  prev: Quaternion;
}

/** Distance from a point to a district's rectangle (0 inside). */
export function distanceToDistrict(d: DistrictDef, x: number, z: number) {
  const dx = Math.max(0, Math.abs(x - d.centre[0]) - d.half[0]);
  const dz = Math.max(0, Math.abs(z - d.centre[1]) - d.half[1]);
  return Math.hypot(dx, dz);
}

/** Runs every district's plan pass (colliders, massing, marks, spots) without Three.js meshes. */
export function planDistricts(ctx: DistrictContext) {
  const out = DISTRICTS.map((def) => {
    const b = new Builder(false);
    const o = BUILDS[def.id](b, ctx);
    b.discard();
    return { def, builder: b, output: o };
  });
  return out;
}

/**
 * Owns the districts: colliders are always present; meshes stream in detail
 * near the car and stand as white study-model massing further away.
 */
export class DistrictManager {
  readonly spots: (Spot & { district: DistrictId })[] = [];
  readonly marks: BoardMark[] = [];
  readonly massing: Massing[] = [];
  private slots: DistrictSlot[] = [];
  private removers: (() => void)[] = [];
  private props: Prop[] = [];
  private propGroup = new Group();
  private root = new Group();
  private queue: DistrictSlot[] = [];
  detailRadius: number;

  constructor(
    private scene: Scene,
    private physics: Physics,
    private mats: Materials,
    private ctx: DistrictContext,
    private shadows: boolean,
    detailRadius: number,
    propDensity: number,
  ) {
    this.detailRadius = detailRadius;
    this.root.name = 'districts';
    scene.add(this.root);
    const plan = planDistricts(ctx);
    const propSpecs: PropSpec[] = [];
    for (const { def, builder, output } of plan) {
      this.removers.push(physics.addStatic(builder.colliders));
      this.massing.push(...builder.massing);
      this.marks.push(...output.marks);
      for (const s of output.spots) this.spots.push({ ...s, district: def.id });
      propSpecs.push(...output.props);
      const proxy = this.buildProxy(builder.massing);
      this.root.add(proxy);
      this.slots.push({ def, proxy, detail: null, tight: Boolean(output.tight) });
    }
    this.buildProps(propSpecs, propDensity);
  }

  private buildProxy(massing: Massing[]) {
    const geos = massing
      .filter((m) => m.h > 0.2)
      .map((m) => {
        const g = new BoxGeometry(m.w, m.h, m.d);
        g.rotateY(m.ry);
        g.translate(m.x, BOARD_HEIGHT + (m.y ?? 0) + m.h / 2, m.z);
        return g.toNonIndexed();
      });
    const group = new Group();
    if (geos.length) {
      const merged = mergeGeometries(geos);
      geos.forEach((g) => g.dispose());
      const mesh = new Mesh(merged, this.mats.massing);
      mesh.castShadow = this.shadows;
      mesh.receiveShadow = this.shadows;
      group.add(mesh);
    }
    return group;
  }

  private buildProps(specs: PropSpec[], density: number) {
    const R = this.physics.R;
    const keep = specs.filter((_, i) => density >= 1 || (i * 0.618) % 1 < Math.max(density, 0.34));
    const reelGeo = new CylinderGeometry(0.75, 0.75, 1.1, 18);
    const coneGeo = new CylinderGeometry(0.05, 0.28, 0.7, 10);
    const crateGeo = new BoxGeometry(0.9, 0.9, 0.9);
    for (const s of keep) {
      const geo = s.kind === 'reel' ? reelGeo : s.kind === 'cone' ? coneGeo : crateGeo;
      const mat: Material = s.kind === 'reel' ? this.mats.kraft : s.kind === 'cone' ? this.mats.vermilion : this.mats.timber;
      const mesh = new Mesh(geo, mat);
      mesh.castShadow = this.shadows;
      const halfH = s.kind === 'reel' ? 0.55 : s.kind === 'cone' ? 0.35 : 0.45;
      const home = { x: s.x, y: BOARD_HEIGHT + halfH + 0.02, z: s.z };
      const body = this.physics.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(home.x, home.y, home.z).setLinearDamping(0.4).setAngularDamping(0.6).setCanSleep(true));
      const collider =
        s.kind === 'reel'
          ? R.ColliderDesc.cylinder(0.55, 0.75).setDensity(60)
          : s.kind === 'cone'
            ? R.ColliderDesc.cone(0.35, 0.28).setDensity(30)
            : R.ColliderDesc.cuboid(0.45, 0.45, 0.45).setDensity(40);
      this.physics.world.createCollider(collider.setCollisionGroups(GROUPS.prop).setFriction(0.8), body);
      this.props.push({ mesh, body, home, prev: new Quaternion() });
      this.propGroup.add(mesh);
    }
    this.propGroup.userData.shared = [reelGeo, coneGeo, crateGeo];
    this.scene.add(this.propGroup);
  }

  /** Build every district in detail at once (used under the intro on Medium and High). */
  buildAll() {
    for (const s of this.slots) this.load(s);
  }

  private load(s: DistrictSlot) {
    if (s.detail) return;
    const b = new Builder(true);
    BUILDS[s.def.id](b, this.ctx);
    s.detail = b.build(this.mats, this.shadows);
    s.detail.name = `district_${s.def.id}`;
    this.root.add(s.detail);
    s.proxy.visible = false;
  }

  private unload(s: DistrictSlot) {
    if (!s.detail) return;
    disposeGroup(s.detail);
    s.detail.removeFromParent();
    s.detail = null;
    s.proxy.visible = true;
  }

  /** Stream detail by distance. At most one district is built per frame. */
  update(x: number, z: number) {
    for (const s of this.slots) {
      const d = distanceToDistrict(s.def, x, z);
      if (!s.detail && d < this.detailRadius && !this.queue.includes(s)) this.queue.push(s);
      else if (s.detail && d > this.detailRadius + HYSTERESIS) this.unload(s);
    }
    this.queue.sort((a, b) => distanceToDistrict(a.def, x, z) - distanceToDistrict(b.def, x, z));
    const next = this.queue.shift();
    if (next && distanceToDistrict(next.def, x, z) < this.detailRadius) this.load(next);
  }

  /** Copy prop bodies to meshes. Props past the board edge are put back. */
  syncProps() {
    for (const p of this.props) {
      const t = p.body.translation();
      if (t.y < -5) {
        p.body.setTranslation(p.home, true);
        p.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        p.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        p.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      }
      const r = p.body.rotation();
      p.mesh.position.set(t.x, t.y, t.z);
      p.mesh.quaternion.set(r.x, r.y, r.z, r.w);
    }
  }

  districtAt(x: number, z: number) {
    return districtAt(x, z);
  }

  isTight(id: string | null) {
    return this.slots.find((s) => s.def.id === id)?.tight ?? false;
  }

  loadedCount() {
    return this.slots.filter((s) => s.detail).length;
  }

  dispose() {
    for (const s of this.slots) {
      this.unload(s);
      disposeGroup(s.proxy);
    }
    this.root.removeFromParent();
    for (const g of this.propGroup.userData.shared as { dispose(): void }[]) g.dispose();
    this.propGroup.removeFromParent();
    this.removers.forEach((r) => r());
    for (const p of this.props) this.physics.world.removeRigidBody(p.body);
    this.props = [];
  }
}
