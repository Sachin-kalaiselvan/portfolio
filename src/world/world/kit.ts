import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  IcosahedronGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  Shape,
  Vector3,
  type Material,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { BoxSpec } from '../physics/Physics';
import { BOARD_HEIGHT } from './layout';

/**
 * The architect's study model kit. Ivory card, pale timber, kraft, steel,
 * dark glass, a few accent colours. Everything is built from these shared
 * materials and merged per material, so a whole district is a handful of
 * draw calls.
 */
export type MatKey =
  | 'card'
  | 'cardShade'
  | 'timber'
  | 'kraft'
  | 'steel'
  | 'glass'
  | 'plaster'
  | 'massing'
  | 'foliage'
  | 'foliageDark'
  | 'ink'
  | 'cobalt'
  | 'vermilion'
  | 'window'
  | 'scaffold'
  | 'figure'
  | 'rubber'
  | 'rack';

export type Materials = Record<MatKey, Material>;

export function createMaterials(): Materials {
  const lam = (color: string) => new MeshLambertMaterial({ color });
  return {
    card: lam('#f1ede3'),
    cardShade: lam('#e3ddcf'),
    timber: lam('#d8bf96'),
    kraft: lam('#b8916a'),
    steel: new MeshStandardMaterial({ color: '#9aa0a6', roughness: 0.45, metalness: 0.5 }),
    glass: new MeshStandardMaterial({ color: '#8b9aa6', roughness: 0.12, metalness: 0.15 }),
    plaster: lam('#e9d7c0'),
    massing: lam('#d9d5cc'),
    foliage: lam('#8fa37a'),
    foliageDark: lam('#6f8460'),
    ink: lam('#1d1d1b'),
    cobalt: new MeshStandardMaterial({ color: '#2440d6', roughness: 0.5 }),
    vermilion: lam('#e2532c'),
    window: new MeshStandardMaterial({ color: '#5f6c78', roughness: 0.18, metalness: 0.1, emissive: '#ffd9a0', emissiveIntensity: 0 }),
    scaffold: lam('#cfb48a'),
    figure: lam('#9c9a94'),
    rubber: lam('#2a2a2a'),
    rack: new MeshStandardMaterial({ color: '#141821', emissive: '#4f7bff', emissiveIntensity: 0.6, roughness: 0.6 }),
  };
}

const UP = new Vector3(0, 1, 0);

/** Collects geometry per material, colliders, massing and labels for one area. */
export class Builder {
  private buckets = new Map<MatKey, BufferGeometry[]>();
  readonly colliders: BoxSpec[] = [];
  /** Building volumes: used for the low-detail proxy and the baked shadows on the board. */
  readonly massing: { x: number; z: number; w: number; d: number; h: number; ry: number; y?: number }[] = [];
  readonly extras: Mesh[] = [];
  private m = new Matrix4();
  private q = new Quaternion();

  constructor(public readonly detail = true, public readonly density = 1) {}

  /** Add a geometry already in world space. Consumes the geometry. */
  add(mat: MatKey, g: BufferGeometry) {
    const clean = g.index ? g.toNonIndexed() : g;
    if (clean !== g) g.dispose();
    for (const name of Object.keys(clean.attributes)) if (name !== 'position' && name !== 'normal') clean.deleteAttribute(name);
    if (!this.buckets.has(mat)) this.buckets.set(mat, []);
    this.buckets.get(mat)!.push(clean);
  }

  /** A box by centre-bottom position. `y` is the base height above the board. */
  box(mat: MatKey, x: number, y: number, z: number, w: number, h: number, d: number, ry = 0) {
    const g = new BoxGeometry(w, h, d);
    this.q.setFromAxisAngle(UP, ry);
    this.m.compose(new Vector3(x, BOARD_HEIGHT + y + h / 2, z), this.q, new Vector3(1, 1, 1));
    g.applyMatrix4(this.m);
    this.add(mat, g);
  }

  /** Box with local placement inside a rotated frame (cx, cz, ry). */
  boxAt(mat: MatKey, cx: number, cz: number, ry: number, lx: number, y: number, lz: number, w: number, h: number, d: number) {
    const c = Math.cos(ry);
    const s = Math.sin(ry);
    this.box(mat, cx + lx * c + lz * s, y, cz - lx * s + lz * c, w, h, d, ry);
  }

  cylinder(mat: MatKey, x: number, y: number, z: number, r: number, h: number, seg = 12, horizontalRy: number | null = null) {
    const g = new CylinderGeometry(r, r, h, seg);
    if (horizontalRy !== null) {
      g.rotateZ(Math.PI / 2);
      g.rotateY(horizontalRy);
      g.translate(x, BOARD_HEIGHT + y + r, z);
    } else g.translate(x, BOARD_HEIGHT + y + h / 2, z);
    this.add(mat, g);
  }

