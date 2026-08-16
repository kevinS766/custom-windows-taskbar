Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32TaskbarShow {
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool EnableWindow(IntPtr hWnd, bool bEnable);
}
"@

try {
    # 5 = SW_SHOW, 9 = SW_RESTORE
    $tray = [Win32TaskbarShow]::FindWindow("Shell_TrayWnd", $null)
    if ($tray -ne [IntPtr]::Zero) {
        [Win32TaskbarShow]::EnableWindow($tray, $true)
        [Win32TaskbarShow]::ShowWindow($tray, 5)
        Write-Host "[OK] Barra principal de Windows restaurada." -ForegroundColor Green
    } else {
        Write-Host "[AVISO] No se encontro la ventana Shell_TrayWnd." -ForegroundColor Yellow
    }

    $secTray = [Win32TaskbarShow]::FindWindow("Shell_SecondaryTrayWnd", $null)
    if ($secTray -ne [IntPtr]::Zero) {
        [Win32TaskbarShow]::EnableWindow($secTray, $true)
        [Win32TaskbarShow]::ShowWindow($secTray, 5)
        Write-Host "[OK] Barra secundaria de Windows restaurada." -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
}
