Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32TaskbarHide {
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool EnableWindow(IntPtr hWnd, bool bEnable);
}
"@

try {
    # 0 = SW_HIDE
    $tray = [Win32TaskbarHide]::FindWindow("Shell_TrayWnd", $null)
    if ($tray -ne [IntPtr]::Zero) {
        [Win32TaskbarHide]::ShowWindow($tray, 0)
        [Win32TaskbarHide]::EnableWindow($tray, $false)
        Write-Host "[OK] Barra principal de Windows ocultada." -ForegroundColor Green
    } else {
        Write-Host "[AVISO] No se encontro la ventana Shell_TrayWnd." -ForegroundColor Yellow
    }

    $secTray = [Win32TaskbarHide]::FindWindow("Shell_SecondaryTrayWnd", $null)
    if ($secTray -ne [IntPtr]::Zero) {
        [Win32TaskbarHide]::ShowWindow($secTray, 0)
        [Win32TaskbarHide]::EnableWindow($secTray, $false)
        Write-Host "[OK] Barra secundaria de Windows ocultada." -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
}
