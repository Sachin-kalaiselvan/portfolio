# Vehicle and camera specification

All numbers are **starting values** for Milestone 2. Final values come from feel testing on desktop and the phone matrix, and are kept in one config file (`src/world/vehicle/vehicle.config.ts`, `src/world/camera/camera.config.ts`) so they can be tuned without touching logic.

## 1. The car

### 1.1 Design intent

A small, friendly, original two-seat city electric car: a short upright cabin, a big glass area, short overhangs, a smooth closed front with a slim light bar instead of a grille, and wheels pushed to the corners. It should read as "miniature" at a glance and look like a precise scale model, not a cartoon toy.

Originality rules:
- Not based on any production car. The reference image in the ChatGPT conversation (a real-world microcar from a car maker) is **not** to be modelled; its badge, light design and proportions are someone else's design.
- Not based on Bruno Simon's car (`static/vehicle/default.glb`, an off-road toy jeep with a roll cage and antenna).
- No logos. A small "SK" mark may be embossed on the rear panel.

### 1.2 Dimensions (model scale, 1 unit = 1 m)

| | Value |
|---|---|
| Length | 2.6 |
| Width | 1.45 |
| Height | 1.5 |
| Wheelbase | 1.8 |
| Track width | 1.25 |
| Wheel radius | 0.3 |
| Ground clearance | 0.18 |

### 1.3 Model structure (approved requirement → how it's met)

| Requirement | Implementation |
|---|---|
| Compact miniature proportions | Dimensions above; slightly enlarged wheels and glass relative to a real car |
| Distinctive original silhouette | Upright cabin, single-curve roof, closed nose with light bar, square-ish wheel arches. Silhouette checked against references in the art review |
| Four independently animated wheels | Four separate wheel nodes, each with its own spin, steer and suspension offset |
| Proper wheel steering | Front wheels turn around their kingpin pivot, up to ±32° visual angle (physics angle per §2.3) |
| Visible suspension | Body rolls and pitches relative to the wheels from real suspension compression; arches show wheel travel |
| Separate body, glass, tyres, wheels, interior | Separate meshes and materials: `body`, `glass` (transparent, slight tint), `tyre` ×4, `rim` ×4, `interior` (two seats, dashboard, steering wheel), `lightsFront`, `lightsRear` |
| Working headlights and brake lights | Emissive materials driven by state: headlights on in the intro and the optional evening state; brake lights brighten on braking and reversing; reversing lights when going backwards |
| Appropriate collision representation | Not the visual mesh: a compound of two boxes (see §2.1) |
| Original model | Modelled for this project (see `ASSET_PRODUCTION_PLAN.md` A1) |

### 1.4 Naming contract for the GLB

The visual model loads by these node names; the asset test fails if any is missing:

```
car_root
  car_body            (body shell, also the pivot for roll and pitch)
    car_glass
    car_interior
    car_lights_front
    car_lights_rear
  wheel_FL, wheel_FR, wheel_RL, wheel_RR
    (each) tyre, rim; pivot at the hub centre, Y up, rolling axis X
```

Colours: body in cobalt `#2440d6` with an ivory roof by default. Up to three alternative paint schemes are possible later, but none is required.

### 1.5 Budgets

| | High | Low |
|---|---|---|
| Triangles | ≤ 25,000 | ≤ 8,000 (separate LOD) |
| Materials | ≤ 6 | ≤ 4 |
| Textures | One 1024² atlas (KTX2) or vertex colours | 512² or vertex colours |
| Compressed file | ≤ 400 KB | ≤ 150 KB |

## 2. Vehicle physics

### 2.1 Body

- Rapier dynamic rigid body, mass 300 (unitless in our model scale; tuned for feel, not realism).
- Colliders: a lower box for the chassis (2.5 × 0.5 × 1.4) with the centre of mass lowered by 0.3 to resist flipping, and a smaller cabin box (1.6 × 0.6 × 1.3). Friction 0.4, restitution 0.1.
- A separate sensor shape slightly larger than the body detects bumps into loose props (for sound and small reactions) without affecting driving.
- Never sleeps while the world is active.

### 2.2 Wheels

Rapier's `DynamicRayCastVehicleController` (part of Rapier's public API, used independently of the reference code).

| Setting | Start value |
|---|---|
| Connection points | (±0.9, −0.1, ±0.625) relative to the body |
| Suspension rest length | 0.25 |
| Suspension stiffness | 28 |
| Compression damping | 2.4 |
| Relaxation damping | 2.8 |
| Max suspension travel | 0.2 |
| Friction slip | 1.4 |
| Side friction stiffness | 1.0 |

### 2.3 Driving model

Input arrives as **intent**, never as device state: `throttle` (−1…1), `brake` (0…1), `steer` (−1…1), `handbrake` (0/1). The `Input` system produces intent; `VehiclePhysics` consumes it.

| Behaviour | Starting rule |
|---|---|
| Acceleration | Engine force on all four wheels (EVs feel best with instant, smooth torque), tapering to zero at top speed |
| Top speed | 14 units/s forward, 6 units/s in reverse |
| Braking | Brake force proportional to `brake`; pressing the opposite throttle direction above 1 unit/s brakes first, then reverses once nearly stopped |
| Reverse | Holding back when stopped reverses; reversing lights and a slower top speed |
| Idle | Gentle rolling resistance so the car coasts to a stop |
| Steering | Max physics angle 0.5 rad at walking pace, reduced to 0.2 rad at top speed, smoothed toward the target at about 6 rad/s, so keyboard steering isn't twitchy |
| Smooth acceleration and braking | Intent is ramped (throttle rise 4/s, fall 6/s) before it reaches the engine |
| Pleasant, responsive handling | Judged by the M2 feel test (§6) |
| Self-righting | Upside down or on its side for 3 s → lifted and turned upright in place |
| Stuck | Throttle held with under 0.5 units moved in 4 s → "Reset car" prompt; automatic after 8 s |
| Boundaries | Board lip colliders; if the car somehow leaves the board, it respawns at the nearest road |

