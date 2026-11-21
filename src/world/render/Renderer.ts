import {
  ACESFilmicToneMapping,
  Color,
  Fog,
  PCFShadowMap,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { TiltShiftPass } from './TiltShift';
import { TIERS, type TierSettings } from './quality';
import type { Tier } from '../core/types';
import { WorldError } from '../core/types';

/**
 * Owns the WebGL renderer, pixel ratio, render scale and post-processing.
 * Decision (M1 checkpoint): WebGLRenderer, not WebGPURenderer. Measured on
 * 21 Nov 2026 with a minimal scene: 131 KB gzipped vs 218 KB for the WebGPU
 * build, and WebGL 2 is the proven path on older iPhones.
 */
export class Renderer {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(50, 1, 0.3, 900);
  private composer: EffectComposer | null = null;
  private tiltH: TiltShiftPass | null = null;
  private tiltV: TiltShiftPass | null = null;
  settings: TierSettings;
  renderScale = 1;
  private width = 1;
  private height = 1;
  onContextLost: (() => void) | null = null;

  constructor(private container: HTMLElement, tier: Tier) {
    this.settings = TIERS[tier];
    try {
      this.renderer = new WebGLRenderer({
        antialias: this.settings.antialias,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
      });
    } catch {
      throw new WorldError('no-webgl', 'WebGL could not start on this device.');
    }
    const r = this.renderer;
    r.outputColorSpace = SRGBColorSpace;
    r.toneMapping = ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.shadowMap.type = PCFShadowMap;
    // Counted per frame across every pass, reset in render().
    r.info.autoReset = false;
    r.domElement.className = 'world-canvas';
    r.domElement.setAttribute('aria-hidden', 'true');
    // A bright model-maker's studio: pale wall, the board on a wooden table, distance fading into the wall.
    this.scene.background = new Color('#d6cdbd');
    this.scene.fog = new Fog('#d6cdbd', 260, 760);
    container.appendChild(r.domElement);
    r.domElement.addEventListener('webglcontextlost', this.handleLost);
    this.applyTier(tier);
  }

  private handleLost = (e: Event) => {
    e.preventDefault();
    this.onContextLost?.();
  };

  applyTier(tier: Tier) {
    this.settings = TIERS[tier];
    this.renderScale = Math.min(Math.max(this.renderScale, this.settings.renderScaleMin), this.settings.renderScaleMax);
    this.renderer.shadowMap.enabled = this.settings.shadows;
    this.renderer.shadowMap.needsUpdate = true;
    this.setupComposer();
    this.resize();
  }

  private setupComposer() {
    this.composer?.dispose();
    this.tiltH?.dispose();
    this.tiltV?.dispose();
    this.composer = null;
    this.tiltH = this.tiltV = null;
    if (!this.settings.tiltShift) return;
    const c = new EffectComposer(this.renderer);
    c.addPass(new RenderPass(this.scene, this.camera));
    this.tiltH = new TiltShiftPass(true);
    this.tiltV = new TiltShiftPass(false);
    c.addPass(this.tiltH);
    c.addPass(this.tiltV);
    c.addPass(new OutputPass());
    this.composer = c;
  }

  /** 0 = off. Used to soften the blur while driving fast or with reduced motion. */
  setTiltAmount(v: number) {
    if (this.tiltH) this.tiltH.amount = v;
    if (this.tiltV) this.tiltV.amount = v;
  }

  setRenderScale(s: number) {
    const next = Math.min(Math.max(s, this.settings.renderScaleMin), this.settings.renderScaleMax);
    if (Math.abs(next - this.renderScale) < 0.01) return;
    this.renderScale = next;
    this.resize();
  }

  resize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.width = w;
    this.height = h;
    const pr = Math.min(window.devicePixelRatio || 1, this.settings.pixelRatioCap) * this.renderScale;
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.composer) {
      this.composer.setPixelRatio(pr);
      this.composer.setSize(w, h);
      this.tiltH?.setSize(w * pr, h * pr);
      this.tiltV?.setSize(w * pr, h * pr);
    }
  }

  get aspect() {
    return this.width / this.height;
  }

  render() {
    this.renderer.info.reset();
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  info() {
    const i = this.renderer.info;
    return { calls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures };
  }

  dispose() {
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleLost);
    this.composer?.dispose();
    this.tiltH?.dispose();
    this.tiltV?.dispose();
    this.scene.traverse((o) => {
      const m = o as unknown as { geometry?: { dispose(): void }; material?: { dispose(): void } | { dispose(): void }[] };
      m.geometry?.dispose();
      if (Array.isArray(m.material)) m.material.forEach((x) => x.dispose());
      else m.material?.dispose();
    });
    this.renderer.renderLists.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
