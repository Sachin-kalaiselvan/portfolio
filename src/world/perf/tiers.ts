import type { Tier, TierChoice } from '../core/types';
import { TIERS, TIER_ORDER, tierIndex } from '../render/quality';

/**
 * Tier rules (PERFORMANCE_BUDGET.md). The first run starts at Medium (or the
 * device ceiling if lower) and is measured under the intro; later runs start
 * from the remembered result. A manual choice always wins.
 */
export function initialTier(choice: TierChoice, measured: Tier | null, ceiling: Tier): Tier {
  if (choice !== 'auto') return choice;
  const start = measured ?? 'medium';
  return tierIndex(start) > tierIndex(ceiling) ? ceiling : start;
}

/**
 * Decide after a measurement window. Promote only if comfortably fast (p95
 * under 60% of the current budget and not at the ceiling); demote if over
 * budget.
 */
export function measuredTier(current: Tier, p95: number, ceiling: Tier): Tier {
  const budget = TIERS[current].p95Budget;
  const i = tierIndex(current);
  if (p95 > budget && i > 0) return TIER_ORDER[i - 1];
  if (p95 < budget * 0.6 && i < tierIndex(ceiling)) return TIER_ORDER[i + 1];
  return current;
}

export type GovernorAction = { kind: 'scale'; value: number } | { kind: 'tier'; value: Tier } | { kind: 'fallback' } | null;

/**
 * Runtime governor. Over budget: first lower the render scale, then (auto
 * only) drop a tier, and on Low with sustained very slow frames, suggest the
 * page view. Under budget for a long time: nudge scale back up.
 */
export class QualityGovernor {
  private over = 0;
  private under = 0;
  private cooldown = 0;

  constructor(public auto: boolean) {}

  update(dt: number, p95: number, tier: Tier, scale: number, samples: number): GovernorAction {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (samples < 60 || this.cooldown > 0) return null;
    const t = TIERS[tier];
    if (p95 > t.p95Budget) {
      this.over += dt;
      this.under = 0;
    } else if (p95 < t.p95Budget * 0.7) {
      this.under += dt;
      this.over = 0;
    } else {
      this.over = Math.max(0, this.over - dt);
      this.under = Math.max(0, this.under - dt);
    }
    if (this.over > 2) {
      this.over = 0;
      this.cooldown = 3;
      if (scale > t.renderScaleMin + 0.01) return { kind: 'scale', value: Math.max(t.renderScaleMin, scale - 0.1) };
      if (this.auto && tier !== 'low') return { kind: 'tier', value: TIER_ORDER[tierIndex(tier) - 1] };
      if (tier === 'low' && p95 > t.p95Budget * 1.6) return { kind: 'fallback' };
    }
    if (this.under > 6 && scale < t.renderScaleMax - 0.01) {
      this.under = 0;
      this.cooldown = 3;
      return { kind: 'scale', value: Math.min(t.renderScaleMax, scale + 0.05) };
    }
    return null;
  }
}
