import {
  BoxGeometry,
  CanvasTexture,
  Group,
  Mesh,
  MeshLambertMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  type Material,
} from 'three';
import { BOARD_HALF, BOARD_HEIGHT, DISTRICTS, HUB_RADIUS, PLAY_HALF, ROADS, SUN_DIR, type Road } from './layout';
import type { BoardMark } from './district';
import type { BoxSpec } from '../physics/Physics';
import { profile } from '../../content/profile';

const SERIF = '"Instrument Serif", Georgia, serif';
const MONO = '"Geist Mono Variable", "Geist Mono", ui-monospace, monospace';
const SANS = '"Geist Variable", Geist, system-ui, sans-serif';

export async function loadBoardFonts() {
  try {
    await Promise.all([
      document.fonts.load(`italic 64px ${SERIF}`),
      document.fonts.load(`400 64px ${SERIF}`),
      document.fonts.load(`500 64px ${MONO}`),
      document.fonts.load(`600 64px ${SANS}`),
    ]);
  } catch {
    /* fall back to system fonts */
  }
}

export interface Massing {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  ry: number;
  y?: number;
}

/** Paints the board top: paper, plots, roads, labels, marks and (optionally) baked shadows. */
export function paintBoard(size: number, marks: BoardMark[], massing: Massing[], bakedShadows: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const s = size / (BOARD_HALF * 2);
  const X = (x: number) => (x + BOARD_HALF) * s;
  const Z = (z: number) => (z + BOARD_HALF) * s;

  // Paper.
  ctx.fillStyle = '#f2eee4';
  ctx.fillRect(0, 0, size, size);
  // Fine grain so the board reads as paper, not flat colour.
  const grain = ctx.createImageData(size, size);
  let seed = 7;
  for (let i = 0; i < grain.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const v = (seed / 2147483647) * 14;
    grain.data[i] = grain.data[i + 1] = grain.data[i + 2] = 0;
    grain.data[i + 3] = v;
  }
  const g2 = document.createElement('canvas');
  g2.width = g2.height = size;
  g2.getContext('2d')!.putImageData(grain, 0, 0);
  ctx.globalAlpha = 0.5;
  ctx.drawImage(g2, 0, 0);
  ctx.globalAlpha = 1;

  // Play area border: a thin ink frame with a title block, like a drawing sheet.
  ctx.strokeStyle = 'rgba(29,29,27,0.55)';
  ctx.lineWidth = Math.max(1, 0.25 * s);
  ctx.strokeRect(X(-PLAY_HALF - 4), Z(-PLAY_HALF - 4), (PLAY_HALF + 4) * 2 * s, (PLAY_HALF + 4) * 2 * s);
  ctx.fillStyle = '#1d1d1b';
  ctx.font = `italic ${3.2 * s}px ${SERIF}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText("The Builder's World", X(-PLAY_HALF + 2), Z(PLAY_HALF + 2.4));
  ctx.font = `${1.15 * s}px ${MONO}`;
  ctx.textAlign = 'right';
  ctx.fillText(`${profile.name.toUpperCase()}  ·  SITE MODEL  ·  NOT TO SCALE`, X(PLAY_HALF - 2), Z(PLAY_HALF + 2.4));

  // Plots behind everything.
  for (const m of marks) {
    if (m.kind !== 'plot') continue;
    ctx.fillStyle = m.tone;
    roundRect(ctx, X(m.x - m.w / 2), Z(m.z - m.d / 2), m.w * s, m.d * s, 3 * s);
    ctx.fill();
  }
  // Hub plaza.
  ctx.fillStyle = '#e8e2d5';
  ctx.beginPath();
  ctx.arc(X(0), Z(0), HUB_RADIUS * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(29,29,27,0.35)';
  ctx.lineWidth = 0.15 * s;
  for (let r = 6; r < HUB_RADIUS; r += 4) {
    ctx.beginPath();
    ctx.arc(X(0), Z(0), r * s, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Baked contact shadows (all tiers) and long sun shadows (low tier only).
  const sx = -SUN_DIR[0] / SUN_DIR[1];
  const sz = -SUN_DIR[2] / SUN_DIR[1];
  const hasFilter = 'filter' in ctx;
  ctx.save();
  if (hasFilter) ctx.filter = `blur(${Math.max(1, 0.6 * s)}px)`;
  ctx.fillStyle = 'rgba(60,45,30,0.16)';
  for (const m of massing) {
    if (m.h < 0.5 || m.y) continue;
    footprint(ctx, m, X, Z, s, 0.4);
    ctx.fill();
  }
  if (bakedShadows) {
    if (hasFilter) ctx.filter = `blur(${Math.max(1, 1.2 * s)}px)`;
    ctx.fillStyle = 'rgba(70,52,35,0.22)';
    for (const m of massing) {
      if (m.h < 0.5) continue;
      shadowHull(ctx, m, sx, sz, X, Z, s);
      ctx.fill();
    }
  }
  ctx.restore();

  // Roads: surface, then edges, then centre lines.
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const r of ROADS) {
    pathRoad(ctx, r, X, Z);
    ctx.strokeStyle = '#1d1d1b';
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = r.width * s + Math.max(1.5, 0.22 * s) * 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  for (const r of ROADS) {
    pathRoad(ctx, r, X, Z);
    ctx.strokeStyle = '#dcd5c8';
    ctx.lineWidth = r.width * s;
    ctx.stroke();
  }
  for (const r of ROADS) {
    if (r.centre !== 'dashed') continue;
    pathRoad(ctx, r, X, Z);
    ctx.strokeStyle = '#f7f4ec';
    ctx.lineWidth = Math.max(1, 0.18 * s);
    ctx.setLineDash([1.6 * s, 1.6 * s]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Marks: track, plans, hatched free plots, text.
  for (const m of marks) {
    if (m.kind === 'track') {
      ctx.strokeStyle = '#c9a27d';
      ctx.lineWidth = 3.2 * s;
      ctx.beginPath();
      ctx.ellipse(X(m.x), Z(m.z), m.rx * s, m.rz * s, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#f7f4ec';
      ctx.lineWidth = Math.max(1, 0.1 * s);
      for (const off of [-0.8, 0, 0.8]) {
        ctx.beginPath();
        ctx.ellipse(X(m.x), Z(m.z), (m.rx + off) * s, (m.rz + off) * s, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (m.kind === 'plan') {
      ctx.save();
      ctx.translate(X(m.x), Z(m.z));
      ctx.rotate(-m.ry);
      ctx.strokeStyle = '#2440d6';
      ctx.lineWidth = Math.max(1, 0.14 * s);
      ctx.setLineDash([0.6 * s, 0.35 * s]);
      ctx.strokeRect((-m.w / 2) * s, (-m.d / 2) * s, m.w * s, m.d * s);
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo((-m.w / 2) * s, (-m.d / 2) * s);
      ctx.lineTo((m.w / 2) * s, (m.d / 2) * s);
      ctx.moveTo((m.w / 2) * s, (-m.d / 2) * s);
      ctx.lineTo((-m.w / 2) * s, (m.d / 2) * s);
      ctx.globalAlpha = 0.35;
      ctx.stroke();
      ctx.globalAlpha = 1;
      if (m.text) {
        ctx.fillStyle = '#2440d6';
        ctx.font = `${0.62 * s}px ${MONO}`;
        ctx.textAlign = 'center';
        ctx.fillText('PLAN — ' + m.text.toUpperCase(), 0, (m.d / 2 + 0.9) * s);
      }
      ctx.restore();
    } else if (m.kind === 'hatch') {
      ctx.save();
      ctx.beginPath();
      ctx.rect(X(m.x - m.w / 2), Z(m.z - m.d / 2), m.w * s, m.d * s);
      ctx.clip();
      ctx.strokeStyle = 'rgba(29,29,27,0.22)';
      ctx.lineWidth = Math.max(1, 0.08 * s);
      for (let k = -m.d; k < m.w + m.d; k += 0.6) {
        ctx.beginPath();
        ctx.moveTo(X(m.x - m.w / 2 + k), Z(m.z - m.d / 2));
        ctx.lineTo(X(m.x - m.w / 2 + k - m.d), Z(m.z + m.d / 2));
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(29,29,27,0.4)';
      ctx.setLineDash([0.5 * s, 0.4 * s]);
      ctx.strokeRect(X(m.x - m.w / 2), Z(m.z - m.d / 2), m.w * s, m.d * s);
      ctx.setLineDash([]);
    } else if (m.kind === 'text') {
      ctx.save();
      ctx.translate(X(m.x), Z(m.z));
      if (m.ry) ctx.rotate(-m.ry);
      ctx.fillStyle = '#1d1d1b';
      ctx.font = `${m.font === 'serif' ? 'italic ' : m.font === 'sans' ? '600 ' : ''}${m.size * s}px ${m.font === 'serif' ? SERIF : m.font === 'mono' ? MONO : SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(m.text, 0, 0);
      ctx.restore();
    }
  }

  // District names printed beside each gateway, readable when approaching from the hub.
  for (const d of DISTRICTS) {
    const towards = Math.atan2(d.gateway[1], d.gateway[0]);
    const px = d.gateway[0] - Math.cos(towards) * 9;
    const pz = d.gateway[1] - Math.sin(towards) * 9;
    const side = d.id === 'personal' ? 11 : 0;
    ctx.save();
    ctx.translate(X(px + side), Z(pz));
    ctx.fillStyle = '#1d1d1b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `italic ${3 * s}px ${SERIF}`;
    ctx.fillText(d.name, 0, -0.6 * s);
    ctx.font = `${0.95 * s}px ${MONO}`;
    ctx.fillText(d.subtitle.toUpperCase(), 0, 2 * s);
    ctx.restore();
  }

  // The site map printed on the hub plaza: board outline, roads, five districts.
  drawSiteMap(ctx, X(0), Z(9), 0.085 * s, s);
  return canvas;
}

