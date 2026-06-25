import {
  AlertCircle,
  BookOpenText,
  CheckCircle2,
  ExternalLink,
  FileText,
  FolderKanban,
  Image,
  ListFilter,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
  createElement,
  type IconNode
} from "lucide";
import { renderMarkdown } from "../../../src/content-core/markdown.ts";
import "../../../src/styles/components/sidebar.css";
import "./styles.css";

type ContentType = "docs" | "projects" | "life";
type ContentStatus = "draft" | "published" | "archived";
type ProjectStage = "concept" | "building" | "completed" | "maintained" | "paused";
type PreviewTab = "preview" | "checks" | "assets";
type FieldKind = "text" | "textarea" | "select" | "csv" | "lines";
type AssetKind = "images" | "videos";

type ContentSummary = {
  type: ContentType;
  id: string;
  title: string;
  summary: string;
  status: ContentStatus;
  projectStage: ProjectStage | null;
  category: string;
  tags: string[];
  updatedAt: string;
  relativePath: string;
};

type ContentDetail = ContentSummary & {
  frontmatter: Record<string, unknown>;
  markdown: string;
  modifiedAt: string;
};

type FieldDef = {
  key: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  readonly?: boolean;
  wide?: boolean;
};

type BrowserDraft = {
  savedAt: string;
  modifiedAt: string;
  frontmatter: Record<string, unknown>;
  markdown: string;
};

type AssetItem = {
  kind: AssetKind;
  name: string;
  path: string;
  url: string;
  size: number;
  modifiedAt: string;
};

const iconNodes = {
  "alert-circle": AlertCircle,
  "book-open-text": BookOpenText,
  "check-circle-2": CheckCircle2,
  "external-link": ExternalLink,
  "file-text": FileText,
  "folder-kanban": FolderKanban,
  image: Image,
  "list-filter": ListFilter,
  plus: Plus,
  "refresh-cw": RefreshCw,
  "rotate-ccw": RotateCcw,
  save: Save,
  search: Search,
  trash: Trash2,
  x: X
} satisfies Record<string, IconNode>;

type IconName = keyof typeof iconNodes;

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Missing app root");

const state: {
  items: ContentSummary[];
  selected: ContentDetail | null;
  type: "all" | ContentType;
  status: "all" | ContentStatus;
  query: string;
  previewTab: PreviewTab;
  dirty: boolean;
  saving: boolean;
  creating: boolean;
  uploadingAsset: boolean;
  assets: AssetItem[];
  createIdTouched: boolean;
  recoveryDraft: BrowserDraft | null;
} = {
  items: [],
  selected: null,
  type: "all",
  status: "all",
  query: "",
  previewTab: "preview",
  dirty: false,
  saving: false,
  creating: false,
  uploadingAsset: false,
  assets: [],
  createIdTouched: false,
  recoveryDraft: null
};

app.innerHTML = `
  <div class="studio-shell">
    <header class="studio-header">
      <div class="studio-brand">
        <span class="studio-mark">${icon("book-open-text")}</span>
        <div>
          <strong>Content Studio</strong>
          <span>Local workspace</span>
        </div>
      </div>
      <div class="studio-header-actions">
        <span class="mode-badge editable"><span></span>可编辑</span>
        <button class="command-button" id="newContentButton" type="button">
          ${icon("plus")}<span>新建</span>
        </button>
        <button class="icon-button" id="refreshButton" type="button" title="刷新内容" aria-label="刷新内容">
          ${icon("refresh-cw")}
        </button>
        <button class="command-button primary" id="saveButton" type="button" disabled>
          ${icon("save")}<span>保存</span>
        </button>
        <a class="command-button" href="http://127.0.0.1:5173/embedded-blog/" target="_blank" rel="noreferrer">
          ${icon("external-link")}<span>打开主站</span>
        </a>
      </div>
    </header>

    <main class="studio-workspace">
      <aside class="content-browser">
        <div class="pane-heading">
          <div><span>CONTENT</span><strong>内容库</strong></div>
          <span id="contentCount">0</span>
        </div>
        <div class="type-switch" role="tablist" aria-label="内容类型">
          <button class="active" type="button" data-type="all">${icon("list-filter")}<span>全部</span></button>
          <button type="button" data-type="docs">${icon("file-text")}<span>文档</span></button>
          <button type="button" data-type="projects">${icon("folder-kanban")}<span>项目</span></button>
          <button type="button" data-type="life">${icon("image")}<span>分享</span></button>
        </div>
        <label class="search-field">
          ${icon("search")}
          <input id="searchInput" type="search" placeholder="搜索标题、ID、标签" autocomplete="off" />
        </label>
        <label class="filter-field">
          <span>状态</span>
          <select id="statusFilter">
            <option value="all">全部状态</option>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="archived">已归档</option>
          </select>
        </label>
        <div class="content-list" id="contentList" aria-live="polite"></div>
      </aside>

      <section class="editor-pane">
        <div class="pane-heading editor-heading">
          <div><span>EDITOR</span><strong id="editorTitle">选择内容</strong></div>
          <span class="disk-state" id="diskState">磁盘内容</span>
        </div>
        <div class="draft-banner" id="draftBanner" hidden>
          <div>
            <strong>发现浏览器草稿</strong>
            <span id="draftInfo"></span>
          </div>
          <button type="button" id="recoverDraftButton">${icon("rotate-ccw")}恢复</button>
          <button type="button" id="discardDraftButton">${icon("trash")}丢弃</button>
        </div>
        <div class="save-message" id="saveMessage" hidden></div>
        <div class="editor-empty" id="editorEmpty">
          ${icon("file-text")}
          <strong>选择一项内容</strong>
        </div>
        <div class="editor-content" id="editorContent" hidden>
          <div class="field-grid" id="metadataFields"></div>
          <div class="markdown-heading">
            <label for="markdownSource">Markdown</label>
            <span id="markdownStats"></span>
          </div>
          <textarea id="markdownSource" spellcheck="false"></textarea>
        </div>
      </section>

      <aside class="preview-pane">
        <div class="preview-tabs" role="tablist" aria-label="预览模式">
          <button class="active" type="button" data-preview-tab="preview">详情预览</button>
          <button type="button" data-preview-tab="checks">检查</button>
          <button type="button" data-preview-tab="assets">素材</button>
        </div>
        <div class="preview-empty" id="previewEmpty">
          ${icon("book-open-text")}
        </div>
        <div class="preview-scroll" id="previewContent" hidden></div>
        <div class="checks-panel" id="checksPanel" hidden></div>
        <div class="assets-panel" id="assetsPanel" hidden>
          <div class="asset-toolbar">
            <input id="assetInput" type="file" accept=".jpg,.jpeg,.png,.webp,.avif,.gif,.svg,.mp4,.webm,image/*,video/mp4,video/webm" multiple hidden />
            <button class="command-button primary" id="uploadAssetButton" type="button">${icon("plus")}<span>上传素材</span></button>
            <span id="assetHint">图片/GIF 15MB 内，小视频 30MB 内</span>
          </div>
          <div class="asset-list" id="assetList"></div>
          <div class="gallery-manager" id="galleryManager"></div>
        </div>
      </aside>
    </main>

    <div class="modal-backdrop" id="createModal" hidden>
      <form class="create-dialog" id="createContentForm">
        <header>
          <div>
            <span>NEW</span>
            <strong>新建内容</strong>
          </div>
          <button class="icon-button" id="createCloseButton" type="button" title="关闭" aria-label="关闭">${icon("x")}</button>
        </header>
        <div class="create-grid">
          <label>
            <span>类型</span>
            <select id="createType">
              <option value="docs">技术文档</option>
              <option value="projects">项目作品</option>
              <option value="life">个人分享</option>
            </select>
          </label>
          <label>
            <span>ID</span>
            <input id="createId" autocomplete="off" />
          </label>
          <label class="field-wide">
            <span>标题</span>
            <input id="createTitle" autocomplete="off" required />
          </label>
          <label class="field-wide">
            <span>摘要</span>
            <textarea id="createSummary" required></textarea>
          </label>
          <label id="createMetaField">
            <span id="createMetaLabel">分类</span>
            <input id="createMeta" autocomplete="off" />
          </label>
          <label id="createStageField" hidden>
            <span>项目阶段</span>
            <select id="createProjectStage">
              <option value="building">building</option>
              <option value="concept">concept</option>
              <option value="completed">completed</option>
              <option value="maintained">maintained</option>
              <option value="paused">paused</option>
            </select>
          </label>
        </div>
        <div class="create-path-preview" id="createPathPreview"></div>
        <div class="create-error" id="createError" hidden></div>
        <footer>
          <button class="command-button" id="createCancelButton" type="button">取消</button>
          <button class="command-button primary" id="createSubmitButton" type="submit">
            ${icon("plus")}<span>创建草稿</span>
          </button>
        </footer>
      </form>
    </div>
  </div>
`;

