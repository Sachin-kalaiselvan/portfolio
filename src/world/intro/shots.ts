import { Vector3 } from 'three';
import { easeInOut, lerp } from '../core/maths';
import type { Shot } from '../camera/CameraDirector';
import { BOARD_HEIGHT, START } from '../world/layout';
import { TOWER } from '../world/hub';

/**
 * Intro camera shots. Each is a function of progress (0..1) so the move is
 * deterministic and identical at any frame rate. Portrait screens get wider
 * lenses and higher positions so the same subjects stay in frame.
 */
function mix(a: Shot, b: Shot, k: number): Shot {
  return {
    position: new Vector3().lerpVectors(a.position, b.position, k),
    target: new Vector3().lerpVectors(a.target, b.target, k),
    fov: lerp(a.fov, b.fov, k),
  };
}

const V = (x: number, y: number, z: number) => new Vector3(x, y, z);

export function aerialShot(p: number, portrait: boolean): Shot {
  const k = easeInOut(p);
  const a: Shot = { position: V(-40, portrait ? 330 : 250, 260), target: V(0, 0, 10), fov: portrait ? 44 : 34 };
  const b: Shot = { position: V(-70, portrait ? 210 : 150, 150), target: V(0, 0, 0), fov: portrait ? 46 : 36 };
  return mix(a, b, k);
}

export function identityShot(p: number, portrait: boolean, still: boolean): Shot {
  const k = still ? 0 : easeInOut(p);
  const top = BOARD_HEIGHT + 8 * TOWER.floorH;
  const a: Shot = { position: V(-70, portrait ? 160 : 110, 120), target: V(TOWER.x, top * 0.4, TOWER.z), fov: portrait ? 46 : 36 };
  const b: Shot = { position: V(34, portrait ? 60 : 38, 60), target: V(TOWER.x, top * 0.55, TOWER.z), fov: portrait ? 58 : 42 };
  return still ? { position: V(-60, portrait ? 220 : 170, 170), target: V(0, 0, 8), fov: portrait ? 46 : 36 } : mix(a, b, k);
}

export function vehicleShot(p: number, portrait: boolean, car: Vector3): Shot {
  const k = easeInOut(p);
  const [sx, sz] = START.position;
  const c = car.lengthSq() > 0 ? car : V(sx, BOARD_HEIGHT + 0.5, sz);
  const a: Shot = { position: V(c.x + 22, c.y + (portrait ? 22 : 14), c.z - 10), target: V(c.x, c.y + 0.5, c.z), fov: portrait ? 52 : 38 };
  const b: Shot = { position: V(c.x + 7, c.y + (portrait ? 5 : 3), c.z - 6.5), target: V(c.x, c.y + 0.6, c.z), fov: portrait ? 56 : 40 };
  return mix(a, b, k);
}

export function behindShot(p: number, from: Shot, to: Shot): Shot {
  return mix(from, to, easeInOut(p));
}