  collider(x: number, y: number, z: number, w: number, h: number, d: number, ry = 0) {
    this.colliders.push({ x, y: BOARD_HEIGHT + y + h / 2, z, hx: w / 2, hy: h / 2, hz: d / 2, ry, kind: 'building' });
  }

  /** Drop collected geometry without building it (plan pass). */
  discard() {
    for (const list of this.buckets.values()) list.forEach((g) => g.dispose());
    this.buckets.clear();
    for (const e of this.extras) {
      e.geometry.dispose();
      (e.userData.texture as { dispose(): void } | undefined)?.dispose();
    }
    this.extras.length = 0;
  }

  /** Merge everything into one mesh per material. */
  build(mats: Materials, shadows: boolean): Group {
    const group = new Group();
    for (const [key, list] of this.buckets) {
      if (!list.length) continue;
      const merged = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      if (!merged) continue;
      merged.computeBoundingSphere();
      const mesh = new Mesh(merged, mats[key]);
      mesh.name = key;
      const flat = key === 'ink' || key === 'figure';
      mesh.castShadow = shadows && !flat;
      mesh.receiveShadow = shadows;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      group.add(mesh);
    }
    this.buckets.clear();
    for (const e of this.extras) group.add(e);
    return group;
  }
}

// ——— Building pieces ———————————————————————————————————————————————

export interface BuildingOpts {
  floors: number;
  floorHeight?: number;
  mat?: MatKey;
  /** Window rows on the long faces. */
  windows?: boolean;
  /** 'done' or 'build' (partly built: scaffold over the upper floors). */
  stage?: 'done' | 'build';
  roof?: 'flat' | 'parapet';
  collide?: boolean;
  balconies?: boolean;
}

/** A card building: floor slabs proud of the walls, cut window bands, optional scaffold. */
export function building(b: Builder, x: number, z: number, w: number, d: number, ry: number, o: BuildingOpts) {
  const fh = o.floorHeight ?? 3.1;
  const floors = o.floors;
  const built = o.stage === 'build' ? Math.max(1, Math.ceil(floors / 2)) : floors;
  const h = floors * fh;
  const mat = o.mat ?? 'card';
  b.massing.push({ x, z, w, d, h, ry });
  if (o.collide !== false) b.collider(x, 0, z, w, h, d, ry);

  // Finished floors: solid walls. Unfinished floors: grey card massing, only slabs and columns.
  b.boxAt(mat, x, z, ry, 0, 0, 0, w, built * fh, d);
  if (!b.detail) return;
  for (let f = 1; f <= built; f++) b.boxAt('cardShade', x, z, ry, 0, f * fh - 0.12, 0, w + 0.24, 0.12, d + 0.24);

  if (o.windows !== false) {
    const bays = Math.max(1, Math.floor(w / 2.4));
    const baysD = Math.max(1, Math.floor(d / 2.4));
    for (let f = 0; f < built; f++) {
      const y = f * fh + (f === 0 ? 0.6 : 0.9);
      const wh = f === 0 ? 1.9 : 1.6;
      for (let i = 0; i < bays; i++) {
        const lx = -w / 2 + (w / bays) * (i + 0.5);
        const ww = (w / bays) * 0.62;
        b.boxAt('window', x, z, ry, lx, y, d / 2 + 0.02, ww, wh, 0.08);
        b.boxAt('window', x, z, ry, lx, y, -d / 2 - 0.02, ww, wh, 0.08);
        if (o.balconies && f > 0 && i % 2 === 0) b.boxAt('cardShade', x, z, ry, lx, y - 0.95, d / 2 + 0.55, ww + 0.4, 0.14, 1.0);
      }
      for (let i = 0; i < baysD; i++) {
        const lz = -d / 2 + (d / baysD) * (i + 0.5);
        const ww = (d / baysD) * 0.6;
        b.boxAt('window', x, z, ry, w / 2 + 0.02, y, lz, 0.08, wh, ww);
        b.boxAt('window', x, z, ry, -w / 2 - 0.02, y, lz, 0.08, wh, ww);
      }
    }
  }

  if (o.roof === 'parapet' && built === floors) {
    b.boxAt(mat, x, z, ry, 0, h, d / 2 - 0.1, w, 0.6, 0.2);
    b.boxAt(mat, x, z, ry, 0, h, -d / 2 + 0.1, w, 0.6, 0.2);
    b.boxAt(mat, x, z, ry, w / 2 - 0.1, h, 0, 0.2, 0.6, d);
    b.boxAt(mat, x, z, ry, -w / 2 + 0.1, h, 0, 0.2, 0.6, d);
  }

  if (built < floors) {
    // Unbuilt floors: slabs on thin columns, wrapped in scaffold.
    for (let f = built + 1; f <= floors; f++) b.boxAt('massing', x, z, ry, 0, f * fh - 0.25, 0, w, 0.25, d);
    const cols = [
      [-w / 2 + 0.3, -d / 2 + 0.3],
      [w / 2 - 0.3, -d / 2 + 0.3],
      [-w / 2 + 0.3, d / 2 - 0.3],
      [w / 2 - 0.3, d / 2 - 0.3],
    ];
    for (const [cx, cz] of cols) b.boxAt('massing', x, z, ry, cx, built * fh, cz, 0.35, (floors - built) * fh, 0.35);
    scaffold(b, x, z, w + 1.2, d + 1.2, built * fh - fh, (floors - built + 1) * fh + 1, ry);
  }
}

