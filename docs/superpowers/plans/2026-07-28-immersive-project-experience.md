# Immersive Project Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a performant, optional orbital/space project experience that enhances selected project details without changing the site's global navigation or ordinary document-reading path.

**Architecture:** The visual branch consumes the content contract from the content-foundation plan. A strategy selector keeps `standard` projects on the current document shell and renders `immersive` projects through a local experience shell. The shell owns its Three.js canvas, GSAP scroll lifecycle, rail navigation and evidence focus; route cleanup always disposes them before the next view renders.

**Tech Stack:** TypeScript, Vite, Three.js 0.185, GSAP 3.14 with ScrollTrigger, existing route transition and document shell, CSS media queries.

## Global Constraints

- Execute in `C:\Users\86199\Desktop\Code` on branch `codex/space-visual-upgrade`.
- Before Task 1, merge or cherry-pick the completed `DocumentTest` content-foundation commits; do not reimplement those schemas on this branch.
- Preserve global navigation, theme controls, quick dock, search and existing route names.
- Keep `standard` projects on `renderDocumentShell`; do not add a Canvas to them.
- Add no new runtime dependency; `three` and `gsap` are already installed.
- Never put document text, buttons or videos inside Canvas. Canvas is decorative and must be `aria-hidden`.
- Support `prefers-reduced-motion: reduce`, WebGL failure and narrow touch viewports with full-content static fallbacks.
- Cap canvas pixel ratio at 2, pause/dispose offscreen work, and use the existing active-view cleanup registration.
- Commit each independently testable task and push the visual branch after each passing task.

---

## File Structure

- Create: `src/features/projects/experience.ts` - presentation strategy and detail render/mount boundary.
- Create: `src/features/projects/immersive/view.ts` - semantic immersive project shell and chapter markup.
- Create: `src/features/projects/immersive/scene.ts` - local Three.js orbital scene and resource disposal.
- Create: `src/features/projects/immersive/motion.ts` - GSAP/ScrollTrigger chapters, rail, evidence focus and reduced-motion policy.
- Create: `src/features/projects/immersive/presets.ts` - `orbit`, `signal`, `archive` colour and geometry parameters.
- Create: `src/features/projects/immersive/types.ts` - visual-branch interfaces derived from `ProjectItem`.
- Modify: `src/app/bootstrap.ts` - dispatch project detail rendering through the new strategy and register cleanup.
- Modify: `src/shared/routeTransition.ts` - project-only expanded preview label and focus-safe enter/return flow.
- Modify: `src/styles/pages/projects.css` - scoped immersive detail styles and fallbacks.
- Create: `tests/project-experience.test.ts` - pure strategy, preset and chapter conversion tests.

### Task 1: Add a Presentation Strategy Without Changing Ordinary Details

**Files:**
- Create: `src/features/projects/experience.ts`
- Create: `tests/project-experience.test.ts`
- Modify: `src/app/bootstrap.ts`

**Interfaces:**
- Consumes `ProjectItem` from the merged content-foundation work.
- Produces `renderProjectExperience(project, options): string` and `mountProjectExperience(project, host): () => void`.
- Returns the existing document shell for `standard` projects and an immersive shell only for `immersive` projects.

- [ ] **Step 1: Write the failing pure strategy test**

```ts
assert.equal(selectProjectExperience({ presentation: "standard" } as ProjectItem), "standard");
assert.equal(selectProjectExperience({ presentation: "immersive" } as ProjectItem), "immersive");
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --experimental-strip-types --test tests/project-experience.test.ts`

Expected: FAIL because `selectProjectExperience` does not exist.

- [ ] **Step 3: Implement the strategy boundary**

```ts
export type ProjectExperienceKind = "standard" | "immersive";

export function selectProjectExperience(project: Pick<ProjectItem, "presentation">): ProjectExperienceKind {
  return project.presentation === "immersive" ? "immersive" : "standard";
}
```

Move only the existing `renderDocumentShell({...})` argument construction from `renderProjectDetail` into an exported `renderStandardProjectExperience(project)`. Change the bootstrap call to `renderProjectDetail(params.id, currentRunId)` and the function signature to `renderProjectDetail(projectId: string, runId: number)`. Inside it, call the selector, preserve the existing `detailPage` outer shell, and call `registerMountResult(mountProjectExperience(project, view), runId)` so route teardown owns every immersive listener.

- [ ] **Step 4: Verify ordinary project parity**

Run: `npm run build`

Manual check: open an existing project with no `presentation` field; title, rails, gallery, image preview, code copy and return must remain unchanged.

- [ ] **Step 5: Commit and push**

```powershell
git add src/features/projects/experience.ts src/app/bootstrap.ts tests/project-experience.test.ts
git commit -m "Add project experience strategy"
git push origin codex/space-visual-upgrade
```

### Task 2: Build the Semantic Immersive Project Shell

