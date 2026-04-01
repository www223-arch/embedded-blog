# 嵌入式博客开发与用户指南

## 目录

1. [项目架构](#项目架构)
2. [自动化脚本开发指南](#自动化脚本开发指南)
3. [用户使用指南](#用户使用指南)
4. [维护与扩展](#维护与扩展)
5. [常见问题](#常见问题)

## 项目架构

### 核心技术栈

- **前端框架**: Vite + TypeScript
- **动效库**: GSAP
- **数据验证**: Zod
- **构建工具**: Vite
- **脚本语言**: Python (内容生成), Node.js (自动化脚本)

### 项目结构

```
embedded-blog/
├── content/              # YAML格式的原始内容
│   ├── docs/            # 技术文档
│   ├── life/            # 个人分享
│   └── projects/        # 项目作品
├── docs/                # 项目文档
├── public/              # 静态资源
├── scripts/             # 自动化脚本
├── src/                 # 源代码
│   ├── app/             # 应用核心
│   ├── content/         # 生成的内容文件
│   ├── features/        # 功能模块
│   ├── shared/          # 共享工具
│   ├── store/           # 状态管理
│   ├── main.ts          # 入口文件
│   └── style.css        # 全局样式
├── generate_content.py  # 内容生成脚本
└── add-card.js          # 自动化添加卡片脚本
```

## 自动化脚本开发指南

### 1. add-card.js 脚本实现原理

#### 核心功能

- **功能**: 自动添加新的卡片数据到对应的数据文件
- **支持类型**: `docs` (技术文档), `projects` (项目作品), `life` (个人分享)
- **实现方式**: ES模块语法，使用Node.js内置模块

#### 代码结构

```javascript
#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 数据文件路径
const DATA_PATHS = {
  docs: path.join(__dirname, '..', 'src', 'content', 'docs.ts'),
  projects: path.join(__dirname, '..', 'src', 'content', 'projects.ts'),
  life: path.join(__dirname, '..', 'src', 'content', 'lifePosts.ts')
};

// 读取数据文件
function readDataFile(type) {
  // 实现读取逻辑
}

// 写入数据文件
function writeDataFile(type, originalContent, newData) {
  // 实现写入逻辑
}

// 添加不同类型的卡片
function addDocsCard() { /* ... */ }
function addProjectsCard() { /* ... */ }
function addLifeCard() { /* ... */ }

// 执行添加操作
switch (type) {
  case 'docs': addDocsCard(); break;
  case 'projects': addProjectsCard(); break;
  case 'life': addLifeCard(); break;
}
```

#### 工作流程

1. **解析命令行参数** - 确定要添加的卡片类型
2. **读取现有数据** - 从对应的数据文件中读取现有数据
3. **生成新卡片数据** - 创建包含默认值的新卡片对象
4. **更新数据文件** - 将新卡片添加到数据文件中
5. **输出成功信息** - 通知用户操作成功

### 2. 脚本维护与扩展

#### 维护要点

- **数据格式一致性**: 确保新添加的卡片数据格式与现有数据一致
- **错误处理**: 处理文件读取、写入和解析错误
- **兼容性**: 保持与现有数据结构的兼容性

#### 扩展方法

1. **添加新的卡片类型**:

   ```javascript
   // 在DATA_PATHS中添加新类型
   const DATA_PATHS = {
     // 现有类型...
     newType: path.join(__dirname, '..', 'src', 'content', 'newType.ts')
   };

   // 添加对应的添加函数
   function addNewTypeCard() {
     const { content, data } = readDataFile('newType');
     const newCard = {
       // 新卡片数据结构
     };
     const newData = [...data, newCard];
     writeDataFile('newType', content, newData);
   }

   // 在switch中添加新类型
   switch (type) {
     // 现有类型...
     case 'newType':
       addNewTypeCard();
       break;
   }
   ```

2. **自定义卡片模板**:

   ```javascript
   function addCustomCard(type, customData) {
     const { content, data } = readDataFile(type);
     const newCard = {
       id: `${type}-${Date.now()}`,
       ...customData
     };
     const newData = [...data, newCard];
     writeDataFile(type, content, newData);
   }
   ```

3. **批量添加功能**:

   ```javascript
   function addMultipleCards(type, cards) {
     const { content, data } = readDataFile(type);
     const newData = [...data, ...cards];
     writeDataFile(type, content, newData);
   }
   ```

## 用户使用指南

### 1. 使用自动化脚本添加卡片

#### 基本用法

```bash
# 添加技术文档卡片
npm run add-card docs

# 添加项目作品卡片
npm run add-card projects

# 添加个人分享卡片
npm run add-card life
```

#### 操作流程

1. **打开终端** - 在项目根目录打开命令行终端
2. **运行命令** - 执行对应类型的添加命令
3. **查看结果** - 命令执行成功后会显示 "Successfully updated [type] data"
4. **生成内容** - 运行 `python generate_content.py` 生成网站内容
5. **查看效果** - 在浏览器中刷新页面查看新添加的卡片

### 2. 使用 YAML 文件管理内容

#### 准备工作

- 安装 Python（如果尚未安装）
- 了解基本的 YAML 文件格式

#### 添加新内容

1. **添加图片**:
   - 将图片复制到 `public` 文件夹
   - 图片文件名使用英文小写加连字符，如 `circuit-board.png`

2. **创建 YAML 文件**:
   - **技术文档**: 在 `content/docs` 文件夹创建 `.yaml` 文件
   - **项目作品**: 在 `content/projects` 文件夹创建 `.yaml` 文件
   - **个人分享**: 在 `content/life` 文件夹创建 `.yaml` 文件

3. **填写内容**:
   - 按照 YAML 文件模板填写相应字段
   - 确保 `id` 与文件名一致

4. **生成内容**:
   ```bash
   python generate_content.py
   ```

5. **查看效果**:
   - 在浏览器中刷新页面查看新内容

### 3. 测试与部署

#### 本地测试

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5173/
```

#### 构建部署

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 维护与扩展

### 1. 代码维护

#### 定期更新

- **依赖更新**: 定期运行 `npm update` 更新依赖包
- **代码检查**: 使用 TypeScript 类型检查确保代码质量
- **性能优化**: 定期检查并优化页面加载性能

#### 错误处理

- **日志记录**: 添加适当的日志记录以便调试
- **错误边界**: 为关键组件添加错误边界
- **用户反馈**: 提供清晰的错误提示给用户

### 2. 功能扩展

#### 添加新功能模块

1. **创建新的 feature 文件夹**:
   ```
src/features/new-feature/
  ├── view.ts        # 视图渲染
  └── logic.ts       # 业务逻辑
   ```

2. **注册新模块**:
   ```typescript
   // 在 bootstrap.ts 中
   register({
     key: "new-feature",
     label: "新功能",
     title: "新功能",
     render: renderNewFeature,
     afterMount: bindNewFeature
   });
   ```

3. **实现视图和逻辑**:
   - 参考现有模块的实现方式
   - 遵循项目的代码风格和架构

#### 自定义主题

1. **修改 CSS 变量**:
   ```css
   :root {
     --bg-0: #000000;        /* 主背景 */
     --bg-1: #050505;        /* 次要背景 */
     --surface: rgba(255, 255, 255, 0.08);  /* 表面 */
     --text: #ffffff;         /* 文本颜色 */
     --accent: #0071e3;       /* 强调色 */
   }
   ```

2. **添加自定义样式**:
   - 在 `style.css` 中添加新的样式规则
   - 使用现有的 CSS 类名和命名约定

## 常见问题

### 1. 自动化脚本问题

#### Q: 运行 `npm run add-card` 报错 "require is not defined"

A: 项目使用 ES 模块语法，确保脚本文件使用 `.js` 扩展名并且 `package.json` 中设置了 `"type": "module"`。

#### Q: 运行脚本后数据文件没有更新

A: 检查数据文件的路径是否正确，确保文件存在且有写入权限。

### 2. 内容管理问题

#### Q: 添加新内容后网站没有显示

A: 确保运行了 `python generate_content.py` 生成内容文件，然后刷新浏览器。

#### Q: YAML 文件格式错误

A: 检查 YAML 文件的缩进是否一致（使用空格），确保所有字段都有正确的格式。

### 3. 开发环境问题

#### Q: 开发服务器启动失败

A: 检查端口是否被占用，尝试使用不同的端口启动服务器。

#### Q: TypeScript 类型错误

A: 检查代码中的类型定义，确保所有变量和函数都有正确的类型标注。

## 总结

本项目提供了一个完整的嵌入式工程师博客解决方案，包括：

- **自动化脚本** - 简化内容添加流程
- **YAML 内容管理** - 方便非技术人员维护内容
- **现代化前端架构** - 使用 Vite + TypeScript 确保代码质量
- **可扩展设计** - 易于添加新功能和模块

通过本指南，开发者可以了解如何维护和扩展项目，用户可以了解如何使用自动化工具添加和管理内容。

祝你使用愉快！?
