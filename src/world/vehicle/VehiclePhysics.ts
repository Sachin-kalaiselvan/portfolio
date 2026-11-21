import type * as RAPIERNS from '@dimforge/rapier3d-compat';
import { GROUPS, quatFromEuler, type Physics } from '../physics/Physics';
import { VEHICLE as V } from './vehicle.config';
import { approach, clamp, lerp } from '../core/maths';
import type { Intent } from '../input/Input';

export interface Pose {
  x: number;
  y: number;
  z: number;
  qx: number;
  qy: number;
  qz: number;
  qw: number;
}

export interface WheelState {
  spin: number;
  steer: number;
  suspension: number;
  contact: boolean;
}

/**
 * The car as Rapier sees it: a chassis with ray-cast wheels.
 * Consumes intent, never reads devices, never touches meshes.
 */
export class VehiclePhysics {
  readonly body: RAPIERNS.RigidBody;
  readonly controller: RAPIERNS.DynamicRayCastVehicleController;
  readonly wheels: WheelState[] = [0, 1, 2, 3].map(() => ({ spin: 0, steer: 0, suspension: V.restLength, contact: false }));

  /** Smoothed values actually applied. */
  private throttle = 0;
  private steer = 0;
  speed = 0; // forward speed, units/s (negative when reversing)
  braking = false;
  reversing = false;
  upsideDownFor = 0;
  stuckFor = 0;
  private stuckCheck = { x: 0, z: 0, t: 0 };
  prev: Pose;
  curr: Pose;
  /** Fires when a recovery is needed: 'upright' (auto) or 'stuck' (prompt). */
  onRecover: ((kind: 'upright' | 'stuck' | 'reset') => void) | null = null;
  enabled = true;

  constructor(private physics: Physics, x: number, z: number, heading: number) {
    const R = physics.R;
    const w = physics.world;
    const q = quatFromEuler(0, -heading, 0);
    const y = 1.2 + 1.0; // board top + clearance
    this.body = w.createRigidBody(
      R.RigidBodyDesc.dynamic()
        .setTranslation(x, y, z)
        .setRotation(q)
        .setLinearDamping(V.linearDamping)
        .setAngularDamping(V.angularDamping)
        .setCanSleep(false)
        .setCcdEnabled(true),
    );
    w.createCollider(
      R.ColliderDesc.cuboid(V.chassis.hx, V.chassis.hy, V.chassis.hz)
        .setTranslation(0, V.chassis.y, 0)
        .setDensity(V.chassis.density)
        .setFriction(0.3)
        .setRestitution(0.1)
        .setCollisionGroups(GROUPS.car),
      this.body,
    );
    w.createCollider(
      R.ColliderDesc.cuboid(V.cabin.hx, V.cabin.hy, V.cabin.hz)
        .setTranslation(V.cabin.x, V.cabin.y, 0)
        .setDensity(V.chassis.density * 0.25)
        .setFriction(0.3)
        .setCollisionGroups(GROUPS.car),
      this.body,
    );
    // Lower the centre of mass so the car resists rolling.
    // A low ballast mass (like a floor battery pack) pulls the centre of mass down.
    const ballast = this.body.mass() * 0.6;
    this.body.setAdditionalMassProperties(
      ballast,
      { x: 0, y: -V.centreOfMassDrop, z: 0 },
      { x: ballast * 0.3, y: ballast * 0.5, z: ballast * 0.3 },
      { x: 0, y: 0, z: 0, w: 1 },
      true,
    );

    this.controller = w.createVehicleController(this.body);
    const positions = [
      { x: V.wheelX, z: -V.wheelZ }, // front left (car faces +X, left is −Z)
      { x: V.wheelX, z: V.wheelZ }, //  front right
      { x: -V.wheelX, z: -V.wheelZ }, // rear left
      { x: -V.wheelX, z: V.wheelZ }, //  rear right
    ];
    positions.forEach((p, i) => {
      this.controller.addWheel({ x: p.x, y: V.wheelY, z: p.z }, { x: 0, y: -1, z: 0 }, { x: 0, y: 0, z: 1 }, V.restLength, V.wheelRadius);
      this.controller.setWheelSuspensionStiffness(i, V.stiffness);
      this.controller.setWheelSuspensionCompression(i, V.compression);
      this.controller.setWheelSuspensionRelaxation(i, V.relaxation);
      this.controller.setWheelMaxSuspensionTravel(i, V.maxTravel);
      this.controller.setWheelMaxSuspensionForce(i, V.maxSuspensionForce);
      this.controller.setWheelFrictionSlip(i, V.frictionSlip);
      this.controller.setWheelSideFrictionStiffness(i, V.sideFriction);
    });
    this.curr = this.readPose();
    this.prev = { ...this.curr };
  }

  private readPose(): Pose {
    const t = this.body.translation();
    const r = this.body.rotation();
    return { x: t.x, y: t.y, z: t.z, qx: r.x, qy: r.y, qz: r.z, qw: r.w };
  }

