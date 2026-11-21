import { Group, Quaternion, Vector3, type Scene } from 'three';
import { buildCar, type CarParts } from './carModel';
import type { VehiclePhysics } from './VehiclePhysics';
import { VEHICLE as V } from './vehicle.config';
import { damp } from '../core/maths';

/**
 * Draws the car from the physics state, interpolated between the last two
 * physics steps. Reads physics only; never writes to it.
 */
export class VehicleVisual {
  readonly group = new Group();
  private parts: CarParts;
  private qa = new Quaternion();
  private qb = new Quaternion();
  readonly position = new Vector3();
  readonly quaternion = new Quaternion();
  headlights = false;
  private brakeGlow = 0;

  constructor(scene: Scene, lod: 'high' | 'low') {
    this.parts = buildCar(lod);
    this.group.add(this.parts.root);
    scene.add(this.group);
  }

  setLod(lod: 'high' | 'low') {
    this.group.remove(this.parts.root);
    this.disposeParts();
    this.parts = buildCar(lod);
    this.group.add(this.parts.root);
  }

  update(p: VehiclePhysics, alpha: number, dt: number) {
    const a = p.prev;
    const b = p.curr;
    this.position.set(a.x + (b.x - a.x) * alpha, a.y + (b.y - a.y) * alpha, a.z + (b.z - a.z) * alpha);
    this.qa.set(a.qx, a.qy, a.qz, a.qw);
    this.qb.set(b.qx, b.qy, b.qz, b.qw);
    this.quaternion.slerpQuaternions(this.qa, this.qb, alpha);
    this.group.position.copy(this.position);
    this.group.quaternion.copy(this.quaternion);

    // Each wheel independently: suspension travel, steering, spin.
    p.wheels.forEach((w, i) => {
      const { pivot, spin } = this.parts.wheels[i];
      pivot.position.y = V.wheelY - w.suspension;
      pivot.rotation.y = w.steer;
      spin.rotation.z = -w.spin;
    });

    this.brakeGlow = damp(this.brakeGlow, p.braking ? 1 : 0, 0.06, dt);
    this.parts.lightsRear.emissiveIntensity = 0.35 + this.brakeGlow * 2.6;
    this.parts.lightsReverse.emissiveIntensity = p.reversing ? 2.2 : 0;
    this.parts.lightsFront.emissiveIntensity = this.headlights ? 2.4 : 0.4;
  }

  private disposeParts() {
    this.parts.root.traverse((o) => {
      const m = o as { geometry?: { dispose(): void } };
      m.geometry?.dispose();
    });
    this.parts.materials.forEach((m) => m.dispose());
  }

  dispose() {
    this.group.removeFromParent();
    this.disposeParts();
  }
}