/** Scaffold wrapped round a rectangle: standards, ledgers and boards. */
export function scaffold(b: Builder, x: number, z: number, w: number, d: number, y0: number, h: number, ry = 0) {
  if (!b.detail) return;
  const lifts = Math.max(1, Math.round(h / 2));
  const lh = h / lifts;
  const sides: [number, number, number, number][] = [
    [0, d / 2, w, 0],
    [0, -d / 2, w, 0],
    [w / 2, 0, d, Math.PI / 2],
    [-w / 2, 0, d, Math.PI / 2],
  ];
  for (const [lx, lz, len, rot] of sides) {
    const n = Math.max(2, Math.round(len / 2.5));
    for (let i = 0; i <= n; i++) {
      const t = -len / 2 + (len / n) * i;
      const px = rot ? lx : lx + t;
      const pz = rot ? lz + t : lz;
      b.boxAt('scaffold', x, z, ry, px, y0, pz, 0.08, h, 0.08);
    }
    for (let k = 1; k <= lifts; k++) {
      const yy = y0 + lh * k;
      if (rot) b.boxAt('scaffold', x, z, ry, lx, yy, lz, 0.07, 0.07, len);
      else b.boxAt('scaffold', x, z, ry, lx, yy, lz, len, 0.07, 0.07);
    }
    // One diagonal brace per side.
    const g = new BoxGeometry(0.06, Math.hypot(len, h), 0.06);
    g.rotateZ(Math.atan2(len, h) * (rot ? 0 : 1));
    if (rot) g.rotateX(-Math.atan2(len, h));
    const c = Math.cos(ry);
    const s = Math.sin(ry);
    g.rotateY(ry);
    g.translate(x + lx * c + lz * s, BOARD_HEIGHT + y0 + h / 2, z - lx * s + lz * c);
    b.add('scaffold', g);
  }
}

/** North-light sawtooth roof over a rectangle, teeth running along local X. */
export function sawtoothRoof(b: Builder, x: number, z: number, w: number, d: number, y: number, teeth: number, ry = 0) {
  const tw = w / teeth;
  const th = 2.4;
  for (let i = 0; i < teeth; i++) {
    const s = new Shape();
    s.moveTo(0, 0);
    s.lineTo(tw, 0);
    s.lineTo(tw, th);
    s.lineTo(0, 0);
    const g = new ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
    g.translate(-w / 2 + i * tw, 0, -d / 2);
    g.rotateY(ry);
    g.translate(x, BOARD_HEIGHT + y, z);
    b.add('card', g);
    // Glazed vertical face of each tooth.
    b.boxAt('glass', x, z, ry, -w / 2 + (i + 1) * tw - 0.04, y, 0, 0.06, th * 0.92, d * 0.96);
  }
}

export function tree(b: Builder, x: number, z: number, scale = 1, dark = false) {
  if (b.density < 1 && pseudoRandom(x * 13.1 + z * 7.7) > b.density) return;
  b.cylinder('timber', x, 0, z, 0.12 * scale, 1.4 * scale, 6);
  const g = new IcosahedronGeometry(1.25 * scale, 1);
  g.scale(1, 0.9, 1);
  g.translate(x, BOARD_HEIGHT + 2.3 * scale, z);
  b.add(dark ? 'foliageDark' : 'foliage', g);
  if (b.detail) {
    const g2 = new IcosahedronGeometry(0.8 * scale, 1);
    g2.translate(x + 0.5 * scale, BOARD_HEIGHT + 2.9 * scale, z - 0.3 * scale);
    b.add(dark ? 'foliageDark' : 'foliage', g2);
  }
}

/** A plain grey architect's scale figure. */
export function figure(b: Builder, x: number, z: number, ry = 0) {
  if (!b.detail || (b.density < 1 && pseudoRandom(x * 3.3 + z) > b.density)) return;
  b.boxAt('figure', x, z, ry, 0, 0, 0, 0.32, 0.95, 0.22);
  b.boxAt('figure', x, z, ry, 0, 0.95, 0, 0.42, 0.65, 0.26);
  b.cylinder('figure', x, 1.62, z, 0.13, 0.26, 8);
}

