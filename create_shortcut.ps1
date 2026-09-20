$desktopPath1 = [Environment]::GetFolderPath('Desktop')
$desktopPath2 = "C:\Users\Moon Link\OneDrive\Desktop"
$targetExe = "c:\Users\Moon Link\Downloads\SkyFinservefinal\dist\win-unpacked\SkyFinserv.exe"
$targetBat = "c:\Users\Moon Link\Downloads\SkyFinservefinal\START_DESKTOP_APP.bat"
$iconPath = "c:\Users\Moon Link\Downloads\SkyFinservefinal\assets\icon.ico"

$WshShell = New-Object -comObject WScript.Shell

$paths = @($desktopPath1, $desktopPath2)
foreach ($d in $paths) {
    if (Test-Path $d) {
        $shortcutPath = Join-Path $d "SkyFinserv Desktop.lnk"
        $Shortcut = $WshShell.CreateShortcut($shortcutPath)
        $Shortcut.TargetPath = $targetExe
        $Shortcut.WorkingDirectory = "c:\Users\Moon Link\Downloads\SkyFinservefinal"
        $Shortcut.Description = "SkyFinserv Loan Portal Desktop Application"
        if (Test-Path $iconPath) {
            $Shortcut.IconLocation = $iconPath
        }
        $Shortcut.Save()
        Write-Host "Created shortcut at: $shortcutPath"
    }
}
