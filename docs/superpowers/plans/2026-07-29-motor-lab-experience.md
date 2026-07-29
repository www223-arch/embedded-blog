# Motor Lab Project Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the FOC immersive detail page into an object-led motor lab that supports drag inspection, an explicit diagnostic mode, and a readable scrolling chronicle.

**Architecture:** Keep the shared immersive DOM shell and evidence flow. Add a preset loader with one common scene-controller contract, then implement `motor-lab` as a dynamically imported Three.js scene. Pure state functions describe diagnostic and chapter emphasis so interaction behavior can be tested without WebGL.

**Tech Stack:** TypeScript, Vite 8, Three.js 0.185, native pointer events, existing Node test runner and Markdown content core.

## Global Constraints

- Preserve standard projects and the existing `signal` preset.
- `motor-lab` is a custom preset, not a mandatory template for future projects.
- Use one dynamically imported canvas and no new runtime dependency.
- Drag must not intercept wheel scrolling or create a keyboard-only canvas path.
- Device pixel ratio is capped at `1.5`; mobile and reduced-motion paths contain no canvas.
- DOM content and controls remain useful if scene import or WebGL creation fails.
- Every production behavior starts with a focused failing test.

---

### Task 1: Preset Contract and Motor-Lab Shell

**Files:**
- Modify: `src/content/schema.ts`
- Modify: `src/features/projects/immersive/types.ts`
- Modify: `src/features/projects/immersive/view.ts`
- Modify: `docs-vitepress/projects/motor-control.md`
- Test: `tests/content-core.test.ts`
- Test: `tests/project-experience.test.ts`

**Interfaces:**
- Produces: `visualPreset: "motor-lab"` validation.
- Produces: `isMotorLabPreset(project): boolean`.
- Produces: semantic `.motor-lab-command`, `.motor-lab-readout`, and fallback media markup.

- [ ] Add a content test that parses `visualPreset: motor-lab` and expects success.
- [ ] Add a project-experience test that renders the FOC shell and expects the diagnostic command plus motor readout.
- [ ] Run both focused tests and verify they fail because the preset and shell do not exist.
- [ ] Extend the schema enum and render motor-lab-only controls without changing the signal shell.
- [ ] Replace the mojibake FOC fixture with valid UTF-8 Chinese and set `visualPreset: motor-lab`.
- [ ] Run focused tests, content tests, and build; expect all pass.
- [ ] Commit `Add motor lab project preset`.

### Task 2: Testable Motor State and Preset Loader

**Files:**
- Create: `src/features/projects/immersive/motorLabState.ts`
- Create: `src/features/projects/immersive/sceneLoader.ts`
- Modify: `src/features/projects/immersive/types.ts`
- Modify: `src/features/projects/immersive/motion.ts`
- Test: `tests/project-experience.test.ts`

**Interfaces:**

```ts
export type MotorLabPart = "assembly" | "rotor" | "encoder" | "phases";
export type MotorLabState = {
  activeIndex: number;
  diagnostic: boolean;
  selectedPart: MotorLabPart;
  cameraZ: number;
  housingOpacity: number;
  rippleStrength: number;
};
export function createMotorLabState(chapterCount: number, activeIndex: number, diagnostic: boolean, selectedPart?: MotorLabPart): MotorLabState;
export function isPointerDrag(distanceSquared: number, threshold?: number): boolean;
export function loadImmersiveScene(preset: ProjectItem["visualPreset"]): Promise<ImmersiveSceneMount>;
```

- [ ] Test index clamping, diagnostic transparency/ripple, selected part preservation, and drag threshold.
- [ ] Test loader keys synchronously through an exported `getSceneModuleKey` helper.
- [ ] Run the focused test and verify missing-module failures.
- [ ] Implement the pure state and common controller/mount contracts.
- [ ] Move scene import selection out of `motion.ts`; wire the diagnostic button to DOM state and optional controller method.
- [ ] Run focused tests and build; expect all pass.
- [ ] Commit `Add motor lab interaction state`.

### Task 3: Interactive Three.js Motor Assembly

**Files:**
- Create: `src/features/projects/immersive/motorLabScene.ts`
- Modify: `src/features/projects/immersive/scene.ts`
- Test: `tests/project-experience.test.ts`

**Interfaces:**

```ts
export function getMotorLabRendererConfig(dpr: number): { pixelRatio: number; interactive: true };
export function mountMotorLabScene(host: HTMLElement, chapters: ProjectChapter[], onPartChange: (part: MotorLabPart) => void): ImmersiveSceneController | undefined;
```

- [ ] Test renderer configuration and pointer drag threshold before importing production implementation.
- [ ] Run focused tests and verify the new module import fails.
- [ ] Build the motor from shared cylinder, torus, box, and line geometries with reusable materials.
- [ ] Add orbit-style pointer rotation with no wheel zoom, raycast part selection, and visible hover/selection feedback.
- [ ] Add diagnostic camera push, housing transparency, encoder pulse, phase illumination, and procedural speed trace.
- [ ] Add visibility pause, resize handling, resource disposal, and unsupported-host fallback.
- [ ] Run focused tests and build; expect all pass.
- [ ] Commit `Build interactive motor lab scene`.

### Task 4: Lunar-Inspired Layout and End-to-End Verification

**Files:**
- Modify: `src/styles/immersive-project.css`
- Modify: `src/features/projects/immersive/view.ts`
- Modify: `src/features/projects/immersive/motion.ts`
- Test: `tests/project-experience.test.ts`

**Interfaces:**
- Consumes: `.motor-lab-active`, `.motor-lab-diagnostic`, `.motor-lab-part-*` state classes.
- Produces: a full first viewport, sticky desktop lab, unframed chapter rhythm, and mobile fallback.

- [ ] Test stable diagnostic button labels and selected-part readout copy.
- [ ] Run focused tests and verify the new copy/state expectation fails.
- [ ] Style the motor-lab hero as a full viewport inside the existing detail route; keep the scene interactive and the copy sparse.
- [ ] Restyle only motor-lab chapters into a quiet scrollytelling layout; leave signal and standard styles intact.
- [ ] Add mobile/reduced-motion fallback with cover media and no interactive controls that imply unavailable behavior.
- [ ] Run focused tests, full content tests, and production build.
- [ ] Start the local server and verify desktop drag, part selection, diagnostic toggle, chapter transitions, route cleanup, and 390px fallback in the browser.
- [ ] Commit `Polish motor lab project experience`.

## Self-Review

- The four tasks cover content validation, reusable preset boundaries, pure interaction state, real WebGL behavior, accessibility, cleanup, styling, and browser verification.
- The existing signal scene remains behind the same common controller contract.
- No camera coordinates or component positions enter Markdown.
- There are no placeholders or dependencies on unavailable project media.

