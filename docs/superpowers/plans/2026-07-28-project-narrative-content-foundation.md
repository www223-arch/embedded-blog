# Project Narrative Content Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backward-compatible presentation metadata and narrative Markdown blocks so ordinary projects remain easy to maintain while immersive projects have structured data to consume.

**Architecture:** `docs-vitepress/projects/*.md` remains the sole content source. Optional frontmatter controls presentation mode; Markdown fences become typed narrative blocks through a MarkdownIt/YAML parser. The Content Studio exposes only maintainable fields and inserts known blocks, while existing project rendering stays valid for every old project.

**Tech Stack:** TypeScript, Vite, Zod, MarkdownIt, YAML, Node test runner, existing Content Studio server/client.

## Global Constraints

- Execute in `C:\Users\86199\Desktop\Code2` on branch `DocumentTest`.
- Do not stage or alter the user-owned `docs-vitepress/projects/example-nested.md` modification.
- Add no runtime dependency; `zod`, `markdown-it`, and `yaml` are already installed.
- Existing projects without new frontmatter fields must render as `standard` / `chronicle`.
- Project content remains Markdown; the GUI may insert known blocks but never generates bespoke Three.js scenes.
- Media paths must stay under `/images/` or `/videos/`, with no `..` or backslashes.
- Commit each task separately and push `DocumentTest` after every passing task.

---

## File Structure

- Modify: `src/content-core/model.ts` - canonical presentation/narrative/preset unions.
- Create: `src/content-core/narrative.ts` - typed parser for ordered narrative fences.
- Modify: `src/content/schema.ts`, `src/content/projects.ts` - schema and Markdown loader.
- Modify: `src/content-core/markdown.ts` - safe narrative block HTML.
- Modify: `tests/content-core.test.ts` - parser, schema and renderer tests.
- Modify: `tools/content-studio/server/content-store.mjs`, `tools/content-studio/client/main.ts` - draft defaults, fields and block insertion.
- Modify: `tests/content-studio-store.test.mjs` - persistence tests.
- Modify: `docs/templates/project.md`, `docs/鍐呭涓婁紶涓庣淮鎶ょ敤鎴锋墜鍐?md`, `docs/鏈湴鍐呭宸ヤ綔鍙颁笌瀵屾枃妗ｇ郴缁熻鍒?md`, `docs/寮€鍙戞寚鍗?md`.

### Task 1: Define Project Presentation Contracts

**Files:**
- Modify: `src/content-core/model.ts`
- Modify: `src/content/schema.ts`
- Modify: `src/content/projects.ts`
- Test: `tests/content-core.test.ts`

**Interfaces:**
- Produces `ProjectPresentation`, `ProjectNarrative`, `ProjectVisualPreset`.
- Produces `ProjectItem.presentation`, `narrative`, `visualPreset`, `updatedAt`, and `currentFocus`.

- [ ] **Step 1: Write the failing default/validation tests**

```ts
const project = projectSchema.parse({
  id: "plain-project", title: "Plain", summary: "Summary", stack: [],
  highlights: [], gallery: [], links: [], status: "draft", projectStage: "building"
});
assert.equal(project.presentation, "standard");
assert.equal(project.narrative, "chronicle");
assert.equal(project.visualPreset, "orbit");
assert.equal(project.currentFocus, "");

assert.throws(() => projectSchema.parse({
  id: "bad", title: "Bad", summary: "Summary", stack: [], highlights: [],
  gallery: [], links: [], status: "draft", projectStage: "building", visualPreset: "planet"
}));
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --experimental-strip-types --test tests/content-core.test.ts`

Expected: FAIL because the project schema has no presentation fields.

- [ ] **Step 3: Add the canonical types and schema defaults**

```ts
export const projectPresentations = ["standard", "immersive"] as const;
export type ProjectPresentation = (typeof projectPresentations)[number];
export const projectNarratives = ["chronicle", "field-notes", "chapters"] as const;
export type ProjectNarrative = (typeof projectNarratives)[number];
export const projectVisualPresets = ["orbit", "signal", "archive"] as const;
export type ProjectVisualPreset = (typeof projectVisualPresets)[number];
```

In `projectSchema`, add:

