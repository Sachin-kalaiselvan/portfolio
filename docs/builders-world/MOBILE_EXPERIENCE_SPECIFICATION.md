# Mobile experience specification

Phones are treated as a first-class target. Two modes are equally supported, and a visitor can move between them at any time without losing their place.

## 1. Mode selection on arrival

1. **No WebGL 2 and no WebGPU:** the world is never loaded; the 2D page shows as normal.
2. **Stored preference:** if the visitor chose 2D or 3D before, honour it.
3. **Otherwise,** start the 3D intro on the **Low** tier, measure frame times during the aerial shot (see `PERFORMANCE_STRATEGY.md` §3), and move up a tier only if the measurement allows it.
4. If even Low can't hold 24 fps through the measurement window, end the intro and show a one-line choice: "This device is struggling with 3D. Continue with the page version?" with "Page version" (default) and "Keep 3D anyway".

**Not used to decide the mode or tier:** screen size, user-agent strings, "is it a phone". The only inputs are what the browser can do and how fast it actually renders.

## 2. Simplified 3D mode (approved requirements)

| Requirement | Implementation |
|---|---|
| Same world identity | Same board, art direction, five districts and crane as on desktop |
| Same important project destinations | Every main discovery point exists on every tier; Low removes props and detail, never destinations |
| Touch driving controls | See §3 |
| Reduced rendering complexity | Low and Medium tiers (`PERFORMANCE_STRATEGY.md` §2): fewer instanced props, shorter draw distance, simpler materials |
| Appropriate asset quality | Low-LOD car and buildings, 512² texture variants, KTX2 everywhere |
| Adaptive resolution | Render scale between 0.6 and 1.0 of device pixels (pixel ratio capped at 1.5 on Low and Medium), adjusted by the quality governor |
| Reduced shadows and post-processing when necessary | Low: a single blob shadow under the car and baked shadows in the board texture, no real-time shadow map, no depth of field, no bloom. Medium: one small shadow map that follows the car, no depth of field |

## 3. Touch controls

Separate, clearly labelled on-screen controls (not a world-space drag gesture), built in React over the canvas:

```
 ┌──────────────────────────────────────────────┐
 │ [≡ Menu]                      [Page view] [🔊] │
 │                                              │
 │                  (world)                     │
 │                                              │
 │  ◀ ━━━━━━ ▶                          [ ▲ ]   │
 │  steering slider                     accel   │
 │  (or tilt, optional)                 [ ▼ ]   │
 │                                      brake/  │
 │  [map]                               reverse │
 └──────────────────────────────────────────────┘
        [ Open: THREXA ▸ ]  ← appears near a point
```

| Control | Behaviour |
|---|---|
| **Steering** (left thumb) | A horizontal slider zone at bottom-left, 160–200 px wide. Thumb position = steer (−1…1), springs back to centre on release. Analog, so small corrections are possible |
| **Accelerate** (right thumb) | Large button, at least 64 × 64 px. Hold = throttle. Sliding the thumb up on it from the press point gives partial throttle |
| **Brake / reverse** (right thumb) | Large button under accelerate. Brakes while moving forward; once stopped, holding it reverses |
| **Interaction** | When near a discovery point, a large labelled button appears bottom-centre: "Open: THREXA". Tapping it opens the panel |
| **Camera** | Two-finger drag orbits; pinch zooms. One-finger touches on the canvas outside the controls do nothing (no accidental steering) |
| **Map** | Opens the minimap full-screen; tapping a district or project shows it and offers "Take me there" (auto-drive camera) or "Open" |
| **Menu** | Projects, About, Contact, Quality, Camera mode, Sound, Replay intro, Page view |
| **Page view** | Always visible top-right; switches to 2D |
| **Sound** | Off by default; toggling it on is itself the user gesture that creates the audio context |

Rules:
- All touch targets are at least 48 × 48 px (most are larger); controls sit inside the safe-area insets.
- Left-handed layout (mirrored) is an option in the menu.
- Optional tilt steering is a menu option, off by default, and asks for motion permission only when chosen.
- Controls never hide the car; the camera's look-at point is offset upward on portrait screens to clear them.
- `touch-action: none` applies only to the canvas and controls, so the rest of the page and panels scroll normally. Panels are ordinary scrollable HTML.
- Controls fade to 40% opacity after 4 s without a touch and return on touch; they never disappear completely.

