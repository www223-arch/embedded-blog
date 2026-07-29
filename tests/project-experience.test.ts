import assert from "node:assert/strict";
import test from "node:test";
import type { ProjectItem } from "../src/content/schema.ts";
import { selectProjectExperience } from "../src/features/projects/experience.ts";
import { buildProjectChapters, getProjectDocumentRoute, isMotorLabPreset, renderImmersiveProject } from "../src/features/projects/immersive/view.ts";
import { createSignalOrbitState } from "../src/features/projects/immersive/sceneState.ts";
import { getSignalOrbitRendererConfig } from "../src/features/projects/immersive/scene.ts";
import { getActiveChapterIndex, getChapterAriaCurrent, getEvidenceReturnTargetId } from "../src/features/projects/immersive/motion.ts";
import { createMotorLabState, getMotorLabReadout, isPointerDrag } from "../src/features/projects/immersive/motorLabState.ts";
import { getSceneModuleKey } from "../src/features/projects/immersive/sceneLoader.ts";
import { getMotorLabRendererConfig } from "../src/features/projects/immersive/motorLabScene.ts";
import { createMotorStoryState, getMotorStoryFrameWindow } from "../src/features/projects/immersive/motorStoryState.ts";
import { getMotorStoryFrameSrc } from "../src/features/projects/immersive/motorStorySequence.ts";

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

test("motor milestones link valid local reports without creating dead actions", () => {
  const linkedProject = projectWith([
    {
      type: "milestone",
      date: "2026-07-29",
      title: "Encoder calibration",
      status: "current",
      media: "",
      document: "encoder-calibration-report",
      body: "Measured ripple."
    },
    { type: "milestone", date: "Next", title: "Sensorless control", status: "future", media: "", body: "Not linked yet." }
  ] as ProjectItem["narrativeBlocks"]);
  const html = renderImmersiveProject(linkedProject);

  assert.equal(getProjectDocumentRoute("encoder-calibration-report"), "#doc-detail/encoder-calibration-report");
  assert.match(html, /href="#doc-detail\/encoder-calibration-report"/);
  assert.match(html, />Read report<\/a>/);
  assert.equal((html.match(/class="immersive-project-document"/g) ?? []).length, 1);
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

test("active project chapters expose a semantic current step", () => {
  assert.equal(getChapterAriaCurrent(true), "step");
  assert.equal(getChapterAriaCurrent(false), null);
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

test("motor lab renderer caps density and enables direct manipulation", () => {
  assert.deepEqual(getMotorLabRendererConfig(3), { pixelRatio: 1.5, interactive: true });
});

test("motor lab readout keeps diagnostic and part labels stable", () => {
  assert.deepEqual(getMotorLabReadout("encoder", true), {
    modeLabel: "诊断模式",
    partLabel: "编码器与零位",
    commandLabel: "退出诊断模式"
  });
});

test("motor story progress moves through assembled, explosion, handoff, and timeline stages", () => {
  assert.deepEqual(createMotorStoryState(-1, 80), {
    progress: 0,
    frameIndex: 0,
    stage: "assembled",
    explodeProgress: 0,
    timelineProgress: 0,
    visibleLabels: []
  });

  const exploding = createMotorStoryState(0.4, 80);
  assert.equal(exploding.stage, "exploding");
  assert.equal(exploding.frameIndex, 32);
  assert.ok(exploding.explodeProgress > 0 && exploding.explodeProgress < 1);
  assert.deepEqual(exploding.visibleLabels, ["front-cover", "rotor"]);

  assert.equal(createMotorStoryState(0.74, 80).stage, "handoff");
  assert.equal(createMotorStoryState(1.4, 80).stage, "timeline");
  assert.equal(createMotorStoryState(1.4, 80).frameIndex, 79);
  assert.equal(createMotorStoryState(1.4, 80).timelineProgress, 1);
});

test("motor story preloads a bounded window around the requested frame", () => {
  assert.deepEqual(getMotorStoryFrameWindow(0, 80, 2), [0, 1, 2]);
  assert.deepEqual(getMotorStoryFrameWindow(40, 80, 2), [38, 39, 40, 41, 42]);
  assert.deepEqual(getMotorStoryFrameWindow(79, 80, 2), [77, 78, 79]);
});

test("motor story frame paths match the generated Blender sequence", () => {
  assert.equal(getMotorStoryFrameSrc(0), "/images/projects/motor-control/story/frame-0001.webp");
  assert.equal(getMotorStoryFrameSrc(79), "/images/projects/motor-control/story/frame-0080.webp");
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
