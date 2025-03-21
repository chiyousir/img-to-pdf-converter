Write-Host "Configuring Git..." -ForegroundColor Green

$name = Read-Host "Enter your name for Git commit"
$email = Read-Host "Enter your email for Git commit"

git config --global user.name $name
git config --global user.email $email

Write-Host "Adding all changes..." -ForegroundColor Green
git add .

$message = Read-Host "Enter commit message"
git commit -m $message

Write-Host "Pushing to GitHub..." -ForegroundColor Green
git push

Write-Host "Done! Press any key to exit" -ForegroundColor Green
$null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 