```ts
presentation: projectPresentationSchema.default("standard"),
narrative: projectNarrativeSchema.default("chronicle"),
visualPreset: projectVisualPresetSchema.default("orbit"),
updatedAt: z.string().default(""),
currentFocus: z.string().default("")
```

Pass those five frontmatter values through `src/content/projects.ts` using `valueAsString`; schema defaults own fallback behaviour.

- [ ] **Step 4: Run the content checks**

Run: `npm run test:content-core && npm run check:content && npm run build`

Expected: PASS with no project Markdown edits.

- [ ] **Step 5: Commit and push**

```powershell
git add src/content-core/model.ts src/content/schema.ts src/content/projects.ts tests/content-core.test.ts
git commit -m "Add project presentation metadata"
git push origin DocumentTest
```

### Task 2: Parse and Render Ordered Narrative Blocks

**Files:**
- Create: `src/content-core/narrative.ts`
- Modify: `src/content-core/markdown.ts`
- Modify: `src/content/schema.ts`, `src/content/projects.ts`
- Test: `tests/content-core.test.ts`

**Interfaces:**
- Produces `parseNarrativeBlocks(markdown: string): NarrativeBlock[]`.
- Produces `ProjectItem.narrativeBlocks`.

- [ ] **Step 1: Write the failing parser and rendering tests**

```ts
const blocks = parseNarrativeBlocks([
  "```milestone", "date: 2026-07-28", "title: Diff preview",
  "status: current", "media: /images/projects/studio/diff.gif", "```",
  "Saved work.", "", "```question", "title: Open question", "state: open",
  "```", "How much structure is enough?"
].join("\n"));
assert.deepEqual(blocks.map((block) => block.type), ["milestone", "question"]);
assert.equal(blocks[0]?.media, "/images/projects/studio/diff.gif");
assert.equal(blocks[1]?.body, "How much structure is enough?");
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --experimental-strip-types --test tests/content-core.test.ts`

Expected: FAIL because `src/content-core/narrative.ts` does not exist.

- [ ] **Step 3: Implement token-based parsing**

Use `new MarkdownIt().parse(markdown, {})` to locate fence tokens in source order and `yaml.parse` for fence metadata. Publish exactly this union:

```ts
export type NarrativeBlock =
  | { type: "milestone"; date: string; title: string; status: "past" | "current" | "future"; media: string; body: string }
  | { type: "question"; title: string; state: "open" | "resolved"; body: string }
  | { type: "next"; title: string; body: string };
```

Accept a `media` value only if it starts with `/images/` or `/videos/` and contains neither `..` nor `\\\\`. Invalid metadata yields a safe empty value or a skipped block; it must never throw while loading a project. Add matching Zod schemas and call `parseNarrativeBlocks(entry.markdown)` in `projects.ts`.

- [ ] **Step 4: Render safe semantic block HTML and run checks**

Add `milestone`, `question`, and `next` branches in the existing fence renderer. Each returns an escaped `article.doc-narrative-block` with `data-narrative-type`; milestone also has `data-narrative-status`.

Run: `npm run test:content-core && npm run check:content && npm run build`

Expected: PASS, including tests for invalid YAML, unsafe media, invalid status, source order and escaped body text.

- [ ] **Step 5: Commit and push**

```powershell
git add src/content-core/narrative.ts src/content-core/markdown.ts src/content/schema.ts src/content/projects.ts tests/content-core.test.ts
git commit -m "Add project narrative blocks"
git push origin DocumentTest
```

### Task 3: Expose Maintainable Controls in Content Studio

**Files:**
- Modify: `tools/content-studio/server/content-store.mjs`
- Modify: `tools/content-studio/client/main.ts`
- Test: `tests/content-studio-store.test.mjs`

**Interfaces:**
- Project drafts persist `presentation`, `narrative`, `visualPreset`, `updatedAt`, and `currentFocus`.
- The editor exposes selectors and safe block insertion actions.

- [ ] **Step 1: Write failing persistence tests**

```js
assert.equal(saved.frontmatter.presentation, "immersive");
assert.equal(saved.frontmatter.narrative, "chapters");
assert.equal(saved.frontmatter.visualPreset, "signal");
assert.equal(saved.frontmatter.currentFocus, "Build the chapter rail");
```

Create a temporary project with `createContentStore`, save those frontmatter fields, re-read the Markdown and assert the round trip.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --experimental-strip-types --test tests/content-studio-store.test.mjs`

