import { profile } from "../../content/profile";

export function renderHome(): string {
  return `
  <section class="hero reveal">
    <div class="hero-mask"></div>
    <div class="container">
      <p class="mono" id="lineHello"></p>
      <p class="mono" id="lineIam"></p>
      <p class="mono mono-strong"><span id="lineRole"></span><span class="cursor">|</span></p>
      <p class="hero-intro">${profile.intro}</p>
    </div>
  </section>
  <section class="container section nav-stage reveal" id="navStage">
    <h2>导航舞台</h2>
    <p class="page-intro">向下探索：文档沉淀、项目实践、生活分享、留言互动。</p>
    <div class="grid-two stage-grid">
      <article class="card stage-card" data-route="docs">
        <h3>技术文档</h3>
        <p>按领域分类整理，支持持续更新。</p>
      </article>
      <article class="card stage-card" data-route="projects">
        <h3>项目案例</h3>
        <p>从系统设计到调试经验的完整复盘。</p>
      </article>
      <article class="card stage-card" data-route="life">
        <h3>个人分享</h3>
        <p>摄影、生活、阅读与成长记录。</p>
      </article>
      <article class="card stage-card" data-route="board">
        <h3>留言板</h3>
        <p>欢迎交流想法，留下你的一句话。</p>
      </article>
    </div>
    <div id="petDock" class="pet-dock" aria-label="pet dock"></div>
  </section>`;
}
