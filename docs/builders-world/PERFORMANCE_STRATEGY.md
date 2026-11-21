# Performance strategy

Every number in this document is a **target or a budget**, not a measurement. Nothing has been built or benchmarked yet. Each milestone reports measured results against these targets, and targets that turn out wrong are revised with the measurement that showed it.

The only measured figures here come from disk, for comparison: the reference site's whole compressed world is about 1.0 MB of models plus 3.1 MB of textures (`BRUNO_REPOSITORY_RESEARCH.md` §2.12), and our current 2D site's production JavaScript is 340 KB raw, 105 KB gzipped (one file, measured on 21 Nov 2026 from the existing build).

## 1. Principles

1. The 2D page is never slowed by the world. The world's code and assets load only after the page is interactive, and only when the 3D path is chosen.
2. Physics stability beats frame rate. Physics always runs at a fixed 60 Hz; only rendering adapts.
3. Measure, don't guess. Quality comes from capability checks and measured frame times, never from screen size or user agent.
4. Unload, don't just hide. GPU memory for districts out of range is released.
5. Every tier keeps every project destination.

## 2. Quality tiers

| Setting | Low | Medium | High |
|---|---|---|---|
| Render scale (× device pixels) | 0.6–0.85, adaptive | 0.75–1.0, adaptive | 1.0 |
| Pixel ratio cap | 1.5 | 1.5 | 2 |
| Frame cap | 30 fps (changeable) | 60 fps | Display rate |
| Anti-aliasing | None (rely on render scale) | FXAA | MSAA 4× (or FXAA on WebGPU if cheaper) |
| Shadows | Baked into the board and buildings; blob shadow under the car | One 1024² directional shadow map following the car, short range | 2048² shadow map, wider range, soft filtering |
| Depth of field (tilt-shift) | Off | Off | On |
| Bloom | Off | Off | Light, on emissive lights only |
| Materials | Unlit or Lambert with baked lighting | Lambert/Standard, baked ambient occlusion | Standard, baked AO, environment reflections on glass and car |
| Car model | Low LOD (≤ 8k triangles) | Full | Full |
| Draw distance | 90 units | 140 units | Whole board |
| District streaming radius | Current district + neighbours + hub | Current + neighbours + hub | All loaded |
| Props (instanced) | 30% density | 70% | 100% |
| Ambient animation | Crane only | Crane, flags, rack lights | All |
| Physics | 60 Hz fixed | 60 Hz fixed | 60 Hz fixed |

## 3. Choosing and changing the tier

### 3.1 Capability checks (before loading the engine)

The boot module (no Three.js) checks:
- WebGPU (`navigator.gpu` and a successful adapter request) and WebGL 2 (a context can be created). Neither → 2D, done.
- `MAX_TEXTURE_SIZE` ≥ 4096 required for Medium and High.
- `navigator.deviceMemory` (where available) ≤ 2 → start at Low and never auto-promote above Medium. This is a capability signal reported by the browser, not a screen-size guess, and it's only used as a ceiling.
- `prefers-reduced-motion`, `Save-Data` and `prefers-reduced-data` → start at Low, skip the full intro.

### 3.2 Measured selection (during the intro)

- Start on Low. During the aerial shot (about 3 s, after shaders have compiled), record frame times.
- If the median frame time is under 12 ms and the 95th percentile under 20 ms, step up to Medium and measure again for 2 s; the same rule on Medium allows High.
- The result is stored and reused on the next visit, then re-checked quietly.

### 3.3 Runtime governor

- Tracks a rolling 5-second window of frame times.
- **Step down** a tier (or lower the render scale within a tier first) when the 95th percentile exceeds the tier's budget (Low 45 ms, Medium 24 ms, High 20 ms) for 5 s.
- **Step up** only render scale automatically, never the tier, and only after 20 s of comfortable headroom. Tier increases are left to the manual selector, so quality doesn't flip back and forth.
- Detects sustained slow drift over minutes (thermal throttling) and responds the same way.

### 3.4 Manual selector

Menu → Quality: Auto (default), Low, Medium, High, plus the frame cap and "Shadows on/off". A manual choice turns off automatic tier changes (render scale adaptation remains) and is remembered.

## 4. Budgets

