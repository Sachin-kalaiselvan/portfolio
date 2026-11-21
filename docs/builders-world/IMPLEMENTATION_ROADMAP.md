# Implementation roadmap

> **Status (21 Nov 2026).** Milestones 1–7 were built in order on `world/build` without stopping between milestones, as instructed. What was built, what changed from this plan and what was measured: `BUILD_REPORT.md`.

Eight milestones, following the updated plan. **One milestone at a time.** Each ends with a report (files changed, dependencies added, build output, tests run, measured performance, known limitations, rollback steps) and stops for approval before the next begins.

The renderer, input, physics and vehicle are proven together (M1–M2) before any finished world is built (M3).

| # | Milestone | Deliverable |
|---|---|---|
| 0 | Repository research and approved plan | These ten documents |
| 1 | 3D foundation, loading experience and cinematic intro controller | A working slice: from the real `/` page, capability check → lazy world → intro on a test board → Skip → controls card → back to 2D, all disposable |
| 2 | Original mini electric car, Rapier physics and dynamic camera | The car driving on the test board with the chase and isometric cameras, desktop and touch |
| 3 | Complete miniature world and five districts | The finished board, hub, crane and all five districts, streamed by distance |
| 4 | Discovery system and project case studies | Discovery points opening real case studies from shared content, routes in sync |
| 5 | Audio, menus, map and interaction polish | Sound, menu, minimap, respawn, auto-drive, evening lighting (optional) |
| 6 | Mobile 3D quality tiers and 2D alternative | Measured tiers, governor, touch polish, the full 3D ⇄ 2D switch |
| 7 | Final optimisation, testing and deployment | Budgets met, full test pass, deployed |

**Rollback for every milestone:** each milestone is developed on its own branch (`world/m1-foundation` and so on) and merged to `portfolio-site` only after approval. Until M6, the world is behind a build flag (`VITE_WORLD=1`); with the flag off, the build is byte-for-byte the current 2D site. Rolling back is reverting the merge or turning the flag off.

---

## Milestone 0: research and plan

| | |
|---|---|
| Scope | Inspect our repository and the reference repository; write the ten planning documents |
| Files | `docs/builders-world/*.md` only |
| Dependencies | None |
| Acceptance | Every approved creative decision is in the documents (see the final check in the M0 report); you approve the plan and decisions D1–D6 |
| Tests | None (no code) |
| Risks | Plan doesn't match what you want; mitigated by this review |
| Rollback | Delete `docs/builders-world/` |

---

## Milestone 1: 3D foundation, loading and intro controller

Builds the technical foundation and the cinematic sequence controller. **Does not** build the finished world, the final car or real districts.

### Scope

| Part | What's built |
|---|---|
| A. Application lifecycle | `WorldShell.tsx` mounts and disposes `WorldRuntime`; typed errors fall back to 2D |
| B. Renderer | `WebGPURenderer` (WebGL 2 fallback), tier settings stub, resize, context-loss handling |
| C. Scene manager | Scene graph roots (world, vehicle, effects), environment light and sun |
| D. Camera manager | `CameraDirector` with `cinematic` mode and a temporary free test camera (dev only) |
| E. Input abstraction | Named actions, contexts (`intro`, `driving`, `panel`, `menu`), keyboard, pointer, gamepad, touch-control events (UI only; no car yet) |
| F. Resize handling | Viewport, pixel ratio, render scale, orientation |
| G. Render loop | `FixedStepLoop` (accumulator, step cap, interpolation alpha), pause and resume, hidden-tab handling |
| H. Physics initialisation | Rapier loaded in parallel and initialised with a flat test-board collider, so M2 can start immediately (no car yet) |
| I. Asset manager | GLB + KTX2 + meshopt loading, manifest, reference counting, progress, failure reporting |
| J. Performance monitor | Frame-time capture, the measurement routine from `PERFORMANCE_STRATEGY.md` §3.2, the dev `#stats` overlay |
| K. Loading interface | Step-0 screen: ink board outline, progress line, Skip, View as page |
| L. Error handling and cleanup | Disposables registry; `dispose()` releases everything |
| M. Boot module | Capability checks, stored preferences, lazy import of the world chunk |
| N. Mode architecture | Store states (`booting → intro → driving → panel → 2d`), bridge API, the `/` overlay behaviour per decision D1, and the routing contract for M4 |
| O. Intro controller | `IntroSequencer` with all six steps, Skip, reduced-motion path, portrait variants, missing-asset handling, playing over a **temporary test board and car blockout clearly labelled "prototype"** |
| P. Test environment | Vitest and Playwright set up; the tests listed below |