function drawSiteMap(ctx: CanvasRenderingContext2D, cx: number, cy: number, k: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(29,29,27,0.7)';
  ctx.lineWidth = Math.max(1, 0.08 * s);
  ctx.strokeRect(-PLAY_HALF * k, -PLAY_HALF * k, PLAY_HALF * 2 * k, PLAY_HALF * 2 * k);
  for (const r of ROADS) {
    ctx.beginPath();
    r.points.forEach((p, i) => (i ? ctx.lineTo(p[0] * k, p[1] * k) : ctx.moveTo(p[0] * k, p[1] * k)));
    if (r.closed) ctx.closePath();
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(36,64,214,0.85)';
  for (const d of DISTRICTS) {
    ctx.fillRect((d.centre[0] - d.half[0] * 0.6) * k, (d.centre[1] - d.half[1] * 0.6) * k, d.half[0] * 1.2 * k, d.half[1] * 1.2 * k);
  }
  ctx.fillStyle = '#1d1d1b';
  ctx.font = `${0.5 * s}px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.fillText('SITE PLAN', 0, (PLAY_HALF * k) + 0.9 * s);
  ctx.restore();
}

function pathRoad(ctx: CanvasRenderingContext2D, r: Road, X: (v: number) => number, Z: (v: number) => number) {
  ctx.beginPath();
  r.points.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Z(p[1])) : ctx.moveTo(X(p[0]), Z(p[1]))));
  if (r.closed) ctx.closePath();
}

function corners(m: Massing, grow = 0) {
  const c = Math.cos(m.ry);
  const sn = Math.sin(m.ry);
  const hw = m.w / 2 + grow;
  const hd = m.d / 2 + grow;
  return [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ].map(([lx, lz]) => [m.x + lx * c + lz * sn, m.z - lx * sn + lz * c] as [number, number]);
}

function footprint(ctx: CanvasRenderingContext2D, m: Massing, X: (v: number) => number, Z: (v: number) => number, _s: number, grow: number) {
  const pts = corners(m, grow);
  ctx.beginPath();
  pts.forEach(([x, z], i) => (i ? ctx.lineTo(X(x), Z(z)) : ctx.moveTo(X(x), Z(z))));
  ctx.closePath();
}

/** Convex hull of the base and the top projected along the sun. */
function shadowHull(ctx: CanvasRenderingContext2D, m: Massing, sx: number, sz: number, X: (v: number) => number, Z: (v: number) => number, _s: number) {
  const base = corners(m);
  const pts = [...base, ...base.map(([x, z]) => [x + sx * m.h, z + sz * m.h] as [number, number])];
  const hull = convexHull(pts);
  ctx.beginPath();
  hull.forEach(([x, z], i) => (i ? ctx.lineTo(X(x), Z(z)) : ctx.moveTo(X(x), Z(z))));
  ctx.closePath();
}

function convexHull(points: [number, number][]) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: [number, number][] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Board slab, printed top, kraft base, table, and the raised edge round the play area. */
export function buildBoard(canvas: HTMLCanvasElement, shadows: boolean): { group: Group; colliders: BoxSpec[]; texture: CanvasTexture; materials: Material[] } {
  const group = new Group();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  const topMat = new MeshLambertMaterial({ map: texture });
  const kraft = new MeshLambertMaterial({ color: '#b48e66' });
  const edge = new MeshLambertMaterial({ color: '#ece7dc' });
  const table = new MeshLambertMaterial({ color: '#9b7a5c' });

  const top = new Mesh(new PlaneGeometry(BOARD_HALF * 2, BOARD_HALF * 2), topMat);
  top.rotation.x = -Math.PI / 2;
  top.position.y = BOARD_HEIGHT;
  top.receiveShadow = shadows;
  const slab = new Mesh(new BoxGeometry(BOARD_HALF * 2, BOARD_HEIGHT - 0.01, BOARD_HALF * 2), edge);
  slab.position.y = (BOARD_HEIGHT - 0.01) / 2;
  const base = new Mesh(new BoxGeometry(BOARD_HALF * 2 + 16, 1.2, BOARD_HALF * 2 + 16), kraft);
  base.position.y = -0.6;
  base.receiveShadow = shadows;
  const tableMesh = new Mesh(new BoxGeometry(1400, 2, 1400), table);
  tableMesh.position.y = -2.2;
  tableMesh.receiveShadow = shadows;
  group.add(top, slab, base, tableMesh);

  // Raised card edge around the play area.
  const lipH = 0.7;
  const t = 0.6;
  const L = (PLAY_HALF + 0.5) * 2 + t;
  const lips: [number, number, number, number][] = [
    [0, -PLAY_HALF - 0.5, L, t],
    [0, PLAY_HALF + 0.5, L, t],
    [-PLAY_HALF - 0.5, 0, t, L],
    [PLAY_HALF + 0.5, 0, t, L],
  ];
  const colliders: BoxSpec[] = [{ x: 0, y: BOARD_HEIGHT / 2, z: 0, hx: BOARD_HALF, hy: BOARD_HEIGHT / 2, hz: BOARD_HALF, kind: 'ground' }];
  for (const [x, z, w, d] of lips) {
    const m = new Mesh(new BoxGeometry(w, lipH, d), edge);
    m.position.set(x, BOARD_HEIGHT + lipH / 2, z);
    m.castShadow = shadows;
    group.add(m);
    colliders.push({ x, y: BOARD_HEIGHT + 1, z, hx: w / 2, hy: 1, hz: d / 2, kind: 'building' });
  }
  return { group, colliders, texture, materials: [topMat, kraft, edge, table] };
}
