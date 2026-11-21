# Asset production plan

Code can render a world, but it can't turn weak assets into a good one. This plan decides how the world looks, who makes each piece, in what order, and to what budget.

**Hard rules**
- No primitive placeholder geometry is presented as final art. Primitives are allowed during prototyping only if they're **labelled on screen as temporary** (a small "prototype" tag in the corner of the canvas in dev builds) and replaced before the milestone that owns them is approved.
- Nothing from Bruno Simon's repository: no models, textures, sounds, fonts, palette, Blender files or likeness.
- Every sourced asset has a recorded licence and source in `assets-src/LICENCES.md` before it's committed.

## 1. Art direction (decision D2)

### Recommended: architect's study model

The world looks like a high-quality architectural presentation model on a desk in late-afternoon light.

| | |
|---|---|
| Buildings | Crisp ivory card and pale timber, clean edges, small chamfers, visible floor lines and window cut-outs. Materials are mostly flat colour with baked ambient occlusion |
| Ground | Ivory board printed with ink roads and labels; kraft-brown base and board edge visible in wide shots |
| Accents | Cobalt for the car, the active route and interaction rings; one material colour per project (kraft and steel for THREXA, warm plaster for the City, glass and steel for Sentra, green for the park) |
| Life | Small scale figures in plain grey (architect-model style), lichen-style trees, real "construction" elements (scaffold, crane) |
| Light | Low warm sun, soft long shadows (baked), tilt-shift on capable tiers |
| Type in world | Ink-printed labels on the board in Geist Mono and Instrument Serif, matching the 2D site |

Why this direction:
- **Original.** It shares nothing with the reference's saturated toy look, palette texture or orange-teal terrain.
- **Matches the 2D site,** so 3D and 2D feel like one identity.
- **Producible by one person.** Clean card architecture rewards accuracy rather than texture painting. Simple, well-proportioned geometry looks intentional in this style, while the same geometry looks unfinished in a realistic style.
- **Light.** Flat materials and baked lighting compress well and render cheaply on phones.
- **Supports the story.** "A builder's site model" with scaffolding and cranes for projects in development is natural in this style.

### Alternatives considered

| Direction | What it looks like | Cost and risk |
|---|---|---|
| Realistic miniature (the ChatGPT reference photos: tilt-shift photography of detailed scale models) | Weathered textures, detailed facades, realistic cars | Needs a skilled 3D artist and texture work for every building; files several times heavier; mobile performance at risk; the most likely to look unfinished if under-resourced |
| Stylised low-poly | Bright flat-shaded shapes | Cheap and fast, but close to the reference site's genre and to many template worlds; weaker identity |

## 2. Production approach (decision D3)

Recommended split:

| Asset | Who | Why |
|---|---|---|
| Hero car (A1) | **Commissioned** from a hard-surface 3D modeller, from our spec and sketches | It's the signature object, seen up close constantly; it has to be excellent |
| Central crane and tower (A4) | **Commissioned** with the car, or modelled by Sachin from engineering drawings | Seen from everywhere |
| Board, roads, district blockouts | **Sachin in Blender** | Mostly flat geometry and layout work |
| District buildings | **Sachin in Blender**, white-model style, one district at a time | Producible in this art direction |
| Small props (scaffold kit, trees, figures, street furniture, reels, pallets) | **CC0 kits customised** (Kenney, Poly Haven, Quaternius), recoloured to our palette; anything that looks generic gets remodelled | Saves weeks; CC0 means no attribution or licence risk |
| Audio | CC0 libraries or self-recorded (decision D6) | — |

If Blender time isn't available, the fallback is commissioning district art too, which changes the budget, not the plan.

## 3. Asset inventory

Priority follows the approved order: hero vehicle, terrain, road network, central landmark, district buildings, foliage, environmental props, UI and map assets.

**Columns:** source = custom (made for us) or sourced (CC0 kit, customised). Budgets are per asset, compressed, High tier; Low tier variants listed where needed.

### A1. Hero car (priority 1)

| | |
|---|---|
| Purpose | The player's vehicle; signature object |
| Source | Custom (commissioned) |
| Geometry | Per `VEHICLE_AND_CAMERA_SPECIFICATION.md` §1: separate body, glass, interior, 4 tyres, 4 rims, front and rear light meshes. High ≤ 25k triangles; Low LOD ≤ 8k |
| Materials | ≤ 6: paint (cobalt, ivory roof), glass, rubber, rim metal, interior, light emissive |
| Textures | Vertex colours or one 1024² atlas (512² for Low); optional small normal map for tyre tread |
| Animation | None baked; wheels, steering, suspension and lights driven in code. Pivots at hub centres |
| Collision | Not from the mesh; two boxes defined in code |
| Format | GLB → meshopt + KTX2 |
| Optimisation | ≤ 400 KB (High), ≤ 150 KB (Low) |
| Licence | Work-for-hire contract assigning full rights to Sachin / The Ingredient List; source `.blend` delivered |

