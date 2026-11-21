/** Shared types between the world runtime and the React interface. No Three.js here. */

export type Tier = 'low' | 'medium' | 'high';
export type TierChoice = Tier | 'auto';
export type CameraMode = 'follow' | 'overhead';
export type InputDevice = 'keyboard' | 'touch' | 'gamepad';

export type WorldMode =
  | 'off' //       not running
  | 'booting' //   capability checks, loading the engine
  | 'intro' //     cinematic sequence playing
  | 'controls' //  intro finished, waiting for the first driving input
  | 'driving'
  | 'focus' //     camera moving to a discovery point before opening it
  | 'panel' //     2D content shown over the paused world
  | 'error';

export type IntroStep = 'loading' | 'aerial' | 'identity' | 'vehicle' | 'behind' | 'controls' | 'done';

export interface NearbyPoint {
  id: string;
  label: string;
}

export interface WorldState {
  mode: WorldMode;
  introStep: IntroStep;
  loadProgress: number;
  tier: Tier;
  tierChoice: TierChoice;
  renderScale: number;
  fpsCap: 30 | 60 | 0;
  cameraMode: CameraMode;
  audioEnabled: boolean;
  reducedMotion: boolean;
  inputDevice: InputDevice;
  nearby: NearbyPoint | null;
  district: string | null;
  speed: number;
  discovered: string[];
  /** Shown when 3D stops and the page takes over. */
  message: string | null;
  /** A short driving hint, e.g. after getting stuck. */
  hint: string | null;
  /** Floors on the hub tower, and whether it has been topped out. */
  towerFloors: number;
  toppedOut: boolean;
  menuOpen: boolean;
  mapOpen: boolean;
  /** Car position on the board (x, z) and heading, for the map. Updated a few times a second. */
  car: { x: number; z: number; heading: number };
  /** Last discovery that was new, shown briefly. */
  justFound: string | null;
}

export type WorldErrorCode = 'no-webgl' | 'context-lost' | 'asset-failed' | 'too-slow' | 'unknown';

export class WorldError extends Error {
  constructor(public code: WorldErrorCode, message: string) {
    super(message);
  }
}