Expected: FAIL because generated drafts omit the presentation fields.

- [ ] **Step 3: Add draft defaults and metadata fields**

Add this exact default set to the project branch in `createDraftFrontmatter`:

```js
presentation: "standard",
narrative: "chronicle",
visualPreset: "orbit",
updatedAt: draft.date,
currentFocus: ""
```

Add these `metadataFor` fields:

```ts
{ key: "presentation", label: "灞曠ず鏂瑰紡", kind: "select", options: ["standard", "immersive"] },
{ key: "narrative", label: "鍙欎簨鏂瑰紡", kind: "select", options: ["chronicle", "field-notes", "chapters"] },
{ key: "visualPreset", label: "绌洪棿棰勮", kind: "select", options: ["orbit", "signal", "archive"] },
{ key: "updatedAt", label: "鏈€杩戞洿鏂?, kind: "text" },
{ key: "currentFocus", label: "褰撳墠鐒︾偣", kind: "textarea", wide: true }
```

Hide `visualPreset` and `currentFocus` when `presentation !== "immersive"`; do not erase hidden values.

- [ ] **Step 4: Add block insertion and validation**

Add controls that insert the exact `milestone`, `question`, and `next` templates at the editor caret, set `state.dirty = true`, and call `updateSaveState()`. Require `updatedAt` and `currentFocus` only for `immersive` projects in `validateDetail`.

- [ ] **Step 5: Run checks, commit and push**

Run: `npm run test:content-core && npm run typecheck:studio && npm run build`

Expected: PASS.

```powershell
git add tools/content-studio/server/content-store.mjs tools/content-studio/client/main.ts tests/content-studio-store.test.mjs
git commit -m "Add immersive project controls to studio"
git push origin DocumentTest
```

### Task 4: Update Templates and User Documentation

**Files:**
- Modify: `docs/templates/project.md`
- Modify: `docs/鍐呭涓婁紶涓庣淮鎶ょ敤鎴锋墜鍐?md`
- Modify: `docs/鏈湴鍐呭宸ヤ綔鍙颁笌瀵屾枃妗ｇ郴缁熻鍒?md`
- Modify: `docs/寮€鍙戞寚鍗?md`

**Interfaces:**
- Documents the exact fields and block formats from Tasks 1-3.
- Distinguishes ordinary projects, immersive presets and bespoke code scenes.

- [ ] **Step 1: Update the ordinary project template**

Add this frontmatter after `projectStage` while keeping the existing case-study body unchanged:

```yaml
presentation: standard
narrative: chronicle
visualPreset: orbit
updatedAt: '2026-07-28'
currentFocus: ''
```

- [ ] **Step 2: Add the user workflow**

Document accepted values, all three fence formats, media path rules, when to choose `standard`, and why `immersive` does not itself create a bespoke scene.

- [ ] **Step 3: Add the visual-branch contract**

In `docs/寮€鍙戞寚鍗?md`, document that the visual branch consumes `presentation`, `narrativeBlocks`, `visualPreset`, `updatedAt`, and `currentFocus`, and must not change ordinary `renderDocumentShell` behaviour.

- [ ] **Step 4: Verify, commit and push**

Run: `npm run check:content && npm run docs:build && npm run build && git diff --check`

Expected: PASS.

```powershell
git add docs/templates/project.md docs/鍐呭涓婁紶涓庣淮鎶ょ敤鎴锋墜鍐?md docs/鏈湴鍐呭宸ヤ綔鍙颁笌瀵屾枃妗ｇ郴缁熻鍒?md docs/寮€鍙戞寚鍗?md
git commit -m "Document project narrative workflow"
git push origin DocumentTest
```

## Final Verification

- [ ] Run `npm run test:content-core`, `npm run typecheck:studio`, `npm run check:content`, `npm run build`, and `npm run docs:build`.
- [ ] In the Content Studio, create one temporary ordinary project and one temporary immersive project; verify that fields, save diff and narrative insertion work.
- [ ] Remove verification-only temporary content through the Content Studio before final commit.
- [ ] Confirm `git status --short` only retains the user-owned `docs-vitepress/projects/example-nested.md` change.
