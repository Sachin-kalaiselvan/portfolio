export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
/** Frame-rate independent exponential approach. `tau` is the time constant in seconds. */
export const damp = (current: number, target: number, tau: number, dt: number) =>
  tau <= 0 ? target : lerp(current, target, 1 - Math.exp(-dt / tau));
/** Shortest signed angle from a to b. */
export const angleDelta = (a: number, b: number) => {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
};
export const dampAngle = (current: number, target: number, tau: number, dt: number) =>
  current + angleDelta(current, target) * (tau <= 0 ? 1 : 1 - Math.exp(-dt / tau));
/** Move towards a target at a fixed maximum rate per second. */
export const approach = (current: number, target: number, rate: number, dt: number) => {
  const d = target - current;
  const m = rate * dt;
  return Math.abs(d) <= m ? target : current + Math.sign(d) * m;
};
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