bindControls();
void loadContent();

function bindControls(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-type]").forEach((button) => {
    button.addEventListener("click", () => {
      state.type = button.dataset.type as typeof state.type;
      document.querySelectorAll("[data-type]").forEach((node) => node.classList.toggle("active", node === button));
      renderList();
    });
  });

  document.querySelector<HTMLInputElement>("#searchInput")?.addEventListener("input", (event) => {
    state.query = (event.currentTarget as HTMLInputElement).value.trim().toLowerCase();
    renderList();
  });

  document.querySelector<HTMLSelectElement>("#statusFilter")?.addEventListener("change", (event) => {
    state.status = (event.currentTarget as HTMLSelectElement).value as typeof state.status;
    renderList();
  });

  document.querySelector("#newContentButton")?.addEventListener("click", openCreateDialog);
  document.querySelector("#refreshButton")?.addEventListener("click", () => void loadContent(state.selected));
  document.querySelector("#saveButton")?.addEventListener("click", () => void saveCurrentContent());
  document.querySelector("#recoverDraftButton")?.addEventListener("click", recoverBrowserDraft);
  document.querySelector("#discardDraftButton")?.addEventListener("click", discardBrowserDraft);
  document.querySelector("#uploadAssetButton")?.addEventListener("click", () => document.querySelector<HTMLInputElement>("#assetInput")?.click());
  document.querySelector("#assetInput")?.addEventListener("change", (event) => {
    const input = event.currentTarget as HTMLInputElement;
    void uploadAssets(input.files);
    input.value = "";
  });
  document.querySelector("#createCloseButton")?.addEventListener("click", closeCreateDialog);
  document.querySelector("#createCancelButton")?.addEventListener("click", closeCreateDialog);
  document.querySelector("#createContentForm")?.addEventListener("submit", (event) => void createContentFromDialog(event));
  document.querySelector("#createType")?.addEventListener("change", () => {
    state.createIdTouched = false;
    updateCreateDialogFields();
  });
  document.querySelector("#createTitle")?.addEventListener("input", () => {
    updateCreateIdFromTitle();
    updateCreatePathPreview();
  });
  document.querySelector("#createId")?.addEventListener("input", () => {
    state.createIdTouched = true;
    updateCreatePathPreview();
  });

  document.querySelectorAll<HTMLButtonElement>("[data-preview-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.previewTab = button.dataset.previewTab as PreviewTab;
      document.querySelectorAll("[data-preview-tab]").forEach((node) => node.classList.toggle("active", node === button));
      renderPreview();
      if (state.previewTab === "assets" && state.selected) void loadAssets(state.selected);
    });
  });

  document.querySelector("#previewContent")?.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".doc-code-copy");
    if (!button) return;
    const code = button.closest(".doc-code-block")?.querySelector("code");
    if (code) void copyCode(button, code);
  });

  document.querySelector("#assetList")?.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-asset-action]");
    if (!button) return;
    const asset = state.assets.find((item) => item.url === button.dataset.assetUrl);
    if (!asset) return;
    if (button.dataset.assetAction === "insert") insertAssetIntoMarkdown(asset);
    if (button.dataset.assetAction === "gallery") addAssetToGallery(asset);
    if (button.dataset.assetAction === "cover") setAssetAsCover(asset);
    if (button.dataset.assetAction === "delete") void deleteAsset(asset);
  });

  document.querySelector("#galleryManager")?.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-gallery-action]");
    const index = Number(button?.dataset.galleryIndex);
    if (!button || !Number.isInteger(index)) return;
    if (button.dataset.galleryAction === "up") moveGalleryItem(index, -1);
    if (button.dataset.galleryAction === "down") moveGalleryItem(index, 1);
    if (button.dataset.galleryAction === "remove") removeGalleryItem(index);
  });
}