export function streetLight(b: Builder, x: number, z: number, ry = 0) {
  if (!b.detail) return;
  b.cylinder('steel', x, 0, z, 0.06, 4.2, 6);
  b.boxAt('steel', x, z, ry, 0.5, 4.1, 0, 1.1, 0.08, 0.12);
  b.boxAt('window', x, z, ry, 0.95, 3.98, 0, 0.36, 0.08, 0.2);
}

export function bench(b: Builder, x: number, z: number, ry = 0) {
  if (!b.detail) return;
  b.boxAt('timber', x, z, ry, 0, 0.42, 0, 1.6, 0.08, 0.45);
  b.boxAt('timber', x, z, ry, 0, 0.5, -0.2, 1.6, 0.4, 0.06);
  b.boxAt('steel', x, z, ry, -0.65, 0, 0, 0.06, 0.42, 0.4);
  b.boxAt('steel', x, z, ry, 0.65, 0, 0, 0.06, 0.42, 0.4);
}

/** Small flag on a pole. `mat` vermilion marks Live work; cobalt marks the topped-out tower. */
export function flag(b: Builder, x: number, y: number, z: number, mat: MatKey = 'vermilion', h = 3) {
  b.cylinder('steel', x, y, z, 0.04, h, 6);
  b.box(mat, x + 0.45, y + h - 0.6, z, 0.9, 0.55, 0.03);
}

/** Closed gate between two posts, used for a paused project. */
export function gate(b: Builder, x: number, z: number, w: number, ry = 0) {
  b.boxAt('steel', x, z, ry, -w / 2, 0, 0, 0.18, 1.8, 0.18);
  b.boxAt('steel', x, z, ry, w / 2, 0, 0, 0.18, 1.8, 0.18);
  const bars = Math.round(w / 0.35);
  for (let i = 1; i < bars; i++) b.boxAt('steel', x, z, ry, -w / 2 + (w / bars) * i, 0.1, 0, 0.05, 1.5, 0.05);
  b.boxAt('steel', x, z, ry, 0, 1.55, 0, w, 0.08, 0.08);
  b.boxAt('steel', x, z, ry, 0, 0.3, 0, w, 0.08, 0.08);
  b.collider(x, 0, z, w + 0.2, 1.8, 0.4, ry);
}

export function pseudoRandom(seed: number) {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

// ——— Lettering ——————————————————————————————————————————————————————

export interface LabelOpts {
  font?: string;
  color?: string;
  background?: string | null;
  /** World height of the label in metres. */
  height: number;
  padding?: number;
  align?: 'center' | 'left';
}

/** Text painted to a canvas, on a plane. Used for signs, plaques and building lettering. */
export function label(text: string, o: LabelOpts): Mesh {
  const font = o.font ?? '600 96px "Geist Variable", Geist, system-ui, sans-serif';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = font;
  const lines = text.split('\n');
  const size = parseInt(/(\d+)px/.exec(font)?.[1] ?? '96', 10);
  const pad = (o.padding ?? 0.35) * size;
  const width = Math.ceil(Math.max(...lines.map((l) => ctx.measureText(l).width)) + pad * 2);
  const lineH = size * 1.15;
  const height = Math.ceil(lines.length * lineH + pad * 1.4);
  canvas.width = width;
  canvas.height = height;
  if (o.background) {
    ctx.fillStyle = o.background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.font = font;
  ctx.fillStyle = o.color ?? '#1d1d1b';
  ctx.textBaseline = 'middle';
  ctx.textAlign = o.align === 'left' ? 'left' : 'center';
  lines.forEach((l, i) => ctx.fillText(l, o.align === 'left' ? pad : width / 2, pad * 0.7 + lineH * (i + 0.5)));
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  const h = o.height;
  const w = (h * width) / height;
  const mat = new MeshBasicMaterial({ map: tex, transparent: !o.background, side: DoubleSide, toneMapped: false });
  const mesh = new Mesh(new PlaneGeometry(w, h), mat);
  mesh.userData.texture = tex;
  return mesh;
}

/** Place a label in the world, facing a direction (ry = rotation about Y). */
export function placeLabel(b: Builder, text: string, x: number, y: number, z: number, ry: number, o: LabelOpts) {
  if (!b.detail) return;
  const m = label(text, o);
  m.position.set(x, BOARD_HEIGHT + y, z);
  m.rotation.y = ry;
  b.extras.push(m);
}

/** Free a group built by a Builder, including label textures. */
export function disposeGroup(g: Group) {
  g.traverse((o) => {
    const m = o as Mesh;
    if (m.isMesh) {
      m.geometry.dispose();
      const tex = m.userData.texture as CanvasTexture | undefined;
      if (tex) {
        tex.dispose();
        (m.material as Material).dispose();
      }
    }
  });
  g.removeFromParent();
}
