# Original world design

Everything here is designed for this project. No part of the layout, terrain, road network, landmarks or props is taken from Bruno Simon's world. Where his world uses a free-form island with scattered themed areas, ours is a planned town: a hub, a ring road and five districts on spokes, read like a site plan.

## 1. Concept: a builder's site model

The whole world sits on a large table-top model board, the kind an architect or planner builds to show a development. The board is ivory card on a kraft base, with an edge you can see from the aerial shot. Buildings are crisp card and wood models. Roads are printed onto the board.

**Construction stage shows project status.** This is the world's main storytelling device, and it keeps every claim honest:

| Status in `src/content` | How it's built in the world |
|---|---|
| Live | Finished building, lights on, a small vermilion "Live" flag |
| Client project | Finished building with a plaque naming it as client work |
| Open source | Finished building with an open forecourt and the door open |
| In development | Partly built: finished ground floors, scaffolding and a working tower crane above |
| Released experiment (shelved) | Finished pavilion with the gate closed and a plain "Paused" sign |
| Concept / Hackathon entry | Drawn on the ground as a plan (ink linework on the board), with a small marker |

When a project's status changes in `projects.ts`, the district's state follows it. The status-to-stage mapping is data, not hand-placed art.

## 2. Board and scale

| | Value |
|---|---|
| Units | 1 unit = 1 metre at "model scale" (the car is about 2.6 m long) |
| Board | 260 × 260 units, rounded corners, raised 1.2 units above the kraft base |
| Playable area | Inside a 240 × 240 boundary; the board edge has a low lip, and there's an invisible wall at 118 units from centre |
| Driving times (target) | Hub to any district entrance in 6–10 s at cruising speed; corner to corner under 40 s |
| Ground | Flat apart from one gentle mound in the Experiment district and a shallow ramp up to the hub plaza |

Keeping the ground almost flat makes the car easy to drive, keeps physics simple (a few large box colliders instead of a heightfield) and suits the model-board concept.

## 3. Layout

```
                                 N
                                 ▲
       ┌─────────────────────────────────────────────────────┐
       │                                                     │
       │   INDUSTRIAL                             CITY        │
       │   THREXA / The Ingredient List           WHAT RA     │
       │   [factory, reel yard,                   SUDEEEP?    │
       │    dispatch bay]                         [dense      │
       │          ╲                                street      │
       │           ╲  north-west spoke     north-east spoke   │
       │            ╲                            ╱  grid,     │
       │             ╲      ┌──────────┐        ╱   flyover]  │
       │              ╲─────│  RING    │───────╱              │
       │                    │  ROAD  ◉ │  ◉ = central landmark│
       │              ╱─────│  HUB     │───────╲              │
       │             ╱      └────┬─────┘        ╲             │
       │            ╱            │ south spoke   ╲            │
       │   EXPERIMENT            │                ENGINEERING │
       │   Fitness Guild +       │                SENTRA      │
       │   experiments      PERSONAL              [campus,    │
       │   [park, track,    About, Capabilities,   pipeline   │
       │    pavilions]      Contact               pavilions]  │
       │                    [workshop, ★ start]               │
       └─────────────────────────────────────────────────────┘
```

| Element | Position (x, z), units from centre | Notes |
|---|---|---|
| Hub plaza and central landmark | (0, 0), plaza radius 22 | Raised 0.6 with a shallow ramp ring |
| Ring road | Radius 32 around the hub, 9 units wide (two lanes) | One-way loop, clockwise |
| Industrial district | Centre (−70, −62), footprint about 70 × 60 | North-west spoke |
| City district | Centre (70, −62), footprint about 70 × 60 | North-east spoke |
| Engineering district | Centre (72, 64), footprint about 64 × 56 | South-east spoke |
| Experiment district | Centre (−72, 64), footprint about 64 × 56 | South-west spoke |
| Personal district | Centre (0, 86), footprint about 60 × 40 | South spoke; the start point |
| Start position | (0, 96) in front of the workshop, facing north (towards the hub) | The car is parked here when the intro begins |

## 4. Roads

- **Ring road** around the hub, with five exits.
- **Five spokes**, each 8 units wide, running from the ring to a district gateway. Each spoke has a slight curve so the district reveals itself as you drive rather than all at once.
- **Outer loop**, 7 units wide, connecting neighbouring districts around the edge of the board, so a visitor can tour all five without going back through the hub.
- **District streets** inside each district, designed to suit it (a service yard in Industrial, a tight grid in City, a campus loop in Engineering, a park path in Experiment, a short lane in Personal).
- Road markings are printed ink lines on the board. Junctions have painted arrows pointing to district names, so the board itself acts as signage.
- The car can leave the road anywhere; the roads guide but don't confine.

