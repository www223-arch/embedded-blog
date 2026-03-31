(() => {
  const state = window.PORTFOLIO_DATA || { projects: [], techDocs: [], timeline: [] };

  const els = {
    projectGrid: document.getElementById("projectGrid"),
    docGrid: document.getElementById("docGrid"),
    docTabs: document.getElementById("docTabs"),
    docPanelTitle: document.getElementById("docPanelTitle"),
    docPanelDesc: document.getElementById("docPanelDesc"),
    timelineWrap: document.getElementById("timelineWrap"),
    navToggle: document.getElementById("navToggle"),
    navList: document.getElementById("navList"),
    year: document.getElementById("year"),
    lineHello: document.getElementById("lineHello"),
    lineIam: document.getElementById("lineIam"),
    lineRole: document.getElementById("lineRole")
  };

  function renderProjects() {
    if (!els.projectGrid) return;
    els.projectGrid.innerHTML = state.projects
      .map(
        (item) => `
        <article class="project-card reveal">
          <img class="project-cover" src="${item.cover}" alt="${item.title}" loading="lazy" />
          <div class="project-body">
            <h3>${item.title}</h3>
            <p>${item.summary}</p>
            <a class="project-link" href="./project.html?id=${item.id}">查看详情 →</a>
          </div>
        </article>
      `
      )
      .join("");
  }

  function renderDocCards(doc) {
    if (!els.docGrid) return;
    const docs = Array.isArray(doc.docs) && doc.docs.length
      ? doc.docs
      : doc.tags.map((tag) => ({
          title: `${tag} 实践笔记`,
          summary: `围绕 ${tag} 的项目经验、调试方法与工程注意事项。`,
          level: "文档",
          link: "#"
        }));

    els.docGrid.innerHTML = docs
      .map(
        (item) => `
        <article class="doc-card doc-live-card">
          <div class="doc-card-top">
            <span class="doc-pill">${item.level}</span>
            <span class="doc-arrow">↗</span>
          </div>
          <h4>${item.title}</h4>
          <p>${item.summary}</p>
          <a class="doc-link" href="${item.link}">阅读文档</a>
        </article>
      `
      )
      .join("");
  }

  function renderDocs() {
    if (!els.docGrid || !els.docTabs || !state.techDocs.length) return;

    const activate = (index) => {
      const current = state.techDocs[index];
      if (!current) return;

      els.docTabs.querySelectorAll(".doc-tab").forEach((tab, tabIndex) => {
        tab.classList.toggle("active", tabIndex === index);
      });

      if (els.docPanelTitle) els.docPanelTitle.textContent = current.category;
      if (els.docPanelDesc) {
        els.docPanelDesc.textContent = current.description || "当前分类下的文档索引。";
      }

      if (window.gsap) {
        gsap.to(els.docGrid, {
          opacity: 0,
          y: 10,
          duration: 0.16,
          ease: "power1.out",
          onComplete: () => {
            renderDocCards(current);
            gsap.fromTo(
              ".doc-live-card",
              { opacity: 0, y: 16 },
              { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power2.out" }
            );
            gsap.to(els.docGrid, { opacity: 1, y: 0, duration: 0.25, ease: "power1.out" });
          }
        });
      } else {
        renderDocCards(current);
      }
    };

    els.docTabs.innerHTML = state.techDocs
      .map(
        (doc, index) => `
        <button class="doc-tab ${index === 0 ? "active" : ""}" data-index="${index}">
          <span>${doc.category}</span>
          <small>${doc.tags.length} Topics</small>
        </button>
      `
      )
      .join("");

    els.docTabs.querySelectorAll(".doc-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.index || 0);
        activate(index);
      });
    });

    renderDocCards(state.techDocs[0]);
    activate(0);
  }

  function renderTimeline() {
    if (!els.timelineWrap) return;
    els.timelineWrap.innerHTML = state.timeline
      .map(
        (item) => `
        <article class="timeline-item reveal">
          <strong>${item.title}</strong>
          <div class="timeline-meta">${item.time}</div>
          <p>${item.detail}</p>
        </article>
      `
      )
      .join("");
  }

  function setupNav() {
    if (!els.navToggle || !els.navList) return;
    els.navToggle.addEventListener("click", () => {
      els.navList.classList.toggle("open");
    });

    els.navList.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        els.navList.classList.remove("open");
      });
    });
  }

  function setupActiveLink() {
    const links = [...document.querySelectorAll('.nav-list a[href^="#"]')];
    const sections = links
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = `#${entry.target.id}`;
          links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === id));
        });
      },
      { threshold: 0.45 }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function setupGsap() {
    if (!window.gsap) return;
    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
    }

    gsap.from(".type-line, .hero-actions", {
      y: 18,
      opacity: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: "power2.out"
    });

    gsap.utils.toArray(".reveal").forEach((el) => {
      gsap.from(el, {
        y: 22,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: window.ScrollTrigger
          ? { trigger: el, start: "top 85%", toggleActions: "play none none none" }
          : undefined
      });
    });
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function typeText(el, text, speed = 90) {
    if (!el) return;
    for (let i = 0; i < text.length; i += 1) {
      el.textContent += text[i];
      await wait(speed + Math.random() * 30);
    }
  }

  async function eraseText(el, speed = 45) {
    if (!el) return;
    while (el.textContent.length > 0) {
      el.textContent = el.textContent.slice(0, -1);
      await wait(speed);
    }
  }

  async function setupTypewriter() {
    if (!els.lineHello || !els.lineIam || !els.lineRole) return;

    const roles = ["Embedded Engineer", "Photographer", "Dreamer"];

    els.lineHello.textContent = "";
    els.lineIam.textContent = "";
    els.lineRole.textContent = "";

    await typeText(els.lineHello, "Hello world,", 95);
    await wait(220);
    await typeText(els.lineIam, "I am WL, I want to become", 78);
    await wait(240);

    while (true) {
      for (const role of roles) {
        await typeText(els.lineRole, role, 85);
        await wait(900);
        await eraseText(els.lineRole, 48);
        await wait(180);
      }
    }
  }

  function init() {
    renderProjects();
    renderDocs();
    renderTimeline();
    setupNav();
    setupActiveLink();
    setupGsap();
    setupTypewriter();
    if (els.year) els.year.textContent = String(new Date().getFullYear());
  }

  document.addEventListener("DOMContentLoaded", init);
})();
