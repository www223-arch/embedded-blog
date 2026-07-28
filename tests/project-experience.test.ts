import assert from "node:assert/strict";
import test from "node:test";
import type { ProjectItem } from "../src/content/schema.ts";
import { selectProjectExperience } from "../src/features/projects/experience.ts";
import { buildProjectChapters } from "../src/features/projects/immersive/view.ts";

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