### Files (new unless noted)

`src/world/{boot,core,render,assets,input,physics,camera,intro,perf}/…`, `src/ui-world/{WorldShell,IntroOverlay,LoadingScreen}.tsx`, `public/world/test/` (temporary test board), `vitest.config.ts`, `playwright.config.ts`, `tests/unit/*`, `tests/e2e/*`. Modified: `package.json` (scripts and dependencies), `src/App.tsx` (mount point behind `VITE_WORLD`), `vercel.json` (cache rule for `/world`).

### Dependencies

Add `three`, `@dimforge/rapier3d-compat`. Dev: `vitest`, `@playwright/test`, `@gltf-transform/cli`, `@types/three`.

### Acceptance criteria

- With `VITE_WORLD` off, the production build output is unchanged from today's site.
- With it on: on a capable desktop browser, `/` shows the step-0 screen within 1 s of the page being interactive, then plays the intro over the test board.
- Skip, View as page, reduced motion, no early audio, missing-asset behaviour and portrait framing all meet `CINEMATIC_INTRO_SPECIFICATION.md` §8.
- The measured tier selection runs and its result is shown in `#stats`.
- `dispose()` releases the canvas, context, listeners and Rapier world (verified 5 times in a row).
- No console errors or warnings on the M1 routes.
- The world chunk is not part of the first page load (verified in the build output and network log).
- Forced WebGL 2 mode runs the same slice (renderer decision checkpoint, see plan §4).

### Tests

- **Unit (Vitest):** fixed-step accumulator (step counts, cap, alpha), input action mapping and contexts, intro sequencer timing, skip and seek, tier selection from synthetic frame-time series, store transitions.
- **Browser (Playwright, desktop and 390 × 844):** boot → intro → skip; View as page from the first frame; reduced-motion run; audio context absent before a gesture; dispose leaves nothing behind; no console errors; world chunk not requested when `VITE_WORLD` is off or 2D is chosen.
- **Build:** `npm run build`, `npm test` (existing content checks) and the new suites all pass.

### Risks

| Risk | Response |
|---|---|
| WebGPU fallback slow or heavy on iOS | Checkpoint in M1: switch to `WebGLRenderer` if needed |
| Engine chunk over 350 KB | Tree-shake Three.js imports; report the measured size |
| Rapier WASM size | Report measured size; it loads in parallel and isn't on the intro's critical path |

### Rollback

Turn off `VITE_WORLD` or revert the merge. No 2D files are changed except the guarded mount point.

---

## Milestone 2: car, physics and camera

### Scope

The car per `VEHICLE_AND_CAMERA_SPECIFICATION.md`: `VehiclePhysics` (ray-cast vehicle, fixed step, intent), `VehicleVisual` (interpolation, wheels, suspension, lights), driving input for keyboard, gamepad and touch controls (`TouchControls.tsx`), chase camera with collision avoidance, isometric mode, camera director blends, self-righting and reset. The intro's steps 3–6 now use the real car. Test board gets a few blocks and ramps to test camera collision and suspension (labelled temporary).

### Dependencies

None new (optionally a dev-only tuning panel, if agreed).

### Acceptance

All tests in `VEHICLE_AND_CAMERA_SPECIFICATION.md` §6, including the feel test on desktop and a phone, plus the final car model passing the art review and budgets.

### Tests

Unit: steering curve, intent ramps, frame-rate independence (30/60/144 fps), camera spring maths, camera never writes physics. Browser: drive a scripted path on desktop and touch emulation; isometric toggle; reset.

### Risks

