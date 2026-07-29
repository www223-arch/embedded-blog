# Motor Scroll Story Design

## Purpose

Replace the procedural motor-lab demo with one continuous product narrative:
an assembled physical motor enters the existing project-detail page, native
scroll separates it into an exploded assembly, the motor axis becomes a project
timeline, and each milestone opens a real test report or technical document.

The experience stays inside the current cosmic project shell. It must not feel
like a separate microsite, a generic CAD viewer, or a document pasted beneath a
3D toy.

## Reference Findings

Lunar achieves its product realism with a long WebP image sequence and video,
not by asking a lightweight real-time model to carry every hero frame. That
distinction matters here: offline rendering can use better geometry, lighting,
materials, antialiasing, and motion blur while the browser only has to choose a
frame for the current scroll position.

The FOC project will use the same principle with a lighter asset budget:

- A web-optimized WebP sequence is the canonical assembled-to-exploded shot.
- A poster frame covers loading, reduced-motion, and narrow-screen states.
- DOM content, timeline semantics, and document routes remain canonical.
- Three.js is optional after the main sequence, not responsible for the hero.

## Visual Asset Policy

The first prototype may use a publicly downloadable reference motor because the
owner's exact CAD and photography are not available yet. The page and source
metadata must call it a reference assembly and retain source attribution. It
must never claim that the reference geometry is the exact tested hardware.

Preferred replacement order when project material becomes available:

1. The owner's STEP/SolidWorks/Fusion/GLB assembly with named parts.
2. A turntable photo or video plus separate CAD render layers.
3. A clearly attributed public reference motor.

The rendering pipeline belongs under `tools/motor-story/`; generated web assets
belong under `public/images/projects/motor-control/story/`. Source CAD files do
not enter the production bundle unless their redistribution terms allow it.

## Continuous Experience

### Stage 1: Assembled Object

The first viewport preserves the existing global navigation, cosmic background,
project title, summary, and return flow. A photoreal motor occupies the visual
center. Copy is restrained. Scroll, not a separate command button, begins the
story.

### Stage 2: Controlled Explosion

The viewport pins for a finite section while native scroll advances the frame
sequence. Front cover, bearing, rotor, stator, housing, encoder, and rear cover
separate along one axis. Camera movement is subtle and continuous. Labels only
appear after parts have enough space; they are DOM overlays and never baked into
the imagery.

### Stage 3: Axis-to-Timeline Handoff

At full explosion, the motor moves toward the left visual field. Its shaft axis
extends into the project trajectory without a cut or route change. The first
milestone appears on that same line. The page then resumes ordinary vertical
scroll with a sticky, quieter exploded motor reference.

### Stage 4: Evidence Nodes

Each milestone is a semantic link when it declares a `document` field. Clicking
it navigates to the existing `doc-detail/<id>` route in the same site. Browser
back returns to the originating project and chapter. Milestones without a
document remain readable timeline entries and never show a dead action.

The Markdown maintenance contract is:

```yaml
date: 2026-07-29
title: 速度波动优化与编码器校准
status: current
document: encoder-calibration-report
media: /images/projects/motor-control/encoder-ripple.webp
```

## Architecture

- `motorStoryState.ts` maps normalized scroll progress to frame, stage, labels,
  and timeline handoff state as pure testable data.
- `motorStorySequence.ts` preloads a small frame window, draws the selected image
  to one responsive canvas, and falls back to the poster on failure.
- `motion.ts` measures the pinned sequence progress and updates both the sequence
  controller and the active project chapter.
- `view.ts` renders the sequence shell, part labels, timeline nodes, and document
  links while continuing to use the shared project chapter model.
- Narrative parsing accepts a safe document id; route construction remains in
  the view layer.
- The old procedural motor scene is removed from the motor preset once the
  sequence path is verified. Existing signal/orbit projects remain unchanged.

## Performance And Accessibility

- Desktop frame target: 72-96 WebP frames, 1280 px long edge, 70-80 quality.
- Initial load fetches poster plus a small leading window; remaining frames load
  in idle time and around the current frame.
- The canvas is decorative and never receives keyboard focus.
- Text, timeline links, status, and document navigation are semantic DOM.
- `prefers-reduced-motion` shows the assembled poster followed directly by the
  timeline; no pinned scroll distance is added.
- Narrow screens use three representative frames instead of the full sequence.
- A failed frame keeps the last successfully drawn frame and never hides text.
- No scroll hijacking, wheel interception, or mandatory drag gesture.

## Acceptance Criteria

- The first object reads as a photographed or high-quality rendered motor, not
  a composition of obvious Three.js primitives.
- One uninterrupted scroll produces assembled motor, exploded motor, and project
  timeline in that order.
- The timeline visually grows from the motor axis rather than appearing as a
  separate document section.
- A milestone with `document` opens the expected local technical document.
- A milestone without `document` has no misleading action.
- The shared project shell, global UI, existing signal preset, route cleanup,
  mobile layout, and reduced-motion reader continue to work.
- Asset source and attribution are documented in the repository.

