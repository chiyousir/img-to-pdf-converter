@echo off
echo 正在配置Git...
git config --global core.pager ""

echo 确保在主分支上...
git checkout main

echo 添加所有文件...
git add .

echo 提交更改...
git commit -m "更新项目文件" --allow-empty

echo 推送到master分支...
git push origin main:master -f

echo 完成！
pause 