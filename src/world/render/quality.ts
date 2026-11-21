import type { Tier } from '../core/types';

/** Everything a quality tier changes. Physics is identical on every tier. */
export interface TierSettings {
  pixelRatioCap: number;
  renderScaleMin: number;
  renderScaleMax: number;
  shadows: boolean;
  shadowMapSize: number;
  shadowExtent: number;
  antialias: boolean;
  tiltShift: boolean;
  /** Radius around the car within which districts are built in full detail. */
  detailRadius: number;
  propDensity: number;
  ambientAnimation: 'crane' | 'some' | 'all';
  fpsCapDefault: 30 | 60 | 0;
  /** p95 frame time (ms) above which the governor steps down. */
  p95Budget: number;
  carLod: 'low' | 'high';
}

export const TIERS: Record<Tier, TierSettings> = {
  low: {
    pixelRatioCap: 1.5,
    renderScaleMin: 0.6,
    renderScaleMax: 0.85,
    shadows: false,
    shadowMapSize: 0,
    shadowExtent: 0,
    antialias: false,
    tiltShift: false,
    detailRadius: 95,
    propDensity: 0.3,
    ambientAnimation: 'crane',
    fpsCapDefault: 30,
    p95Budget: 45,
    carLod: 'low',
  },
  medium: {
    pixelRatioCap: 1.5,
    renderScaleMin: 0.75,
    renderScaleMax: 1,
    shadows: true,
    shadowMapSize: 1024,
    shadowExtent: 36,
    antialias: true,
    tiltShift: false,
    detailRadius: 140,
    propDensity: 0.7,
    ambientAnimation: 'some',
    fpsCapDefault: 60,
    p95Budget: 24,
    carLod: 'high',
  },
  high: {
    pixelRatioCap: 2,
    renderScaleMin: 1,
    renderScaleMax: 1,
    shadows: true,
    shadowMapSize: 2048,
    shadowExtent: 60,
    antialias: true,
    tiltShift: true,
    detailRadius: 1000,
    propDensity: 1,
    ambientAnimation: 'all',
    fpsCapDefault: 0,
    p95Budget: 20,
    carLod: 'high',
  },
};

export const TIER_ORDER: Tier[] = ['low', 'medium', 'high'];
export const tierIndex = (t: Tier) => TIER_ORDER.indexOf(t);
