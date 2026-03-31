import { profile } from "../../content/profile";

export function renderAbout(): string {
  return `
  <section class="container section">
    <h2 class="reveal">关于我</h2>
    <p class="reveal">职业身份：${profile.title}</p>
    <div class="timeline reveal">
      ${profile.timeline.map((line) => `<p>${line}</p>`).join("")}
    </div>
  </section>
  `;
}
