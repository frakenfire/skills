$ErrorActionPreference = "Continue"
$repo = $null
$outDir = Join-Path (Get-Location) "output"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$items = @()
function Add-Check($Name, $Status, $Value, $Next) {
  $script:items += [pscustomobject]@{ name=$Name; status=$Status; value=$Value; next=$Next }
  Write-Output "[진단] $Name: $Status - $Value"
}
function Cmd-Exists($cmd) { return [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
Write-Output "[시작] AI coding environment diagnosis"
Add-Check "PowerShell" "OK" $PSVersionTable.PSVersion.ToString() ""
foreach ($cmd in @("winget","git","node","npm","claude","codex","gh")) {
  if (Cmd-Exists $cmd) { Add-Check $cmd "OK" ((& $cmd --version 2>$null | Select-Object -First 1) -join " ") "" }
  else { Add-Check $cmd "WARN" "not found" "install or restart terminal after PATH changes" }
}
if (Cmd-Exists git) {
  $repo = git rev-parse --show-toplevel 2>$null
  if ($LASTEXITCODE -eq 0) {
    Add-Check "git repo" "OK" $repo ""
    Add-Check "git branch" "OK" (git branch --show-current) ""
    Add-Check "git remote" "OK" ((git remote -v) -join "; ") ""
    Add-Check "git status" "OK" ((git status --short) -join "; ") ""
  } else { Add-Check "git repo" "FAIL" "not inside a git repo" "clone the GitHub private repo first" }
} else { Add-Check "git repo" "SKIP" "git not found" "install Git" }
foreach ($p in @("AGENTS.md","CLAUDE.md","SETUP.md")) { Add-Check $p ($(if (Test-Path $p) {"OK"} else {"WARN"})) (Resolve-Path $p -ErrorAction SilentlyContinue) "create from repo kit if missing" }
foreach ($p in @("$env:USERPROFILE\.claude","$env:USERPROFILE\.claude\CLAUDE.md","$env:USERPROFILE\.codex","$env:USERPROFILE\.codex\config.toml")) { Add-Check $p ($(if (Test-Path $p) {"OK"} else {"WARN"})) $p "sync from repo if needed" }
$items | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 (Join-Path $outDir "bootstrap-state.json")
$md = @("# Diagnose Report", "", "Generated: $(Get-Date -Format s)", "", "| item | status | value | next |", "|---|---|---|---|")
foreach ($i in $items) { $md += "| $($i.name) | $($i.status) | $($i.value -replace '\|','/') | $($i.next -replace '\|','/') |" }
$md | Set-Content -Encoding UTF8 (Join-Path $outDir "last-diagnose-report.md")
Write-Output "[완료] wrote output/bootstrap-state.json and output/last-diagnose-report.md"
