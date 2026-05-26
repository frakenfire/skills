param([string]$Path = (Get-Location).Path)
Write-Output "[시작] fix git safe.directory for specific checkout"
$normalized = $Path -replace "\\", "/"
git config --global --add safe.directory $normalized
Write-Output "[완료] added safe.directory: $normalized"
Write-Output "[경고] Do not use safe.directory '*' unless this specific path fix fails and you accept the broader trust risk."
