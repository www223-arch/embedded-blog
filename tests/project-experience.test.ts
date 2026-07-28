import assert from "node:assert/strict";
import test from "node:test";
import { selectProjectExperience } from "../src/features/projects/experience.ts";

test("project experience uses the ordinary shell by default", () => {
  assert.equal(selectProjectExperience({ presentation: "standard" }), "standard");
});

test("project experience enables the immersive shell explicitly", () => {
  assert.equal(selectProjectExperience({ presentation: "immersive" }), "immersive");
});
