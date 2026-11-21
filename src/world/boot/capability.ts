/**
 * What the browser can do. No screen-size or user-agent guesses:
 * only feature checks and values the browser reports about itself.
 */
export interface Capability {
  webgl2: boolean;
  maxTextureSize: number;
  /** navigator.deviceMemory where reported (GB), else null. Used only as a ceiling. */
  deviceMemory: number | null;
  reducedMotion: boolean;
  saveData: boolean;
}

export function detectCapability(): Capability {
  let webgl2 = false;
  let maxTextureSize = 0;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
    if (gl) {
      webgl2 = true;
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch {
    webgl2 = false;
  }
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return {
    webgl2,
    maxTextureSize,
    deviceMemory: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: Boolean(nav.connection?.saveData) || window.matchMedia('(prefers-reduced-data: reduce)').matches,
  };
}

/** Highest tier this device may ever be promoted to automatically. */
export function tierCeiling(c: Capability): 'low' | 'medium' | 'high' {
  if (c.maxTextureSize < 4096) return 'low';
  if (c.deviceMemory !== null && c.deviceMemory <= 2) return 'medium';
  return 'high';
}