function openCreateDialog(): void {
  persistBrowserDraft();
  state.createIdTouched = false;
  setCreateError("");
  const type = state.type === "all" ? "docs" : state.type;
  const modal = document.querySelector<HTMLElement>("#createModal");
  const typeSelect = document.querySelector<HTMLSelectElement>("#createType");
  const titleInput = document.querySelector<HTMLInputElement>("#createTitle");
  const summaryInput = document.querySelector<HTMLTextAreaElement>("#createSummary");
  if (!modal || !typeSelect || !titleInput || !summaryInput) return;

  typeSelect.value = type;
  titleInput.value = "";
  summaryInput.value = defaultCreateSummary(type);
  modal.hidden = false;
  updateCreateDialogFields();
  titleInput.focus();
}

function closeCreateDialog(): void {
  if (state.creating) return;
  const modal = document.querySelector<HTMLElement>("#createModal");
  if (modal) modal.hidden = true;
  setCreateError("");
}

async function createContentFromDialog(event: Event): Promise<void> {
  event.preventDefault();
  if (state.creating) return;

  const type = currentCreateType();
  const title = document.querySelector<HTMLInputElement>("#createTitle")?.value.trim() ?? "";
  const id = createIdSuggestion(document.querySelector<HTMLInputElement>("#createId")?.value ?? title);
  const summary = document.querySelector<HTMLTextAreaElement>("#createSummary")?.value.trim() ?? "";
  const meta = document.querySelector<HTMLInputElement>("#createMeta")?.value.trim() ?? "";
  const projectStage = document.querySelector<HTMLSelectElement>("#createProjectStage")?.value ?? "building";

  if (!title) {
    setCreateError("标题不能为空。");
    return;
  }
  if (!summary) {
    setCreateError("摘要不能为空。");
    return;
  }

  state.creating = true;
  updateCreateSubmitState();
  setCreateError("");

  try {
    const response = await fetch(`/api/content/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title, summary, meta, projectStage })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || "创建失败");

    closeCreateDialogAfterSuccess();
    state.type = payload.item.type;
    state.status = "all";
    state.query = "";
    syncFilterControls();
    await loadContent(payload.item);
    setSaveMessage(`已创建：${payload.paths.markdown}；素材目录：${payload.paths.images}`);
  } catch (error) {
    setCreateError(error instanceof Error ? error.message : "创建失败");
  } finally {
    state.creating = false;
    updateCreateSubmitState();
  }
}

function closeCreateDialogAfterSuccess(): void {
  const modal = document.querySelector<HTMLElement>("#createModal");
  if (modal) modal.hidden = true;
  setCreateError("");
}

function updateCreateDialogFields(): void {
  const type = currentCreateType();
  const metaLabel = document.querySelector("#createMetaLabel");
  const metaInput = document.querySelector<HTMLInputElement>("#createMeta");
  const stageField = document.querySelector<HTMLElement>("#createStageField");
  const summaryInput = document.querySelector<HTMLTextAreaElement>("#createSummary");
  if (metaLabel) metaLabel.textContent = type === "projects" ? "技术栈" : type === "life" ? "标签" : "分类";
  if (metaInput) metaInput.value = defaultCreateMeta(type);
  if (stageField) stageField.hidden = type !== "projects";
  if (summaryInput && !summaryInput.value.trim()) summaryInput.value = defaultCreateSummary(type);
  updateCreateIdFromTitle();
  updateCreatePathPreview();
}

function updateCreateIdFromTitle(): void {
  if (state.createIdTouched) return;
  const titleInput = document.querySelector<HTMLInputElement>("#createTitle");
  const idInput = document.querySelector<HTMLInputElement>("#createId");
  if (!titleInput || !idInput) return;
  idInput.value = createIdSuggestion(titleInput.value || defaultCreateTitle(currentCreateType()));
}

function updateCreatePathPreview(): void {
  const preview = document.querySelector("#createPathPreview");
  const idInput = document.querySelector<HTMLInputElement>("#createId");
  if (!preview || !idInput) return;
  const type = currentCreateType();
  const id = createIdSuggestion(idInput.value || defaultCreateTitle(type));
  preview.textContent = `${contentDirectory(type)}/${id}.md · public/images/${contentDirectory(type)}/${id}/`;
}

function updateCreateSubmitState(): void {
  const button = document.querySelector<HTMLButtonElement>("#createSubmitButton");
  if (!button) return;
  button.disabled = state.creating;
  const label = button.querySelector("span");
  if (label) label.textContent = state.creating ? "创建中" : "创建草稿";
}

function setCreateError(message: string): void {
  const target = document.querySelector<HTMLElement>("#createError");
  if (!target) return;
  target.hidden = !message;
  target.textContent = message;
}

function currentCreateType(): ContentType {
  const value = document.querySelector<HTMLSelectElement>("#createType")?.value;
  return value === "projects" || value === "life" ? value : "docs";
}

function syncFilterControls(): void {
  document.querySelectorAll("[data-type]").forEach((node) => {
    node.classList.toggle("active", (node as HTMLElement).dataset.type === state.type);
  });
  const statusFilter = document.querySelector<HTMLSelectElement>("#statusFilter");
  const searchInput = document.querySelector<HTMLInputElement>("#searchInput");
  if (statusFilter) statusFilter.value = state.status;
  if (searchInput) searchInput.value = state.query;
}

async function loadContent(reselect: ContentDetail | null = null): Promise<void> {
  setLoading(true);
  try {
    const response = await fetch("/api/content", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || "内容加载失败");
    state.items = payload.items;
    renderList();

    const target = reselect && state.items.find((item) => item.type === reselect.type && item.id === reselect.id);
    if (target) await selectContent(target);
    else if (!state.selected && state.items.length) await selectContent(state.items[0]);
  } catch (error) {
    renderListError(error instanceof Error ? error.message : "内容加载失败");
  } finally {
    setLoading(false);
  }
}

function renderList(): void {
  const list = document.querySelector<HTMLDivElement>("#contentList");
  const count = document.querySelector("#contentCount");
  if (!list || !count) return;

  const filtered = state.items.filter((item) => {
    const typeMatches = state.type === "all" || item.type === state.type;
    const statusMatches = state.status === "all" || item.status === state.status;
    const haystack = [item.title, item.id, item.summary, item.category, ...item.tags].join(" ").toLowerCase();
    return typeMatches && statusMatches && (!state.query || haystack.includes(state.query));
  });

  count.textContent = String(filtered.length);
  if (!filtered.length) {
    list.innerHTML = `<div class="list-empty">没有匹配内容</div>`;
    return;
  }

  list.innerHTML = filtered
    .map(
      (item) => `
        <button class="content-row ${state.selected?.id === item.id && state.selected.type === item.type ? "active" : ""}" type="button"
          data-content-type="${item.type}" data-content-id="${escapeAttribute(item.id)}">
          <span class="content-type-icon">${icon(typeIcon(item.type))}</span>
          <span class="content-row-main">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.category || item.id)} · ${escapeHtml(item.updatedAt)}</span>
          </span>
          <span class="status-dot status-${item.status}" title="${statusLabel(item.status)}"></span>
        </button>
      `
    )
    .join("");

  list.querySelectorAll<HTMLButtonElement>(".content-row").forEach((button) => {
    button.addEventListener("click", () => {
      const item = state.items.find(
        (candidate) => candidate.type === button.dataset.contentType && candidate.id === button.dataset.contentId
      );
      if (item) void selectContent(item);
    });
  });
}

async function selectContent(summary: ContentSummary): Promise<void> {
  persistBrowserDraft();
  try {
    const response = await fetch(`/api/content/${summary.type}/${encodeURIComponent(summary.id)}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || "内容读取失败");
    const detail = payload.item as ContentDetail;
    state.selected = detail;
    state.dirty = false;
    state.recoveryDraft = getNewerBrowserDraft(detail);
    state.assets = [];
    setSaveMessage("");
    renderList();
    renderEditor();
    renderRecoveryBanner();
    renderPreview();
    updateSaveState();
    void loadAssets(detail);
  } catch (error) {
    renderListError(error instanceof Error ? error.message : "内容读取失败");
  }
}

