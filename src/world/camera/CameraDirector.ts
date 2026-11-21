import { Vector3, type PerspectiveCamera } from 'three';
import { clamp, damp, dampAngle, easeInOut, lerp, smoothstep } from '../core/maths';
import type { Physics } from '../physics/Physics';
import type { Input } from '../input/Input';
import type { CameraMode } from '../core/types';

/** Starting values from VEHICLE_AND_CAMERA_SPECIFICATION.md §3–4. */
export const CAMERA = {
  fov: 50,
  fovFast: 56,
  fovPortrait: 62,
  distanceMin: 4.5,
  distanceMax: 14,
  heightMin: 1.6,
  heightMax: 7,
  zoomDefault: 0.32,
  posTau: 0.25,
  lookTau: 0.12,
  yawTau: 0.45,
  lead: 2,
  collisionIn: 0.08,
  collisionOut: 0.4,
  recentreDelay: 1.5,
  overhead: { azimuth: Math.PI * 0.75, pitch: (52 * Math.PI) / 180, fov: 22, distMin: 38, distMax: 60 },
};

export interface Shot {
  position: Vector3;
  target: Vector3;
  fov: number;
}

export type DirectorMode = 'cinematic' | 'chase' | 'overhead' | 'focus';

export interface FollowTarget {
  position: Vector3;
  heading: number;
  speed: number;
  topSpeed: number;
}

/**
 * Decides where the camera is. Exactly one mode writes the camera per frame,
 * and switches blend over a fixed time. Reads the interpolated car pose;
 * never touches physics bodies.
 */
export class CameraDirector {
  mode: DirectorMode = 'cinematic';
  followMode: CameraMode = 'follow';
  reducedMotion = false;
  /** Multiplier for distance by area (City streets shorter, hub longer). */
  areaDistance = 1;

  private pos = new Vector3(0, 120, 160);
  private look = new Vector3();
  private fov = CAMERA.fov;
  private yaw = 0;
  private orbitYaw = 0;
  private orbitPitch = 0;
  private zoom = CAMERA.zoomDefault;
  private collisionDist = Infinity;
  private overheadZoom = 0.4;

  private blendFrom: Shot | null = null;
  private blendT = 1;
  private blendDur = 1;
  private cinematic: Shot = { position: new Vector3(0, 120, 160), target: new Vector3(), fov: 40 };
  private focus: Shot | null = null;
  private tmp = new Vector3();
  private tmp2 = new Vector3();

  constructor(private camera: PerspectiveCamera, private physics: Physics | null, private input: Input) {}

  setPhysics(p: Physics) {
    this.physics = p;
  }

  /** Set the shot the intro wants this frame (no smoothing; the intro eases itself). */
  setCinematic(shot: Shot) {
    this.cinematic.position.copy(shot.position);
    this.cinematic.target.copy(shot.target);
    this.cinematic.fov = shot.fov;
  }

  switchTo(mode: DirectorMode, duration = 1, focusShot?: Shot) {
    if (focusShot) this.focus = { position: focusShot.position.clone(), target: focusShot.target.clone(), fov: focusShot.fov };
    this.blendFrom = { position: this.pos.clone(), target: this.look.clone(), fov: this.fov };
    this.blendDur = this.reducedMotion ? 0.0001 : Math.max(duration, 0.0001);
    this.blendT = 0;
    this.mode = mode;
  }

  /** Snap the chase camera behind the car with no smoothing (Skip, respawn). */
  snapBehind(t: FollowTarget) {
    this.yaw = t.heading;
    this.orbitYaw = 0;
    const s = this.chaseShot(t, 1 / 60, true);
    this.pos.copy(s.position);
    this.look.copy(s.target);
    this.fov = s.fov;
    this.blendT = 1;
    this.blendFrom = null;
  }

  /** The pose behind the car, used by the intro's last shot to hand over seamlessly. */
  behindShot(t: FollowTarget): Shot {
    const yaw = t.heading;
    const dist = lerp(CAMERA.distanceMin, CAMERA.distanceMax, CAMERA.zoomDefault);
    const height = lerp(CAMERA.heightMin, CAMERA.heightMax, CAMERA.zoomDefault);
    return {
      position: new Vector3(t.position.x - Math.cos(yaw) * dist, t.position.y + height, t.position.z - Math.sin(yaw) * dist),
      target: new Vector3(t.position.x + Math.cos(yaw) * 1.2, t.position.y + 0.9, t.position.z + Math.sin(yaw) * 1.2),
      fov: this.portraitFov(CAMERA.fov),
    };
  }

  private portraitFov(base: number) {
    return this.camera.aspect < 0.8 ? Math.max(base, CAMERA.fovPortrait) : base;
  }

