@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo          GitHub Pages 部署工具
echo ========================================
echo.

:: 1. 检查 dist 文件夹是否存在
if not exist "dist" (
    echo ❌ 错误：找不到 dist 文件夹！
    echo 请先在 main 分支执行：npm run build
    echo.
    pause
    exit /b
)

:: 2. 检查 dist 是否为空
dir /b "dist" | findstr .>nul || (
    echo ❌ 错误：dist 文件夹是空的！
    echo 请先在 main 分支执行：npm run build
    echo.
    pause
    exit /b
)

echo ✅ 检查通过：dist 文件夹存在且有内容
echo.
pause

:: 3. 切换到 gh-pages 分支
echo 正在切换到 gh-pages 分支...
git checkout gh-pages
if errorlevel 1 (
    echo ❌ 切换分支失败！
    pause
    exit /b
)
echo ✅ 已切换到 gh-pages 分支
echo.
pause

:: 4. 清空旧文件（保留 .git 文件夹）
echo 正在清空旧部署文件...
for /f "delims=" %%i in ('dir /b ^| findstr /v /i ".git"') do (
    rmdir /s /q "%%i" 2>nul
    del /f /q "%%i" 2>nul
)
echo ✅ 旧文件已清空
echo.
pause

:: 5. 复制 dist 内容
echo 正在复制新的部署文件...
xcopy "dist\*" "." /e /h /y /i
echo ✅ 文件复制成功
echo.
pause

:: 6. 提交
echo 正在提交到本地仓库...
git add .
git commit -m "更新部署文件"
echo ✅ 提交成功
echo.
pause

:: 7. 推送到 GitHub
echo 正在推送到远程仓库...
git push origin gh-pages
if errorlevel 1 (
    echo ❌ 推送失败！请检查网络连接或权限
) else (
    echo ✅ 推送成功！
)
echo.
pause

:: 8. 切回 main 分支
echo 正在切回 main 分支...
git checkout main
echo.
echo ========================================
echo          部署流程结束！
echo ========================================
echo.
pause