async function loadAssets(detail: ContentDetail): Promise<void> {
  try {
    const response = await fetch(`/api/assets/${detail.type}/${encodeURIComponent(detail.id)}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || "素材加载失败");
    if (!state.selected || state.selected.type !== detail.type || state.selected.id !== detail.id) return;
    state.assets = payload.assets;
    renderAssets();
  } catch (error) {
    renderAssetError(error instanceof Error ? error.message : "素材加载失败");
  }
}

async function uploadAssets(files: FileList | null): Promise<void> {
  if (!state.selected || !files?.length || state.uploadingAsset) return;
  state.uploadingAsset = true;
  updateAssetUploadState();
  setSaveMessage("正在上传素材...");

  try {
    for (const file of Array.from(files)) {
      validateClientAsset(file);
      const dataBase64 = await fileToBase64(file);
      const response = await fetch(`/api/assets/${state.selected.type}/${encodeURIComponent(state.selected.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          dataBase64
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "素材上传失败");
      state.assets = payload.assets;
    }
    renderAssets();
    setSaveMessage("素材已上传。可以插入正文，或加入项目图集。");
  } catch (error) {
    setSaveMessage(error instanceof Error ? error.message : "素材上传失败", true);
  } finally {
    state.uploadingAsset = false;
    updateAssetUploadState();
  }
}

async function deleteAsset(asset: AssetItem): Promise<void> {
  if (!state.selected) return;
  const confirmed = window.confirm(`删除素材 ${asset.name}？\n\n如果正文里已经引用了它，请先手动移除对应 Markdown。`);
  if (!confirmed) return;

  try {
    const response = await fetch(`/api/assets/${state.selected.type}/${encodeURIComponent(state.selected.id)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: asset.url })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || "删除素材失败。");
    state.assets = payload.assets;
    detachDeletedAssetReferences(asset.url);
    renderAssets();
    renderPreview();
    setSaveMessage("素材已删除。若已从封面或图集中移除，请保存内容。");
  } catch (error) {
    renderAssetError(error instanceof Error ? error.message : "删除素材失败。");
  }
}

function renderEditor(): void {
  const detail = state.selected;
  const empty = document.querySelector<HTMLElement>("#editorEmpty");
  const content = document.querySelector<HTMLElement>("#editorContent");
  const title = document.querySelector("#editorTitle");
  const fields = document.querySelector<HTMLDivElement>("#metadataFields");
  const source = document.querySelector<HTMLTextAreaElement>("#markdownSource");
  if (!empty || !content || !title || !fields || !source || !detail) return;

  empty.hidden = true;
  content.hidden = false;
  title.textContent = detail.title;
  fields.innerHTML = metadataFor(detail).map(renderField).join("");
  bindFieldInputs(fields);
  source.value = detail.markdown.trim();
  source.oninput = () => {
    if (!state.selected) return;
    state.selected.markdown = source.value;
    markDirty();
  };
  updateMarkdownStats();
}

function renderField(field: FieldDef): string {
  const value = fieldValue(field);
  const attrs = `data-field-key="${escapeAttribute(field.key)}" data-field-kind="${field.kind}" ${field.readonly ? "readonly disabled" : ""}`;
  const label = `<span>${escapeHtml(field.label)}</span>`;
  const className = field.wide ? "field-wide" : "";
  if (field.kind === "textarea" || field.kind === "lines") {
    return `<label class="${className}">${label}<textarea ${attrs}>${escapeHtml(value)}</textarea></label>`;
  }
  if (field.kind === "select") {
    const options = (field.options ?? []).map((option) => `<option value="${escapeAttribute(option)}" ${option === value ? "selected" : ""}>${escapeHtml(option)}</option>`).join("");
    return `<label class="${className}">${label}<select ${attrs}>${options}</select></label>`;
  }
  return `<label class="${className}">${label}<input ${attrs} value="${escapeAttribute(value)}" /></label>`;
}

function bindFieldInputs(container: HTMLElement): void {
  container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("[data-field-key]").forEach((field) => {
    if (field.hasAttribute("disabled")) return;
    field.addEventListener("input", () => updateField(field));
    field.addEventListener("change", () => updateField(field));
  });
}

function updateField(field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): void {
  if (!state.selected) return;
  const key = field.dataset.fieldKey;
  const kind = field.dataset.fieldKind as FieldKind | undefined;
  if (!key || !kind) return;
  state.selected.frontmatter[key] = parseFieldValue(field.value, kind);
  syncSelectedSummary();
  markDirty();
}

function markDirty(): void {
  if (!state.selected) return;
  state.dirty = true;
  persistBrowserDraft();
  renderList();
  renderPreview();
  updateMarkdownStats();
  updateSaveState();
}

async function saveCurrentContent(): Promise<void> {
  if (!state.selected || state.saving) return;
  state.saving = true;
  updateSaveState();
  setSaveMessage("正在保存...");

  try {
    const response = await fetch(`/api/content/${state.selected.type}/${encodeURIComponent(state.selected.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        frontmatter: state.selected.frontmatter,
        markdown: state.selected.markdown,
        expectedModifiedAt: state.selected.modifiedAt
      })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || "保存失败");

    state.selected = payload.item;
    state.items = state.items.map((item) =>
      item.type === payload.item.type && item.id === payload.item.id ? toSummary(payload.item) : item
    );
    state.dirty = false;
    state.recoveryDraft = null;
    removeBrowserDraft(payload.item);
    renderList();
    renderEditor();
    renderRecoveryBanner();
    renderPreview();
    setSaveMessage(`已保存，备份：${payload.backup}`);
  } catch (error) {
    setSaveMessage(error instanceof Error ? error.message : "保存失败", true);
  } finally {
    state.saving = false;
    updateSaveState();
  }
}

function renderPreview(): void {
  const detail = state.selected;
  const empty = document.querySelector<HTMLElement>("#previewEmpty");
  const preview = document.querySelector<HTMLElement>("#previewContent");
  const checks = document.querySelector<HTMLElement>("#checksPanel");
  const assets = document.querySelector<HTMLElement>("#assetsPanel");
  if (!empty || !preview || !checks || !assets) return;

  empty.hidden = Boolean(detail);
  preview.hidden = !detail || state.previewTab !== "preview";
  checks.hidden = !detail || state.previewTab !== "checks";
  assets.hidden = !detail || state.previewTab !== "assets";
  updateAssetUploadState();
  if (!detail) return;

  if (state.previewTab === "preview") {
    const rendered = renderMarkdown(detail.markdown);
    preview.innerHTML = `
      <article class="studio-document">
        <header>
          <span>${escapeHtml(typeLabel(detail.type))} · ${escapeHtml(statusLabel(detail.status))}</span>
          <h1>${escapeHtml(detail.title)}</h1>
          ${detail.summary ? `<p>${escapeHtml(detail.summary)}</p>` : ""}
        </header>
        <div class="doc-body">${rendered.html}</div>
      </article>
    `;
  } else if (state.previewTab === "checks") {
    renderChecks(detail, checks);
  } else {
    renderAssets();
  }
}

function renderAssets(): void {
  const list = document.querySelector<HTMLElement>("#assetList");
  const hint = document.querySelector("#assetHint");
  if (!list || !hint) return;
  if (!state.selected) {
    list.innerHTML = `<div class="asset-empty">先选择一篇内容</div>`;
    renderGalleryManager();
    return;
  }

  hint.textContent = assetHintText();
  if (!state.assets.length) {
    list.innerHTML = `<div class="asset-empty">还没有素材。上传后会出现在这里。</div>`;
    renderGalleryManager();
    return;
  }

  list.innerHTML = state.assets.map(renderAssetItem).join("");
  renderGalleryManager();
}

function renderAssetItem(asset: AssetItem): string {
  const isImage = asset.kind === "images";
  const galleryButton =
    state.selected?.type === "projects" && isImage
      ? `<button type="button" data-asset-action="gallery" data-asset-url="${escapeAttribute(asset.url)}">加入图集</button>`
      : "";
  const coverButton =
    isImage && (state.selected?.type === "projects" || state.selected?.type === "life")
      ? `<button type="button" data-asset-action="cover" data-asset-url="${escapeAttribute(asset.url)}">设为封面</button>`
      : "";
  return `
    <article class="asset-item">
      <div class="asset-thumb">
        ${isImage ? `<img src="${escapeAttribute(asset.url)}" alt="${escapeAttribute(asset.name)}" loading="lazy" />` : `<span>MP4</span>`}
      </div>
      <div class="asset-info">
        <strong>${escapeHtml(asset.name)}</strong>
        <span>${escapeHtml(asset.url)}</span>
        <small>${formatFileSize(asset.size)} · ${formatTime(asset.modifiedAt)}</small>
      </div>
      <div class="asset-actions">
        <button type="button" data-asset-action="insert" data-asset-url="${escapeAttribute(asset.url)}">插入正文</button>
        ${galleryButton}
        ${coverButton}
        <button type="button" data-asset-action="delete" data-asset-url="${escapeAttribute(asset.url)}">删除</button>
      </div>
    </article>
  `;
}

function insertAssetIntoMarkdown(asset: AssetItem): void {
  if (!state.selected) return;
  const snippet =
    asset.kind === "images"
      ? `![${assetAlt(asset)}](${asset.url})`
      : `\`\`\`video
src: ${asset.url}
caption: ${assetAlt(asset)}
autoplay: false
loop: false
muted: false
\`\`\``;
  insertMarkdownSnippet(snippet);
}

function addAssetToGallery(asset: AssetItem): void {
  if (!state.selected || state.selected.type !== "projects" || asset.kind !== "images") return;
  const gallery = Array.isArray(state.selected.frontmatter.gallery)
    ? state.selected.frontmatter.gallery.filter((item): item is string => typeof item === "string")
    : [];
  if (!gallery.includes(asset.url)) gallery.push(asset.url);
  applyProjectGallery(gallery);
  setSaveMessage("已加入项目图集，保存后写入 Markdown。");
}

function setAssetAsCover(asset: AssetItem): void {
  if (!state.selected || asset.kind !== "images") return;

  if (state.selected.type === "projects") {
    const gallery = getProjectGallery();
    const next = [asset.url, ...gallery.filter((item) => item !== asset.url)];
    applyProjectGallery(next);
    setSaveMessage("已设为项目图集首图，保存后生效。");
    return;
  }

  if (state.selected.type === "life") {
    state.selected.frontmatter.cover = asset.url;
    const coverField = document.querySelector<HTMLInputElement>('[data-field-key="cover"]');
    if (coverField) coverField.value = asset.url;
    syncSelectedSummary();
    markDirty();
    renderPreview();
    setSaveMessage("已设为分享封面，保存后生效。");
  }
}

function renderGalleryManager(): void {
  const manager = document.querySelector<HTMLElement>("#galleryManager");
  if (!manager) return;
  if (!state.selected || state.selected.type !== "projects") {
    manager.innerHTML = "";
    return;
  }

  const gallery = getProjectGallery();
  if (!gallery.length) {
    manager.innerHTML = `<section class="gallery-tools"><strong>项目图集</strong><p>还没有图集图片。可以从上方素材设为封面或加入图集。</p></section>`;
    return;
  }

  manager.innerHTML = `
    <section class="gallery-tools">
      <div class="gallery-tools-heading">
        <strong>项目图集</strong>
        <span>${gallery.length} 张，第一张会优先作为卡片视觉</span>
      </div>
      <div class="gallery-list">
        ${gallery.map((url, index) => renderGalleryItem(url, index, gallery.length)).join("")}
      </div>
    </section>
  `;
}

function renderGalleryItem(url: string, index: number, total: number): string {
  return `
    <article class="gallery-item">
      <div class="gallery-thumb"><img src="${escapeAttribute(url)}" alt="" loading="lazy" /></div>
      <span>${escapeHtml(url)}</span>
      <div class="gallery-actions">
        <button type="button" data-gallery-action="up" data-gallery-index="${index}" ${index === 0 ? "disabled" : ""}>上移</button>
        <button type="button" data-gallery-action="down" data-gallery-index="${index}" ${index === total - 1 ? "disabled" : ""}>下移</button>
        <button type="button" data-gallery-action="remove" data-gallery-index="${index}">移除</button>
      </div>
    </article>
  `;
}

function moveGalleryItem(index: number, delta: number): void {
  const gallery = getProjectGallery();
  const target = index + delta;
  if (target < 0 || target >= gallery.length) return;
  [gallery[index], gallery[target]] = [gallery[target], gallery[index]];
  applyProjectGallery(gallery);
  setSaveMessage("图集顺序已调整，保存后生效。");
}

function removeGalleryItem(index: number): void {
  const gallery = getProjectGallery();
  if (index < 0 || index >= gallery.length) return;
  gallery.splice(index, 1);
  applyProjectGallery(gallery);
  setSaveMessage("已从图集移除，保存后生效。");
}

function getProjectGallery(): string[] {
  if (!state.selected || state.selected.type !== "projects") return [];
  return Array.isArray(state.selected.frontmatter.gallery)
    ? state.selected.frontmatter.gallery.filter((item): item is string => typeof item === "string")
    : [];
}

function applyProjectGallery(gallery: string[]): void {
  if (!state.selected || state.selected.type !== "projects") return;
  state.selected.frontmatter.gallery = gallery;
  const galleryField = document.querySelector<HTMLTextAreaElement>('[data-field-key="gallery"]');
  if (galleryField) galleryField.value = gallery.join("\n");
  syncSelectedSummary();
  markDirty();
  renderGalleryManager();
  renderPreview();
}

function detachDeletedAssetReferences(assetUrl: string): void {
  if (!state.selected) return;
  let changed = false;

  if (state.selected.type === "projects") {
    const gallery = getProjectGallery();
    const nextGallery = gallery.filter((item) => item !== assetUrl);
    if (nextGallery.length !== gallery.length) {
      applyProjectGallery(nextGallery);
      changed = true;
    }
  }

  if (state.selected.type === "life" && state.selected.frontmatter.cover === assetUrl) {
    state.selected.frontmatter.cover = "";
    const coverField = document.querySelector<HTMLInputElement>('[data-field-key="cover"]');
    if (coverField) coverField.value = "";
    changed = true;
  }

  if (changed) {
    syncSelectedSummary();
    markDirty();
  }
}

function insertMarkdownSnippet(snippet: string): void {
  if (!state.selected) return;
  const source = document.querySelector<HTMLTextAreaElement>("#markdownSource");
  const insertion = `\n\n${snippet}\n`;
  if (!source) {
    state.selected.markdown = `${state.selected.markdown.trimEnd()}${insertion}`;
    markDirty();
    return;
  }
  const start = source.selectionStart ?? source.value.length;
  const end = source.selectionEnd ?? source.value.length;
  const next = `${source.value.slice(0, start)}${insertion}${source.value.slice(end)}`;
  source.value = next;
  source.selectionStart = source.selectionEnd = start + insertion.length;
  source.focus();
  state.selected.markdown = next;
  markDirty();
  setSaveMessage("已插入正文，保存后写入 Markdown。");
}

function renderAssetError(message: string): void {
  const list = document.querySelector<HTMLElement>("#assetList");
  if (list) list.innerHTML = `<div class="asset-error">${icon("alert-circle")}<span>${escapeHtml(message)}</span></div>`;
}

function renderChecks(detail: ContentDetail, target: HTMLElement): void {
  const issues = validateDetail(detail);
  target.innerHTML = `
    <div class="checks-summary ${issues.length ? "has-issues" : ""}">
      ${icon(issues.length ? "alert-circle" : "check-circle-2")}
      <div><strong>${issues.length ? `${issues.length} 项需要确认` : "基础检查通过"}</strong><span>${escapeHtml(detail.relativePath)}</span></div>
    </div>
    <div class="check-list">
      ${
        issues.length
          ? issues.map((issue) => `<div class="check-item">${icon("alert-circle")}<span>${escapeHtml(issue)}</span></div>`).join("")
          : `<div class="check-item passed">${icon("check-circle-2")}<span>必填字段和状态值正常</span></div>`
      }
    </div>
  `;
}

function recoverBrowserDraft(): void {
  if (!state.selected || !state.recoveryDraft) return;
  state.selected.frontmatter = structuredClone(state.recoveryDraft.frontmatter);
  state.selected.markdown = state.recoveryDraft.markdown;
  syncSelectedSummary();
  state.dirty = true;
  state.recoveryDraft = null;
  renderEditor();
  renderRecoveryBanner();
  renderPreview();
  updateSaveState();
  setSaveMessage("已恢复浏览器草稿，保存后才会写入磁盘。");
}

function discardBrowserDraft(): void {
  if (state.selected) removeBrowserDraft(state.selected);
  state.recoveryDraft = null;
  renderRecoveryBanner();
  setSaveMessage("已丢弃浏览器草稿。");
}

function renderRecoveryBanner(): void {
  const banner = document.querySelector<HTMLElement>("#draftBanner");
  const info = document.querySelector("#draftInfo");
  if (!banner || !info) return;
  banner.hidden = !state.recoveryDraft;
  if (state.recoveryDraft) info.textContent = `保存于 ${formatTime(state.recoveryDraft.savedAt)}`;
}

function persistBrowserDraft(): void {
  if (!state.selected || !state.dirty) return;
  const draft: BrowserDraft = {
    savedAt: new Date().toISOString(),
    modifiedAt: state.selected.modifiedAt,
    frontmatter: state.selected.frontmatter,
    markdown: state.selected.markdown
  };
  localStorage.setItem(draftKey(state.selected), JSON.stringify(draft));
}

function getNewerBrowserDraft(detail: ContentDetail): BrowserDraft | null {
  const raw = localStorage.getItem(draftKey(detail));
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as BrowserDraft;
    if (Date.parse(draft.savedAt) > Date.parse(detail.modifiedAt)) return draft;
  } catch {
    removeBrowserDraft(detail);
  }
  return null;
}

