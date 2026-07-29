# Motor Scroll Story Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the detached procedural motor demo with a continuous assembled-to-exploded scroll sequence that hands off into a document-linked project timeline.

**Architecture:** Generate a web-optimized reference-motor frame sequence offline, then drive one decorative canvas from native scroll through a pure state mapper. Keep milestones, copy, status, and document routes in semantic DOM derived from Markdown.

**Tech Stack:** TypeScript, Vite 8, Canvas 2D, WebP frame sequence, existing Markdown/YAML content core, Node test runner, optional Blender offline rendering.

## Global Constraints

- Preserve the existing project-detail shell and all non-`motor-lab` project presets.
- Do not claim a public reference model is the owner's exact tested motor.
- Keep source attribution and licensing notes beside the asset-generation tool.
- Do not intercept wheel input or implement custom smooth scrolling.
- DOM owns all text, timeline state, and document links.
- Reduced-motion and narrow-screen paths remain complete without the full sequence.
- Use TDD for state, parsing, and markup contracts; visually verify desktop and mobile.

---

### Task 1: Asset Pipeline And Provenance

**Files:**
- Create: `tools/motor-story/README.md`
- Create: `tools/motor-story/render_motor_story.py`
- Create: `public/images/projects/motor-control/story/asset.json`
- Create: `public/images/projects/motor-control/story/poster.webp`
- Create: `public/images/projects/motor-control/story/frame-*.webp`

**Interfaces:**
- Produces: numbered frames `frame-000.webp` through `frame-NNN.webp`.
- Produces: asset manifest fields `frameCount`, `framePattern`, `poster`, `source`, `attribution`, and `referenceOnly`.

- [ ] Record the selected public motor source, author/vendor, source URL, usage terms, and `referenceOnly: true` in the manifest and README.
- [ ] Add a deterministic Blender script that builds/imports named motor parts, assigns PBR materials, animates the axial explosion, and renders transparent WebP frames.
- [ ] Render the poster and complete frame sequence with a portable Blender executable outside the repository.
- [ ] Check frame dimensions, numbering, total byte size, and representative assembled/mid-explosion/full-explosion images.
- [ ] Commit `Add motor story asset pipeline`.

### Task 2: Document-Linked Narrative Contract

**Files:**
- Modify: `src/content-core/narrative.ts`
- Modify: `src/content/schema.ts`
- Modify: `src/features/projects/immersive/types.ts`
- Modify: `src/features/projects/immersive/view.ts`
- Modify: `docs-vitepress/projects/motor-control.md`
- Test: `tests/content-core.test.ts`
- Test: `tests/project-experience.test.ts`

**Interfaces:**
- Produces: optional `document: string` on milestone narrative blocks and project chapters.
- Produces: `getProjectDocumentRoute(documentId: string): string` returning `#doc-detail/<encoded-id>`.

- [ ] Add a failing parser test that accepts `document: encoder-calibration-report` and rejects slash, backslash, traversal, or URL values.
- [ ] Add a failing render test that expects a document link only for a chapter with a valid document id.
- [ ] Run focused tests and verify both fail for the missing contract.
- [ ] Implement safe document-id parsing, schema support, chapter propagation, and same-site route rendering.
- [ ] Add placeholder local reports for the first linked milestones so every rendered action has a valid destination.
- [ ] Run focused and content tests; expect all pass.
- [ ] Commit `Link motor milestones to project reports`.

### Task 3: Scroll Sequence State And Controller

**Files:**
- Create: `src/features/projects/immersive/motorStoryState.ts`
- Create: `src/features/projects/immersive/motorStorySequence.ts`
- Modify: `src/features/projects/immersive/types.ts`
- Modify: `src/features/projects/immersive/sceneLoader.ts`
- Modify: `src/features/projects/immersive/motion.ts`
- Test: `tests/project-experience.test.ts`

**Interfaces:**
- Produces: `createMotorStoryState(progress, frameCount)` with clamped `frameIndex`, `stage`, `explodeProgress`, `timelineProgress`, and visible label ids.
- Produces: `mountMotorStorySequence(host, manifest)` with `setProgress(progress)` and `dispose()`.

- [ ] Add failing tests for progress clamping and the assembled, exploding, handoff, and timeline stage boundaries.
- [ ] Run the focused test and verify the state module is missing.
- [ ] Implement the pure state mapper with no DOM or timing dependencies.
- [ ] Implement one responsive 2D canvas, poster-first loading, bounded concurrent frame loading, last-good-frame fallback, resize handling, and disposal.
- [ ] Measure pinned-section progress in `motion.ts` and pass it to the sequence controller without handling wheel events.
- [ ] Run focused tests and production build; expect all pass.
- [ ] Commit `Drive motor story from native scroll`.

### Task 4: Continuous Visual Handoff

**Files:**
- Modify: `src/features/projects/immersive/view.ts`
- Modify: `src/styles/immersive-project.css`
- Modify: `src/features/projects/immersive/motion.ts`
- Remove: `src/features/projects/immersive/motorLabScene.ts`
- Modify: `tests/project-experience.test.ts`

**Interfaces:**
- Produces: `.motor-story-stage`, `.motor-story-labels`, `.motor-story-axis`, and document-linked `.motor-story-node` markup.
- Consumes: stage data attributes written by the sequence controller.

- [ ] Add a failing render test for one pinned stage followed by a timeline whose first node shares the visual axis.
- [ ] Run the focused test and verify the new story markup is absent.
- [ ] Replace motor-lab controls with a sparse scroll cue, sequence stage, and accessible part-label overlay.
- [ ] Restyle the motor project so full explosion hands off into the chapter rail without a visual cut, while leaving standard and signal styles untouched.
- [ ] Remove the obsolete procedural scene and its state/readout behavior after the new sequence is mounted.
- [ ] Add reduced-motion and 390 px representative-frame fallbacks.
- [ ] Run focused tests, content tests, typecheck, and production build.
- [ ] Commit `Integrate exploded motor timeline`.

### Task 5: Browser Verification And Documentation

**Files:**
- Modify: `tools/motor-story/README.md`
- Modify: `docs/内容上传与维护用户手册.md`

**Interfaces:**
- Produces: exact commands for regenerating frames and exact Markdown for linking a milestone to a report.

- [ ] Start the Vite development server on an available port.
- [ ] Verify desktop assembled, mid-explosion, full-explosion, timeline handoff, node navigation, browser-back restoration, and route cleanup.
- [ ] Verify 390 px and reduced-motion paths contain no blank visual, overlap, or inaccessible action.
- [ ] Check canvas pixels at representative stages and inspect console errors.
- [ ] Document asset replacement, frame regeneration, milestone linking, and report creation without exposing animation coordinates to content authors.
- [ ] Run the final full test/build suite and commit `Document motor story maintenance`.

## Self-Review

- Every visual state is backed by either a rendered frame or readable DOM fallback.
- The plan removes the rejected procedural object instead of layering more UI around it.
- Timeline document links are content data, not hardcoded scene hotspots.
- The asset source can be swapped without changing scroll or document code.
- Non-motor projects remain outside this preset-specific change.

