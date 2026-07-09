$privateTrackedFiles = @(
  "关于我/core-profile.md",
  "关于我/current.md",
  "关于我/verified-patterns.md",
  "关于我/career-projects.md",
  "关于我/health-habits.md",
  "关于我/relationships.md"
)

$missing = @()

foreach ($path in $privateTrackedFiles) {
  if (-not (Test-Path -LiteralPath $path)) {
    $missing += $path
  }
}

if ($missing.Count -gt 0) {
  Write-Host "These files are missing and were not protected:" -ForegroundColor Yellow
  $missing | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
}

foreach ($path in $privateTrackedFiles) {
  git update-index --skip-worktree -- "$path"
}

Write-Host "Protected tracked private files from accidental git diffs." -ForegroundColor Green
Write-Host "Untracked logs and review outputs are covered by .gitignore." -ForegroundColor Green
Write-Host "If you need to edit and commit one of these files intentionally, run:" -ForegroundColor Cyan
Write-Host "  git update-index --no-skip-worktree -- <path>" -ForegroundColor Cyan