function removeBrowserDraft(detail: ContentSummary): void {
  localStorage.removeItem(draftKey(detail));
}

function draftKey(detail: ContentSummary): string {
  return `content-studio:draft:${detail.type}:${detail.id}`;
}

function syncSelectedSummary(): void {
  if (!state.selected) return;
  const data = state.selected.frontmatter;
  state.selected.title = valueAsString(data.title, state.selected.id);
  state.selected.summary = valueAsString(data.summary);
  state.selected.status = normalizeStatus(valueAsString(data.status, state.selected.status));
  state.selected.projectStage =
    state.selected.type === "projects" ? normalizeProjectStage(valueAsString(data.projectStage, "completed")) : null;
  state.selected.category = categoryFor(state.selected);
  state.selected.tags = tagsFor(state.selected);
  state.selected.updatedAt = valueAsString(data.updatedAt, valueAsString(data.date, state.selected.updatedAt));
  const title = document.querySelector("#editorTitle");
  if (title) title.textContent = state.selected.title;
}

function metadataFor(detail: ContentDetail): FieldDef[] {
  const common: FieldDef[] = [
    { key: "title", label: "标题", kind: "text" },
    { key: "id", label: "ID", kind: "text", readonly: true },
    { key: "status", label: "状态", kind: "select", options: ["draft", "published", "archived"] },
    { key: "summary", label: "摘要", kind: "textarea", wide: true }
  ];

  if (detail.type === "docs") {
    return [
      ...common,
      { key: "category", label: "分类", kind: "text" },
      { key: "level", label: "难度", kind: "select", options: ["beginner", "intermediate", "advanced"] },
      { key: "updatedAt", label: "更新日期", kind: "text" },
      { key: "readingTime", label: "阅读时间", kind: "text" },
      { key: "tags", label: "标签", kind: "csv", wide: true }
    ];
  }

  if (detail.type === "projects") {
    return [
      ...common,
      { key: "projectStage", label: "项目阶段", kind: "select", options: ["concept", "building", "completed", "maintained", "paused"] },
      { key: "period", label: "周期", kind: "text" },
      { key: "role", label: "角色", kind: "text" },
      { key: "stack", label: "技术栈", kind: "csv", wide: true },
      { key: "highlights", label: "亮点", kind: "lines", wide: true },
      { key: "gallery", label: "图集", kind: "lines", wide: true }
    ];
  }

  return [
    ...common,
    { key: "date", label: "日期", kind: "text" },
    { key: "tag", label: "标签", kind: "text" },
    { key: "cover", label: "封面", kind: "text", wide: true },
    { key: "mood", label: "氛围", kind: "text" }
  ];
}

