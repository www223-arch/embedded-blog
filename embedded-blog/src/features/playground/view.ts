export function renderPlayground(): string {
  return `
  <section class="container section playground-page">
    <h2 class="reveal">趣味实验室</h2>
    <div class="grid-two">
      <article class="card reveal">
        <h3>小游戏 1: Memory Flip</h3>
        <p>点击卡片配对，记录最少步数。</p>
        <div id="memoryGame" class="memory-grid"></div>
        <p id="memoryStatus">moves: 0</p>
      </article>
      <article class="card reveal">
        <h3>小游戏 2: Reaction Test</h3>
        <p>点击开始后，看到绿色立刻点击。</p>
        <button id="reactionBtn">Start</button>
        <p id="reactionStatus">wait...</p>
      </article>
    </div>
    <article class="card reveal">
      <h3>成就与积分</h3>
      <p id="scoreBoard">points: 0 | best memory: - | best reaction: -</p>
    </article>
  </section>
  `;
}