Handling feel (tuning time is planned); commissioned car delivery time (M2 can finish physics and camera on the labelled blockout, but **can't be approved** until the final car is in).

### Rollback

Revert the merge; M1 remains.

---

## Milestone 3: the miniature world and five districts

### Scope

Board, roads, hub, crane and tower, and all five districts per `ORIGINAL_WORLD_DESIGN.md`, built and produced per `ASSET_PRODUCTION_PLAN.md`. `DistrictLoader` streaming, colliders from `col_*` objects, markers parsed, status-driven construction stages, instanced foliage and props, baked lighting, Low and High asset variants. The test board is removed.

**Order:** finish the Personal district and hub completely first and approve them as the quality bar; then the other four, one at a time.

### Acceptance

- The car drives through every finished district; roads connect correctly; collisions behave; the camera stays readable in the City streets.
- No missing assets; no placeholder geometry anywhere.
- The world reads as one cohesive model (art review).
- Low tier is available and keeps every destination.
- Draw call, triangle and download budgets met per tier (measured).
- Districts unload and release memory (leak check passes).

### Tests

Asset checks (naming, budgets, markers, licences); browser: tour script visiting each district; memory before and after unloading; screenshots of each district from three cameras for the art review.

### Risks

Asset production time (the largest risk in the project). Mitigation: districts ship one at a time; the hub and crane make the world feel complete even before all five are finished.

### Rollback

Revert per district: each district is its own commit and its own asset folder.

---

## Milestone 4: discovery system and case studies

### Scope

`DiscoveryPoints`, `placements.ts`, proximity rings and prompts, the `ProjectPanel` showing the existing case-study components, URL sync with `/work/<slug>`, back button behaviour, "View in the world" on 2D case studies, the crane's floor-lifting progress, experiment panels, the Personal district's About, Capabilities and Contact panels.

### Acceptance

- Every project in `projects.ts` has a main point; every point has a target (content test enforces both).
- Opening a point and loading `/work/<slug>` directly show the same content.
- Back, Escape and driving away close the panel correctly.
- No fake links or fake contact actions: email opens mail and copies; links are the real ones from content.

### Tests

Content test extended; browser: open every point, compare panel text with the 2D page, back-button flows, deep links in both directions.

### Rollback

Revert the merge; the world still drives without discovery.

---

## Milestone 5: audio, menus, map and polish

### Scope

`AudioManager` (Web Audio: motor, tyres, bumps, horn, ambience, UI), mute and stored preference; menu; minimap and full map; respawn; auto-drive camera from the map; replay intro; optional evening lighting; final interaction polish.

### Acceptance

No audio before a gesture; mute persists; map matches the world (generated from the same road data); every menu item works; nothing dead or decorative.

### Rollback

Each feature is independently removable.

---

## Milestone 6: mobile quality tiers and the 2D alternative

### Scope

`QualityGovernor` complete; tier settings fully applied; manual Quality menu; 30 fps cap; idle render-on-demand; touch-control refinements (left-handed layout, optional tilt); the full 3D ⇄ 2D switch with context preserved; "Enter the world" in the 2D header; mode memory; real-device testing on the matrix.

### Acceptance

All tests in `MOBILE_EXPERIENCE_SPECIFICATION.md` §8, measured on real devices and reported per device.

### Rollback

Governor can be set to fixed tiers; switch can fall back to a full navigation.

---

## Milestone 7: optimisation, testing and deployment

### Scope

Budget pass against `PERFORMANCE_STRATEGY.md` §4; Lighthouse on the 2D pages; accessibility pass (keyboard reaches everything, screen-reader names, focus management between world and panels); final art review; social preview images; `VITE_WORLD` flag removed; production deploy on Vercel with the final domain; post-deploy smoke test.

### Acceptance

All budgets met or exceptions documented with measurements; all test suites pass; no console errors on any route; Lighthouse for 2D pages not lower than before the world was added; you sign off the final art and behaviour.

### Rollback

Vercel's previous deployment can be promoted instantly.

---

## What happens after M0 approval

1. You review these documents and answer decisions D1–D6 in `PORTFOLIO_IMPLEMENTATION_PLAN.md` §6.
2. If D3 includes commissioning the car, the brief for the modeller can go out straight away: `VEHICLE_AND_CAMERA_SPECIFICATION.md` §1 is written to serve as that brief. M2 can't be approved without it, so it's the longest lead item.
3. Then Prompt 1 (Milestone 1) runs.
