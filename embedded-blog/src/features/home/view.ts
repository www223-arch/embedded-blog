import { profile } from "../../content/profile";

export function renderHome(): string {
  return `
  <div class="home-container">
    <div class="home-background"></div>
    <div class="home-foreground">
      <section class="hero reveal">
        <div class="hero-mask"></div>
        <canvas id="heroParticles" class="hero-particles" aria-hidden="true"></canvas>
        <div class="rocket-container">
          <div class="rocket">
            <div class="rocket-nose"></div>
            <div class="rocket-body">
              <div class="rocket-window"></div>
              <div class="rocket-stripe"></div>
            </div>
            <div class="rocket-fins">
              <div class="rocket-fin fin-left"></div>
              <div class="rocket-fin fin-right"></div>
              <div class="rocket-fin fin-center"></div>
            </div>
            <div class="rocket-engine">
              <div class="engine-nozzle"></div>
            </div>
            <div class="rocket-exhaust">
              <div class="exhaust-core"></div>
              <div class="exhaust-inner"></div>
              <div class="exhaust-outer"></div>
              <div class="exhaust-particles"></div>
            </div>

          </div>
        </div>
        <div class="container">
          <p class="mono" id="lineHello"></p>
          <p class="mono" id="lineIam"></p>
          <div class="role-line">
            <span id="lineRole"></span><span class="cursor">|</span>
          </div>
        </div>
      </section>
      <section class="section nav-stage" id="navStage">
        <div class="container">
          <div class="stage-grid">
            <article class="card stage-card stage-docs" data-route="docs">
              <h3>技术文档</h3>
              <p>按领域分类整理，支持持续更新。</p>
            </article>
            <article class="card stage-card stage-projects" data-route="projects">
              <h3>项目案例</h3>
              <p>从系统设计到调试经验的完整复盘。</p>
            </article>
            <article class="card stage-card stage-life" data-route="life">
              <h3>个人分享</h3>
              <p>摄影、生活、阅读与成长记录。</p>
            </article>
            <article class="card stage-card stage-board" data-route="board">
              <h3>留言板</h3>
              <p>欢迎交流想法，留下你的一句话。</p>
            </article>
          </div>
        </div>
      </section>
    </div>
  </div>`;
}
