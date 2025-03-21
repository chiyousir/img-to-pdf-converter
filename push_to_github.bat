@echo off
echo Configuring Git...

REM Get user info
set /p name=Enter your name for Git commit: 
set /p email=Enter your email for Git commit: 

git config --global user.name "%name%"
git config --global user.email "%email%"

echo Adding all changes...
git add .

set /p message=Enter commit message: 
git commit -m "%message%"

echo Pushing to GitHub...
git push

echo Done!
pause 