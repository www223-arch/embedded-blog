import assert from "node:assert/strict";
import test from "node:test";
import { createStageRevealState } from "../src/features/home/stageRevealMotion.ts";

test("stage reveal stays dormant before the launch handoff", () => {
  const state = createStageRevealState({
    scrollY: 220,
    viewportHeight: 720,
    cardCount: 4
  });

  assert.equal(state.visible, false);
  assert.equal(state.intensity, 0);
  assert.deepEqual(state.cardProgress, [0, 0, 0, 0]);
});

test("stage reveal unlocks cards in sequence after the launch handoff", () => {
  const state = createStageRevealState({
    scrollY: 520,
    viewportHeight: 720,
    cardCount: 4
  });

  assert.equal(state.visible, true);
  assert.ok(state.intensity > 0.35 && state.intensity < 0.5);
  assert.deepEqual(state.cardProgress.map((value) => Number(value.toFixed(2))), [0.82, 0.62, 0.42, 0.22]);
});
