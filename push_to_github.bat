@echo off
echo Configuring Git...
git config --global core.pager ""

echo Ensuring on main branch...
git checkout main

echo Adding all files...
git add .

echo Committing changes...
git commit -m "Update project files" --allow-empty

echo Pushing to master branch...
git push origin main:master -f

echo Done!
pause 