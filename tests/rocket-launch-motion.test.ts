import assert from "node:assert/strict";
import test from "node:test";
import { createRocketLaunchState } from "../src/features/home/rocketLaunchMotion.ts";

test("rocket launch motion keeps the rocket in the tunnel through the middle scroll range", () => {
  const state = createRocketLaunchState({
    scrollY: 360,
    viewportHeight: 720
  });

  assert.equal(state.phase, "launch");
  assert.ok(state.translateY > -90 && state.translateY < -60);
  assert.ok(state.scale > 0.96 && state.scale < 0.98);
  assert.ok(state.opacity > 0.91 && state.opacity < 0.94);
});

test("rocket launch motion settles into the jet phase before takeoff", () => {
  const state = createRocketLaunchState({
    scrollY: 120,
    viewportHeight: 720
  });

  assert.equal(state.phase, "jet");
  assert.ok(state.translateY > 3 && state.translateY < 5);
  assert.equal(state.scale, 1);
  assert.equal(state.opacity, 1);
});