**Files:**
- Create: `src/features/projects/immersive/types.ts`
- Create: `src/features/projects/immersive/view.ts`
- Modify: `src/features/projects/experience.ts`
- Test: `tests/project-experience.test.ts`

**Interfaces:**
- Consumes `ProjectItem.narrativeBlocks`, `currentFocus`, `updatedAt`, and `visualPreset`.
- Produces `renderImmersiveProjectExperience(project): string`.
- The shell exposes `#immersiveProjectScene`, `.immersive-project-rail`, `.immersive-project-chapter`, and `[data-evidence-src]` hooks.

- [ ] **Step 1: Write failing chapter conversion tests**

```ts
const chapters = buildProjectChapters({
  markdown: "# Fallback",
  narrativeBlocks: [
    { type: "milestone", date: "2026-07-28", title: "Diff", status: "current", media: "/images/diff.gif", body: "Saved." }
  ]
} as ProjectItem);
assert.equal(chapters.length, 1);
assert.equal(chapters[0]?.railLabel, "Diff");
assert.equal(chapters[0]?.status, "current");
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --experimental-strip-types --test tests/project-experience.test.ts`

Expected: FAIL because `buildProjectChapters` does not exist.

- [ ] **Step 3: Implement semantic HTML, not canvas text**

Define:

```ts
export type ProjectChapter = {
  id: string;
  railLabel: string;
  status: "past" | "current" | "future" | "open" | "resolved";
  eyebrow: string;
  title: string;
  body: string;
  media: string;
};
```

Build chapters from ordered narrative blocks. If none exist, produce one chapter from `project.title`, `project.summary`, and `project.markdown ?? ""`. Render a semantic `header`, ordered rail buttons, `article` chapters, normal document media and an explicit return button. Escape all frontmatter-derived text. Use the existing Markdown renderer for each chapter body, not `innerHTML` from raw Markdown.

- [ ] **Step 4: Verify desktop and small-screen markup**

Run: `npm run build`

Manual check at 1440px and 390px: the chapter text remains in DOM and every rail button has an accessible label.

- [ ] **Step 5: Commit and push**

```powershell
git add src/features/projects/experience.ts src/features/projects/immersive/types.ts src/features/projects/immersive/view.ts tests/project-experience.test.ts
git commit -m "Add immersive project detail shell"
git push origin codex/space-visual-upgrade
```

### Task 3: Add the Reusable Orbital Scene and Presets

**Files:**
- Create: `src/features/projects/immersive/presets.ts`
- Create: `src/features/projects/immersive/scene.ts`
- Test: `tests/project-experience.test.ts`

**Interfaces:**
- Produces `getProjectScenePreset(name): ProjectScenePreset` and `mountProjectOrbitScene(host, preset): () => void`.
- The returned cleanup cancels animation, disconnects observers, disposes geometries/materials/renderer and removes its canvas.

- [ ] **Step 1: Write failing preset and fallback tests**

```ts
assert.equal(getProjectScenePreset("signal").accent, "#83d2c0");
assert.equal(getProjectScenePreset("unknown").id, "orbit");
assert.equal(canUseProjectScene({ reducedMotion: true, width: 1280 }), false);
assert.equal(canUseProjectScene({ reducedMotion: false, width: 390 }), false);
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --experimental-strip-types --test tests/project-experience.test.ts`

Expected: FAIL because preset and policy functions do not exist.

- [ ] **Step 3: Implement scene lifecycle**

Use the existing `src/features/home/spaceField.ts` techniques as reference, but keep the project scene separate. The scene contains only sparse stars, two orbit lines and one preset-coloured signal point. It must use:

```ts
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)), false);
renderer.domElement.setAttribute("aria-hidden", "true");
```

Use `IntersectionObserver` to skip rendering when the scene is not visible and a `visibilitychange` listener to pause when the tab is hidden. Catch `new THREE.WebGLRenderer()` failure and leave the host in `data-state="unsupported"`; never prevent the page from rendering.

- [ ] **Step 4: Verify disposal and fallback**

Run: `npm run build`

Manual check: navigate into an immersive project, away to another route, then back three times. The document must contain one canvas at most and DevTools must report no active scene listener after leaving the route.

- [ ] **Step 5: Commit and push**

```powershell
git add src/features/projects/immersive/presets.ts src/features/projects/immersive/scene.ts tests/project-experience.test.ts
git commit -m "Add orbital project scene"
git push origin codex/space-visual-upgrade
```

### Task 4: Add Scroll Travel, Rail Navigation, Evidence Focus, and Reduced Motion

**Files:**
- Create: `src/features/projects/immersive/motion.ts`
- Modify: `src/features/projects/experience.ts`
- Modify: `src/styles/pages/projects.css`
- Test: `tests/project-experience.test.ts`

