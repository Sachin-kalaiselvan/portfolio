# THE BUILDER'S WORLD: implementation plan

Personal portfolio of Sachin Kalaiselvan, as an original driveable miniature world plus the conventional 2D portfolio, sharing one set of content.

Status: **plan for review. No code has been written.**

## Documents in this set

| # | File | What it settles |
|---|---|---|
| 1 | `PORTFOLIO_IMPLEMENTATION_PLAN.md` | This file: architecture, systems, lifecycle, dependencies, open decisions |
| 2 | `BRUNO_REPOSITORY_RESEARCH.md` | What the reference does, what we learn, what we avoid, licences |
| 3 | `ORIGINAL_WORLD_DESIGN.md` | Layout, districts, roads, landmark, discovery points, visual identity |
| 4 | `ASSET_PRODUCTION_PLAN.md` | Every asset, its budget, who makes it, in what order |
| 5 | `PERFORMANCE_STRATEGY.md` | Quality tiers, budgets, measurement, mobile and thermal limits |
| 6 | `IMPLEMENTATION_ROADMAP.md` | Milestones 0–7 with scope, tests, acceptance, risks, rollback |
| 7 | `CREATIVE_BRIEF.md` | The approved creative decisions and the tone of the whole thing |
| 8 | `VEHICLE_AND_CAMERA_SPECIFICATION.md` | The mini electric car and the chase camera |
| 9 | `CINEMATIC_INTRO_SPECIFICATION.md` | The opening sequence, Skip, reduced motion, failure cases |
| 10 | `MOBILE_EXPERIENCE_SPECIFICATION.md` | Simplified 3D mode, 2D mode, switching, quality selection |

## 1. Starting point: the existing repository

Inspected on 21 Nov 2026 (`Sachin-kalaiselvan/portfolio`, branch `portfolio-site`, which is the only branch on GitHub, latest commit `1964373`).

| | Current state |
|---|---|
| Framework | React 19, React Router 7, Vite 8, TypeScript 7 (strict), npm |
| Rendering | Every route prerendered to static HTML at build (`scripts/prerender.mjs`), then hydrated |
| Routes | `/`, `/work/:slug` (5 case studies), 404 |
| Content | Typed data in `src/content/` (`profile.ts`, `projects.ts`, `experiments.ts`, `capabilities.ts`, `types.ts`) |
| Styling | Plain CSS with design tokens (`src/styles/tokens.css`): ivory `#f3f0e8`, ink `#131312`, cobalt `#2440d6`, Geist + Instrument Serif + Geist Mono |
| Motion | CSS transitions and one shared IntersectionObserver. No animation library |
| Media | 4.2 MB in `public/media/` (WebP screenshots, two MP4/WebM films) |
| Tests | `npm test` = content checks (`scripts/check-content.mjs`). No unit or browser tests in the repo |
| Deployment | `vercel.json` (clean URLs, long cache on `/assets` and `/media`). Not yet deployed to a domain |
| Production dependencies | 6 (React, React DOM, React Router, 3 font packages) |

**What this means:** the conventional 2D portfolio required by the plan **already exists**. It's prerendered, crawlable, accessible and reads from `src/content`. The 3D world is added beside it, reads the same content, and never replaces the HTML that search engines and screen readers rely on. Nothing in the current site needs rewriting for Milestone 1.

## 2. Architecture

### 2.1 Two layers, one content source

```
                 src/content/*.ts  (projects, profile, experiments, capabilities)
                        │
        ┌───────────────┴────────────────┐
        ▼                                ▼
  2D portfolio (React)            3D world (TypeScript + Three.js)
  - prerendered HTML              - lazy-loaded chunk, never in the first page load
  - routes / and /work/:slug      - reads the same project records
  - always present in the DOM     - a district and discovery points per project
        ▲                                │
        └──── WorldBridge (typed events, a small store) ────┘
              React UI (panels, HUD, menus) ⇄ world runtime
```

- **React manages the interface. Three.js manages the world.** The world runtime has no React imports. React talks to it only through `WorldBridge`.
- **One content source.** A project is added once, in `src/content/projects.ts`. Its district placement is a separate small mapping (`src/world/content/placements.ts`: slug → district, discovery point IDs) that the content test checks, so a project can't be in the world without a case study or vice versa.
- **Same routes.** Opening a project in the world pushes `/work/<slug>` to the history and shows the case study in a panel over the paused world. Back closes it. Opening `/work/<slug>` directly (a shared link, a search result) loads the prerendered 2D case study, which offers "View in the world".

### 2.2 How the 3D world mounts

Recommended (decision D1 in §6):

