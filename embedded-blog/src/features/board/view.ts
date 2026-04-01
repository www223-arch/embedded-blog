import { LocalMessageRepository } from "./repo";

const repo = new LocalMessageRepository();

export function renderBoard(): string {
  return `
  <div class="page-wrapper board-page">
    <section class="container section">
      <h2 class="reveal">留言板</h2>
    <p class="reveal page-intro">欢迎留下你的想法、建议或一句问候。</p>
    <form id="boardForm" class="card reveal board-form">
      <input id="boardName" maxlength="20" placeholder="你的昵称" required />
      <textarea id="boardContent" maxlength="160" placeholder="说点什么..." required></textarea>
      <button type="submit">发布留言</button>
    </form>
      <div id="boardList" class="board-list reveal"></div>
    </section>
  </div>
  `;
}

export function mountBoard(): void {
  const listNode = document.getElementById("boardList");
  const form = document.getElementById("boardForm") as HTMLFormElement | null;
  const nameInput = document.getElementById("boardName") as HTMLInputElement | null;
  const contentInput = document.getElementById("boardContent") as HTMLTextAreaElement | null;
  if (!listNode || !form || !nameInput || !contentInput) return;

  const renderList = () => {
    const items = repo.list();
    listNode.innerHTML = items.length
      ? items
          .map(
            (item) => `
          <article class="card board-item">
            <div class="board-meta">${escapeHtml(item.name)} · ${new Date(item.createdAt).toLocaleString()}</div>
            <p>${escapeHtml(item.content)}</p>
          </article>
        `
          )
          .join("")
      : `<article class="card board-item"><p>还没有留言，来留下第一条吧。</p></article>`;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!nameInput.value.trim() || !contentInput.value.trim()) return;
    repo.add({ name: nameInput.value, content: contentInput.value });
    contentInput.value = "";
    renderList();
  });

  renderList();
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
