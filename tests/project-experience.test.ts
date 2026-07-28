import assert from "node:assert/strict";
import test from "node:test";
import type { ProjectItem } from "../src/content/schema.ts";
import { selectProjectExperience } from "../src/features/projects/experience.ts";
import { buildProjectChapters } from "../src/features/projects/immersive/view.ts";
import { createSignalOrbitState } from "../src/features/projects/immersive/sceneState.ts";
import { getSignalOrbitRendererConfig } from "../src/features/projects/immersive/scene.ts";

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
