# Build report: Milestones 1–7

Built on branch `world/build` (from `world/m0-plan`), in milestone order, without stopping between milestones, as asked on 21 Nov 2026. This file records what was built, where it differs from the plan, and what was actually measured. Where something was not measured, it says so.

## What was built

| Milestone | Built | Main files |
|---|---|---|
| 1. Foundation, loading, intro controller | Capability check, prefs, lazy engine, WebGL renderer with tiers and tilt-shift, fixed-step loop, store, disposables, intro sequencer and shots, loading screen, Skip, "View as page" from the first frame | `src/world/boot/*`, `src/world/core/*`, `src/world/render/*`, `src/world/intro/*`, `src/ui-world/LoadingScreen.tsx`, `IntroOverlay.tsx` |
| 2. Car, physics, camera | Rapier ray-cast vehicle, procedural microcar (two LODs), chase/overhead/focus/cinematic camera with collision, keyboard, mouse, touch and gamepad input | `src/world/physics/*`, `src/world/vehicle/*`, `src/world/camera/*`, `src/world/input/*` |
| 3. World and five districts | Painted board (roads, plots, names, track, plan drawings, site map, baked shadows), hub with tower crane and the tower that grows, Industrial, City (driveable flyover), Engineering, Experiment, Personal; distance streaming with massing proxies; dynamic props | `src/world/world/*`, `src/world/districts/*` |
| 4. Discovery | 19 discovery points mapped to real pages (5 case studies, About, Capabilities, Contact, Experiments); focus flight, then the real route opens; "Back to the world"; browser Back to `/` resumes driving; tower gains a floor per piece of work found, topped out when every district is visited | `src/world/discovery/*`, `src/world/content/placements.ts`, `src/ui-world/WorldOverlay.tsx` |
| 5. Audio, menus, map | Web Audio synth (motor, tyres, bumps, wind, horn, chimes), created only on a click; menu (go to, quality, frame rate, camera, sound, handedness, reset, replay intro, page view); site-plan map; HUD | `src/world/audio/*`, `src/ui-world/*` |
| 6. Tiers, mobile, 2D | Measured tier under the intro, governor (render scale first, then tier, then page view), manual quality selector, touch controls with left-handed option, 3D ⇄ 2D switch remembered | `src/world/perf/*`, `src/ui-world/TouchControls.tsx`, `WorldShell.tsx` |
| 7. Optimisation and tests | Rapier WASM served as a file, overlay UI split from the page bundle, unit and end-to-end tests | `vite.config.ts`, `tests/*`, `playwright.config.ts` |

Entry points on the page: "Enter the world" in the nav (and the mobile menu), "View in the world" on each case study.

## Differences from the plan

- **Assets are procedural (D3).** Every building, the car, the crane and the board are generated in code. There are no Blender files, glTF, Draco or KTX2 textures. `ASSET_PRODUCTION_PLAN.md` describes a pipeline that was not used.
- **Colliders are always present.** Only meshes stream by distance; far districts show white study-model massing.
- **The Experiment mound was dropped.** The district is a flat park with a running track.
- **WebGL, not WebGPU.** Decided at the M1 checkpoint: 131 KB gzipped for a minimal WebGL scene against 218 KB for the WebGPU build.
- **Rapier's WASM is a separate file.** The `-compat` package inlines the WASM as base64. A small Vite plugin (`rapierWasmFile` in `vite.config.ts`) swaps it for the package's own `.wasm`. The build fails if Rapier's code changes shape. Rapier starts downloading at the same time as the engine chunk. It still has to finish before the intro starts; the plan wanted it never to block the intro.
- **One branch, no build flag.** The plan had one branch per milestone and a `VITE_WORLD` flag. The work was built straight through on `world/build`, as instructed. Rolling back means not merging the branch.
- **Not built:** auto-drive, evening lighting (optional in the plan), streamed audio files (sound is synthesised instead).
- **Antialiasing is fixed at boot.** Changing tier later changes everything except MSAA, because WebGL can't change it without a new context.

## Measured

Every figure below was measured on 21 Nov 2026 in this build environment.

**Download (production build, gzip)**

| Item | Size | Budget |
|---|---|---|
| 2D page JS | 108.3 KB (346 KB raw), from 105 KB before | +5 KB at most: **met (+3.3 KB)** |
| World overlay UI (lazy) | 6.3 KB JS + 3.9 KB CSS | — |
| Engine chunk: Three.js and the runtime | 177.1 KB | ≤ 350 KB: **met** |
| Rapier JS | 39.7 KB | — |
| Rapier WASM | 1,187.6 KB (3.08 MB raw) | Measure: **this is the largest item.** The inlined build was 1,670 KB gzipped, so serving the file saved about 440 KB |
| Models, textures and audio | 0 (generated on the device) | ≤ 6 MB total: **met** |

**Tests**

- `npm test`: the content check plus 24 Vitest tests, all passing. They cover:
  - the vehicle at 30, 60 and 144 fps (agreeing within 1%);
  - the fixed-step loop;
  - the store;
  - the intro order, including reduced motion and Skip;
  - tier rules and the governor;
  - discovery and placements;
  - the layout audit: no road runs through a building, every discovery spot is reachable, and every spot has a placement and the reverse.
- `npx playwright test` (after `npm run build`): 9 passing and 1 skipped. The skipped one is the touch-only test on desktop. They run on desktop (1280×800) and mobile (390×844, touch) and cover:
  - the boot shows Skip and "View as page";
  - the page beneath is made `inert`;
  - no AudioContext is created before a click;
  - "View as page" disposes the canvas and is remembered after a reload;
  - reduced motion gives a still view and then the controls;
  - opening Sentra from the world loads `/work/sentra`, and "Back to the world" resumes driving;
  - the touch targets are at least 48 px;
  - there are no console errors or warnings.

**Frame rate: not measured on real hardware.** This environment has no GPU. Chrome renders WebGL in software (SwiftShader), and there the world ran at 1–2 fps on Medium at 1280×800 and about 8 fps on Low at 390×844. Those numbers say nothing about a phone or laptop with a GPU. The per-tier p95 budgets (Low 45 ms, Medium 24 ms, High 20 ms) still need checking on real devices. Open `/#stats` to see live fps, p95 frame time, draw calls and triangles.

## Known limitations

- Frame rate on real devices is unknown until tested (above).
- Rapier (1.19 MB gzipped) must load before the intro plays, so first load on a slow mobile connection will be long. The loading screen shows progress, and "View as page" works throughout.
- The car's handling values are tuned in tests, not by feel on real controls.
- Visiting a district by "View in the world" counts towards topping out the tower.

## Rollback

Don't merge `world/build`. To turn off the world for visitors after a merge without reverting, remove `<WorldShell />` from `src/App.tsx`. The 2D site is otherwise unchanged.