### 2.4 Fixed timestep

- Physics runs at **60 Hz** fixed steps. Each frame adds the real frame time (clamped to 0.1 s) to an accumulator and runs whole steps, at most 5 per frame. Any time left over beyond that is dropped, so a stalled tab never fast-forwards physics.
- `VehiclePhysics.preStep()` applies intent before each step; `postStep()` reads speed, wheel contact, suspension lengths and upright state after it.
- The vehicle controller is updated with the same fixed `dt` (1/60).
- The frame rate never changes physics behaviour. A unit test runs the same input script at simulated 30, 60 and 144 fps and checks the final positions agree within 1%.

### 2.5 Physics ↔ visuals

- `VehicleVisual` keeps the previous and current physics pose and draws the car at `lerp/slerp(previous, current, alpha)`, where `alpha` is the accumulator remainder. This removes judder when display rate and physics rate differ.
- Wheels: spin from wheel angular speed, steer from the controller's steering angle, vertical offset from suspension length. Each wheel animates independently.
- Body roll and pitch come from the chassis rotation; the visual adds no fake wobble.
- `VehicleVisual` only reads physics state. It never writes to the physics body.

## 3. Chase camera

### 3.1 Behaviour

| Requirement | Implementation |
|---|---|
| Smooth follow | The camera follows a **target pose** behind and above the car; position uses a critically damped spring (time constant 0.25 s), look-at uses a separate spring (0.12 s) on a point slightly ahead of the car |
| Adjustable distance | Default 7.5 units behind; range 4.5–14 |
| Adjustable height | Default 3.2 units above; range 1.6–7; linked to distance by a curve so zooming out also rises |
| Smooth horizontal rotation | The camera's yaw follows the car's **velocity direction** (not its nose), with lag (time constant 0.45 s), so drifting and reversing don't swing the camera wildly. When reversing slowly, yaw holds |
| Controlled zoom | Mouse wheel and pinch change a single zoom value (0–1) mapped to distance and height, eased; clamped |
| Speed-sensitive behaviour | Above 60% top speed, distance grows by up to 12% and field of view widens from 50° to 56°. Disabled when reduced motion is on |
| Collision avoidance | A sphere cast (radius 0.3) from the look-at point toward the desired camera position against static colliders. If blocked, the camera moves in to just before the hit, quickly (0.08 s), and eases back out slowly (0.4 s) |
| Smooth transitions into discovery | The `CameraDirector` blends from the chase pose to the point's authored pose over 1.0 s (ease in-out), and back over 0.8 s |
| Optional fixed isometric mode | See §4 |
| Road ahead stays visible | Look-at point leads the car by 2 units at speed; pitch is capped so the horizon stays in the upper third; no cinematic sway while driving |

### 3.2 Manual orbit

- Desktop: drag with the right mouse button, or hold and drag on empty canvas with the left button when not driving, to orbit (yaw ±180°, pitch 10°–60°). Releasing starts auto-recentre after 1.5 s of driving.
- Touch: a two-finger drag orbits; a pinch zooms. One finger is reserved for the driving controls.
- Gamepad: right stick orbits, with the same auto-recentre.

### 3.3 Field of view

- 50° vertical by default. On narrow portrait screens, the horizontal field matters more, so the vertical FOV widens up to 62° to keep the road visible beside the car.

### 3.4 Separation from physics

- The camera reads the **interpolated visual pose** of the car.
- The camera never sets the position, rotation or velocity of any physics body, and never feeds back into driving intent.
- Camera collision uses read-only scene queries (`castShape`) against a dedicated "camera blockers" collision group (buildings, the crane, the board lip), so loose props don't make the camera jump.

## 4. Isometric mode (optional)

- Chosen from the menu ("Camera: Follow / Overhead") and remembered.
- Fixed azimuth 45°, fixed pitch 52°, narrow lens (FOV 22°), distance 38–60 by zoom, follows the car's position with a spring (0.3 s). Doesn't rotate with the car.
- Driving controls stay relative to the car (forward is always the car's forward), so they don't change between modes.
- It's an independent implementation for our world, using our own values and code; it's offered as an alternative view, not the default.

## 5. Camera director

A small state machine owns which camera is active:

```
cinematic (intro) ──handover──▶ chase ⇄ isometric
                                  │  ▲
                        open point│  │close
                                  ▼  │
                              discovery
```

- Every switch is a blend of position, orientation and field of view over a fixed time. With reduced motion, every blend is replaced by a quick fade through ivory (0.25 s).
- Only one camera writes to the Three.js camera each frame.

## 6. Acceptance tests (Milestone 2)

| Test | Pass when |
|---|---|
| Model contract | GLB has every node in §1.4; triangle and size budgets met |
| Wheels | Each wheel spins at the rate matching ground speed (±5%), front wheels steer visibly, each wheel's suspension moves independently over a bump |
| Lights | Brake lights brighten while braking; reversing lights only in reverse; headlights toggle |
| Frame-rate independence | Scripted run at 30/60/144 fps ends within 1% of the same position |
| Self-right and reset | Car placed upside down rights itself in ≤ 4 s; stuck prompt appears as specified |
| Camera never touches physics | Code check: camera modules import nothing that writes to Rapier bodies; runtime check: body state unchanged by camera mode switching |
| Camera collision | Driving along a wall and into the City streets never shows the inside of a building |
| Feel test | 3 people unfamiliar with the project drive from the start to the hub and around the ring on desktop and on a phone without hitting the board lip more than once, and rate the handling "pleasant" or better |
