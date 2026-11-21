/** Every tunable number for the car in one place. Car faces +X in its own frame. */
export const VEHICLE = {
  // Body (half extents) and mass.
  chassis: { hx: 1.25, hy: 0.25, hz: 0.7, y: 0.1, density: 140 },
  cabin: { hx: 0.75, hy: 0.3, hz: 0.62, x: -0.1, y: 0.62 },
  centreOfMassDrop: 0.35,
  linearDamping: 0.05,
  angularDamping: 0.6,

  // Wheels.
  wheelRadius: 0.3,
  wheelX: 0.9,
  wheelZ: 0.625,
  wheelY: -0.05,
  restLength: 0.28,
  maxTravel: 0.22,
  stiffness: 34,
  compression: 3.2,
  relaxation: 3.6,
  maxSuspensionForce: 100000,
  frictionSlip: 2.2,
  sideFriction: 1.1,

  // Driving.
  engineForce: 3400,
  reverseForce: 1900,
  brakeForce: 90,
  rollingBrake: 4,
  topSpeed: 14,
  topSpeedReverse: 6,
  maxSteerLow: 0.5,
  maxSteerHigh: 0.2,
  steerRate: 5.5,
  throttleRise: 4,
  throttleFall: 6,

  // Recovery.
  uprightAfter: 3,
  stuckAfter: 4,
  autoResetAfter: 8,
} as const;
