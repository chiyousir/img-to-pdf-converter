Write-Host "Configuring Git..." -ForegroundColor Green
$env:GIT_PAGER = ""

Write-Host "Ensuring on main branch..." -ForegroundColor Green
git checkout main

Write-Host "Adding all files..." -ForegroundColor Green
git add .

Write-Host "Committing changes..." -ForegroundColor Green
git commit -m "Update project files" --allow-empty

Write-Host "Pushing to master branch..." -ForegroundColor Green
git push origin main:master -f

Write-Host "Done!" -ForegroundColor Green
Read-Host "Press Enter to continue" 