import {
  BoxGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shape,
  TorusGeometry,
  Vector2,
  type BufferGeometry,
  type Material,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * The original miniature electric car, modelled in code.
 * Faces +X. Origin at the chassis centre (matches the physics body).
 * Node names follow the contract in VEHICLE_AND_CAMERA_SPECIFICATION.md §1.4.
 *
 * Design: a short upright two-seat city car. Closed nose with a slim light
 * bar, big glass, single-curve roof in ivory, wheels pushed to the corners.
 * Not based on any production car or on the reference site's vehicle.
 */

export interface CarParts {
  root: Group;
  body: Group;
  wheels: { pivot: Group; spin: Group }[];
  lightsFront: MeshStandardMaterial;
  lightsRear: MeshStandardMaterial;
  lightsReverse: MeshStandardMaterial;
  materials: Material[];
}

const L = 2.6; // length
const W = 1.42; // body width
const WHEEL_R = 0.3;
const WHEEL_X = 0.9;
const WHEEL_Z = 0.625;
const ARCH_R = 0.37;
/** The physics chassis centre is this far above the body's bottom edge. */
const ORIGIN_Y = 0.37;

/** Side profile of the lower body with wheel arches cut out, in (x, y) metres. */
function lowerProfile(): Shape {
  const s = new Shape();
  const b = 0.12; // bottom of the body above ground-level reference
  const top = 0.82;
  const hx = L / 2;
  s.moveTo(-hx + 0.12, b);
  // Rear arch.
  s.lineTo(-WHEEL_X - ARCH_R, b);
  s.absarc(-WHEEL_X, b + 0.06, ARCH_R, Math.PI, 0, true);
  s.lineTo(WHEEL_X - ARCH_R, b);
  // Front arch.
  s.absarc(WHEEL_X, b + 0.06, ARCH_R, Math.PI, 0, true);
  s.lineTo(hx - 0.14, b);
  // Rounded nose, slightly raked.
  s.quadraticCurveTo(hx, b, hx, b + 0.16);
  s.lineTo(hx - 0.02, top - 0.12);
  s.quadraticCurveTo(hx - 0.05, top, hx - 0.22, top);
  // Waistline back to the tail.
  s.lineTo(-hx + 0.16, top);
  s.quadraticCurveTo(-hx, top, -hx, top - 0.16);
  s.lineTo(-hx, b + 0.12);
  s.quadraticCurveTo(-hx, b, -hx + 0.12, b);
  return s;
}

/** Side profile of the glasshouse (cabin) above the waist. */
function cabinProfile(inset = 0): Shape {
  const s = new Shape();
  const y0 = 0.8;
  const y1 = 1.5 - inset;
  s.moveTo(0.98 - inset, y0);
  s.quadraticCurveTo(0.62, y1 - 0.02, 0.38 - inset * 0.5, y1);
  s.lineTo(-0.95 + inset * 0.5, y1);
  s.quadraticCurveTo(-1.16 + inset, y1 - 0.05, -1.2 + inset, y0);
  s.lineTo(0.98 - inset, y0);
  return s;
}

function extrude(shape: Shape, depth: number, bevel: number): BufferGeometry {
  const g = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 3,
    curveSegments: 14,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

function box(w: number, h: number, d: number, x: number, y: number, z: number) {
  const g = new BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}

export function buildCar(lod: 'high' | 'low', paint = '#2440d6'): CarParts {
  const hi = lod === 'high';
  const mats = {
    paint: new MeshPhysicalMaterial({ color: paint, roughness: 0.32, metalness: 0.15, clearcoat: hi ? 0.8 : 0, clearcoatRoughness: 0.2 }),
    roof: new MeshStandardMaterial({ color: '#f3f0e8', roughness: 0.45 }),
    trim: new MeshStandardMaterial({ color: '#16171a', roughness: 0.6 }),
    glass: new MeshPhysicalMaterial({ color: '#9fb4c8', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.42, depthWrite: false }),
    interior: new MeshStandardMaterial({ color: '#3a3b3f', roughness: 0.85 }),
    seat: new MeshStandardMaterial({ color: '#e6e1d4', roughness: 0.8 }),
    tyre: new MeshStandardMaterial({ color: '#1b1b1c', roughness: 0.9 }),
    rim: new MeshStandardMaterial({ color: '#e9e5da', roughness: 0.35, metalness: 0.3 }),
    hub: new MeshStandardMaterial({ color: paint, roughness: 0.4 }),
  };
  const lightsFront = new MeshStandardMaterial({ color: '#fffbea', emissive: '#fff3cf', emissiveIntensity: 0.4 });
  const lightsRear = new MeshStandardMaterial({ color: '#7a1612', emissive: '#ff2a1a', emissiveIntensity: 0.35 });
  const lightsReverse = new MeshStandardMaterial({ color: '#d9d9d9', emissive: '#ffffff', emissiveIntensity: 0 });

  const root = new Group();
  root.name = 'car_root';
  const body = new Group();
  body.name = 'car_body';
  root.add(body);

  // Lower body (paint).
  const lower = extrude(lowerProfile(), W - 0.12, 0.06);
  // Black lower cladding band and bumpers.
  const cladding = mergeGeometries([
    box(L - 0.1, 0.12, W + 0.02, 0, 0.2, 0),
    box(0.12, 0.2, W - 0.1, L / 2 - 0.02, 0.26, 0),
    box(0.12, 0.2, W - 0.1, -L / 2 + 0.02, 0.26, 0),
  ]);
  // Cabin: glass shell, with pillars and the ivory roof over it.
  const glass = extrude(cabinProfile(0.02), W - 0.2, 0.03);
  const roofShape = new Shape();
  roofShape.moveTo(0.44, 1.47);
  roofShape.quadraticCurveTo(0.2, 1.56, -0.2, 1.56);
  roofShape.lineTo(-0.94, 1.54);
  roofShape.quadraticCurveTo(-1.1, 1.52, -1.1, 1.44);
  roofShape.lineTo(0.44, 1.44);
  const roof = extrude(roofShape, W - 0.1, 0.04);
  const pillars = mergeGeometries([
    // A pillars (raked), B pillars, C pillars on each side.
    ...[-1, 1].flatMap((side) => {
      const z = side * (W / 2 - 0.1);
      const a = box(0.09, 0.72, 0.07, 0.7, 1.14, z);
      a.rotateZ(0);
      const aGeo = new BoxGeometry(0.08, 0.78, 0.07);
      aGeo.rotateZ(0.62);
      aGeo.translate(0.72, 1.13, z);
      return [aGeo, box(0.1, 0.7, 0.07, -0.18, 1.15, z), box(0.14, 0.7, 0.07, -1.06, 1.12, z)];
    }),
  ]);
  // Mirrors.
  const mirrors = mergeGeometries([-1, 1].map((s) => box(0.1, 0.08, 0.16, 0.74, 0.92, s * (W / 2 + 0.06))));

  const addMesh = (g: BufferGeometry, m: Material, name: string, parent: Group = body, cast = true) => {
    const mesh = new Mesh(g, m);
    mesh.name = name;
    mesh.castShadow = cast;
    mesh.receiveShadow = false;
    parent.add(mesh);
    return mesh;
  };

  addMesh(lower, mats.paint, 'car_body_shell');
  addMesh(cladding, mats.trim, 'car_cladding');
  addMesh(pillars, mats.paint, 'car_pillars');
  addMesh(roof, mats.roof, 'car_roof');
  addMesh(mirrors, mats.trim, 'car_mirrors');
  addMesh(glass, mats.glass, 'car_glass', body, false);

  // Interior: two seats, dashboard, steering wheel.
  const interior = new Group();
  interior.name = 'car_interior';
  body.add(interior);
  if (hi) {
    const seats = mergeGeometries(
      [-0.3, 0.3].flatMap((z) => [box(0.42, 0.14, 0.42, -0.3, 0.86, z), box(0.12, 0.5, 0.42, -0.52, 1.1, z)]),
    );
    addMesh(seats, mats.seat, 'car_seats', interior, false);
    addMesh(box(0.22, 0.16, W - 0.3, 0.6, 0.92, 0), mats.interior, 'car_dash', interior, false);
    const wheelG = new TorusGeometry(0.13, 0.022, 6, 18);
    wheelG.rotateY(Math.PI / 2);
    wheelG.rotateZ(0.5);
    wheelG.translate(0.36, 1.04, -0.3);
    addMesh(wheelG, mats.trim, 'car_steering_wheel', interior, false);
  }

  // Lights: front light bar across the closed nose, rear lamps, reversing lamps.
  const front = addMesh(
    mergeGeometries([box(0.04, 0.06, W - 0.38, L / 2 + 0.005, 0.66, 0), ...[-1, 1].map((s) => box(0.05, 0.12, 0.2, L / 2 - 0.01, 0.62, s * (W / 2 - 0.2)))]),
    lightsFront,
    'car_lights_front',
    body,
    false,
  );
  void front;
  addMesh(mergeGeometries([-1, 1].map((s) => box(0.04, 0.2, 0.22, -L / 2 - 0.005, 0.62, s * (W / 2 - 0.2)))), lightsRear, 'car_lights_rear', body, false);
  addMesh(mergeGeometries([-1, 1].map((s) => box(0.04, 0.07, 0.1, -L / 2 - 0.006, 0.44, s * (W / 2 - 0.36)))), lightsReverse, 'car_lights_reverse', body, false);

  // Small "SK" mark on the tail: two raised bars, deliberately understated.
  if (hi) addMesh(box(0.02, 0.05, 0.18, -L / 2 - 0.01, 0.76, 0), mats.roof, 'car_mark', body, false);

  // Shift the body so its origin matches the physics chassis centre.
  body.position.y = -ORIGIN_Y;

  // Wheels: tyre (lathe profile with a rounded shoulder) + rim with five spokes.
  const tyreProfile = [
    new Vector2(0.2, -0.11),
    new Vector2(0.27, -0.12),
    new Vector2(WHEEL_R - 0.01, -0.1),
    new Vector2(WHEEL_R, -0.05),
    new Vector2(WHEEL_R, 0.05),
    new Vector2(WHEEL_R - 0.01, 0.1),
    new Vector2(0.27, 0.12),
    new Vector2(0.2, 0.11),
  ];
  const tyreG = new LatheGeometry(tyreProfile, hi ? 28 : 14);
  tyreG.rotateX(Math.PI / 2);
  const rimG = new CylinderGeometry(0.2, 0.2, 0.16, hi ? 24 : 12);
  rimG.rotateX(Math.PI / 2);
  const spokes: BufferGeometry[] = [];
  for (let i = 0; i < 5; i++) {
    const s = new BoxGeometry(0.035, 0.17, 0.03);
    s.translate(0, 0.09, 0);
    s.rotateZ((i / 5) * Math.PI * 2);
    s.translate(0, 0, 0.085);
    spokes.push(s);
  }
  const hubG = new CylinderGeometry(0.06, 0.06, 0.05, 12);
  hubG.rotateX(Math.PI / 2);
  hubG.translate(0, 0, 0.09);
  const spokeG = mergeGeometries(spokes);

  const wheels: CarParts['wheels'] = [];
  const pos = [
    [WHEEL_X, -WHEEL_Z],
    [WHEEL_X, WHEEL_Z],
    [-WHEEL_X, -WHEEL_Z],
    [-WHEEL_X, WHEEL_Z],
  ];
  const names = ['wheel_FL', 'wheel_FR', 'wheel_RL', 'wheel_RR'];
  pos.forEach(([x, z], i) => {
    const pivot = new Group();
    pivot.name = names[i];
    pivot.position.set(x, -0.05 - 0.28 + 0.06, z);
    const spin = new Group();
    pivot.add(spin);
    // Outward side of each wheel faces away from the car.
    const outward = z < 0 ? -1 : 1;
    const tyre = new Mesh(tyreG, mats.tyre);
    tyre.name = 'tyre';
    tyre.castShadow = true;
    const rim = new Mesh(rimG, mats.rim);
    rim.name = 'rim';
    const sp = new Mesh(spokeG, mats.hub);
    sp.scale.z = outward;
    const hub = new Mesh(hubG, mats.rim);
    hub.scale.z = outward;
    spin.add(tyre, rim, sp, hub);
    root.add(pivot);
    wheels.push({ pivot, spin });
  });

  return {
    root,
    body,
    wheels,
    lightsFront,
    lightsRear,
    lightsReverse,
    materials: [...Object.values(mats), lightsFront, lightsRear, lightsReverse],
  };
}
