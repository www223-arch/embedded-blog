# Deploy to Gitee Pages

# Change to build directory
Set-Location dist

# Initialize git repository
git init
git add .
git commit -m "Deploy to Gitee Pages"

# Add Gitee remote
git remote add origin https://gitee.com/www223/embedded-blog.git

# Push to gh-pages branch
git push -f origin main:gh-pages

# Clean up
Set-Location ..
Remove-Item -Recurse -Force dist\.git -ErrorAction SilentlyContinue

Write-Host "Deployment completed! Please enable Pages service in Gitee repository settings."
Write-Host "Access URL: https://www223.gitee.io/embedded-blog/"
