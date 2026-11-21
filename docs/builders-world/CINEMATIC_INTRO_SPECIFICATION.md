# Cinematic intro specification

## 1. Purpose

Set the scene in a few seconds, then get out of the way. The intro introduces the place, the person and the car, and teaches the controls. It never stands between a visitor and the portfolio.

## 2. Approved sequence

| Step | Approved requirement | What happens | Duration (target) |
|---|---|---|---|
| 0 | Avoid excessive loading delays | First frame: ivory background, the board outline drawn in ink, a thin progress line. "Skip" and "View as page" are already visible. Starts while the first district and the car load | Until the first batch is ready (target under 2.5 s on 4G) |
| 1 | Establish the miniature world through an aerial cinematic shot | The camera descends from high above the board in a slow arc, revealing the hub crane and the five districts in warm light, with tilt-shift blur on capable tiers | 3.5 s |
| 2 | Reveal the identity: Sachin Kalaiselvan | The name appears in the React overlay (Instrument Serif italic, large), with one line below (draft copy, for your approval): "Founder, The Ingredient List. Things I've built, at the stage they're really at." Fades in over the moving shot | 2.0 s (overlaps step 1's last second) |
| 3 | Introduce the original miniature electric car | The camera glides down to the workshop at the start point and frames the parked car from the front three-quarter; headlights switch on | 2.0 s |
| 4 | Transition the camera behind the vehicle | The camera orbits around to the chase position; the name overlay fades out | 1.2 s |
| 5 | Show keyboard or touch control instructions | A small control card appears for the current input device (keyboard / touch / gamepad), with "Start driving" | Stays until the first driving input or 6 s |
| 6 | Hand control to the visitor | Driving input enabled on the first throttle or steer, or on "Start driving". The control card shrinks into the help button | Instant |

**Total before control:** about 8.5 s of camera motion after loading. The step budget must not grow past 10 s; any new shot has to replace one.

## 3. Rules (approved)

| Rule | How it's met |
|---|---|
| Have a Skip option | A "Skip intro" button is visible from the first frame, reachable by keyboard (first focusable control) and screen reader. Escape and Enter also skip. Skip jumps straight to step 5 with the camera behind the car (a 0.3 s fade, no motion) |
| Don't prevent immediate access to the portfolio | "View as page" is visible from the first frame and is a real link to the 2D layout. The prerendered 2D page is in the DOM throughout, so it works even if the world's JavaScript fails |
| Respect reduced motion | With `prefers-reduced-motion: reduce`, there's no fly-through: one still frame of the aerial view with the name, then a fade straight to the car with the control card. The tilt-shift and camera springs are calmed for the rest of the session |
| Avoid excessive loading delays | Loading starts before step 1; the aerial shot uses a light preview of the board (see §6), and the car and first district finish loading during it. Rapier loads in parallel and isn't needed until step 6 |
| Support mobile and desktop | Shots are framed for both 16:9 and 9:19.5; each shot has a portrait variant of its camera path (a higher, narrower view) |
| No audio before user interaction | Audio stays off. A small speaker toggle in the corner turns it on; the first tap on "Start driving" or the first key press creates the audio context, if the visitor's stored preference is "on" |
| Gracefully handle missing assets | Each shot declares which assets it needs. A missing optional asset (a prop, a texture) is skipped and logged. A missing required asset (board, car) ends the intro and moves to whichever state works: driving without the missing parts if safe, otherwise the 2D page with a one-line reason |

## 4. Returning visitors

- The intro plays once per browser. On later visits it starts at step 5, with the camera behind the car, after a 1 s aerial establishing frame (or none with reduced motion).
- "Replay intro" is in the menu.
- The stored state (`localStorage`, wrapped in try/catch) is just: `introSeen`, `mode` (3d or 2d), `tier`, `audio`, `cameraMode`. If storage isn't available, everything still works; the intro just plays each time.

## 5. System design

The intro is a separate system (`src/world/intro/`), not an animation embedded in the main app.

- **`IntroSequencer`:** takes an ordered list of shots and plays them against the world clock. It exposes `play()`, `skip()`, `seek(step)`, `dispose()`, and events `stepStarted`, `stepEnded`, `completed`, `skipped`.
- **A shot** is data: camera keyframes (position, target, field of view, time), easing, the overlay state to show (via the store), required and optional asset IDs, and a portrait variant.
- **Camera control during the intro** goes through the `CameraDirector` in `cinematic` mode. The sequencer never moves the camera directly and never touches physics.
- **Overlay text** (name, line, control card) is React, driven by the store's `intro` state. It's real text, selectable and readable by screen readers, not text painted into the 3D scene.
- **Shots are sampled from the render clock,** not the physics clock, so they stay smooth even if physics isn't initialised yet.
- **Skipping** sets the camera to the end pose of step 4 in one frame (or a 0.3 s fade), sets intro state to `controls`, and releases all shot resources.

## 6. Loading plan for the intro

| Batch | Contents | Needed for | Target size (compressed) |
|---|---|---|---|
| 0 | Boot module, overlay UI | Step 0 | Part of the existing page; under 15 KB |
| 1 | Three.js and runtime chunk, board base, low-detail massing of all five districts (a single simplified "preview" model), sky gradient | Steps 1–2 | Engine chunk plus about 400 KB of assets |
| 2 | Car (full model), Personal district (full), hub and crane | Steps 3–6 | About 800 KB |
| 3 | Rapier WASM | Step 6 | Measured in M1 |
| Later | Remaining districts, streamed by distance (see performance strategy) | Driving | — |

If batch 2 isn't ready when step 2 ends, the aerial shot holds and loops gently (slow orbit) with the progress line visible, rather than freezing.

## 7. Failure and edge cases

| Case | Behaviour |
|---|---|
| WebGL and WebGPU both unavailable | Boot module never loads the world; the 2D page shows normally. No error message needed |
| Context lost during the intro | Stop, dispose, show the 2D page with "The 3D view stopped. Here's the page version." and a "Try 3D again" button |
| Very slow connection (batch 1 not ready in 8 s) | Show "Still loading the world. View the page instead?" with both options; loading continues in the background |
| Measured frame time too slow during step 1 (see performance strategy) | Drop the tier for the rest of the intro; if even Low can't hold 24 fps, end the intro and offer the 2D page |
| Tab hidden during the intro | Pause; resume where it left off |
| Visitor resizes or rotates | Swap to the matching portrait/landscape camera path at the same progress |
| Reduced motion turned on mid-session | Apply from the next camera transition |

## 8. Acceptance tests (Milestone 1)

| Test | Pass when |
|---|---|
| Skip | From any step, Skip reaches the control card in ≤ 0.3 s; Escape and keyboard focus both work |
| View as page | Works from the first frame, also with the world's JavaScript blocked |
| Reduced motion | No camera motion before the control card; one still, then a fade |
| No early audio | No `AudioContext` is created before a user gesture (checked in a browser test) |
| Missing asset | With an optional asset removed, the intro completes; with the car removed, it ends cleanly and shows the right fallback |
| Timing | Steps 1–4 total ≤ 10 s; first visible frame ≤ 1 s after the page is interactive on desktop |
| Portrait | Every shot keeps the subject in frame at 390 × 844 |
| Dispose | After the intro and `dispose()`, no canvas, no WebGL context and no runtime listeners remain |
