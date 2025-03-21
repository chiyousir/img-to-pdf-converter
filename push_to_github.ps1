Write-Host "正在配置Git..." -ForegroundColor Green
$env:GIT_PAGER = ""

Write-Host "确保在主分支上..." -ForegroundColor Green
git checkout main

Write-Host "添加所有文件..." -ForegroundColor Green
git add .

Write-Host "提交更改..." -ForegroundColor Green
git commit -m "更新项目文件" --allow-empty

Write-Host "推送到master分支..." -ForegroundColor Green
git push origin main:master -f

Write-Host "完成！" -ForegroundColor Green
Read-Host "按Enter键继续" 