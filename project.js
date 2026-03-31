(() => {
  const data = window.PORTFOLIO_DATA || { projects: [] };
  const wrap = document.getElementById("projectDetail");
  const year = document.getElementById("year");

  function getProjectId() {
    const query = new URLSearchParams(window.location.search);
    return query.get("id");
  }

  function renderProject() {
    if (!wrap) return;
    const id = getProjectId();
    const project = data.projects.find((item) => item.id === id) || data.projects[0];

    if (!project) {
      wrap.innerHTML = "<p>未找到项目数据，请返回首页重试。</p>";
      return;
    }

    wrap.innerHTML = `
      <p class="hero-kicker">Project Detail</p>
      <h1>${project.title}</h1>
      <img class="project-detail-cover" src="${project.cover}" alt="${project.title}" loading="lazy" />
      <p>${project.description}</p>
      <h3>技术栈</h3>
      <div class="tag-list">
        ${project.stack.map((tag) => `<span class="tag">${tag}</span>`).join("")}
      </div>
      <h3>设计思路</h3>
      <ul>
        ${project.highlights.map((point) => `<li>${point}</li>`).join("")}
      </ul>
      <p style="margin-top: 24px;">
        <a class="btn btn-primary" href="./index.html#projects">回到作品展示</a>
      </p>
    `;
  }

  function setupAnimation() {
    if (!window.gsap) return;
    gsap.from("#projectDetail > *", {
      y: 16,
      opacity: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: "power2.out"
    });
  }

  function init() {
    renderProject();
    setupAnimation();
    if (year) year.textContent = String(new Date().getFullYear());
  }

  document.addEventListener("DOMContentLoaded", init);
})();
