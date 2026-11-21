# Creative brief: THE BUILDER'S WORLD

## The idea in one line

A small, carefully made world you can drive around, where each part of the world is something Sachin has built, shown at its real stage of completion.

## Who it's for

People deciding whether to work with Sachin: founders, clients, hiring managers, collaborators. They arrive from a link, often on a phone, and give it a minute or two. The world has to be enjoyable in the first ten seconds and informative within the first minute.

**The rule from the planning conversation:** the world is the attraction; the work is the reason people stay. Someone should remember driving around, and leave knowing what Sachin has built and what he can do.

## Approved decisions (non-negotiable)

These were approved by the project owner and are fixed requirements.

| Area | Decision |
|---|---|
| Project | THE BUILDER'S WORLD, personal portfolio of Sachin Kalaiselvan |
| Vehicle | An original miniature electric car: compact miniature proportions, distinctive original silhouette, four independently animated wheels, proper wheel steering, visible suspension, separate body, glass, tyres, wheels and interior, working headlights and brake lights, appropriate collision shape, original model not copied from Bruno Simon |
| Camera | Dynamic third-person vehicle camera: smooth follow, adjustable distance and height, smooth horizontal rotation, controlled zoom, speed-sensitive behaviour where appropriate, collision avoidance, smooth transitions into discovery moments, optional fixed isometric mode |
| Entry | Cinematic introduction before driving: aerial shot of the world → reveal "Sachin Kalaiselvan" → introduce the car → camera moves behind it → keyboard or touch instructions → hand control over. Must have Skip, never block access to the portfolio, respect reduced motion, avoid long loading delays, work on mobile and desktop, never autoplay audio before user interaction, handle missing assets gracefully |
| Mobile | Two equally supported modes. **Simplified 3D:** same world identity and project destinations, touch driving, reduced rendering, appropriate asset quality, adaptive resolution, fewer shadows and effects where needed. **Conventional 2D:** direct project navigation, the same project content and case studies, About, Capabilities, Experiments, Contact, responsive editorial design. Visitors can switch between 3D and 2D. Devices aren't classed as low-end from screen size; use capability checks and measured performance, and offer a manual quality selector |
| World | Five connected districts: Industrial (THREXA / The Ingredient List), City (WHAT RA SUDEEEP?), Engineering (Sentra), Experiment (Fitness Guild and other verified experiments), Personal (About, capabilities, contact). Original layouts, architecture, roads, landmarks and environmental storytelling. Nothing from Bruno Simon's map, terrain, roads, models or props |
| Architecture | 3D and 2D share project content, identifiers, case-study routes, destinations, media references and status. A project is never entered twice. The 3D world can be started and disposed on its own. React runs the interface, Three.js runs the world, through a clear interface. The intro is its own system. Vehicle physics is independent of the camera; the camera never moves the physics body |

## Tone

- **Crafted, calm, confident.** It should feel like a well-made architectural model on a desk in late-afternoon light, not like an arcade game.
- **Honest.** Each project is built to the stage it has actually reached. Live work is finished architecture. Work in development has scaffolding and a crane. Concepts are drawn on the ground as plans. A shelved project shows a closed gate with a plain sign. The world never implies traction, customers or completion that don't exist.
- **Playful in small ways.** Things react when you drive into them, the car has a horn, lights come on at dusk. No jokes at the expense of the work.
- **Personal, not branded.** It's Sachin's world. Product names appear where they're real (THREXA, Sentra). Invented brands and logos aren't used.

## What it must not feel like

- A copy of Bruno Simon's portfolio. Different camera, intro, touch controls, art direction, typography, world concept and content.
- A tech demo that hides the portfolio. The 2D page is one click away from the first frame.
- A game that demands skill. Nobody should need to be good at driving to see a project.
- A gallery of generic city assets. Every district has to say something about its project.

## Visual identity

Shared with the existing 2D site so the two modes feel like one identity:

| | Value |
|---|---|
| Base | Ivory `#f3f0e8` (paper, card, ground) |
| Ink | Near-black `#131312` (type, road lines, linework) |
| Accent | Cobalt `#2440d6` (the car, interaction prompts, the active route) |
| Signal | Vermilion `#e2532c`, used only for "Live" markers |
| Type | Geist for interface, Instrument Serif italic for district names and the intro title, Geist Mono for labels and status |
| Light | Low warm sun, long soft shadows, tilt-shift depth of field on capable devices |

The recommended art direction (an architect's study model) and its alternatives are in `ASSET_PRODUCTION_PLAN.md` §1; that choice is decision D2.

## Success looks like

- A visitor reaches their first project in under 60 seconds without instructions beyond the intro's.
- A visitor on an average phone either drives smoothly or ends up in the 2D page without friction or confusion.
- Nothing on screen is a placeholder presented as finished art.
- Every claim inside the world matches `src/content` and the case studies.
