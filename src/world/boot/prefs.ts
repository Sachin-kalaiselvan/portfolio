import type { CameraMode, TierChoice } from '../core/types';

/** Remembered choices. Storage can be missing or blocked; everything still works without it. */
export interface Prefs {
  mode: '3d' | '2d' | null;
  introSeen: boolean;
  tierChoice: TierChoice;
  measuredTier: 'low' | 'medium' | 'high' | null;
  fpsCap: 30 | 60 | 0 | null;
  audio: boolean;
  cameraMode: CameraMode;
  leftHanded: boolean;
  /** Discovery point ids found, and districts driven into. */
  discovered: string[];
  visited: string[];
}

const KEY = 'builders-world:v1';
const DEFAULTS: Prefs = {
  mode: null,
  introSeen: false,
  tierChoice: 'auto',
  measuredTier: null,
  fpsCap: null,
  audio: false,
  cameraMode: 'follow',
  leftHanded: false,
  discovered: [],
  visited: [],
};

export function readPrefs(): Prefs {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function writePrefs(patch: Partial<Prefs>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...readPrefs(), ...patch }));
  } catch {
    /* storage unavailable: preferences just aren't remembered */
  }
}