## 5. Central landmark

**The tower crane over the unfinished tower.** A tall slender tower crane (about 34 units high) stands in the middle of the hub beside a tower that's still being built. Its jib slowly turns. It's the tallest thing on the board, visible from everywhere, and it states the whole idea of the site: things are being built here.

- Each time a visitor discovers a project for the first time, the crane lifts one floor panel onto the tower (a short animation, at most once per project per visit). After all five districts are visited, the tower is topped out with a small cobalt flag. It's progress you can see, not an achievement list.
- At the crane's base is a large ink-drawn **site map** printed on the plaza: a readable map of the board with the five districts named. Driving over it is the in-world equivalent of the minimap.

## 6. Districts

Each district lists its content source, architecture, discovery points and what opens. Project text always comes from `src/content`; the world doesn't hold its own copy.

### 6.1 Industrial district: THREXA / The Ingredient List

- **Source:** `projects.ts` → `threxa`. Status: In development ("All modules exist as a working prototype. Finishing it for real use." No plant runs it yet).
- **Architecture:** a factory with a sawtooth roof (the classic north-light industrial roof), a long corrugation line visible through an open side, a reel yard with stacked paper reels, and a dispatch bay with two loading docks. The office wing at the front carries a small "The Ingredient List" plaque; "THREXA" is lettered on the factory. Because THREXA is in development, the far end of the factory has scaffolding and the crane hook above it.
- **Story you can read while driving:** reels → corrugation line → printing → pasting → dispatch dock, laid out as a path you drive along. It follows the order path in the case study.
- **Discovery points:**
  1. **Factory office** (main): opens the THREXA case study.
  2. **Corrugation line:** opens the case study at the "Modules" section.
  3. **Dispatch dock:** opens the case study at "Where it stands".
- **Local details:** stacked reels can be knocked over and roll; a forklift is parked by the dock (static).

### 6.2 City district: WHAT RA SUDEEEP?

- **Source:** `projects.ts` → `what-ra-sudeeep`. Status: In development, no public build yet.
- **Architecture:** a small, dense neighbourhood inspired by Bengaluru streets rather than copying real places: narrow mixed-use buildings of different heights, balconies, shop shutters (no real brands, all signage invented and plain), overhead cable lines, a short concrete flyover crossing the district, a bus shelter, a tree-lined main road and a market corner. It's in development, so half the blocks are still grey card massing with scaffolding.
- **Discovery points:**
  1. **Flyover ramp** (main): opens the WHAT RA SUDEEEP? case study.
  2. **Market corner:** opens it at "Systems".
- **Note:** the district is a model of the game's setting, not footage of the game. Nothing in it is presented as gameplay. Real gameplay media replaces the illustration on the case study when it exists.

### 6.3 Engineering district: Sentra

- **Source:** `projects.ts` → `sentra`. Status: Open source.
- **Architecture:** a calm campus around a courtyard. Four connected pavilions stand for the four agents, in order: **Extract → Reason → Act → Memory**, linked by a glass walkway with a cobalt line running through it (the pipeline). A small server hall sits behind with rack lights pulsing slowly. The "Act" pavilion has a gate barrier at its door, standing for the approval step before high-risk actions.
- **Discovery points:**
  1. **Campus entrance** (main): opens the Sentra case study.
  2. **Walkway:** opens it at "How it's built".
- **Link out:** the main point's panel shows "Source on GitHub" from the project's links.

### 6.4 Experiment district: Fitness Guild and verified experiments

- **Sources:** `projects.ts` → `fitness-guild` (Released experiment, shelved Nov 2026) and every item in `experiments.ts`.
- **Architecture:** a park on the board's one gentle mound. A small running track with a pavilion for Fitness Guild, its gate closed with a "Paused" sign. Around a winding path, one small pavilion or plan drawing per experiment, built to its status:

| Experiment (`experiments.ts`) | Status | Built as |
|---|---|---|
| Core Blocks | Live | Finished pavilion with a Live flag |
| Gridlock Arrows | Live | Finished pavilion with a Live flag |
| Box costing calculator | Live | Finished pavilion with a Live flag |
| Bengaluru: Traffic Life | In development | Pavilion with scaffolding |
| Lead pipeline for a design studio | In development | Pavilion with scaffolding |
| Gridshot | In development | Pavilion with scaffolding |
| QuantaGrid | Hackathon entry | Plan drawing on the ground |