Per frame, measured with `renderer.info` in the dev stats overlay (`#stats`):

| | Low | Medium | High |
|---|---|---|---|
| Draw calls | ≤ 80 | ≤ 160 | ≤ 300 |
| Visible triangles | ≤ 150k | ≤ 400k | ≤ 1.0M |
| Textures resident | ≤ 32 MB | ≤ 64 MB | ≤ 128 MB |
| CPU frame time (JS) | ≤ 8 ms | ≤ 6 ms | ≤ 6 ms |

Download (compressed, transferred):

| | Budget |
|---|---|
| 2D page first load | Unchanged from today (105 KB gzipped JS); the world adds **nothing** to it except the boot module (≤ 5 KB) |
| World engine chunk (Three.js + runtime, excluding Rapier) | ≤ 350 KB |
| Rapier WASM | Measured in M1; loaded in parallel, never blocks the intro |
| Intro batch 1 assets | ≤ 400 KB |
| Batch 2 (car, Personal district, hub) | ≤ 800 KB |
| Each other district | ≤ 600 KB |
| Whole world, everything loaded | ≤ 6 MB |
| Audio | Streamed later; ≤ 1.5 MB total |

## 5. Techniques

| Area | Technique |
|---|---|
| Draw calls | Merge static geometry per district by material; instancing for repeated props (reels, trees, scaffold sections, street lights); a shared material library |
| Geometry | Meshopt compression; quantised attributes; LODs for the car and large buildings; no hidden faces kept on card-model buildings |
| Textures | KTX2 (ETC1S for colour and baked lighting, UASTC for normal maps if any); atlases per district; 512² variants for Low; no PNG or JPEG textures at runtime |
| Shadows | Baked lighting in the art direction carries most shadow; one real-time shadow map only on Medium and High, tightly fitted around the car |
| Culling | Frustum culling (Three.js default) plus per-district bounding spheres; distance-based district streaming with hysteresis (load at radius R, unload at R + 20) |
| Shader compilation | Compile district materials when loaded, before they become visible (`renderer.compileAsync` against the loaded group), so first sight never stalls |
| Physics | Static colliders as simple boxes and convex hulls (no trimesh for buildings); loose props sleep; colliders for unloaded districts removed |
| JavaScript | No per-frame allocation in the loop (reuse vectors); state sent to React at most 10 times a second; no React re-render tied to the frame |
| Loading | Two-batch intro loading; district streaming; HTTP caching with content-hashed file names (Vercel already serves `/assets` immutable; `/world` files get the same rule) |
| Idle | Render on demand when nothing moves (car stopped, no camera motion, no animation) after 20 s; pause when hidden |

## 6. Physics stepping

- Fixed `dt = 1/60 s`.
- Accumulator with the frame delta clamped to 0.1 s; at most 5 steps per frame; extra time dropped (no spiral of death).
- Render interpolation between the last two physics states using the remaining fraction.
- Verified by the frame-rate independence test in the vehicle spec §6.

## 7. Memory and cleanup

- Every loaded resource is registered with the `AssetLoader`, which reference-counts it. Unloading a district disposes its geometries, materials and textures when the count drops to zero.
- A dev-only check after unloading compares `renderer.info.memory` before and after; a leak fails the M3 acceptance test.
- `runtime.dispose()` must return memory to the baseline (verified by a browser test that creates and disposes the world 5 times and checks `renderer.info` and listener counts).

## 8. Monitoring and measurement

- Dev stats overlay (`#stats` in the URL): FPS, frame-time graph (median, p95), draw calls, triangles, textures, geometries, current tier, render scale, loaded districts. Not included in production builds.
- Each milestone reports: device, browser, tier, median and p95 frame time over a scripted 2-minute drive, draw calls, triangles, downloaded bytes. These go in the milestone report, measured, never estimated.
- Lighthouse for the 2D page is re-run at M7 to confirm the world hasn't regressed it.

## 9. Things this strategy rules out

- Choosing quality from screen size or user agent.
- A real-time day/night cycle, weather, volumetric effects, screen-space reflections or ambient occlusion at runtime (bake it instead).
- Heightfield terrain and trimesh building colliders.
- Loading the whole world before the visitor can drive.
- Claiming any frame rate or load time that wasn't measured on a named device.
