Write-Output "[시작] setup verification"
$checks = @("git --version","node -v","npm -v","claude --version","codex --version","gh --version","git remote -v","git status --short")
foreach ($c in $checks) { Write-Output "[진단] $c"; powershell -NoProfile -Command $c }
foreach ($p in @("AGENTS.md","CLAUDE.md","SETUP.md","$env:USERPROFILE\.claude\CLAUDE.md","$env:USERPROFILE\.codex\config.toml")) { Write-Output "[진단] $p = $(Test-Path $p)" }
Write-Output "[완료] verify output above"
