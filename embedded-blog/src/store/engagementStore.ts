type GameState = {
  memoryBest: number;
  reactionBest: number;
  points: number;
};

const state: GameState = {
  memoryBest: 0,
  reactionBest: 9999,
  points: 0
};

export function getGameState(): GameState {
  return { ...state };
}

export function commitMemoryResult(moves: number): void {
  if (!state.memoryBest || moves < state.memoryBest) state.memoryBest = moves;
  state.points += 10;
}

export function commitReactionResult(ms: number): void {
  if (ms < state.reactionBest) state.reactionBest = ms;
  state.points += 8;
}
