# FOC Signal Orbit Experience Design

## Purpose

Create an immersive but lightweight project-detail presentation for an ongoing
FOC motor-control project. It must help technical interviewers and peers see
the project's engineering trajectory, while remaining useful as a project log
that can accept new Markdown content over time.

This is an optional project presentation. Existing `standard` project pages
remain unchanged. A project opts in through existing metadata:

```yaml
presentation: immersive
narrative: chronicle
visualPreset: signal
updatedAt: 2026-07-28
currentFocus: Speed ripple reduction and encoder calibration
```

## Experience Principles

- Use actual WebGL depth, camera motion, and spatial anchors. Do not simulate
  the primary effect with layered CSS transforms.
- Keep one lightweight scene local to the detail page. DOM remains the source
  of truth for all readable content and accessible controls.
- Scroll advances a camera through an orbit of project stages; it never
  hijacks native reading or turns the project into a game.
- Past, current, and open work have stable visual meanings: gold, mint, and
  soft violet respectively.
- Evidence is intentional: an image, video, waveform, code excerpt, or link
  expands near its related stage and returns to the reader's original place.
- The scene earns its presence by showing progress and technical focus. It
  does not use particle storms, elaborate post-processing, or decorative 3D
  objects without narrative meaning.

## Scene

The `signal` preset renders one Three.js canvas behind an immersive project
shell. The canvas is `aria-hidden`; it contains only these visual primitives:

1. A low-density star field with a fixed seed.
2. Three elliptical orbital lines.
3. A central control core with a restrained emissive response.
4. Four stage anchors, mapped to narrative blocks.
5. A ribbon-like signal trace whose amplitude or colour reflects the active
   chapter status.

The FOC project's initial anchors are:

| Stage | Narrative meaning | Status | Visual state |
| --- | --- | --- | --- |
| Stepper bring-up | Hardware and first reproducible run | past | Gold anchor |
| Frequency-domain SOP | Methodical learning and repeatable tuning | past | Gold anchor |
| Ripple and encoder calibration | Active investigation | current | Mint anchor and stronger signal trace |
| FOC library, SMC, and sensorless control | Open direction | future | Violet anchor |

Anchors are generated from `narrativeBlocks`. When a project has no blocks, a
single fallback anchor is generated from its title, summary, and Markdown.

## Reading and Interaction Flow

1. A project card expands into the existing pause state. The user chooses to
   enter or return; reduced-motion users navigate directly.
2. The immersive hero introduces the current project focus. The scene fades
   in after readable DOM content is available.
3. Each scroll chapter updates the active anchor and moves the camera along a
   damped curve. The camera travels a small, continuous distance instead of
   jumping between hard-coded views.
4. The active DOM chapter remains the main reading target. Its rail control
   may focus the matching anchor, and keyboard focus never enters the canvas.
5. A media/evidence action opens a DOM modal or focus panel. Closing restores
   focus to its trigger and keeps the chapter's scroll position.
6. Return uses the existing route transition back to the source card.

## Motion and Performance

- Three.js renders only while the immersive detail is mounted and stops when
  the page is hidden or unmounted.
- Renderer pixel ratio is capped at `min(devicePixelRatio, 1.5)`.
- Geometry and materials are reused; no per-frame allocations occur.
- Scroll values are sampled passively and interpolated in the animation loop.
  GSAP/ScrollTrigger may identify the active chapter, but is not used to
  create competing camera timelines.
- Use one canvas only. Multiple canvases are avoided because browser WebGL
  context limits and unshared resources harm reliability.
- The scene is dynamically imported only for immersive routes, protecting the
  normal site and normal project pages from bundle cost.

## Fallbacks and Accessibility

- `prefers-reduced-motion`, WebGL creation failure, and narrow touch screens
  show the same immersive DOM chapters without the canvas or camera motion.
- Semantic headings, rail buttons, evidence buttons, and the modal provide
  the complete content and keyboard operation.
- Colour is supplemental: status labels remain textual.
- Canvas has no pointer or keyboard ownership. Pointer parallax is optional
  and disabled in fallback modes.

## Content Contract

The content workflow remains Markdown-first. The existing semantic blocks
provide the visual stages:

````markdown
```milestone
date: 2026-07-28
title: Speed ripple and encoder calibration
status: current
media: /images/projects/foc/ripple-comparison.png
```
Investigation summary, measurement method, and current conclusion.
```

```question
title: Which calibration error dominates the low-speed ripple?
state: open
```
The next experiment and the evidence needed to answer it.
```
````

`milestone` maps to a stage anchor; `question` and `next` become visibly open
or future elements in the active chapter. The visual system never requires
hand-authored Three.js code in a Markdown file.

## Module Boundaries

- `src/features/projects/experience.ts`: chooses standard or immersive mode.
- `src/features/projects/immersive/view.ts`: produces semantic shell and
  chapter DOM from `ProjectItem` and `narrativeBlocks`.
- `src/features/projects/immersive/scene.ts`: owns Three.js renderer,
  lifecycle, anchors, camera interpolation, and cleanup.
- `src/features/projects/immersive/motion.ts`: connects DOM scroll/rail state
  to a small scene-state interface and manages evidence focus.
- `src/styles/pages/projects.css`: scoped immersive styles and fallbacks.

The scene receives only serialisable stage state; it does not parse Markdown or
own route navigation. The view never imports Three.js.

## Acceptance Criteria

- A `standard` project renders exactly as before.
- A `presentation: immersive`, `visualPreset: signal` project renders a DOM
  chapter shell plus one mounted canvas on supported desktop devices.
- Four FOC narrative stages visibly map to past, current, and future scene
  anchors.
- Scroll changes active chapter, rail state, and scene target without jank or
  abrupt camera jumps.
- Evidence opens and closes without losing reading position or keyboard focus.
- Reduced-motion, WebGL-failure, and narrow-mobile paths remain fully readable
  and usable without a canvas.
- Cleanup disposes renderer, geometries, materials, listeners, and scroll
  triggers when navigation changes.

## Sources Consulted

- [Three.js renderer patterns in React Three Fiber](https://github.com/pmndrs/react-three-fiber)
- [Drei helpers and ScrollControls ecosystem](https://github.com/pmndrs/drei)
- [Theatre.js motion choreography patterns](https://github.com/theatre-js/theatre)

The site does not adopt these libraries for this feature. Their reusable
patterns inform one-canvas ownership, scene/component separation, and
purposeful camera choreography within the existing vanilla Three.js stack.