  private chaseShot(t: FollowTarget, dt: number, snap = false): Shot {
    // Orbit and zoom requests.
    const o = this.input.takeOrbit();
    this.orbitYaw += o.dx * 0.006;
    this.orbitPitch = clamp(this.orbitPitch + o.dy * 0.004, -0.5, 0.6);
    this.zoom = clamp(this.zoom + this.input.takeZoom(), 0, 1);
    const idle = performance.now() - this.input.orbit.lastInputAt > CAMERA.recentreDelay * 1000;
    if (idle && !this.input.orbit.dragging && Math.abs(t.speed) > 1) {
      this.orbitYaw = damp(this.orbitYaw, 0, 0.6, dt);
      this.orbitPitch = damp(this.orbitPitch, 0, 0.8, dt);
    }

    // Yaw follows the direction of travel, not the nose; holds when crawling backwards.
    let desiredYaw = this.yaw;
    if (t.speed > 0.8) desiredYaw = t.heading;
    else if (t.speed > -1.5 && t.speed <= 0.8) desiredYaw = Math.abs(t.speed) < 0.3 ? this.yaw : t.heading;
    else desiredYaw = t.heading; // reversing fast: stay behind the car's nose direction
    this.yaw = snap ? desiredYaw : dampAngle(this.yaw, desiredYaw, CAMERA.yawTau, dt);

    const speedRatio = this.reducedMotion ? 0 : smoothstep(0.6, 1, Math.abs(t.speed) / t.topSpeed);
    let dist = lerp(CAMERA.distanceMin, CAMERA.distanceMax, this.zoom) * (1 + 0.12 * speedRatio) * this.areaDistance;
    const height = lerp(CAMERA.heightMin, CAMERA.heightMax, this.zoom) * (1 + this.orbitPitch);
    const yaw = this.yaw + this.orbitYaw;

    const lookY = this.camera.aspect < 0.8 ? 0.4 : 0.9;
    const lead = CAMERA.lead * clamp(t.speed / t.topSpeed, 0, 1);
    const target = this.tmp2.set(t.position.x + Math.cos(t.heading) * lead, t.position.y + lookY, t.position.z + Math.sin(t.heading) * lead);

    // Collision avoidance: sphere cast from the look point towards the camera.
    const dir = this.tmp.set(-Math.cos(yaw) * dist, height - lookY, -Math.sin(yaw) * dist);
    const full = dir.length();
    dir.divideScalar(full);
    let allowed = full;
    if (this.physics) allowed = Math.max(1.5, this.physics.cameraCast(target, dir, full) - 0.2);
    if (snap) this.collisionDist = allowed;
    else this.collisionDist = damp(this.collisionDist === Infinity ? allowed : this.collisionDist, allowed, allowed < this.collisionDist ? CAMERA.collisionIn : CAMERA.collisionOut, dt);
    dist = Math.min(full, this.collisionDist);

    const fov = this.portraitFov(lerp(CAMERA.fov, CAMERA.fovFast, speedRatio));
    return { position: new Vector3().copy(target).addScaledVector(dir, dist), target: target.clone(), fov };
  }

  private overheadShot(t: FollowTarget): Shot {
    this.overheadZoom = clamp(this.overheadZoom + this.input.takeZoom(), 0, 1);
    this.input.takeOrbit();
    const c = CAMERA.overhead;
    const d = lerp(c.distMin, c.distMax, this.overheadZoom);
    const target = t.position.clone();
    const position = new Vector3(
      target.x + Math.cos(c.azimuth) * Math.cos(c.pitch) * d,
      target.y + Math.sin(c.pitch) * d,
      target.z + Math.sin(c.azimuth) * Math.cos(c.pitch) * d,
    );
    return { position, target, fov: this.portraitFov(c.fov) };
  }

  update(t: FollowTarget | null, dt: number) {
    let shot: Shot;
    if (this.mode === 'cinematic' || !t) shot = this.cinematic;
    else if (this.mode === 'focus' && this.focus) shot = this.focus;
    else if (this.mode === 'overhead') shot = this.overheadShot(t);
    else shot = this.chaseShot(t, dt);

    const smoothed = this.mode === 'chase' || this.mode === 'overhead';
    if (smoothed && this.blendT >= 1) {
      const tau = this.mode === 'overhead' ? 0.3 : CAMERA.posTau;
      this.pos.set(damp(this.pos.x, shot.position.x, tau, dt), damp(this.pos.y, shot.position.y, tau, dt), damp(this.pos.z, shot.position.z, tau, dt));
      this.look.set(
        damp(this.look.x, shot.target.x, CAMERA.lookTau, dt),
        damp(this.look.y, shot.target.y, CAMERA.lookTau, dt),
        damp(this.look.z, shot.target.z, CAMERA.lookTau, dt),
      );
      this.fov = damp(this.fov, shot.fov, 0.4, dt);
    } else {
      this.pos.copy(shot.position);
      this.look.copy(shot.target);
      this.fov = shot.fov;
    }

    // Blend from the previous camera into the new mode.
    if (this.blendFrom && this.blendT < 1) {
      this.blendT = Math.min(1, this.blendT + dt / this.blendDur);
      const k = easeInOut(this.blendT);
      this.pos.lerpVectors(this.blendFrom.position, this.pos, k);
      this.look.lerpVectors(this.blendFrom.target, this.look, k);
      this.fov = lerp(this.blendFrom.fov, this.fov, k);
      if (this.blendT >= 1) this.blendFrom = null;
    }

    this.camera.position.copy(this.pos);
    this.camera.lookAt(this.look);
    if (Math.abs(this.camera.fov - this.fov) > 0.01) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  get isBlending() {
    return this.blendT < 1;
  }
}
