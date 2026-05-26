param([switch]$Approve)
Write-Output "[시작] prerequisite installer"
if (-not $Approve) { Write-Output "[경고] dry-run only. Re-run with -Approve to install Git, Node.js LTS, GitHub CLI, and Codex CLI."; exit 0 }
winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements
winget install --id GitHub.cli -e --source winget --accept-package-agreements --accept-source-agreements
npm install -g @openai/codex
Write-Output "[완료] restart terminal/IDE and run verify-setup.ps1"
