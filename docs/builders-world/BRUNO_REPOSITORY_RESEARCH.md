# Bruno Simon folio-2025: repository research

Reference only. Nothing from this repository is copied into ours.

| | |
|---|---|
| Repository | https://github.com/brunosimon/folio-2025 |
| Commit inspected | `70764a94756cc4de564e493c8ba46c4b5fe03ed1` (4 Nov 2026) |
| Local copy | `../folio-2025-reference` (outside our project, shallow clone, not a dependency) |
| Size | 1,226 files, 622 MB. `sources/` 1.5 MB of code, `static/` 197 MB, `resources/` 150 MB of Blender and design sources |
| Code | About 30,500 lines of plain JavaScript across 126 files. No TypeScript, no UI framework |
| Inspected | Read in full: entry, Game, Ticker, Time, Events, Rendering, Quality, PreRenderer, ResourcesLoader, Viewport, Physics, PhysicsVehicle, Player (input and state parts), Inputs, References, Area, Areas, World, Intro (start flow), View (camera setup and update). Skimmed by structure: VisualVehicle, Nipple, InteractivePoints, ProjectsArea, Modals, Menu, Map, Audio, Server, Options, Overlay, Zones, Terrain, Materials, Lighting, Reveal, compress script, `index.html` |
| Not inspected | The remaining 13 area files (CircuitArea, LabArea and so on) beyond their method lists, weather effects (Snow, Rain, Lightnings, Tornado), Achievements, the WebSocket server code beyond its connection method, and the `.blend` files (not opened; Blender isn't available here) |
| Not run | I didn't install, build or run the project. Nothing below is a measured runtime result. File sizes are measured from disk. |

## 1. Stack

From `package.json` and `vite.config.js`:

- **Three.js 0.187** imported as `three/webgpu`: `WebGPURenderer`, which falls back to WebGL 2 when WebGPU isn't available. All custom shaders are written in TSL (Three Shading Language node functions), so they compile for both back ends.
- **Rapier 0.19** (`@dimforge/rapier3d`, the WASM build) loaded with a dynamic `import()` while the second asset batch downloads. Needs `vite-plugin-wasm`.
- **GSAP 3** for tweens, with the global timeline speed tied to game time.
- **Howler** for audio.
- **camera-controls**, used only for a debug free-fly camera.
- **Tweakpane** debug panel and **stats-gl**, both only active with `#debug` or `#stats` in the URL.
- **Stylus** for CSS.
- **msgpack-lite** for an optional multiplayer WebSocket server (`VITE_SERVER_URL`).
- Build-time asset tools: **gltf-transform** (ETC1S texture compression inside GLB, then Draco geometry) and **toktx** (KTX2 textures), driven by `scripts/compress.js`.

## 2. Architecture

### 2.1 Entry and lifecycle

- `sources/index.js` creates a single `new Game()`. `Game` is a singleton (`Game.getInstance()`); every system reaches every other system through it (`this.game.physics`, `this.game.view` and so on).
- `Game.init()` runs in a fixed order:
  1. DOM, scene, debug, loader, quality, ticker, time, inputs (filtered to the `intro` category), audio, viewport, modals, menu, renderer (`await renderer.init()`).
  2. **Batch 1**: four small files the intro needs (respawn points, palette texture, two intro textures).
  3. Camera, post-processing, render loop starts, world step 0 (grid and intro ring).
  4. **Batch 2**: about 40 GLB and texture files, loaded in parallel with the Rapier import. The progress feeds the intro ring.
  5. Terrain, physics, vehicle, player, interactive points, map and title are created, then world step 1 (everything else).
- **Teardown:** there isn't any. The game is never disposed. 21 `dispose()` or `destroy()` calls exist across 10 files, and 64 `addEventListener` calls are matched by one `removeEventListener`. That's fine for a site that is the whole page. It's the main thing we must not copy, because our 3D world has to be startable and disposable independently of the 2D site.

### 2.2 Game loop and time

- `Rendering.setRenderer()` hands the browser's animation loop to `Ticker.update()`.
- `Ticker` computes `delta` (clamped to 1/30 s), a scaled delta (`× 2` by default, slowed for "bullet time"), a 30-frame average, and frame-count waits. It then fires one `tick` event.
- `Events` stores callbacks in numbered **order slots**, so one `tick` runs systems in a fixed sequence. The readme documents the order: 0 time and inputs → 1 player pre-physics → 2 vehicle pre-physics → 3 physics step → 4 objects sync → 5 vehicle post-physics → 6 player post-physics → 7 camera → 8–10 world, effects and areas → 13 instancing → 14 audio and UI → 998 render → 999 monitoring.
- **Physics timestep:** `Physics.update()` sets `world.timestep = ticker.deltaScaled` every frame, so the simulation steps with a **variable** timestep. There's no fixed-step accumulator and no render interpolation. The vehicle controller uses `1/60` on low quality and `min(1/60, average delta)` on high.

**Lesson:** the ordered single-tick pipeline is clear and worth having in our own form. The variable physics step is what our plan explicitly rules out: we use a fixed 60 Hz step with interpolation.

### 2.3 Rendering

- `WebGPURenderer` with `powerPreference: 'high-performance'`, MSAA only when pixel ratio is below 2, pixel ratio capped at 2, shadows on, render order sorting instead of depth sorting.
- Post-processing through a `RenderPipeline`: scene pass → bloom (5 mips on high quality, 2 on low) → a custom "cheap depth of field" blur on high quality only.
- A one-off cube-camera render at start on WebGPU high quality, to compile shaders before the player sees them.
- One directional light whose shadow camera follows the visible area.

### 2.4 Quality

`Quality.js` sets level 1 (low) when the user-agent string matches `Mobi|Android|iPhone|iPad|iPod`, otherwise level 0 (high). There's no measurement. 15 places branch on the level (bloom mips, depth of field, camera angle, shadow radius, vehicle physics delta and so on). Our plan rules this out: we don't classify devices by user agent or screen size.

### 2.5 Physics and vehicle

- `Physics.getPhysical()` turns a plain description (`type`, `colliders` with `cuboid | ball | cylinder | trimesh | hull | heightfield`, mass, friction, restitution, collision category) into a Rapier rigid body and colliders. Collision filtering uses three bit-groups (`all`, `object`, `bumper`).
- **Vehicle** (`Physics/PhysicsVehicle.js`): Rapier's `DynamicRayCastVehicleController` on a chassis of three box colliders (main body with lowered centre of mass, roof, and a wider "bumper" box that only hits loose objects). Four ray-cast wheels with suspension, friction slip and side-friction settings. The front two wheels steer.
- Per frame it computes engine force, brake (including automatic braking when the input reverses direction at speed), steering and per-wheel suspension height (low, mid, high) from the player's input. After the physics step it derives speed, direction, upside-down state, "stuck" state and flips from the chassis transform.
- **Physical and visual vehicles are separate.** `PhysicsVehicle` knows nothing about meshes; `World/VisualVehicle.js` reads the physical state and animates a separately loaded GLB (wheels, suspension, blinkers, antenna, boost trails). This is the split our plan requires.

### 2.6 Player and input

- `Player` translates input actions into four numbers each frame (`accelerating`, `steering`, `boosting`, `braking`) plus suspension states, and owns respawn, the unstuck helper and session statistics. It doesn't touch physics directly.
- `Inputs` holds **named actions** (`forward`, `left`, `interact`…), each listing the keys that drive it (`Keyboard.KeyW`, `Gamepad.r2`, `Pointer.any`…) and the **categories** in which it's allowed (`intro`, `wandering`, `racing`, `cinematic`). Active filters decide which actions respond, so the same key can mean different things in different contexts. The input mode (mouse and keyboard, gamepad, touch) switches automatically on the last device used, and CSS classes follow it.
- **Touch** (`Inputs/Nipple.js`): there are no on-screen accelerate or brake buttons. The player presses and drags; the drag direction is projected into the world around the car and drawn as a ring on the ground. Distance from the centre sets throttle and the angle sets steering. A tap jumps.

### 2.7 Camera

- `View.js`: a 25° field-of-view perspective camera at a **fixed diagonal angle** (azimuth 45°, polar about 56° on high quality and 49° on low), 15–30 units from a smoothed focus point that follows the car. The camera **does not rotate to follow the car's heading.** Zoom comes from the mouse wheel and pulls in slightly at speed on high quality. There's a spring "roll" effect, speed lines, and a "cinematic" blend to a fixed pose when an interactive point opens.
- It computes an "optimal area" quad on the ground that the camera can see. Areas use it for culling, which only works because the camera angle never changes.

**Lesson:** our approved camera is a dynamic third-person chase camera with an optional fixed isometric mode, so the camera is our own design. The fixed-angle approach appears only as our optional isometric mode, built independently.

### 2.8 World authoring

- The world is authored in Blender (`resources/folio-2025.blend`, 16 MB) and exported to many GLB files. `areas.glb` has one root object per area, named `achievements…`, `projects…` and so on. `Areas.js` matches names to classes.
- `References.js` collects any object named `ref<Name><n>` or `reference<Name><n>`: invisible marker empties placed in Blender for spawn points, zone bounds, culling radii, image surfaces and interaction points. `Area.js` reads `zoneBounding` (enter and leave events) and `zoneFrustum` (culling radius) from them.
- `Objects.addFromModel()` creates physics bodies straight from model children and their Blender custom properties (`userData.mass`, `preventAutoAdd`, `preventFrustum`).
- Most objects are coloured from one **128 × 4 palette texture** by UV position, so many meshes share one material. Trees, bushes and flowers are placed from "references" models and drawn with instancing.

**Lesson:** "place markers in Blender, read them by name in code" is a strong authoring pattern and we'll use our own version of it. The single palette texture is why the whole world is so light, and it's also a large part of Bruno's recognisable look, so we use a different art direction (see `ASSET_PRODUCTION_PLAN.md`).

### 2.9 Interaction and content

- `InteractivePoints.js` finds the nearest point within range (re-tested only after the car moves 0.2 units), shows a key icon, and calls `interact()` on Enter, E, F, the gamepad button or the touch button.
- `ProjectsArea.js` shows projects on an in-world board: project data comes from `sources/data/projects.js` (title, URL, role, images as `.ktx` files). Images load when needed and cross-fade in a TSL shader; text is drawn to canvas textures. The camera blends to a fixed pose while the board is open.
- HTML is used for the menu, modals, map, touch buttons and the transition overlay.
- **Search and accessibility:** `index.html` has a title, description and social tags, but no portfolio content in HTML. All project information exists only inside the 3D scene. There's no 2D alternative, and no reduced-motion handling anywhere in `sources/`.

### 2.10 Intro

`World/Intro.js` draws a ring on the ground around the spawn point that fills with loading progress, then shows a "click to start" label in the world (with a sound toggle). The click is the user gesture that unlocks audio. `Reveal.js` then plays a timed reveal. There's no aerial fly-through and no skip button; the intro is short.

**Lesson:** our approved intro (aerial shot → name → vehicle → camera behind → controls → hand over, with Skip) is a different sequence, built as its own system.

### 2.11 Audio

`Audio.register()` wraps Howler sounds with per-frame `onPlaying` callbacks that set volume and rate from game state (engine pitch from throttle, tyre noise from speed and so on). Mute is stored in `localStorage`. Playback starts only after the intro click.

### 2.12 Assets and loading

Measured on disk:

| | Size |
|---|---|
| All compressed GLB models (32 files) | 1.0 MB |
| All KTX2 textures (88 files, including project images) | 3.1 MB |
| Vehicle, compressed | 34 KB (232 KB before compression) |
| Area models, compressed | 624 KB |
| Terrain model, compressed | 26 KB (+342 KB terrain texture) |
| Music (CC0) | 148 MB |
| Draco and Basis decoders | 3.6 MB + 0.6 MB |

The world is visually rich but geometrically simple, palette-coloured and heavily compressed. A "realistic" art direction would cost far more than this.

## 3. Useful patterns for our project

These are ideas and structure, written from scratch in TypeScript. No code is copied.

1. One ordered update pipeline per frame (input → intent → fixed-step physics → post-physics → camera → world → UI → render).
2. Physical vehicle and visual vehicle as separate objects; the visual one only reads state.
3. Named input actions with context filters, and automatic input-mode switching.
4. Two-stage loading: a tiny first batch so the intro can start while the rest loads in parallel with the physics engine.
5. Blender-placed marker objects read by naming convention, so layout changes don't need code changes.
6. Shared materials and instancing for repeated props.
7. Nearest-point interaction re-tested only after the car moves.
8. Compressed textures (KTX2) and compressed geometry as a build step that keeps originals.
9. Optional debug panel and stats behind a URL flag, absent from normal builds.

## 4. What we should not reproduce

| In the reference | Why not for us | Our approach |
|---|---|---|
| Singleton `Game` reached from everywhere | Can't be torn down; hard to test; hidden coupling | Explicit `WorldRuntime` object, systems receive what they need, `dispose()` on every system |
| No teardown, listeners never removed | Our 3D world must be startable and disposable while the 2D site keeps running | Every system registers its own cleanup; a test verifies the WebGL context and listeners are released |
| Variable physics timestep | Physics behaves differently at 30, 60 and 120 fps | Fixed 60 Hz step, accumulator with a step cap, render interpolation |
| Quality from the user-agent string | Misclassifies devices; ruled out by the brief | Capability checks + measured frame times + manual selector |
| Fixed-angle camera with view-quad culling | Our camera rotates; that culling would break | Chase camera; distance-based and frustum culling per district |
| Content only inside the 3D scene | Not crawlable, not accessible | Content stays in `src/content`; the prerendered 2D site is always present |
| No reduced-motion handling | Required by our brief | Reduced motion skips the fly-through and calms camera motion |
| Plain JavaScript | Our project is strict TypeScript | TypeScript throughout |
| Howler, GSAP, camera-controls, Tweakpane, Stylus, msgpack | Each adds weight; several unnecessary for us | Decide per milestone; see `PORTFOLIO_IMPLEMENTATION_PLAN.md` §4 |
| Palette-texture toy look, Pally typeface, orange-teal gradients | Recognisably Bruno's | Our own art direction from the existing site identity |

## 5. Licence

| Material | Licence | Can we reuse it? |
|---|---|---|
| Source code in `sources/` | MIT (`license.md`, © 2025 Bruno Simon) | Legally yes, with the copyright notice. **We still won't**, because the brief requires an original implementation. If any snippet is ever adapted, it must keep the MIT notice and be recorded. |
| `package.json` licence field | Says "ISC", which contradicts `license.md` | Treat `license.md` (MIT) as authoritative for code; the conflict is another reason not to copy |
| Music in `static/sounds/musics/` | CC0 1.0 (`static/sounds/musics/license.md`) | Legally free to use. Still not planned: it's part of his site's identity. |
| Other sounds (vehicle, hits, ambience…) | **No licence file.** File names point to commercial sound libraries ("Robotic_Lifeforms_2…", "Car Horn Long 4", "41051 Glass stone turning loop…") | **No.** Assume they're licensed to him, not to us. |
| Models, textures, Blender files, renders, his likeness (`resources/models/bruno.glb`) | Not stated separately; artwork and a person's likeness | **No.** The MIT text covers "software"; it isn't a clear grant over his artwork, and his likeness isn't ours to use. |
| Pally typeface (`static/fonts/`) | Third-party typeface, not covered by his licence | **No.** |
| Draco and Basis decoders (`static/draco`, `static/basis`) | Their own upstream licences | We'd use the copies that ship with Three.js, not his. |
| Dependencies | three (MIT), Rapier (Apache-2.0), Howler (MIT), GSAP (GSAP Standard "no charge" licence, not MIT) | Usable under their own licences if we choose them |

## 6. Limitations of this research

- Static reading only. I didn't run the site, so performance, mobile behaviour and feel weren't observed.
- The `.blend` files weren't opened, so modelling conventions inside Blender are inferred from the exported GLB names and code.
- The 13 area-specific files and the weather systems were reviewed only by their method names.
- Asset licence conclusions are a reading of what's in the repository, not legal advice.