  /** Forward direction (+X local) in world space, flattened. */
  heading(): number {
    const { qx, qy, qz, qw } = this.curr;
    const fx = 1 - 2 * (qy * qy + qz * qz);
    const fz = 2 * (qx * qz - qw * qy);
    return Math.atan2(fz, fx);
  }

  /** Apply intent before a physics step. */
  preStep(intent: Intent, dt: number) {
    if (!this.enabled) intent = { throttle: 0, brake: 1, steer: 0 };
    const target = clamp(intent.throttle, -1, 1);
    const rate = Math.abs(target) > Math.abs(this.throttle) ? V.throttleRise : V.throttleFall;
    this.throttle = approach(this.throttle, target, rate, dt);

    const speedRatio = clamp(Math.abs(this.speed) / V.topSpeed, 0, 1);
    const maxSteer = lerp(V.maxSteerLow, V.maxSteerHigh, speedRatio);
    this.steer = approach(this.steer, -clamp(intent.steer, -1, 1) * maxSteer, V.steerRate * maxSteer * 2, dt);

    let engine = 0;
    let brake = intent.brake * V.brakeForce;
    const fwd = this.speed;
    if (this.throttle > 0.01) {
      if (fwd < -1) brake = Math.max(brake, V.brakeForce * this.throttle);
      else engine = V.engineForce * this.throttle * clamp(1 - fwd / V.topSpeed, 0, 1);
    } else if (this.throttle < -0.01) {
      if (fwd > 1) brake = Math.max(brake, V.brakeForce * -this.throttle);
      else engine = V.reverseForce * this.throttle * clamp(1 + fwd / V.topSpeedReverse, 0, 1);
    } else {
      brake = Math.max(brake, V.rollingBrake);
    }
    this.braking = brake > V.rollingBrake + 1;
    this.reversing = fwd < -0.3 && this.throttle < 0;

    for (let i = 0; i < 4; i++) {
      this.controller.setWheelEngineForce(i, engine / 4);
      this.controller.setWheelBrake(i, brake / 4);
      this.controller.setWheelSteering(i, i < 2 ? this.steer : 0);
    }
    this.controller.updateVehicle(dt, undefined, GROUPS.car);
  }

  /** Read state after a physics step. */
  postStep(dt: number) {
    this.prev = this.curr;
    this.curr = this.readPose();
    this.speed = this.controller.currentVehicleSpeed();
    for (let i = 0; i < 4; i++) {
      const w = this.wheels[i];
      w.contact = this.controller.wheelIsInContact(i);
      w.suspension = this.controller.wheelSuspensionLength(i) ?? V.restLength;
      w.steer = this.controller.wheelSteering(i) ?? 0;
      w.spin = this.controller.wheelRotation(i) ?? w.spin;
    }

    // Upright check: the car's up vector.
    const { qx, qz, qy, qw } = this.curr;
    const upY = 1 - 2 * (qx * qx + qz * qz);
    void qy;
    void qw;
    this.upsideDownFor = upY < 0.3 ? this.upsideDownFor + dt : 0;
    if (this.upsideDownFor > V.uprightAfter) {
      this.upsideDownFor = 0;
      this.onRecover?.('upright');
    }

    // Stuck check: throttle held but hardly moving.
    this.stuckCheck.t += dt;
    if (this.stuckCheck.t >= 1) {
      const moved = Math.hypot(this.curr.x - this.stuckCheck.x, this.curr.z - this.stuckCheck.z);
      this.stuckFor = Math.abs(this.throttle) > 0.5 && moved < 0.5 ? this.stuckFor + this.stuckCheck.t : 0;
      this.stuckCheck = { x: this.curr.x, z: this.curr.z, t: 0 };
      if (this.stuckFor >= V.autoResetAfter) {
        this.stuckFor = 0;
        this.onRecover?.('reset');
      } else if (this.stuckFor >= V.stuckAfter) this.onRecover?.('stuck');
    }
  }

  /** Place the car upright at a position, at rest. */
  teleport(x: number, z: number, heading: number, lift = 0.6) {
    const q = quatFromEuler(0, -heading, 0);
    this.body.setTranslation({ x, y: 1.2 + 0.7 + lift, z }, true);
    this.body.setRotation(q, true);
    this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.throttle = 0;
    this.steer = 0;
    this.curr = this.readPose();
    this.prev = { ...this.curr };
    this.upsideDownFor = this.stuckFor = 0;
  }

  /** Turn the car upright where it is. */
  rightInPlace() {
    this.teleport(this.curr.x, this.curr.z, this.heading(), 1.2);
  }

  dispose() {
    const w = this.physics.world;
    w.removeVehicleController(this.controller);
    if (w.getRigidBody(this.body.handle)) w.removeRigidBody(this.body);
  }
}
