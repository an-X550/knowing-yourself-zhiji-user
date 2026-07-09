$privateTrackedFiles = @(
  "关于我/core-profile.md",
  "关于我/current.md",
  "关于我/verified-patterns.md",
  "关于我/career-projects.md",
  "关于我/health-habits.md",
  "关于我/relationships.md"
)

foreach ($path in $privateTrackedFiles) {
  git update-index --no-skip-worktree -- "$path"
}

Write-Host "Tracked private files are visible to git again." -ForegroundColor Green
