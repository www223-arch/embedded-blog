import { navigate } from "../app/router";
import { projectItems } from "../content/projects";
import { lifePosts } from "../content/lifePosts";
import { techDocs } from "../content/docs";

let sidebarCollapsed = false;
let fileTreeCollapsed = false;
let tocCollapsed = false;

export function toggleSidebar(): void {
  sidebarCollapsed = !sidebarCollapsed;
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  
  if (sidebar) {
    if (sidebarCollapsed) {
      sidebar.style.transform = "translateX(-100%)";
    } else {
      sidebar.style.transform = "translateX(0)";
    }
  }
  
  if (toggleBtn) {
    toggleBtn.textContent = sidebarCollapsed ? "☰ 展开" : "☰ 收起";
  }
}

export function toggleFileTree(): void {
  fileTreeCollapsed = !fileTreeCollapsed;
  const fileTreeContent = document.getElementById("fileTreeContent");
  const fileTreeToggle = document.getElementById("fileTreeToggle");
  
  if (fileTreeContent) {
    fileTreeContent.style.display = fileTreeCollapsed ? "none" : "block";
  }
  
  if (fileTreeToggle) {
    fileTreeToggle.textContent = fileTreeCollapsed ? "▶" : "▼";
  }
}

export function toggleToc(): void {
  tocCollapsed = !tocCollapsed;
  const tocContent = document.getElementById("tocContent");
  const tocToggle = document.getElementById("tocToggle");
  
  if (tocContent) {
    tocContent.style.display = tocCollapsed ? "none" : "block";
  }
  
  if (tocToggle) {
    tocToggle.textContent = tocCollapsed ? "▶" : "▼";
  }
}

function updateSidebarWidth(): void {
  // 现在侧边栏在 section 内部，不需要调整宽度
  console.log("DEBUG: updateSidebarWidth called");
}

export function renderSidebar(currentType: string, currentId: string): string {
  console.log("DEBUG: renderSidebar called with", currentType, currentId);
  
  return `
    <div class="sidebar-container" style="display: flex; gap: 16px;">
      <!-- 左侧栏目 -->
      <div style="width: 160px; display: flex; flex-direction: column; gap: 16px;">
        <!-- 文件目录 -->
        <div id="fileTreePanel" style="border: 1px solid var(--line); background: var(--surface); border-radius: 8px; overflow: hidden;">
          <div style="padding: 12px; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 12px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 6px;">
              <span>📁</span>
              <span>文件</span>
            </div>
            <button id="fileTreeToggle" style="background: none; border: none; cursor: pointer; color: var(--text); font-size: 12px; padding: 4px;">▼</button>
          </div>
          <div id="fileTreeContent" style="max-height: 200px; overflow-y: auto; padding: 8px;">
            <div style="font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; padding: 0 6px;">项目</div>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="margin-bottom: 2px;">
                <div class="file-link" data-route="project-detail" data-id="edge-gateway" style="display: block; padding: 6px 8px; color: var(--text); font-size: 12px; cursor: pointer; border-radius: 4px; transition: background var(--duration-fast) var(--ease-out);">
                  工业边缘网关
                </div>
              </li>
              <li style="margin-bottom: 2px;">
                <div class="file-link active" data-route="project-detail" data-id="motor-control" style="display: block; padding: 6px 8px; color: white; font-size: 12px; cursor: pointer; border-radius: 4px; background: var(--accent);">
                  STM32 PID 电机
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- 页面目录 -->
        <div id="tocPanel" style="border: 1px solid var(--line); background: var(--surface); border-radius: 8px; overflow: hidden;">
          <div style="padding: 12px; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 12px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 6px;">
              <span>📋</span>
              <span>目录</span>
            </div>
            <button id="tocToggle" style="background: none; border: none; cursor: pointer; color: var(--text); font-size: 12px; padding: 4px;">▼</button>
          </div>
          <div id="tocContent" style="max-height: 200px; overflow-y: auto; padding: 8px;">
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="margin-bottom: 2px;">
                <div class="toc-link" style="display: block; padding: 4px 8px; color: var(--text-muted); font-size: 11px; cursor: pointer; border-radius: 4px; transition: all var(--duration-fast) var(--ease-out);">
                  项目概述
                </div>
              </li>
              <li style="margin-bottom: 2px; padding-left: 12px;">
                <div class="toc-link" style="display: block; padding: 4px 8px; color: var(--text-muted); font-size: 11px; cursor: pointer; border-radius: 4px; transition: all var(--duration-fast) var(--ease-out);">
                  技术实现
                </div>
              </li>
              <li style="margin-bottom: 2px;">
                <div class="toc-link active" style="display: block; padding: 4px 8px; color: var(--accent); font-size: 11px; cursor: pointer; border-radius: 4px; background: rgba(0, 113, 227, 0.1);">
                  项目总结
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- 右侧正文内容 -->
      <div style="flex: 1;">
      </div>
    </div>
  `;
}

export function bindSidebarEvents(): void {
  console.log("DEBUG: bindSidebarEvents called");
  
  const fileTreeToggle = document.getElementById("fileTreeToggle");
  if (fileTreeToggle) {
    fileTreeToggle.addEventListener("click", () => {
      console.log("DEBUG: File tree toggle clicked");
      toggleFileTree();
    });
  }
  
  const tocToggle = document.getElementById("tocToggle");
  if (tocToggle) {
    tocToggle.addEventListener("click", () => {
      console.log("DEBUG: TOC toggle clicked");
      toggleToc();
    });
  }
  
  // 绑定文件目录点击事件
  document.querySelectorAll(".file-link").forEach((link) => {
    link.addEventListener("click", () => {
      const route = link.getAttribute("data-route") as any;
      const id = link.getAttribute("data-id");
      if (route && id) {
        console.log("DEBUG: Navigating to", route, id);
        navigate(route, { id });
      }
    });
  });
  
  // 绑定页面目录点击事件
  document.querySelectorAll(".toc-link").forEach((link) => {
    link.addEventListener("click", () => {
      const headingText = link.textContent?.trim();
      if (headingText) {
        const headingId = headingText.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '');
        const heading = document.getElementById(headingId);
        if (heading) {
          console.log("DEBUG: Scrolling to", headingId);
          heading.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });
}

export function renderContentWithHeadingIds(markdown: string): string {
  let html = markdownToHtml(markdown);
  
  const headingRegex = /<h([2-4])>([^<]+)<\/h[2-4]>/g;
  html = html.replace(headingRegex, (match, level, text) => {
    const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '');
    return `<h${level} id="${id}">${text}</h${level}>`;
  });

  return html;
}

function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  return markdown
    .replace(/^# (.*$)/gm, '<h2>$1</h2>')
    .replace(/^## (.*$)/gm, '<h3>$1</h3>')
    .replace(/^### (.*$)/gm, '<h4>$1</h4>')
    .replace(/^#### (.*$)/gm, '<h5>$1</h5>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/^\* (.*$)/gm, '<li>$1</li>')
    .replace(/((?:<li>.*?<\/li>\n?)+)/g, '<ul>$1</ul>')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/^(.+)$/gm, (match, p1) => {
      if (p1.startsWith('<') || p1.startsWith('</')) return match;
      return `<p>${p1}</p>`;
    });
}