1. Every route is served as today's prerendered HTML. That's the first paint for everyone and everything crawlers see.
2. On `/`, a small **boot module** (a few KB, no Three.js) checks capability and stored preference. If 3D is possible and wasn't declined, it shows the intro's first frame over the page and starts downloading the world chunk. The 2D page stays in the DOM underneath, hidden from view but not removed.
3. A **"View as page"** control is visible from the first frame and at all times. It's a real link to the 2D layout, so it works even if JavaScript for the world fails.
4. Choosing 2D, a failed start, or a device that can't sustain the lowest tier disposes the runtime completely (renderer, WebGL context, physics world, listeners, audio) and reveals the page.

### 2.3 Folder structure (proposed)

The ChatGPT draft proposed a separate `sachin-portfolio/` tree with `World.ts`, `WorldManager.ts` and so on. Repository inspection shows a better fit: keep the existing app and add one isolated folder.

```
src/
  content/                 existing, unchanged: the one content source
  components/, pages/      existing 2D site
  world/                   NEW: the 3D runtime, no React imports
    boot/                  capability check, preference, lazy loader (tiny, no Three.js)
    core/                  WorldRuntime, FixedStepLoop, EventBus, Store, Disposables
    render/                renderer, post-processing, quality tiers, resize
    assets/                AssetLoader (GLB, KTX2, meshopt), manifest, budgets
    input/                 actions, keyboard, pointer, gamepad, touch controls
    physics/               Rapier wrapper, collision groups, debug draw
    vehicle/               VehiclePhysics, VehicleVisual, VehicleAudio
    camera/                ChaseCamera, IsometricCamera, CinematicCamera, CameraDirector
    intro/                 IntroSequencer and its shot definitions
    world/                 WorldLayout, DistrictLoader, markers, culling
    districts/             one folder per district (behaviour only; geometry comes from assets)
    discovery/             DiscoveryPoints, proximity, prompts
    audio/                 AudioManager (Web Audio)
    perf/                  FrameMonitor, QualityGovernor, stats overlay (dev only)
    content/placements.ts  slug → district and points
  ui-world/                NEW: React components that sit over the canvas
    WorldShell.tsx         mounts and disposes the runtime
    Hud.tsx, TouchControls.tsx, ProjectPanel.tsx, Minimap.tsx, QualityMenu.tsx, IntroOverlay.tsx
public/
  world/                   NEW: compressed GLB and KTX2 files, by district
assets-src/                NEW, not deployed: Blender files and export presets (or kept outside the repo; see ASSET_PRODUCTION_PLAN.md)
docs/builders-world/       these documents
```

### 2.4 Systems and their responsibilities

| System | Owns | Reads | Never does |
|---|---|---|---|
| `WorldRuntime` | Creating systems in order, the loop, `dispose()` of everything | Boot options (tier, reduced motion, audio preference) | Touch the DOM outside its container |
| `FixedStepLoop` | Fixed 60 Hz simulation steps, accumulator, step cap, interpolation alpha | Real frame time | Run game logic itself |
| `EventBus` + `Store` | Typed events and a small state store (mode, tier, active point, intro state) | — | Hold Three.js objects |
| `Renderer` | Three.js renderer, post-processing chain, pixel ratio, resize, context loss | Tier settings | Decide the tier |
| `QualityGovernor` | Picking and changing the tier from measured frame times, applying manual choice | `FrameMonitor` | Guess from user agent or screen size |
| `AssetLoader` | Loading, caching and disposing GLB, KTX2 and audio; progress | Manifest | Hide a failed load |
| `Input` | Mapping devices to named actions per context (`intro`, `driving`, `panel`, `menu`) | Keyboard, pointer, gamepad, touch | Move the car |
| `Physics` | Rapier world, fixed step, colliders from markers, collision groups | — | Know about meshes |
| `VehiclePhysics` | Chassis, ray-cast wheels, engine, brakes, steering, reset | Driving intent (throttle, brake, steer) | Read input devices directly |
| `VehicleVisual` | The car model, wheel spin and steer, suspension, lights, interpolation | `VehiclePhysics` state | Write to physics |
| `CameraDirector` | Choosing chase, isometric or cinematic camera and blending between them | Vehicle state, intro state, active point | Move the physics body |
| `IntroSequencer` | The scripted opening, Skip, reduced-motion path | Load progress | Block access to the 2D page |
| `DistrictLoader` | Loading, showing and unloading districts by distance | Car position, tier | Load everything at once |
| `DiscoveryPoints` | Proximity, prompt, interaction → `openProject(slug)` | Placements, car position | Hold project text (comes from `src/content`) |
| `AudioManager` | Web Audio context, engine and ambience loops, one-shots, mute | Vehicle state | Play before a user gesture |

### 2.5 Frame order

One callback per animation frame, in this order:

1. Read input → driving intent.
2. Fixed steps (0 to 5 per frame): vehicle pre-step (apply intent) → Rapier step → vehicle post-step (read wheel contacts, speed).
3. Interpolate visual transforms between the last two physics states with the accumulator alpha.
4. Camera (reads interpolated vehicle pose).
5. World: district streaming, discovery proximity (only when the car moved), ambient animation.
6. Audio parameters.
7. Render.
8. Publish a throttled state snapshot to React (speed, nearby point, district) at most 10 times a second, never every frame.

### 2.6 Lifecycle

- `createWorld(container, options): Promise<WorldRuntime>` builds everything and returns a handle. It can fail with typed errors (`NoWebGL`, `ContextLost`, `AssetFailed`, `TooSlow`) that the shell turns into a calm switch to the 2D page with a one-line reason.
- `runtime.pause()` stops simulation and rendering (tab hidden, project panel fully covering, menu open).
- `runtime.dispose()` releases GPU resources (geometries, materials, textures, render targets), calls `renderer.dispose()` and forces the context loss, frees the Rapier world, closes the audio context, removes every listener and observer, and clears the store. A browser test checks that after `dispose()` no canvas remains and no listeners are left on `window` or `document` that the runtime added.

### 2.7 State shared with React

A small store (plain TypeScript, read in React with `useSyncExternalStore`): `mode` (`booting | intro | driving | panel | 2d`), `tier`, `loadProgress`, `nearbyPoint`, `currentDistrict`, `audioEnabled`, `reducedMotion`, `error`. React never gets Three.js objects. Commands go the other way as functions on the bridge: `skipIntro()`, `openProject(slug)`, `closePanel()`, `setTier(t)`, `setCameraMode(m)`, `respawn()`, `switchTo2D()`.

## 3. Approved creative decisions and where they land

| Decision | Specified in |
|---|---|
| THE BUILDER'S WORLD, personal portfolio of Sachin Kalaiselvan | `CREATIVE_BRIEF.md` |
| Original miniature electric car, full requirement list | `VEHICLE_AND_CAMERA_SPECIFICATION.md` §1–2 |
| Dynamic third-person camera, full requirement list, optional isometric mode | `VEHICLE_AND_CAMERA_SPECIFICATION.md` §3–5 |
| Cinematic introduction with Skip, the six steps and its rules | `CINEMATIC_INTRO_SPECIFICATION.md` |
| Two equal mobile modes: simplified 3D and conventional 2D | `MOBILE_EXPERIENCE_SPECIFICATION.md` |
| Switch between 3D and 2D at any time | `MOBILE_EXPERIENCE_SPECIFICATION.md` §4 |
| No device classification by screen size; capability checks, measurement, manual selector | `PERFORMANCE_STRATEGY.md` §3 |
| Five districts: Industrial (THREXA / The Ingredient List), City (WHAT RA SUDEEEP?), Engineering (Sentra), Experiment (Fitness Guild and verified experiments), Personal (About, capabilities, contact) | `ORIGINAL_WORLD_DESIGN.md` |
| Original layouts, architecture, roads, landmarks; nothing from Bruno's map, terrain, roads, models or props | `ORIGINAL_WORLD_DESIGN.md`, `ASSET_PRODUCTION_PLAN.md` |
| Shared project data, identifiers, routes, destinations, media, status | §2.1 here, `IMPLEMENTATION_ROADMAP.md` M4 |
| 3D independently startable and disposable | §2.6 |
| React for the interface, Three.js for the world, clear interface between them | §2.1, §2.7 |
| Cinematic intro as a separate system | `CINEMATIC_INTRO_SPECIFICATION.md` §5 |
| Vehicle physics independent of camera; camera never moves the physics body | §2.4, `VEHICLE_AND_CAMERA_SPECIFICATION.md` §3.4 |
| Fixed-timestep physics; visual vehicle separate from physics vehicle | §2.5, `VEHICLE_AND_CAMERA_SPECIFICATION.md` §2 |

## 4. Dependencies

The brief says not to add dependencies unnecessarily. Each candidate:

