# FOC Signal Orbit Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` or `executing-plans` task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Build a reusable, lightweight signal-orbit project presentation for an ongoing FOC project while keeping ordinary project detail pages unchanged.

**Architecture:** The view turns `ProjectItem.narrativeBlocks` into accessible DOM chapters. A local Three.js scene receives only serialisable chapter state and renders one decorative canvas. Bootstrap selects and cleans up the standard or immersive route.

**Tech Stack:** TypeScript, Vite, Three.js 0.185, GSAP 3.14, existing Markdown content core, Node test runner.

## Global Constraints

- `presentation: standard` keeps its exact present markup and behaviour.
- Only `presentation: immersive` with `visualPreset: signal` mounts the scene.
- One dynamically imported, `aria-hidden` canvas per mounted route; no React or new runtime dependency.
- Device pixel ratio is capped at `1.5`; frame code creates no objects.
- Reduced motion, WebGL failure, and narrow touch screens show a complete DOM reader without canvas motion.
- Gold, mint, and soft violet represent past, current, and future/open states alongside text labels.
- Every task follows red-green-refactor, ends with `npm run build`, and gets its own commit.

## File Responsibilities

- `src/features/projects/experience.ts`: selects standard or immersive rendering.
- `src/features/projects/immersive/types.ts`: chapter and scene-state contracts.
- `src/features/projects/immersive/view.ts`: narrative mapping and safe semantic DOM shell.
- `src/features/projects/immersive/sceneState.ts`: deterministic camera, colour, and intensity targets.
- `src/features/projects/immersive/scene.ts`: Three.js canvas ownership, animation, and disposal.
- `src/features/projects/immersive/motion.ts`: reader, rail, evidence dialog, and scene coordination.
- `src/app/bootstrap.ts`: route lifecycle and mount cleanup.
- `src/features/projects/view.ts` and `src/shared/routeTransition.ts`: pause-to-enter card flow.
- `src/styles/pages/projects.css`: immersive styles and fallbacks.
- `tests/project-experience.test.ts`: pure unit coverage.

### Task 1: Semantic Immersive Reader

**Files:** Create `src/features/projects/immersive/types.ts`, `src/features/projects/immersive/view.ts`; modify `src/features/projects/experience.ts`, `tests/project-experience.test.ts`.

**Interfaces:**

    export type ProjectChapterStatus = "past" | "current" | "future" | "open" | "resolved";
    export type ProjectChapter = { id: string; railLabel: string; eyebrow: string; title: string; body: string; status: ProjectChapterStatus; media: string };
    export function buildProjectChapters(project: ProjectItem): ProjectChapter[];
    export function renderImmersiveProject(project: ProjectItem): string;
    export function renderProjectExperience(project: ProjectItem, standard: (project: ProjectItem) => string): string;

- [ ] Write a failing test that calls `buildProjectChapters` with two milestones (`past`, `current`) and asserts labels `01`, `02`, original order, and statuses.
- [ ] Run `node --experimental-strip-types --test tests/project-experience.test.ts`; expect an import failure for `immersive/view.ts`.
- [ ] Implement `ProjectChapter`; map each milestone in source order. If there are no milestones, create one `current` overview from `project.title` and `project.summary`.
- [ ] Render `#immersiveProjectScene`, `.immersive-project-rail`, `.immersive-project-chapter`, visible status text, and `button[data-evidence-src]` only for trusted media. Use the existing safe Markdown renderer for chapter body and escape all plain attributes.
- [ ] Re-run the focused test, `npm run test:content-core`, and `npm run build`; expect all pass.
- [ ] Commit: `git add tests/project-experience.test.ts src/features/projects/experience.ts src/features/projects/immersive && git commit -m "Add immersive project chapter shell"`.

### Task 2: Testable Signal-Orbit State

**Files:** Create `src/features/projects/immersive/sceneState.ts`; modify `tests/project-experience.test.ts`.

**Interfaces:**

    export type SignalOrbitSceneState = { activeIndex: number; cameraTarget: readonly [number, number, number]; lookTarget: readonly [number, number, number]; signalColor: number; signalStrength: number; anchorColors: number[] };
    export function createSignalOrbitState(chapters: ProjectChapter[], activeIndex: number): SignalOrbitSceneState;

- [ ] Write failing tests: index `99` clamps to the final chapter; `current` is `0x79e0bf`; current `signalStrength` is larger than past strength.
- [ ] Run the focused test; expect an import failure for `sceneState.ts`.
- [ ] Implement the stable palette `past: 0xe6b56c`, `current: 0x79e0bf`, `future/open: 0xb7a0ff`, `resolved: 0xe6b56c`. Derive camera targets from clamped stage index so every project uses the same spatial grammar.
- [ ] Run focused tests and `npm run build`; expect PASS.
- [ ] Commit: `git add tests/project-experience.test.ts src/features/projects/immersive/sceneState.ts && git commit -m "Add signal orbit scene state"`.

### Task 3: One Real Three.js Canvas

**Files:** Create `src/features/projects/immersive/scene.ts`; modify `tests/project-experience.test.ts`.

**Interfaces:**

    export type SignalOrbitSceneController = { setActiveChapter(index: number): void; dispose(): void };
    export function getSignalOrbitRendererConfig(dpr: number): { pixelRatio: number; ariaHidden: string };
    export function mountSignalOrbitScene(host: HTMLElement, chapters: ProjectChapter[]): SignalOrbitSceneController | undefined;

