# 编码规范指南

## 问题背景

在 Windows 环境下开发时，编辑器默认可能使用 GB2312/GBK 编码保存文件，而现代 Web 开发工具链（Vite、TypeScript、浏览器）默认使用 UTF-8。这会导致中文显示乱码。

## 乱码现象

### 典型症状
- 浏览器中显示 `????` 或 `???` 等乱码
- 终端日志显示 `鉃?` 而不是 `?`
- 文件内容在 IDE 中正常，但在浏览器中乱码

### 根本原因
```
正确流程：
UTF-8 文件 → 浏览器按 UTF-8 解码 → 正常显示中文

错误流程（GBK 保存）：
UTF-8 中文 → 编辑器按 GBK 保存 → GBK 字节 → 浏览器按 UTF-8 解码 → 乱码
```

## 解决方案

### 1. 统一使用 UTF-8 编码（推荐）

#### VS Code 设置
1. 点击右下角编码显示（可能显示 "GB2312"）
2. 选择 **"通过编码保存"** → **"UTF-8"**
3. 或者在设置中搜索 `files.encoding`，设置为 `utf8`

#### 其他编辑器
- **Sublime Text**: File → Save with Encoding → UTF-8
- **Notepad++**: 编码 → 转为 UTF-8 编码
- **WebStorm**: File → File Encoding → UTF-8

### 2. 项目配置检查

#### index.html
确保包含正确的 charset 声明：
```html
<meta charset="UTF-8" />
```

#### 文件编码验证
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

### 3. 修复已乱码的文件

如果文件已经被错误编码：

```bash
# 从 git 恢复原始文件（假设原始文件是正确的 UTF-8）
git checkout -- src/features/docs/view.ts
git checkout -- src/features/life/view.ts
git checkout -- index.html
```

## 编码知识科普

### UTF-8 vs GBK

| 特性 | UTF-8 | GBK |
|------|-------|-----|
| 国际标准 | ? 是 | ? 否（仅中文环境） |
| 支持语言 | 全球所有语言 | 主要中文、英文 |
| Web 标准 | ? 是 | ? 否 |
| 字节长度 | 变长（1-4字节） | 定长（2字节中文） |
| 兼容性 | 所有现代工具 | 部分旧系统 |

### 为什么必须用 UTF-8

1. **Web 标准**: HTML5 默认编码是 UTF-8
2. **工具链**: Vite、TypeScript、Node.js 默认 UTF-8
3. **国际化**: 支持 emoji、日文、阿拉伯文等
4. **兼容性**: 跨平台、跨系统无乱码

## 踩坑记录

### 场景 1: 编辑器自动切换编码
**问题**: 在 Windows 上新建文件时，编辑器自动使用 GB2312 保存
**解决**: 修改编辑器默认编码设置为 UTF-8

### 场景 2: 复制粘贴导致编码混乱
**问题**: 从 GBK 编码的文件复制内容到 UTF-8 文件
**解决**: 确保源文件和目标文件都是 UTF-8

### 场景 3: Git 显示乱码
**问题**: `git log` 或 `git diff` 显示中文乱码
**解决**: 
```bash
git config --global core.quotepath false
git config --global gui.encoding utf-8
```

## 最佳实践

1. **项目初始化时**: 统一设置团队编辑器编码为 UTF-8
2. **代码审查时**: 检查新增文件编码
3. **CI/CD 时**: 添加编码检查步骤
4. **文档中**: 明确声明项目使用 UTF-8 编码

## 参考

- [UTF-8 Wikipedia](https://en.wikipedia.org/wiki/UTF-8)
- [HTML charset 规范](https://html.spec.whatwg.org/multipage/semantics.html#charset)
- [Vite 官方文档](https://vitejs.dev/)
