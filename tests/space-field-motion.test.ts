import assert from "node:assert/strict";
import test from "node:test";
import { createSpaceFieldState } from "../src/features/home/spaceFieldMotion.ts";

test("space field state turns pointer and scroll into restrained launch motion", () => {
  const state = createSpaceFieldState({
    pointerX: 0.82,
    pointerY: 0.18,
    launchProgress: 0.64
  });

  assert.equal(Number(state.cameraPosition.x.toFixed(3)), 0.224);
  assert.equal(Number(state.cameraPosition.y.toFixed(3)), 0.172);
  assert.equal(Number(state.cameraPosition.z.toFixed(3)), 5.336);
  assert.equal(Number(state.fieldRotation.x.toFixed(3)), 0.032);
  assert.equal(Number(state.fieldRotation.y.toFixed(3)), 0.173);
  assert.equal(Number(state.fieldRotation.z.toFixed(3)), -0.026);
  assert.equal(Number(state.warpStrength.toFixed(3)), 0.719);
  assert.equal(Number(state.orbitalOpacity.toFixed(3)), 0.562);
  assert.equal(Number(state.starSpeed.toFixed(3)), 0.698);
});

test("space field state stays calm when pointer and scroll inputs are absent", () => {
  const state = createSpaceFieldState({
    pointerX: null,
    pointerY: null,
    launchProgress: -4
  });

  assert.deepEqual(state.cameraPosition, { x: 0, y: 0.06, z: 6.2 });
  assert.deepEqual(state.fieldRotation, { x: 0, y: 0, z: 0 });
  assert.equal(state.warpStrength, 0.22);
  assert.equal(state.orbitalOpacity, 0.28);
  assert.equal(state.starSpeed, 0.16);
});