- [ ] Write a failing test: `getSignalOrbitRendererConfig(3)` equals `{ pixelRatio: 1.5, ariaHidden: "true" }`.
- [ ] Run focused tests; expect an import failure for `scene.ts`.
- [ ] Implement one restrained perspective camera, 180 fixed-seed stars, three orbital `LineLoop`s, one low-poly control core, chapter anchors, and a single signal ribbon. Use reusable vectors and colours; interpolate camera, core intensity, and ribbon state with `THREE.MathUtils.damp`.
- [ ] Exit before canvas creation for reduced motion or width below 760px. Wrap `WebGLRenderer` in `try/catch`; set `host.dataset.state = "unsupported"` on failure.
- [ ] Implement `dispose()` to cancel the frame, remove listeners and canvas, dispose every geometry/material, and call `renderer.dispose()`.
- [ ] Run focused tests and `npm run build`; expect PASS. Start `npm run dev -- --host 127.0.0.1 --port 5175`; manually enter, leave, and re-enter an immersive fixture. Expect one canvas while open and zero after leave.
- [ ] Commit: `git add tests/project-experience.test.ts src/features/projects/immersive/scene.ts && git commit -m "Add signal orbit scene"`.

### Task 4: Reader, Evidence, and Route Lifecycle

**Files:** Create `src/features/projects/immersive/motion.ts`; modify `src/app/bootstrap.ts`, `src/styles/pages/projects.css`, `tests/project-experience.test.ts`.

**Interfaces:**

    export function getActiveChapterIndex(ratios: number[]): number;
    export function getEvidenceReturnTargetId(chapterId: string): string;
    export function mountImmersiveProjectExperience(root: HTMLElement, project: ProjectItem): () => void;

- [ ] Write failing tests: `[0.1, 0.68, 0.31]` resolves index `1`, and `chapter-03` resolves `evidence-chapter-03`.
- [ ] Run the focused test; expect an import failure for `motion.ts`.
- [ ] Use an `IntersectionObserver` rooted at the reader to update rail `aria-current` and call `sceneController.setActiveChapter(index)`. Rail buttons use `scrollIntoView({ behavior: "smooth", block: "start" })`.
- [ ] Open evidence in a DOM `dialog` when available, with a `role="dialog"` fallback. Escape closes it and restores focus to its trigger without changing scroll location.
- [ ] In `bootstrap.ts`, pass `currentRunId` into `renderProjectDetail`, render standard content through `renderProjectExperience`, and register immersive cleanup only for immersive projects. Keep `bindDocumentShell()` on the standard path.
- [ ] Add only `.immersive-project*` CSS: scene host, readable chapters, rail, evidence dialog, and a reduced-motion/mobile rule that hides the scene without hiding content.
- [ ] Run focused tests, `npm run test:content-core`, and `npm run build`; manually verify rail keyboard activation, evidence focus restoration, and reduced-motion reading. Expect PASS.
- [ ] Commit: `git add tests/project-experience.test.ts src/app/bootstrap.ts src/features/projects/immersive/motion.ts src/styles/pages/projects.css && git commit -m "Connect immersive project reader"`.

### Task 5: Pause-to-Enter Card and FOC Fixture

**Files:** Modify `src/features/projects/experience.ts`, `src/features/projects/view.ts`, `src/shared/routeTransition.ts`, `tests/project-experience.test.ts`; create `content/projects/foc-control-research.md`.

**Interfaces:**

    export function isImmersiveCard(project: Pick<ProjectItem, "presentation" | "visualPreset">): boolean;

- [ ] Write a failing test: an `immersive/signal` item returns true and `standard/signal` returns false.
- [ ] Run focused tests; expect `isImmersiveCard` to be unavailable.
- [ ] Mark only immersive signal cards with `data-project-presentation="immersive"`. Preserve existing expanded-card preview; show explicit `进入项目` and `返回列表` actions only for marked cards. Preserve Enter, Escape, and reduced-motion direct navigation.
- [ ] Add a real editable fixture with frontmatter `presentation: immersive`, `narrative: chronicle`, `visualPreset: signal`, `currentFocus: Speed ripple reduction and encoder calibration`, and four blank-media milestones: stepper bring-up/past, frequency-domain SOP/past, ripple plus encoder calibration/current, FOC library plus SMC and sensorless/future.
- [ ] Run `npm run check:content && npm run test:content-core && npm run build`; expect PASS. Inspect desktop and 390px mobile: pause before entry, desktop camera motion, evidence return, and complete mobile document reader.
- [ ] Commit and push: `git add tests/project-experience.test.ts src/features/projects/experience.ts src/features/projects/view.ts src/shared/routeTransition.ts content/projects/foc-control-research.md && git commit -m "Add immersive FOC project entry" && git push origin codex/space-visual-upgrade`.

## Self-Review

- Tasks 1 and 5 cover narrative content and entry flow; Tasks 2 and 3 cover real WebGL, performance, and cleanup; Task 4 covers scrolling, focus, evidence, and fallback.
- Interfaces flow only from chapters to scene state to scene/motion. The scene never imports Markdown or route logic, and the view never imports Three.js.
- There are no unbounded effects, unnamed future abstractions, or new dependencies.
