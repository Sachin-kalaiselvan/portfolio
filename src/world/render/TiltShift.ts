import { ShaderMaterial, Uniform, Vector2 } from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import type { WebGLRenderer, WebGLRenderTarget } from 'three';

/**
 * Two-pass tilt-shift blur: sharp band through the focus line, blur growing
 * above and below it. Sells the miniature scale. High tier only.
 */
const shader = {
  uniforms: {
    tDiffuse: new Uniform(null),
    uDir: new Uniform(new Vector2(1, 0)),
    uResolution: new Uniform(new Vector2(1, 1)),
    uFocus: new Uniform(0.48),
    uBand: new Uniform(0.16),
    uAmount: new Uniform(2.2),
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uDir;
    uniform vec2 uResolution;
    uniform float uFocus;
    uniform float uBand;
    uniform float uAmount;
    varying vec2 vUv;
    void main() {
      float d = max(abs(vUv.y - uFocus) - uBand, 0.0);
      float r = clamp(d * 3.2, 0.0, 1.0) * uAmount;
      vec2 step = uDir / uResolution * r;
      vec4 c = texture2D(tDiffuse, vUv) * 0.2270270270;
      c += texture2D(tDiffuse, vUv + step * 1.3846153846) * 0.3162162162;
      c += texture2D(tDiffuse, vUv - step * 1.3846153846) * 0.3162162162;
      c += texture2D(tDiffuse, vUv + step * 3.2307692308) * 0.0702702703;
      c += texture2D(tDiffuse, vUv - step * 3.2307692308) * 0.0702702703;
      gl_FragColor = c;
    }
  `,
};

export class TiltShiftPass extends Pass {
  private material: ShaderMaterial;
  private quad: FullScreenQuad;
  constructor(horizontal: boolean) {
    super();
    this.material = new ShaderMaterial({
      uniforms: {
        tDiffuse: new Uniform(null),
        uDir: new Uniform(horizontal ? new Vector2(1, 0) : new Vector2(0, 1)),
        uResolution: new Uniform(new Vector2(1, 1)),
        uFocus: new Uniform(0.48),
        uBand: new Uniform(0.16),
        uAmount: new Uniform(2.2),
      },
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      depthTest: false,
      depthWrite: false,
    });
    this.quad = new FullScreenQuad(this.material);
  }
  set amount(v: number) {
    this.material.uniforms.uAmount.value = v;
  }
  set focus(v: number) {
    this.material.uniforms.uFocus.value = v;
  }
  setSize(w: number, h: number) {
    this.material.uniforms.uResolution.value.set(w, h);
  }
  render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget) {
    this.material.uniforms.tDiffuse.value = readBuffer.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }
  dispose() {
    this.material.dispose();
    this.quad.dispose();
  }
}
