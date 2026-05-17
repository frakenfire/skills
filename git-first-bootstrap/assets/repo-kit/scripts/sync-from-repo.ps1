param([switch]$Approve)
Write-Output "[시작] sync from repo to application locations"
git rev-parse --show-toplevel | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Output "[실패] not a git repo"; exit 1 }
if (-not $Approve) { Write-Output "[경고] dry-run only. Re-run with -Approve to copy files to ~/.claude and ~/.codex."; exit 0 }
$claude = Join-Path $env:USERPROFILE ".claude"
$codex = Join-Path $env:USERPROFILE ".codex"
New-Item -ItemType Directory -Force -Path $claude,$codex | Out-Null
if (Test-Path ".\CLAUDE.md") { Copy-Item ".\CLAUDE.md" "$claude\CLAUDE.md" -Force }
foreach ($d in @("skills","agents","commands")) { if (Test-Path ".\.claude\$d") { New-Item -ItemType Directory -Force -Path "$claude\$d" | Out-Null; Copy-Item ".\.claude\$d\*" "$claude\$d" -Recurse -Force } }
if (Test-Path ".\codex-config.toml") { Copy-Item ".\codex-config.toml" "$codex\config.toml" -Force }
Write-Output "[완료] synced repo settings to application locations. Restart Claude/Codex if open."