## 4. Switching between 3D and 2D

| From | Action | Result |
|---|---|---|
| 3D, driving | "Page view" | Fade to ivory (0.3 s), world paused then disposed, 2D page shown at the top. If a project panel was open, the 2D case study for that project is shown instead |
| 3D, panel open | "Page view" in the panel | Same project's 2D case study at the same section |
| 2D page | "Enter the world" (header, and on case studies "View in the world") | Boot module loads the world; a returning visitor skips the full intro; from a case study, the camera starts at that project's district with its panel open |
| 2D | Nothing | The visitor's choice of 2D is remembered and the world isn't loaded again until they ask |

- Switching never reloads the page and never loses scroll or route context.
- The world is fully disposed when leaving 3D (`PORTFOLIO_IMPLEMENTATION_PLAN.md` §2.6), so the 2D page doesn't pay its memory or battery cost.
- Both modes link to the same `/work/<slug>` routes and read the same content.

## 5. Conventional 2D portfolio mode (approved requirements)

The existing site already provides this. It must keep:

| Requirement | Where it is today |
|---|---|
| Direct project navigation | Home page work index, `/work/:slug` |
| Same project content and case studies | `src/content/projects.ts`, `src/pages/CaseStudy.tsx` |
| About | Home `#about` |
| Capabilities | Home `#capabilities` |
| Experiments | Home `#experiments` |
| Contact | Home `#contact` |
| Responsive editorial design | Current CSS, already checked at 1440 and 390 widths |

Changes it needs for the world (in M4 and M6): an "Enter the world" control in the header, "View in the world" on case studies, and remembering the visitor's mode.

## 6. Mobile-specific technical rules

- **Frame rate:** target 60 fps where the tier allows it; Low caps at 30 fps by default to limit heat and battery use. The cap is shown and changeable in Quality.
- **Thermal behaviour:** the quality governor watches for sustained frame-time growth over minutes (a sign of thermal throttling), not just spikes, and steps down a tier rather than letting the phone get hot.
- **Battery:** rendering stops when the tab is hidden, when a full-screen panel covers the canvas, and after 20 s with the car stopped and no input (resumes on the next touch).
- **Memory:** districts outside the streaming radius are unloaded (GPU memory released), not just hidden. Low keeps at most the current district plus its neighbours and the hub.
- **Audio on iOS:** the audio context is created only from a touch handler; it's suspended when the tab is hidden and resumed on return.
- **Orientation:** portrait and landscape both supported; on rotate, the camera framing and controls relayout without restarting.
- **Address bar and safe areas:** the canvas uses dynamic viewport units and respects `env(safe-area-inset-*)`.

## 7. Device test matrix

Testing must happen on real hardware before M6 is accepted. Sachin has an iPhone and no Android phone, so Android coverage needs a borrowed device or a remote device service.

| Class | Example devices | Expected tier |
|---|---|---|
| Current iPhone | iPhone 15 / 16 | Medium or High |
| Older iPhone | iPhone 11 / 12 / SE (2nd or 3rd gen) | Low or Medium |
| Mid-range Android | Samsung A-series, Redmi Note | Low or Medium |
| Low-end Android | 3–4 GB RAM devices | Low, or the 2D suggestion |
| Tablet | iPad (9th gen or newer) | Medium |
| Desktop | Integrated graphics laptop; discrete GPU desktop | Medium; High |

Tiers in this table are expectations to check, not assumptions the code makes.

## 8. Acceptance tests (Milestone 6)

| Test | Pass when |
|---|---|
| No screen-size branching | Code search finds no tier or mode decision based on screen dimensions or user agent |
| Touch driving | On each matrix phone, a first-time user reaches the hub and opens one project with the touch controls in under 90 s |
| Targets | Every touch control ≥ 48 × 48 px and inside safe areas at 360 × 640 and 430 × 932 |
| Switch | 3D → 2D → 3D keeps the same project in view and leaves no orphaned canvas or audio |
| Low tier holds | On the lowest matrix phone, Low averages ≥ 30 fps with 95th-percentile frame time under 45 ms over a 2-minute drive, or the 2D suggestion appears |
| Thermal | 10-minute drive on a mid-range phone: no crash, no stutter spiral; tier steps down if needed |
| Reduced motion | Intro is the still version; camera blends are fades |