### A2. Board and terrain (priority 2)

| | |
|---|---|
| Purpose | The model board, its edge, the kraft base, the table beyond |
| Source | Custom (Sachin) |
| Geometry | Board slab with rounded corners and chamfered edge; one gentle mound (Experiment district); hub ramp. ≤ 20k triangles |
| Materials | Board (ivory paper), base (kraft), table (dark timber, out of focus) |
| Textures | Board baked lighting and printed markings in tiles: 4 × 2048² (High), 1024² (Low), KTX2 ETC1S |
| Collision | Box colliders: board top, lip around the edge, mound as a few convex hulls |
| Optimisation | ≤ 600 KB for all tiles at High |

### A3. Road network (priority 3)

| | |
|---|---|
| Purpose | Ring road, spokes, outer loop, district streets, markings, junction arrows, district names |
| Source | Custom |
| Geometry | Printed onto the board texture rather than separate meshes, plus raised kerbs in the City district only |
| Collision | Kerbs as boxes; roads need none (same height as the board) |
| Notes | Road layout is authored as curves in Blender and also exported as a small JSON path file for the minimap and the auto-drive camera |

### A4. Central landmark: tower crane and unfinished tower (priority 4)

| | |
|---|---|
| Purpose | Visible from everywhere; marks progress as projects are discovered |
| Source | Custom (commissioned with the car, or Sachin from reference drawings) |
| Geometry | Lattice crane (mast, jib, counter-jib, trolley, hook, cab): ≤ 15k triangles using alpha-tested lattice cards on Low. Tower: 12 floor slabs as separate nodes for the "lift a floor" animation |
| Animation | Jib rotation and hook movement in code |
| Collision | Mast and tower base as boxes; the jib has none (it's above the car) |
| Optimisation | ≤ 350 KB |

### A5. District buildings (priority 5)

One GLB per district, plus a shared kit. Built in the white-model style.

| District | Key models | Triangle budget (High) | File budget |
|---|---|---|---|
| Industrial (THREXA) | Factory with sawtooth roof, corrugation line, office wing, reel yard, dispatch bay with docks, scaffold section | ≤ 120k | ≤ 600 KB |
| City (WHAT RA SUDEEEP?) | 10–14 narrow mixed-use buildings (from a modular kit), flyover, bus shelter, market stalls, overhead cables (as lines) | ≤ 140k | ≤ 600 KB |
| Engineering (Sentra) | Four pavilions (Extract, Reason, Act, Memory), glass walkway, server hall with rack lights, approval gate | ≤ 90k | ≤ 500 KB |
| Experiment | Track, Fitness Guild pavilion with closed gate, 7 experiment pavilions or plan drawings, 4 empty slots | ≤ 90k | ≤ 500 KB |
| Personal | Workshop with roller door and visible workbench, drafting table, drawing board, post box, optional Papillon storefront | ≤ 60k | ≤ 400 KB |
| Shared kit | Scaffold modules, Live flag, Paused sign, plaques, plan-drawing decal, window and door modules | ≤ 20k | ≤ 200 KB |

For each district model:
- **Purpose:** the district's architecture and storytelling per `ORIGINAL_WORLD_DESIGN.md` §6.
- **Source:** custom (Sachin in Blender), with shared-kit and CC0 props where noted.
- **Materials:** from one shared library (card ivory, timber, kraft, steel, glass, plaster, foliage, ink, cobalt, vermilion, emissive window light). At most 8 per district.
- **Textures:** one baked-lighting atlas per district: 2048² High, 1024² Medium, 512² Low, KTX2 ETC1S.
- **Animation:** none baked. Code drives the few moving parts (Engineering rack lights, the Industrial line's rollers, flags).
- **Format:** GLB → meshopt + KTX2, one file per district plus a Low variant.
- **Licence:** custom work owned by Sachin / The Ingredient List; any CC0 piece recorded in `assets-src/LICENCES.md`.
- **Low LOD:** large buildings get a simplified LOD (about 30% of triangles).
- **Collision:** authored as separate simple boxes and hulls named `col_*`, exported in the same GLB and hidden at load.
- **Markers:** discovery points `ref_point_<id>`, camera framings `ref_cam_<id>`, district bounds `ref_bounds`, spawn points `ref_spawn_<name>`.
- **Status variants:** buildings for projects in development have `stage_build` (scaffold, crane hook) and `stage_done` children; code shows the one matching the project's status.

### A6. Foliage (priority 6)

| | |
|---|---|
| Purpose | Street trees, park trees, hedges, in architect-model style (lichen-like rounded canopies) |
| Source | Sourced CC0 or custom; 3–4 tree models, 2 hedge pieces |
| Geometry | ≤ 1.5k triangles per tree; instanced |
| Placement | Positions from marker objects in each district file (`ref_tree_*`), instanced at load |

### A7. Environmental props (priority 7)

Reels, pallets, forklift (static), benches, street lights, bins, bus stop sign, scale figures (grey), small cars parked (generic, unbranded, white-model style), post box. Sourced CC0 kits recoloured, or custom. Instanced. ≤ 3k triangles each. Loose props that can be knocked over get a simple box or cylinder collider and sleep until hit.

### A8. UI and map assets (priority 8)

| Asset | Format |
|---|---|
| Minimap | SVG generated at build time from the road JSON and district bounds (not a bitmap) |
| Control icons (touch and keyboard hints) | Inline SVG in React, drawn to match the site's line style |
| Discovery ring | Generated in code (a ring shader), no texture |
| Status markers (Live flag, Paused sign) | Part of the shared kit (A5) |
| Social preview image for the world | Rendered from the finished world at M7 |

### A9. Audio (milestone 5)

| Sound | Source |
|---|---|
| Electric motor hum (pitch from speed) | CC0 or recorded and processed |
| Tyre roll on card and board | CC0 or recorded |
| Light bumps (card, timber) | Recorded (tapping card models gives the right sound) |
| Horn (a short friendly beep) | Designed |
| Ambience (soft room tone, distant birds) | CC0 |
| UI ticks | Designed |

Budget: ≤ 1.5 MB total, compressed (Opus in WebM with AAC fallback for Safari).

## 4. Blender workflow

1. **Units and scale:** metric, 1 Blender unit = 1 world unit; car 2.6 long. Apply all transforms before export.
2. **Origins and pivots:** each model's origin at its base centre on the ground; wheels at hub centres; crane jib at the mast top.
3. **Naming:** lower-case with underscores. Prefixes: `col_` collision, `ref_` marker, `lod1_` low detail, `stage_` status variant. The asset test checks names against a manifest.
4. **One file per district** in `assets-src/` (or an external folder if `.blend` files are too large for Git, using Git LFS), plus `car.blend`, `hub.blend`, `kit.blend`.
5. **Baking:** lighting and ambient occlusion baked per district into atlases at 2048² (High) and 1024²/512² (Low). The sun direction in Blender matches the runtime sun.
6. **Export:** glTF Binary (`.glb`), selected collections only, Y up, no cameras or lights, custom properties on, compression **off** (compression is a separate step that keeps the originals).
7. **Compress** with a project script (`npm run assets`) using `@gltf-transform/cli`: meshopt geometry, KTX2 textures (ETC1S for colour and baked lighting), resize Low variants, then write to `public/world/<district>/`.
8. **Validate** with `npm run assets:check`: naming contract, triangle and file budgets, required markers present, licences recorded.

## 5. Procedural geometry

Procedural generation is used where it's appropriate, and never for hero objects:

| Use | Why procedural |
|---|---|
| Scaffold runs on in-development buildings | Repetitive modular pieces; length and height follow the building |
| Road markings and minimap | Generated from the same road curves, so they never disagree |
| Tree, prop and street-light placement | From markers, instanced |
| Plan-drawing decals for concepts | Generated linework from the building footprint |
| Discovery rings, progress line, interaction prompts | Shaders, no textures |

Not procedural: the car, the crane, the board, and every district's main buildings.

## 6. Production order and gates

| Step | Asset | Gate |
|---|---|---|
| 1 | Car blockout with real proportions, wheels and pivots (labelled temporary) | Lets M2 physics and camera start |
| 2 | Car final (commissioned) | Approved in M2 art review |
| 3 | Board, roads, hub blockout | Lets M3 start |
| 4 | Personal district final | First finished district; the quality bar for the rest |
| 5 | Crane and tower final | — |
| 6 | Industrial, Engineering, City, Experiment, in that order | Each approved before the next starts |
| 7 | Foliage and props pass across all districts | — |
| 8 | Audio | M5 |

**Art review at each gate,** answering: Is it original? Does it match the art direction? Is it within budget? Is anything a placeholder presented as finished? Does it look good from the chase camera, the isometric camera and the intro shot?