- **Discovery points:**
  1. **Track pavilion** (main): opens the Fitness Guild case study.
  2. **One point per experiment:** opens a small panel with the experiment's name, kind, year, description, status and link, using the same data as the 2D Experiments list. Experiments don't have case-study routes today, so their panel links to `/#experiments` in 2D.
- **Adding an experiment** to `experiments.ts` makes it appear here as a generic pavilion or plan in the next free slot. The layout reserves four free slots.

### 6.5 Personal district: About, capabilities and contact

- **Sources:** `profile.ts` (about, approach, exploring, background), `capabilities.ts`, contact details in `profile.ts`.
- **Architecture:** the start point. A small workshop with a roller door, a workbench visible inside, and a drafting table: the builder's own place. A drawing board outside lists capabilities. A post box stands at the lane end. If decision D4 is approved, a narrow design-studio storefront with a plaque reading "Client work: Papillon Interiors" sits beside the workshop.
- **Discovery points:**
  1. **Workshop** (main): opens the About panel (introduction, how I work, working on now, background).
  2. **Drawing board:** opens Capabilities.
  3. **Post box:** opens Contact: email with copy button, GitHub, and LinkedIn when it's filled in. Exactly the contact details in `profile.ts`; no form.
  4. **Studio storefront** (if D4): opens the Papillon Interiors case study.

## 7. Discovery points (shared behaviour)

- Each point is a marker placed in Blender (`ref_point_<id>`) whose ID is listed in `src/world/content/placements.ts` with its project slug or section. The content test fails if an ID has no target or a project has no main point.
- **Proximity:** shown when the car is within 7 units and roughly facing the point. A ring is drawn on the ground in cobalt, and the prompt reads "Press E / Enter" on keyboard, "A" or cross on gamepad, or shows a large button on touch.
- **Opening:** the car brakes gently to a stop, the camera blends to a framed view of the building (about 1 s; instant with reduced motion), and the React panel opens with the case study. The URL changes to `/work/<slug>`.
- **Closing:** Escape, the close button, the browser's back button, or driving away (any throttle input closes it). The camera blends back behind the car.
- **Interaction never needs skill:** a point can also be opened from the minimap or the menu's project list, which drives the camera there automatically (a short cinematic, skippable) or, if the visitor prefers, simply opens the panel.

## 8. Navigation aids

- **Minimap** (React, bottom-left on desktop, collapsible on mobile): the board outline, roads, five districts, the car's position and heading, and discovered points ticked off. Tapping a district shows its projects.
- **Menu** (React): Projects list, About, Contact, Controls, Quality, Camera mode, Sound, "View as page".
- **Respawn:** "Back to start" in the menu, and automatic recovery if the car is upside down for 3 s or stuck for 4 s (see vehicle spec).
- **Boundaries:** the board's raised lip stops the car physically; beyond it the camera never shows the void, because the kraft base and table extend out of frame.

## 9. Camera behaviour by area

| Area | Behaviour |
|---|---|
| Roads and open ground | Standard chase camera (vehicle spec §3) |
| Inside City (tight streets) | Distance shortened by up to 25% and height raised slightly, so buildings don't block the view; collision avoidance active |
| Hub plaza | Distance lengthened slightly to show the crane |
| Discovery open | Fixed framing pose per point, authored as a marker (`ref_cam_<id>`) |
| Isometric mode (optional) | Fixed 45° azimuth, high angle, orthographic-feel narrow lens. Works everywhere. Districts render the same |

## 10. Light, atmosphere and time

- **Default light:** low late-afternoon sun from the south-west, warm key light, cool soft fill, long soft shadows on the ivory board.
- **Tilt-shift depth of field** on Medium and High tiers to sell the miniature scale; off on Low.
- **No day-night cycle, weather or seasons** at launch. They're expensive, they're a signature of the reference site, and they add nothing to the portfolio. One optional "evening" lighting state (lamps and windows on, car headlights on) is a possible M5 addition.
- **Ambient life,** kept small: the crane jib turning, rack lights in Engineering, a flag moving, a few birds crossing the aerial intro shot.

## 11. Environmental storytelling checklist

Each district must answer three questions without opening a panel:

1. **What is this?** The building type says it (factory, city street, campus, park, workshop).
2. **How far along is it?** The construction stage says it (§1).
3. **What's special about it?** One readable detail: the order path through the factory, the flyover in the city, the four-pavilion pipeline, the closed Fitness Guild gate, the workbench.