**Interfaces:**
- Produces `mountImmersiveProjectMotion(host): () => void`.
- Uses GSAP `ScrollTrigger` only for immersive chapters; cleanup kills every created trigger and timeline.

- [ ] **Step 1: Write failing motion-policy tests**

```ts
assert.equal(resolveMotionMode({ reducedMotion: true, touch: false, width: 1280 }), "static");
assert.equal(resolveMotionMode({ reducedMotion: false, touch: true, width: 390 }), "static");
assert.equal(resolveMotionMode({ reducedMotion: false, touch: false, width: 1280 }), "immersive");
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --experimental-strip-types --test tests/project-experience.test.ts`

Expected: FAIL because `resolveMotionMode` does not exist.

- [ ] **Step 3: Implement interaction policy and GSAP lifecycle**

```ts
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
```

In immersive mode, pin only the chapter viewport while its direct content progresses, update `--immersive-progress` on the host, and set the matching rail button `aria-current="step"`. Rail buttons call `chapter.scrollIntoView({ behavior: "smooth", block: "start" })`. Evidence buttons open a focus-safe dialog using the current document image-preview conventions and restore focus to the button on close. Cleanup must call `trigger.kill()`, `timeline.kill()`, remove all listeners and close any open evidence dialog.

In static mode, add `.immersive-project--static`, render the rail as ordinary in-page links, remove pinning/parallax and leave only CSS opacity transitions.

- [ ] **Step 4: Add responsive and reduced-motion CSS**

Include:

```css
@media (prefers-reduced-motion: reduce) {
  .immersive-project * { animation-duration: 1ms !important; transition-duration: 1ms !important; }
}
@media (max-width: 760px) {
  .immersive-project-scene { display: none; }
  .immersive-project-rail { position: static; overflow-x: auto; }
}
```

Keep ordinary `.project-detail-page` selectors untouched; every new selector starts with `.immersive-project`.

- [ ] **Step 5: Verify, commit and push**

Run: `npm run build && git diff --check`

Manual check: rail jump, Escape close, return navigation, reduced-motion emulator and 390px touch width.

```powershell
git add src/features/projects/immersive/motion.ts src/features/projects/experience.ts src/styles/pages/projects.css tests/project-experience.test.ts
git commit -m "Add immersive project scroll interaction"
git push origin codex/space-visual-upgrade
```

### Task 5: Enhance the Existing Card Transition for Immersive Projects

**Files:**
- Modify: `src/features/projects/view.ts`
- Modify: `src/shared/routeTransition.ts`
- Modify: `src/styles/pages/projects.css`
- Test: `tests/project-experience.test.ts`

**Interfaces:**
- Consumes `ProjectItem.presentation`, `projectStage`, and `updatedAt`.
- Gives only immersive cards an expanded-preview status and explicit enter/return commands.

- [ ] **Step 1: Write the failing presentation selector test**

```ts
assert.equal(projectCardMode({ presentation: "immersive" } as ProjectItem), "preview");
assert.equal(projectCardMode({ presentation: "standard" } as ProjectItem), "direct");
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --experimental-strip-types --test tests/project-experience.test.ts`

Expected: FAIL because `projectCardMode` does not exist.

- [ ] **Step 3: Implement the project-only preview**

Add `data-presentation`, current stage and optional `updatedAt` to the existing project-card markup. Extend `navigateFromCard` with an optional `{ preview: boolean }` argument. For `preview: true`, retain the existing expanded overlay but label the actions \"杩斿洖鍒楄〃\" and \"杩涘叆椤圭洰\"; focus the enter action after the expansion completes. For normal projects, keep the current direct detail opening behaviour. Escape closes to the originating card and Enter opens the project.\n+
- [ ] **Step 4: Verify list position and card focus restoration**

Run: `npm run build`

Manual check: scroll the projects list, open an immersive card, close its preview, then enter and use the detail return. The same card must regain focus and the list scroll position must not reset.

- [ ] **Step 5: Commit and push**

```powershell
git add src/features/projects/view.ts src/shared/routeTransition.ts src/styles/pages/projects.css tests/project-experience.test.ts
git commit -m "Enhance immersive project card entry"
git push origin codex/space-visual-upgrade
```

## Final Verification

- [ ] Run `npm run build` and the focused project-experience test file after each task.
- [ ] Use Playwright screenshots at 1440x900 and 390x844 for one ordinary and one immersive project; verify no clipped text, blank canvas, overlay collision or unwanted global layout change.
- [ ] Verify keyboard-only flow: card, expanded preview, Enter, rail buttons, evidence open, Escape, return.
- [ ] Verify static fallback under reduced motion and at 390px; all project text and media must remain present.
- [ ] Verify three repeated route changes create no duplicate canvas and no lingering ScrollTrigger instances.
- [ ] Verify `git status --short` contains only intended visual-branch files before the final push.
