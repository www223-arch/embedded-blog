#!/bin/bash

# 部署到 Gitee Pages

# 进入构建目录
cd dist

# 初始化 git 仓库
git init
git add .
git commit -m "Deploy to Gitee Pages"

# 添加 Gitee 远程仓库
git remote add origin https://gitee.com/www223/embedded-blog.git

# 推送到 gh-pages 分支
git push -f origin master:gh-pages

# 清理临时文件
cd ..
rm -rf dist/.git

echo "部署完成！请在 Gitee 仓库的 Pages 设置中启用 Pages 服务。"
echo "访问地址: https://www223.gitee.io/embedded-blog/"
