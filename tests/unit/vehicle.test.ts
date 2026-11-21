import { beforeAll, describe, expect, it } from 'vitest';
import { loadRapier, Physics, type Rapier } from '../../src/world/physics/Physics';
import { VehiclePhysics } from '../../src/world/vehicle/VehiclePhysics';
import { FixedStepLoop } from '../../src/world/core/FixedStepLoop';
import type { Intent } from '../../src/world/input/Input';

let R: Rapier;
beforeAll(async () => {
  R = await loadRapier();
});

function setup() {
  const physics = new Physics(R);
  // Flat board: top surface at y = 1.2.
  physics.addStatic([{ x: 0, y: 0.6, z: 0, hx: 200, hy: 0.6, hz: 200, kind: 'ground' }]);
  const car = new VehiclePhysics(physics, 0, 0, 0); // facing +X
  return { physics, car };
}

/** Run a scripted drive at a given display frame rate through the fixed-step loop. */
function drive(fps: number, script: (t: number) => Intent, seconds: number) {
  const { physics, car } = setup();
  const loop = new FixedStepLoop(1 / 60);
  let t = 0;
  let sim = 0; // simulated time, advanced per physics step
  let maxSpeed = 0;
  const frame = 1 / fps;
  while (t < seconds) {
    const { steps } = loop.advance(frame);
    for (let i = 0; i < steps; i++) {
      car.preStep(script(sim), physics.dt);
      physics.step();
      car.postStep(physics.dt);
      sim += physics.dt;
    }
    t += frame;
    maxSpeed = Math.max(maxSpeed, car.speed);
  }
  const out = { ...car.curr, speed: car.speed, maxSpeed, heading: car.heading(), upsideDown: car.upsideDownFor };
  car.dispose();
  physics.dispose();
  return out;
}

const straight = (): Intent => ({ throttle: 1, brake: 0, steer: 0 });

describe('vehicle physics', () => {
  it('settles on its wheels at rest', () => {
    const r = drive(60, () => ({ throttle: 0, brake: 0, steer: 0 }), 2);
    expect(r.y).toBeGreaterThan(1.2);
    expect(r.y).toBeLessThan(2.2);
    expect(Math.hypot(r.x, r.z)).toBeLessThan(0.2);
  });

  it('accelerates forward (+X) towards top speed', () => {
    const r = drive(60, straight, 5);
    console.log('straight 5s', r);
    expect(r.x).toBeGreaterThan(25);
    expect(r.maxSpeed).toBeGreaterThan(11);
    expect(r.maxSpeed).toBeLessThan(15.5);
    expect(Math.abs(r.z)).toBeLessThan(1);
  });

  it('steers right when steer is positive (right is +Z when facing +X)', () => {
    const r = drive(60, (t) => ({ throttle: 0.7, brake: 0, steer: t > 0.5 ? 1 : 0 }), 2.5);
    console.log('right turn', r);
    expect(r.z).toBeGreaterThan(1);
    expect(r.heading).toBeGreaterThan(0.3);
  });

  it('brakes to a stop', () => {
    const r = drive(60, (t) => (t < 3 ? straight() : { throttle: 0, brake: 1, steer: 0 }), 6);
    expect(Math.abs(r.speed)).toBeLessThan(0.3);
  });

  it('reverses when held back from rest', () => {
    const r = drive(60, () => ({ throttle: -1, brake: 0, steer: 0 }), 3);
    console.log('reverse', r);
    expect(r.x).toBeLessThan(-4);
    expect(r.speed).toBeGreaterThan(-6.6);
  });

  it('stays upright through a full-lock turn at speed', () => {
    const r = drive(60, (t) => ({ throttle: 1, brake: 0, steer: t > 3 ? 1 : 0 }), 7);
    console.log('fast turn', r);
    expect(r.upsideDown).toBe(0);
    expect(r.y).toBeLessThan(2.5);
  });

  it('behaves the same at 30, 60 and 144 fps (fixed timestep)', () => {
    const script = (t: number): Intent => ({ throttle: 1, brake: 0, steer: t > 1 && t < 2 ? 0.6 : 0 });
    const a = drive(30, script, 3);
    const b = drive(60, script, 3);
    const c = drive(144, script, 3);
    const dist = Math.hypot(b.x, b.z);
    for (const r of [a, c]) {
      expect(Math.hypot(r.x - b.x, r.z - b.z) / dist).toBeLessThan(0.01);
    }
  });
});
