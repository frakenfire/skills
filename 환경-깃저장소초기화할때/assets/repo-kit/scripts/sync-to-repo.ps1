param([switch]$ApproveCommit, [switch]$ApprovePush, [string]$Message="chore(setup): sync ai coding config")
Write-Output "[시작] sync application settings to repo checkout"
git rev-parse --show-toplevel | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Output "[실패] not a git repo"; exit 1 }
$claude = Join-Path $env:USERPROFILE ".claude"
if (Test-Path "$claude\CLAUDE.md") { Copy-Item "$claude\CLAUDE.md" ".\CLAUDE.md" -Force }
foreach ($d in @("skills","agents","commands")) { if (Test-Path "$claude\$d") { New-Item -ItemType Directory -Force -Path ".\.claude\$d" | Out-Null; Copy-Item "$claude\$d\*" ".\.claude\$d" -Recurse -Force } }
git status --short
git diff --stat
if ($ApproveCommit) { git add .; git commit -m $Message }
if ($ApprovePush) { git push }
Write-Output "[완료] sync-to-repo finished. Commit/push only run if approved by switches."
