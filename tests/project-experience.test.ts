import assert from "node:assert/strict";
import test from "node:test";
import type { ProjectItem } from "../src/content/schema.ts";
import { selectProjectExperience } from "../src/features/projects/experience.ts";
import { buildProjectChapters, isMotorLabPreset, renderImmersiveProject } from "../src/features/projects/immersive/view.ts";
import { createSignalOrbitState } from "../src/features/projects/immersive/sceneState.ts";
import { getSignalOrbitRendererConfig } from "../src/features/projects/immersive/scene.ts";
import { getActiveChapterIndex, getEvidenceReturnTargetId } from "../src/features/projects/immersive/motion.ts";
import { createMotorLabState, isPointerDrag } from "../src/features/projects/immersive/motorLabState.ts";
import { getSceneModuleKey } from "../src/features/projects/immersive/sceneLoader.ts";

test("project experience uses the ordinary shell by default", () => {
  assert.equal(selectProjectExperience({ presentation: "standard" }), "standard");
});

test("project experience enables the immersive shell explicitly", () => {
  assert.equal(selectProjectExperience({ presentation: "immersive" }), "immersive");
});

test("immersive chapters preserve milestone order and active status", () => {
  const chapters = buildProjectChapters(projectWith([
    { type: "milestone", date: "2026-05-01", title: "Stepper bring-up", status: "past", media: "", body: "The motor turns." },
    { type: "milestone", date: "2026-07-28", title: "Encoder calibration", status: "current", media: "", body: "Measure ripple." }
  ]));

  assert.deepEqual(chapters.map(({ railLabel, title, status }) => [railLabel, title, status]), [
    ["01", "Stepper bring-up", "past"],
    ["02", "Encoder calibration", "current"]
  ]);
});

test("immersive chapters supply a readable overview when milestones are absent", () => {
  const [chapter] = buildProjectChapters(projectWith([]));

  assert.equal(chapter.title, "FOC control research");
  assert.equal(chapter.body, "A readable fallback summary.");
  assert.equal(chapter.status, "current");
});

test("signal orbit state clamps to the last available chapter", () => {
  const state = createSignalOrbitState(buildProjectChapters(projectWith([
    { type: "milestone", date: "", title: "Past", status: "past", media: "", body: "" },
    { type: "milestone", date: "", title: "Current", status: "current", media: "", body: "" },
    { type: "milestone", date: "", title: "Future", status: "future", media: "", body: "" }
  ])), 99);

  assert.equal(state.activeIndex, 2);
  assert.equal(state.signalColor, 0xb7a0ff);
});

test("signal orbit state gives the active investigation a stronger signal", () => {
  const chapters = buildProjectChapters(projectWith([
    { type: "milestone", date: "", title: "Past", status: "past", media: "", body: "" },
    { type: "milestone", date: "", title: "Current", status: "current", media: "", body: "" }
  ]));

  assert.ok(createSignalOrbitState(chapters, 1).signalStrength > createSignalOrbitState(chapters, 0).signalStrength);
});

test("signal orbit renderer caps pixel ratio and keeps canvas decorative", () => {
  assert.deepEqual(getSignalOrbitRendererConfig(3), { pixelRatio: 1.5, ariaHidden: "true" });
});

test("reader state resolves the most visible chapter", () => {
  assert.equal(getActiveChapterIndex([0.1, 0.68, 0.31]), 1);
});

test("evidence return target is stable per chapter", () => {
  assert.equal(getEvidenceReturnTargetId("chapter-03"), "evidence-chapter-03");
});

test("motor lab preset renders an explicit experiment command and part readout", () => {
  const project = projectWith([]);
  project.visualPreset = "motor-lab";
  const html = renderImmersiveProject(project);

  assert.equal(isMotorLabPreset(project), true);
  assert.match(html, /class="motor-lab-command"/);
  assert.match(html, /data-motor-diagnostic/);
  assert.match(html, /class="motor-lab-readout"/);
  assert.match(html, /点亮当前实验/);
});

test("signal preset does not inherit motor lab controls", () => {
  const project = projectWith([]);
  const html = renderImmersiveProject(project);

  assert.equal(isMotorLabPreset(project), false);
  assert.doesNotMatch(html, /motor-lab-command/);
});

test("motor lab state clamps chapters and preserves selected part", () => {
  const state = createMotorLabState(5, 99, false, "encoder");

  assert.equal(state.activeIndex, 4);
  assert.equal(state.selectedPart, "encoder");
});

test("motor lab diagnostic state reveals internals and strengthens ripple", () => {
  const observing = createMotorLabState(5, 2, false);
  const diagnostic = createMotorLabState(5, 2, true);

  assert.ok(diagnostic.housingOpacity < observing.housingOpacity);
  assert.ok(diagnostic.rippleStrength > observing.rippleStrength);
  assert.ok(diagnostic.cameraZ < observing.cameraZ);
});

test("motor lab pointer movement distinguishes a click from a drag", () => {
  assert.equal(isPointerDrag(16), false);
  assert.equal(isPointerDrag(64), true);
});

test("immersive scene module keys preserve project-specific presets", () => {
  assert.equal(getSceneModuleKey("motor-lab"), "motor-lab");
  assert.equal(getSceneModuleKey("signal"), "signal");
  assert.equal(getSceneModuleKey("orbit"), "signal");
});

function projectWith(narrativeBlocks: ProjectItem["narrativeBlocks"]): ProjectItem {
  return {
    id: "foc-control-research",
    title: "FOC control research",
    summary: "A readable fallback summary.",
    stack: [],
    highlights: [],
    gallery: [],
    links: [],
    status: "published",
    projectStage: "building",
    presentation: "immersive",
    narrative: "chronicle",
    visualPreset: "signal",
    updatedAt: "2026-07-28",
    currentFocus: "Encoder calibration",
    narrativeBlocks,
    markdown: ""
  };
}
