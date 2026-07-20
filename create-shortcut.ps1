$projectDir = "D:\ai\6a5dd856e73672a131495d9d"
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "AI Coding Learner.lnk"
$targetPath = Join-Path $projectDir "start.bat"
$iconPath = Join-Path $projectDir "node_modules\electron\dist\electron.exe"

$WScriptShell = New-Object -ComObject WScript.Shell
$shortcut = $WScriptShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetPath
$shortcut.WorkingDirectory = $projectDir
$shortcut.Description = "AI Coding Learner - Agent 编程学习平台"
$shortcut.WindowStyle = 1

if (Test-Path $iconPath) {
    $shortcut.IconLocation = "$iconPath,0"
}

$shortcut.Save()

Write-Host "桌面快捷方式已创建: $shortcutPath" -ForegroundColor Green
Write-Host "双击即可启动 AI Coding Learner" -ForegroundColor Cyan