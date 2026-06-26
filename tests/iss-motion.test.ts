import assert from "node:assert/strict";
import test from "node:test";
import { createIssScenePose } from "../src/features/home/issMotion.ts";

test("ISS pose maps pointer and launch progress into bounded scene motion", () => {
  const pose = createIssScenePose({
    pointerX: 0.82,
    pointerY: 0.18,
    launchProgress: 0.64,
    time: 12.5
  });

  assert.equal(Number(pose.modelRotation.x.toFixed(3)), 0.224);
  assert.equal(Number(pose.modelRotation.y.toFixed(3)), 0.992);
  assert.equal(Number(pose.modelRotation.z.toFixed(3)), -0.035);
  assert.equal(Number(pose.cameraPosition.x.toFixed(3)), 0.768);
  assert.equal(Number(pose.cameraPosition.y.toFixed(3)), 0.544);
  assert.equal(Number(pose.cameraPosition.z.toFixed(3)), 4.804);
});

test("ISS pose falls back to a calm center when inputs are missing", () => {
  const pose = createIssScenePose({
    pointerX: null,
    pointerY: null,
    launchProgress: -4,
    time: 0
  });

  assert.deepEqual(pose.modelRotation, { x: 0, y: 0.36, z: 0 });
  assert.deepEqual(pose.cameraPosition, { x: 0, y: 0.1, z: 5.4 });
});
