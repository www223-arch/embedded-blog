# 博客内容管理超级傻瓜指南

欢迎！这是一个超简单的指南，让你不用写代码也能管理你的博客内容！

---

## 目录

1. [准备工作](#准备工作)
2. [添加图片](#添加图片)
3. [添加项目作品](#添加项目作品)
4. [添加技术文档](#添加技术文档)
5. [添加个人分享](#添加个人分享)
6. [生成网站内容](#生成网站内容)
7. [修改已有内容](#修改已有内容)
8. [常见问题](#常见问题)

---

## 准备工作

在开始之前，确保你已经：
- 电脑上安装了 Python（如果还没有，先去 python.org 下载安装）
- 在项目文件夹里打开命令行（终端）

---

## 添加图片

### 第一步：把图片放对地方

1. 找到你的图片文件
2. 把图片复制到 `public` 文件夹里
3. 图片文件名要简单，比如 `my-photo.png`，不要有中文和空格

**例子：**
- 好的文件名：`circuit-board.png`
- 不好的文件名：`我的电路板 照片.png`

### 第二步：记住图片地址

图片放好后，在网站里访问的地址就是 `/文件名.png`

比如：
- 图片文件：`public/circuit-board.png`
- 网站地址：`/circuit-board.png`

---

## 添加项目作品

### 第一步：创建 YAML 文件

1. 打开 `content/projects` 文件夹
2. 新建一个文本文件，文件名用英文小写加连字符，比如 `my-awesome-project.yaml`
3. 把下面的内容复制进去，然后改成你自己的信息

```yaml
id: my-awesome-project
title: "我的超棒项目"
summary: "这里写项目的简短介绍，一两句话就行"
stack:
  - "技术1"
  - "技术2"
  - "技术3"
highlights:
  - "这个项目的亮点1"
  - "这个项目的亮点2"
  - "这个项目的亮点3"
gallery:
  - "/my-project-photo.png"
  - "/another-photo.jpg"
links:
  - label: "查看详情"
    href: "#"
```

### 第二步：填写说明

- **id**: 必须和文件名一样，比如文件名是 `my-awesome-project.yaml`，id 就写 `my-awesome-project`
- **title**: 项目的标题
- **summary**: 项目介绍，一两句话
- **stack**: 用了什么技术，一行一个
- **highlights**: 项目的亮点，一行一个
- **gallery**: 项目图片，把刚才放的图片地址写在这里
- **links**: 链接，一般用默认的就行

### 第三步：保存文件

保存文件，确保后缀是 `.yaml` 不是 `.txt`！

---

## 添加技术文档

### 第一步：创建 YAML 文件

1. 打开 `content/docs` 文件夹
2. 新建一个文本文件，比如 `my-tech-doc.yaml`
3. 把下面的内容复制进去，然后改成你自己的信息

```yaml
id: my-tech-doc
title: "我的技术文档"
category: "编程语言"
tags:
  - "标签1"
  - "标签2"
level: "beginner"
updatedAt: "2026-04-01"
summary: "这篇文档讲了什么内容，简短介绍"
markdown: |
  ## 这里是标题
  
  这里写你的文档内容，可以用 markdown 格式。
  
  - 列表项1
  - 列表项2
  
  ### 小标题
  
  更多内容...
```

### 第二步：填写说明

- **id**: 必须和文件名一样
- **title**: 文档标题
- **category**: 分类，比如"编程语言"、"操作系统"、"MCU 与平台"
- **tags**: 标签，一行一个
- **level**: 难度，三个选择：
  - `beginner` - 入门
  - `intermediate` - 中级
  - `advanced` - 高级
- **updatedAt**: 更新日期，格式是 `年-月-日`
- **summary**: 文档简介
- **markdown**: 这里写文档的详细内容

### 第三步：Markdown 简单教程

在 `markdown` 部分你可以用这些简单格式：

- `## 标题` - 大标题（前面两个 # 号）
- `### 小标题` - 小标题（前面三个 # 号）
- `- 列表项` - 列表（前面一个减号加空格）
- 空一行 - 分段
- 普通文字 - 直接写就行

### 第四步：保存文件

保存文件，确保后缀是 `.yaml`！

---

## 添加个人分享

### 第一步：创建 YAML 文件

1. 打开 `content/life` 文件夹
2. 新建一个文本文件，比如 `my-life-post.yaml`
3. 把下面的内容复制进去，然后改成你自己的信息

```yaml
id: my-life-post
title: "我的生活分享"
date: "2026-04-01"
tag: "摄影"
summary: "这里写分享的简介"
cover: "/my-life-photo.png"
```

### 第二步：填写说明

- **id**: 必须和文件名一样
- **title**: 分享标题
- **date**: 日期，格式是 `年-月-日`
- **tag**: 标签，比如"摄影"、"户外"、"生活"
- **summary**: 分享简介
- **cover**: 封面图片地址

### 第三步：保存文件

保存文件，确保后缀是 `.yaml`！

---

## 生成网站内容

### 重要！添加或修改内容后必须做这一步！

1. 在项目文件夹里打开命令行（终端）
2. 输入这个命令然后回车：

```bash
python generate_content.py
```

3. 等待几秒钟，看到 "Content generation complete!" 就成功了！

### 这个命令做了什么？

- 自动读取你写的所有 YAML 文件
- 检查有没有写错
- 生成网站能用的文件
- 显示找到多少个项目、文档、分享

---

## 修改已有内容

### 修改项目作品

1. 打开 `content/projects` 文件夹
2. 找到你想修改的文件，比如 `my-awesome-project.yaml`
3. 用记事本或其他编辑器打开
4. 修改里面的内容
5. 保存文件
6. **别忘了运行** `python generate_content.py`！

### 修改技术文档

1. 打开 `content/docs` 文件夹
2. 找到你想修改的文件
3. 修改内容
4. 保存文件
5. **运行** `python generate_content.py`！

### 修改个人分享

1. 打开 `content/life` 文件夹
2. 找到你想修改的文件
3. 修改内容
4. 保存文件
5. **运行** `python generate_content.py`！

---

## 常见问题

### Q: 文件名可以用中文吗？

A: 不建议，最好用英文小写加连字符，比如 `my-project.yaml`

### Q: YAML 文件里可以写中文吗？

A: 可以！title、summary 这些地方都可以写中文

### Q: 图片支持什么格式？

A: 支持 .png、.jpg、.jpeg、.gif 等常见格式

### Q: 改了内容网站没变化？

A: 别忘了运行 `python generate_content.py`！运行后刷新浏览器

### Q: 运行命令报错怎么办？

A: 
1. 检查 Python 有没有安装好
2. 检查 YAML 文件格式对不对（缩进要一致，用空格不要用 Tab）
3. 看看有没有漏写冒号、引号这些符号

### Q: 想删除某个内容？

A: 
1. 直接删除对应的 YAML 文件
2. 运行 `python generate_content.py`

### Q: 想重新开始？

A: 运行 `python create_sample_content.py` 会重新生成示例文件（会覆盖同名文件哦！）

---

## 快速检查清单

添加新内容后，检查：

- [ ] 图片放到 `public` 文件夹了吗？
- [ ] YAML 文件创建在正确的文件夹里吗？
- [ ] id 和文件名一样吗？
- [ ] 所有必填项都填了吗？
- [ ] 运行 `python generate_content.py` 了吗？
- [ ] 浏览器刷新了吗？

---

## 还需要帮助？

如果还有问题，看看示例文件：
- `content/projects/edge-gateway.yaml` - 项目示例
- `content/docs/cpp-threading.yaml` - 文档示例
- `content/life/mountain-weekend.yaml` - 分享示例

照着示例改肯定没问题！

祝你使用愉快！?