| Package | Verdict | Why | When |
|---|---|---|---|
| `three` 0.187 | **Add** | The renderer, loaders (GLTF, KTX2, meshopt decoder) and TSL materials | M1 |
| `@dimforge/rapier3d-compat` 0.21 | **Add** | Physics and the ray-cast vehicle controller. The `-compat` build embeds the WASM, so no Vite WASM plugin or top-level await setup is needed. Loaded with dynamic `import()` in parallel with assets | M1 (initialised only if M1 needs it; vehicle in M2) |
| `@gltf-transform/cli` | **Add as dev dependency** | Build-time compression only (KTX2 textures, meshopt geometry). Never shipped to the browser | M1 pipeline, used from M2 |
| `vitest` | **Add as dev dependency** | Unit tests for loop, input mapping, camera maths, tier selection, placements | M1 |
| `@playwright/test` | **Add as dev dependency** | Browser smoke tests: boot, Skip, 2D switch, dispose, no console errors, mobile viewport | M1 |
| GSAP | **Not now** | The intro is a short set of camera keyframes and fades; a typed sequencer of about 200 lines covers it and stays seekable for Skip. GSAP's licence is its own "no charge" licence, not MIT. Revisit only if M1 shows the sequencer is insufficient. | — |
| Howler | **Not needed** | A handful of loops and one-shots is simple with the Web Audio API we need anyway for engine pitch | — |
| camera-controls | **Not needed** | Our chase camera is custom; a debug fly camera isn't worth a dependency | — |
| Tweakpane, stats-gl | **Not in production** | A small dev-only stats overlay (`#stats`) reading `renderer.info` and frame times is enough. A tuning panel can be added as a dev-only dependency during M2 if vehicle tuning needs it | M2, optional, dev only |
| React Three Fiber, Drei | **No** | Would put the world inside React's render cycle, which the approved architecture rules out | — |

**Renderer choice:** `WebGPURenderer` from `three/webgpu`. It uses WebGPU where available and falls back to WebGL 2 automatically, and TSL materials work on both. Risk: the fallback path's performance on older iPhones and mid-range Android is unmeasured. M1 includes a forced-WebGL 2 test on the device matrix. If the WebGPU build is materially heavier or slower there, we switch to `WebGLRenderer` with standard materials; the runtime's render layer is isolated so that switch stays local.

**Geometry compression:** meshopt rather than Draco. The decoder ships with Three.js, is much smaller than Draco's and decodes faster. Final choice is confirmed against real files in M2.

## 5. Major risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Asset production.** No 3D artist is attached to the project, and the brief rules out primitive placeholders as final art | High | High: the world can't ship looking finished | Art direction chosen to be producible by one person in Blender (`ASSET_PRODUCTION_PLAN.md` §1); hero car commissioned or modelled first; districts finished one at a time; budget decision D3 |
| Scope: five finished districts plus an intro, a car and a 2D mode is a large build for one person | High | High | Each milestone ships something complete; the 2D site is always live; districts can launch one at a time behind the same world |
| Mobile performance and heat | Medium | High | Measured tiers, 30 fps cap option, aggressive district unloading, 2D mode always available |
| WebGPU/WebGL 2 differences on iOS Safari | Medium | Medium | Forced-WebGL test in M1; isolated render layer |
| Rapier WASM size on slow connections | Medium | Medium | Loaded in parallel with the intro; intro doesn't need physics; measured in M1 |
| Feels like a copy of Bruno's site | Medium | High | Different camera, intro, touch scheme, art direction, world concept and typography; reviewed at every milestone |
| SEO or accessibility regressions | Low (2D stays) | High | 2D HTML is never removed; Lighthouse and keyboard checks in M7 |
| Physics feel isn't good on the first pass | Medium | Medium | Tuning values in one config file; M2 is dedicated to the car before any world is built |

## 6. Decisions needed from you before or during Milestone 1

| # | Decision | Options | Recommendation |
|---|---|---|---|
| D1 | Where the world lives | **A.** World plays over `/` by default on capable devices; 2D always one click away. **B.** 2D stays at `/`, world at `/world` behind an "Enter the world" button | **A**, because the brief makes the world the first impression. B is lower risk if you'd rather launch the world quietly first |
| D2 | Art direction (see `ASSET_PRODUCTION_PLAN.md` §1) | **Architect's study model** (ivory card buildings, cobalt accents, warm low sun, tilt-shift). **Realistic miniature** (the ChatGPT reference photos). **Stylised low-poly** | **Architect's study model.** It's original, matches the existing site, and one person can produce it. The realistic miniature look needs far more modelling and texture work and much heavier files |
| D3 | Who makes the 3D assets | You in Blender / commission the car and landmark / commission everything / buy kits and customise | Commission the hero car and central landmark; build districts yourself in the white-model style with CC0 kits for small props |
| D4 | Papillon Interiors | Not in the five approved districts. Place it as a design-studio storefront in the Personal district, or keep it 2D-only | Storefront in the Personal district, labelled as client work |
| D5 | Name on the site | The brief says Sachin Kalaiselvan; your other documents use Sachin JK | Your call; it's one field in `src/content/profile.ts` |
| D6 | Audio sources | Record and design your own / CC0 libraries / licensed packs | CC0 or self-recorded for M5; nothing from the reference |

## 7. What isn't decided by this plan

- Final vehicle dimensions, handling values and camera numbers: starting values are in the vehicle spec; final values come from feel tests in M2.
- The exact district footprints and building list: the world design gives the layout and each district's content; detailed blockouts are the first task of M3.
- Domain and deployment URL: still unknown, as before.