function fieldValue(field: FieldDef): string {
  if (!state.selected) return "";
  const value = field.key === "id" ? state.selected.id : state.selected.frontmatter[field.key];
  if (field.kind === "csv") return Array.isArray(value) ? value.join(", ") : valueAsString(value);
  if (field.kind === "lines") return Array.isArray(value) ? value.join("\n") : valueAsString(value);
  return valueAsString(value);
}

function parseFieldValue(value: string, kind: FieldKind): unknown {
  if (kind === "csv") return value.split(",").map((item) => item.trim()).filter(Boolean);
  if (kind === "lines") return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  return value;
}

function validateDetail(detail: ContentDetail): string[] {
  const issues: string[] = [];
  if (!detail.title.trim()) issues.push("标题为空");
  if (!detail.summary.trim()) issues.push("摘要为空");
  if (!detail.markdown.trim()) issues.push("正文为空");
  if (detail.type === "projects" && !detail.projectStage) issues.push("项目阶段未填写");
  if (detail.status === "draft") issues.push("当前内容是草稿，不会进入生产构建");
  if (detail.status === "archived") issues.push("当前内容已归档，不会在主站显示");
  return issues;
}

function updateSaveState(): void {
  const saveButton = document.querySelector<HTMLButtonElement>("#saveButton");
  const diskState = document.querySelector<HTMLElement>("#diskState");
  if (saveButton) {
    saveButton.disabled = !state.selected || !state.dirty || state.saving;
    saveButton.querySelector("span")!.textContent = state.saving ? "保存中" : "保存";
  }
  if (diskState) {
    diskState.textContent = state.dirty ? "浏览器草稿" : "磁盘内容";
    diskState.classList.toggle("dirty", state.dirty);
  }
}

