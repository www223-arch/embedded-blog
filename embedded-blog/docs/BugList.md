# BugList - 已知问题及解决方案

> **最后更新**: 2026-04-04  
> **更新内容**: 创建BugList文档，记录编码问题和背景黑屏问题

---

## 目录

1. [编码问题](#编码问题)
2. [背景黑屏问题](#背景黑屏问题)
3. [样式问题](#样式问题)
4. [性能问题](#性能问题)

---

## 编码问题

### 问题描述

**症状**：
- 浏览器中显示 `????` 或 `???` 等乱码
- 终端日志显示 `鉃?` 而不是 `✓`
- 文件内容在 IDE 中正常，但在浏览器中乱码

**出现时间**: 2026-04-01  
**影响范围**: 所有包含中文的文件  
**严重程度**: 高

### 根本原因

```
正确流程：
UTF-8 文件 → 浏览器按 UTF-8 解码 → 正常显示中文

错误流程（GBK 保存）：
UTF-8 中文 → 编辑器按 GBK 保存 → GBK 字节 → 浏览器按 UTF-8 解码 → 乱码
```

**原因分析**：
- Windows 环境下，编辑器默认可能使用 GB2312/GBK 编码保存文件
- 现代 Web 开发工具链（Vite、TypeScript、浏览器）默认使用 UTF-8
- 编码不一致导致乱码

### 解决方案

#### 方案 1: 统一使用 UTF-8 编码（推荐）

**VS Code 设置**：
1. 点击右下角编码显示（可能显示 "GB2312"）
2. 选择 **"通过编码保存"** → **"UTF-8"**
3. 或者在设置中搜索 `files.encoding`，设置为 `utf8`

**其他编辑器**：
- **Sublime Text**: File → Save with Encoding → UTF-8
- **Notepad++**: 编码 → 转为 UTF-8 编码
- **WebStorm**: File → File Encoding → UTF-8

#### 方案 2: 项目配置检查

**index.html**：
确保包含正确的 charset 声明：
```html
<meta charset="UTF-8" />
```

**文件编码验证**：
使用 PowerShell 检查文件编码：
```powershell
# 查看文件是否包含 GBK 编码的中文字节
python -c "
with open('src/features/docs/view.ts', 'rb') as f:
    data = f.read()
    # GBK 的"技术文档"字节: ced2 b5c4
    # UTF-8 的"技术文档"字节: e68a 80e6 9caf e696 87e6 a1a3
    if b'\xce\xd2' in data or b'\xc4\xe3' in data:
        print('警告：文件包含 GBK 编码字符！')
    else:
        print('文件编码正常（UTF-8）')
"
```

#### 方案 3: 修复已乱码的文件

如果文件已经被错误编码：

```bash
# 从 git 恢复原始文件（假设原始文件是正确的 UTF-8）
git checkout -- src/features/docs/view.ts
git checkout -- src/features/life/view.ts
git checkout -- index.html
```

### 预防措施

1. **项目初始化时**: 统一设置团队编辑器编码为 UTF-8
2. **代码审查时**: 检查新增文件编码
3. **CI/CD 时**: 添加编码检查步骤
4. **文档中**: 明确声明项目使用 UTF-8 编码

### 编码知识科普

#### UTF-8 vs GBK

| 特性 | UTF-8 | GBK |
|------|-------|-----|
| 国际标准 | ✅ 是 | ❌ 否（仅中文环境） |
| 支持语言 | 全球所有语言 | 主要中文、英文 |
| Web 标准 | ✅ 是 | ❌ 否 |
| 字节长度 | 变长（1-4字节） | 定长（2字节中文） |
| 兼容性 | 所有现代工具 | 部分旧系统 |

#### 为什么必须用 UTF-8

1. **Web 标准**: HTML5 默认编码是 UTF-8
2. **工具链**: Vite、TypeScript、Node.js 默认 UTF-8
3. **国际化**: 支持 emoji、日文、阿拉伯文等
4. **兼容性**: 跨平台、跨系统无乱码

### 踩坑记录

#### 场景 1: 编辑器自动切换编码

**问题**: 在 Windows 上新建文件时，编辑器自动使用 GB2312 保存  
**解决**: 修改编辑器默认编码设置为 UTF-8

#### 场景 2: 复制粘贴导致编码混乱

**问题**: 从 GBK 编码的文件复制内容到 UTF-8 文件  
**解决**: 确保源文件和目标文件都是 UTF-8

#### 场景 3: Git 显示乱码

**问题**: `git log` 或 `git diff` 显示中文乱码  
**解决**: 
```bash
git config --global core.quotepath false
git config --global gui.encoding utf-8
```

---

## 背景黑屏问题

### 问题描述

**症状**：
- 个人分享页面背景图片显示为全黑
- 项目作品页面背景图片无法加载
- 控制台显示图片 404 错误

**出现时间**: 2026-04-04  
**Git 节点**: e65c1024601315bdab01ff25b30b14bc9c0e2f0c  
**影响范围**: 个人分享页面、项目作品页面  
**严重程度**: 高

### 根本原因

**问题分析**：

在 commit e65c1024 中添加了 `vite.config.ts`，设置了：
```typescript
export default defineConfig({
  base: '/embedded-blog/',
  build: {
    outDir: 'dist',
  },
});
```

但是代码中的背景图片使用的是绝对路径：
```typescript
// 错误写法
<div class="bg-slide" style="background-image: url('/guosai2.jpg')"></div>
```

**路径解析**：
- 实际访问路径：`http://localhost:5174/guosai2.jpg`
- 正确路径应该是：`http://localhost:5174/embedded-blog/guosai2.jpg`
- 导致图片 404，背景显示为黑色

### 解决方案

#### 方案 1: 使用 import.meta.env.BASE_URL（推荐）

**修改位置**: `src/features/life/view.ts`

```typescript
export function renderLife(): string {
  const tags = [...new Set(lifePosts.map((post) => post.tag))];
  const base = import.meta.env.BASE_URL;  // 获取 base 路径
  return `
  <div class="page-wrapper life-page">
    <div class="bg-slider">
      <div class="bg-slide active" style="background-image: url('${base}guosai2.jpg')"></div>
      <div class="bg-slide" style="background-image: url('${base}xiaoshao.jpg')"></div>
      <div class="bg-slide" style="background-image: url('${base}Giobal.jpg')"></div>
    </div>
    ...
  </div>
  `;
}
```

**修改位置**: `src/app/bootstrap.ts`

```typescript
export function bootstrap(): void {
  registerDefaults();
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) return;
  const base = import.meta.env.BASE_URL;
  document.documentElement.style.setProperty('--base-url', base);
  document.documentElement.style.setProperty('--bg-projects', `url('${base}KSC - SLS_03302026_Artemis II at the pad~orig.jpg')`);
  app.innerHTML = shellTemplate();
  ...
}
```

**修改位置**: `src/style.css`

```css
.projects-page::before {
  background-image: var(--bg-projects);
}
```

#### 方案 2: 使用相对路径

对于 CSS 中的背景图片，可以使用相对路径：

```css
.projects-page::before {
  background-image: url('../../public/KSC - SLS_03302026_Artemis II at the pad~orig.jpg');
}
```

**注意**: 这种方法不够灵活，不推荐使用。

### 验证修复

1. 启动开发服务器：`npm run dev`
2. 访问个人分享页面
3. 检查背景图片是否正常显示
4. 检查控制台是否有 404 错误

### 预防措施

1. **使用 BASE_URL**: 所有静态资源路径都使用 `import.meta.env.BASE_URL` 拼接
2. **测试部署**: 在本地测试时，确保 `base` 配置正确
3. **代码审查**: 检查新增的图片路径是否考虑了 base 路径

### 相关文件

- [src/features/life/view.ts](../src/features/life/view.ts)
- [src/app/bootstrap.ts](../src/app/bootstrap.ts)
- [src/style.css](../src/style.css)
- [vite.config.ts](../vite.config.ts)

---

## 样式问题

### 问题描述

**症状**：
- 样式不生效
- 布局错乱
- 卡片透明
- 图片显示异常

**出现时间**: 2026-04-01  
**影响范围**: 所有页面  
**严重程度**: 中

### 根本原因

**架构问题**：
1. 所有样式混在一个 `style.css` 文件中
2. 基础样式、组件样式、页面样式没有分层
3. 缺乏命名空间，类名容易冲突
4. 修改风险极高，牵一发而动全身

### 解决方案

#### 短期方案：安全修改策略

1. **编辑前先恢复**
   ```bash
   git restore src/style.css
   git restore src/features/projects/view.ts
   ```

2. **只新增，不修改**
   - 在文件末尾添加新样式
   - 新增类名，不修改现有类
   - 不触碰包含中文的代码块

3. **小步验证**
   - 每次只改一个地方
   - 改完立即刷新验证
   - 有问题立即 git restore

#### 长期方案：样式模块化（待实施）

**目标架构**：
```
src/styles/
├── base.css        # 基础样式（重置、变量）
├── components.css  # 可复用组件样式
├── pages/          # 页面特定样式
│   ├── home.css
│   ├── projects.css
│   └── docs.css
└── utilities.css   # 工具类
```

**采用 BEM 命名规范**：
```css
/* Block */
.card { }

/* Element */
.card__image { }
.card__title { }

/* Modifier */
.card--hover { }
.card--featured { }
```

### 预防措施

1. **遵循开闭原则**: 对扩展开放，对修改关闭
2. **使用新增类**: 而不是修改现有类
3. **频繁检查**: 用 Read 工具检查文件状态
4. **小步提交**: 频繁提交，便于回滚

---

## 性能问题

### 问题描述

**症状**：
- 页面加载缓慢
- 动画卡顿
- 粒子系统僵住

**影响范围**: 首页、粒子系统  
**严重程度**: 低

### 解决方案

#### 粒子系统优化

1. **防僵住机制**
   - 定时随机扰动
   - 边界检测
   - 速度限制

2. **性能优化**
   - 减少粒子数量
   - 优化连线算法
   - 使用 requestAnimationFrame

#### 图片优化

1. **懒加载**
   ```html
   <img src="..." loading="lazy" />
   ```

2. **使用 WebP 格式**
   - 更小的文件大小
   - 更快的加载速度

3. **图片压缩**
   - 使用工具压缩图片
   - 保持合适的质量

### 监控方法

```javascript
// 使用 Performance API
console.time('myOperation');
// ... 操作
console.timeEnd('myOperation');

// 使用 Chrome DevTools Performance 面板
```

---

## Bug 报告模板

### 报告格式

```markdown
### 问题描述

**症状**：
- [描述具体症状]

**出现时间**: [日期]  
**Git 节点**: [commit hash]  
**影响范围**: [受影响的功能/页面]  
**严重程度**: [高/中/低]

### 根本原因

[分析问题原因]

### 解决方案

[详细解决方案]

### 预防措施

[如何避免类似问题]

### 相关文件

- [文件路径列表]
```

---

## 参考资源

- [UTF-8 Wikipedia](https://en.wikipedia.org/wiki/UTF-8)
- [HTML charset 规范](https://html.spec.whatwg.org/multipage/semantics.html#charset)
- [Vite 官方文档](https://vitejs.dev/)
- [GSAP 文档](https://greensock.com/docs/)

---

**提示**: 遇到新问题时，请及时更新此文档，记录问题原因和解决方案，方便后续查阅。
