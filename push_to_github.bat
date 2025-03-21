@echo off
echo Configuring Git...

echo Adding all changes...
git add .

set /p message=Enter commit message: 
git commit -m "%message%"

echo Pushing to GitHub...
git push origin main

echo Done!
pause 