function updateAssetUploadState(): void {
  const button = document.querySelector<HTMLButtonElement>("#uploadAssetButton");
  if (!button) return;
  button.disabled = state.uploadingAsset || !state.selected;
  const label = button.querySelector("span");
  if (label) label.textContent = state.uploadingAsset ? "上传中" : "上传素材";
}

function updateMarkdownStats(): void {
  const stats = document.querySelector("#markdownStats");
  if (!stats || !state.selected) return;
  const markdown = state.selected.markdown.trim();
  const characters = markdown.length;
  const lines = markdown ? markdown.split("\n").length : 0;
  stats.textContent = `${lines} 行 · ${characters} 字符`;
}

function setLoading(loading: boolean): void {
  document.querySelector("#refreshButton")?.classList.toggle("loading", loading);
}

function setSaveMessage(message: string, isError = false): void {
  const target = document.querySelector<HTMLElement>("#saveMessage");
  if (!target) return;
  target.hidden = !message;
  target.textContent = message;
  target.classList.toggle("error", isError);
}

function validateClientAsset(file: File): void {
  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  const isVideo = extension === ".mp4" || extension === ".webm";
  const isImage = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".svg"].includes(extension);
  if (!isVideo && !isImage) throw new Error("只支持 jpg、png、webp、avif、gif、svg、mp4 和 webm。");
  const maxBytes = isVideo ? 30 * 1024 * 1024 : 15 * 1024 * 1024;
  if (file.size > maxBytes) throw new Error(isVideo ? "小视频不能超过 30MB。" : "图片或 GIF 不能超过 15MB。");
}

