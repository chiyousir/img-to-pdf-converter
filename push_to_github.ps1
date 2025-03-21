# Simple script to push to GitHub
Write-Host "Configuring Git..."

# Get user input for commit message
$commitMessage = Read-Host "Enter commit message"

Write-Host "Adding all changes..."
git add .

Write-Host "Committing changes..."
git commit -m "$commitMessage"

Write-Host "Pushing to GitHub..."
git push origin main

Write-Host "Done! Press any key to exit"
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 