async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function assetHintText(): string {
  if (!state.selected) return "先选择一篇内容";
  const base = `目录：public/images/${contentDirectory(state.selected.type)}/${state.selected.id}/`;
  return `${base}；视频会进入 public/videos/${contentDirectory(state.selected.type)}/${state.selected.id}/`;
}

function assetAlt(asset: AssetItem): string {
  return asset.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
}

function formatFileSize(size: number): string {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}

function renderListError(message: string): void {
  const list = document.querySelector("#contentList");
  if (list) list.innerHTML = `<div class="list-error">${icon("alert-circle")}<span>${escapeHtml(message)}</span></div>`;
}

function toSummary(detail: ContentDetail): ContentSummary {
  return {
    type: detail.type,
    id: detail.id,
    title: detail.title,
    summary: detail.summary,
    status: detail.status,
    projectStage: detail.projectStage,
    category: detail.category,
    tags: detail.tags,
    updatedAt: detail.updatedAt,
    relativePath: detail.relativePath
  };
}

function categoryFor(detail: ContentDetail): string {
  if (detail.type === "docs") return valueAsString(detail.frontmatter.category, "Uncategorized");
  if (detail.type === "projects") return normalizeProjectStage(valueAsString(detail.frontmatter.projectStage, "completed"));
  return valueAsString(detail.frontmatter.tag);
}

function tagsFor(detail: ContentDetail): string[] {
  const key = detail.type === "docs" ? "tags" : "stack";
  const value = detail.frontmatter[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function contentDirectory(type: ContentType): string {
  if (type === "projects") return "projects";
  if (type === "life") return "life";
  return "docs";
}

function defaultCreateTitle(type: ContentType): string {
  if (type === "projects") return "new-project";
  if (type === "life") return "new-life-post";
  return "new-document";
}

function defaultCreateSummary(type: ContentType): string {
  if (type === "projects") return "Write a short project summary.";
  if (type === "life") return "Write a short summary for this post.";
  return "Write a short summary for this document.";
}

function defaultCreateMeta(type: ContentType): string {
  if (type === "projects") return "STM32, FreeRTOS";
  if (type === "life") return "Life";
  return "Notes";
}

function createIdSuggestion(value: string): string {
  const id = value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (id) return id.slice(0, 80);
  return `content-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`;
}

function typeIcon(type: ContentType): IconName {
  if (type === "projects") return "folder-kanban";
  if (type === "life") return "image";
  return "file-text";
}

function typeLabel(type: ContentType): string {
  if (type === "projects") return "项目";
  if (type === "life") return "个人分享";
  return "技术文档";
}

function statusLabel(status: ContentStatus): string {
  if (status === "published") return "已发布";
  if (status === "archived") return "已归档";
  return "草稿";
}

function normalizeStatus(value: string): ContentStatus {
  return value === "draft" || value === "published" || value === "archived" ? value : "draft";
}

function normalizeProjectStage(value: string): ProjectStage {
  if (value === "concept" || value === "building" || value === "completed" || value === "maintained" || value === "paused") return value;
  return "completed";
}

function valueAsString(value: unknown, fallback = ""): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return fallback;
}

function formatTime(value: string): string {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}

function icon(name: IconName): string {
  return createElement(iconNodes[name], { "aria-hidden": "true" }).outerHTML;
}

async function copyCode(button: HTMLButtonElement, code: Element): Promise<void> {
  const value = code.textContent ?? "";
  let copied = false;
  try {
    await navigator.clipboard.writeText(value);
    copied = true;
  } catch {
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  const label = button.textContent;
  button.textContent = copied ? "已复制" : "已选中";
  window.setTimeout(() => {
    button.textContent = label;
  }, 1400);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
