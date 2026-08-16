using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;

public class Program {
    [DllImport("user32.dll")]
    private static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("kernel32.dll")]
    public static extern uint GetCurrentThreadId();

    [DllImport("user32.dll")]
    public static extern IntPtr OpenInputDesktop(uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll")]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool CloseDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool IsWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern int GetWindowLong(IntPtr hWnd, int nIndex);

    [DllImport("user32.dll")]
    public static extern IntPtr GetWindow(IntPtr hWnd, uint uCmd);

    [DllImport("dwmapi.dll")]
    public static extern int DwmGetWindowAttribute(IntPtr hwnd, int dwAttribute, out int pvAttribute, int cbAttribute);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool BringWindowToTop(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr SetActiveWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);

    [DllImport("user32.dll")]
    public static extern bool AllowSetForegroundWindow(int dwProcessId);

    [DllImport("user32.dll")]
    public static extern bool SystemParametersInfo(uint uiAction, uint uiParam, IntPtr pvParam, uint fWinIni);

    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);

    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    static readonly IntPtr HWND_TOP = new IntPtr(0);
    static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
    static readonly IntPtr HWND_NOTOPMOST = new IntPtr(-2);

    const int GWL_EXSTYLE = -20;
    const int WS_EX_TOOLWINDOW = 0x00000080;
    const int WS_EX_APPWINDOW = 0x00040000;
    const uint GW_OWNER = 4;
    const int DWMWA_CLOAKED = 14;
    const int SW_RESTORE = 9;
    const int SW_SHOW = 5;
    const int SW_MINIMIZE = 6;

    const uint SWP_NOSIZE = 0x0001;
    const uint SWP_NOMOVE = 0x0002;
    const uint SWP_SHOWWINDOW = 0x0040;
    const uint SPI_SETFOREGROUNDLOCKTIMEOUT = 0x2001;
    const uint SPIF_SENDCHANGE = 0x0002;
    const int ASFW_ANY = -1;

    public class WindowEntry {
        public long hWnd;
        public string title;
        public string processName;
        public string exePath;
        public bool isFocused;
        public bool isMinimized;
        public string iconBase64;
    }

    private static Dictionary<string, string> iconCache = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

    public static string GetIconBase64(string exePath) {
        if (string.IsNullOrEmpty(exePath) || !File.Exists(exePath)) return "";
        if (iconCache.ContainsKey(exePath)) return iconCache[exePath];

        try {
            using (Icon ico = Icon.ExtractAssociatedIcon(exePath)) {
                if (ico != null) {
                    using (Bitmap bmp = ico.ToBitmap()) {
                        using (MemoryStream ms = new MemoryStream()) {
                            bmp.Save(ms, ImageFormat.Png);
                            string b64 = "data:image/png;base64," + Convert.ToBase64String(ms.ToArray());
                            iconCache[exePath] = b64;
                            return b64;
                        }
                    }
                }
            }
        } catch { }

        return "";
    }

    public static void FocusWindow(IntPtr targetHwnd) {
        if (targetHwnd == IntPtr.Zero || !IsWindow(targetHwnd)) return;

        try {
            AllowSetForegroundWindow(ASFW_ANY);
            SystemParametersInfo(SPI_SETFOREGROUNDLOCKTIMEOUT, 0, IntPtr.Zero, SPIF_SENDCHANGE);
        } catch { }

        IntPtr fgHwnd = GetForegroundWindow();
        uint fgPid = 0;
        uint fgThread = fgHwnd != IntPtr.Zero ? GetWindowThreadProcessId(fgHwnd, out fgPid) : 0;
        uint targetPid = 0;
        uint targetThread = GetWindowThreadProcessId(targetHwnd, out targetPid);
        uint curThread = GetCurrentThreadId();

        bool attachedFg = false;
        bool attachedTarget = false;

        if (fgThread != 0 && fgThread != curThread) {
            attachedFg = AttachThreadInput(curThread, fgThread, true);
        }
        if (targetThread != 0 && targetThread != curThread) {
            attachedTarget = AttachThreadInput(curThread, targetThread, true);
        }

        // Tap Alt key to grant foreground permissions
        keybd_event(0x12, 0, 0, UIntPtr.Zero);
        keybd_event(0x12, 0, 2, UIntPtr.Zero);

        if (IsIconic(targetHwnd)) {
            ShowWindow(targetHwnd, SW_RESTORE);
        } else {
            ShowWindow(targetHwnd, SW_SHOW);
        }

        // Force Z-Order on top of any maximized window
        SetWindowPos(targetHwnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW);
        SetWindowPos(targetHwnd, HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW);
        SetWindowPos(targetHwnd, HWND_TOP, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW);

        BringWindowToTop(targetHwnd);
        SetForegroundWindow(targetHwnd);
        SetActiveWindow(targetHwnd);
        SwitchToThisWindow(targetHwnd, true);

        if (attachedFg) AttachThreadInput(curThread, fgThread, false);
        if (attachedTarget) AttachThreadInput(curThread, targetThread, false);
    }

    public static void ToggleFocusWindow(IntPtr targetHwnd) {
        IntPtr fgHwnd = GetForegroundWindow();
        if (fgHwnd == targetHwnd && !IsIconic(targetHwnd)) {
            ShowWindow(targetHwnd, SW_MINIMIZE);
            return;
        }
        FocusWindow(targetHwnd);
    }

    public static List<WindowEntry> GetVisibleWindows() {
        IntPtr hDesk = OpenInputDesktop(0, false, 0x01FF);
        if (hDesk != IntPtr.Zero) {
            SetThreadDesktop(hDesk);
        }

        IntPtr fgHwnd = GetForegroundWindow();
        List<WindowEntry> list = new List<WindowEntry>();

        EnumWindows((hWnd, lParam) => {
            if (!IsWindowVisible(hWnd)) return true;

            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            string title = sb.ToString().Trim();
            if (string.IsNullOrEmpty(title)) return true;

            if (title == "Program Manager" || title == "Custom Windows Taskbar" || 
                title == "Default IME" || title == "MSCTFIME UI" ||
                title == "Experiencia de entrada de Windows" ||
                title.StartsWith("amd dvr", StringComparison.OrdinalIgnoreCase)) {
                return true;
            }

            int exStyle = GetWindowLong(hWnd, GWL_EXSTYLE);
            IntPtr owner = GetWindow(hWnd, GW_OWNER);
            if ((exStyle & WS_EX_TOOLWINDOW) != 0 && (exStyle & WS_EX_APPWINDOW) == 0) return true;
            if (owner != IntPtr.Zero && (exStyle & WS_EX_APPWINDOW) == 0) return true;

            int cloaked = 0;
            try {
                DwmGetWindowAttribute(hWnd, DWMWA_CLOAKED, out cloaked, sizeof(int));
            } catch {}
            if (cloaked != 0) return true;

            uint pid;
            GetWindowThreadProcessId(hWnd, out pid);
            string procName = "";
            string exePath = "";

            try {
                Process proc = Process.GetProcessById((int)pid);
                procName = proc.ProcessName;
                try {
                    exePath = proc.MainModule.FileName;
                } catch { }
            } catch { }

            if (string.IsNullOrEmpty(procName)) return true;

            if (procName.Equals("ApplicationFrameHost", StringComparison.OrdinalIgnoreCase)) {
                if (title.IndexOf("calculadora", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    title.IndexOf("calculator", StringComparison.OrdinalIgnoreCase) >= 0) {
                    procName = "calc";
                }
            }

            WindowEntry item = new WindowEntry();
            item.hWnd = (long)hWnd;
            item.title = title;
            item.processName = procName;
            item.exePath = exePath;
            item.isFocused = (hWnd == fgHwnd);
            item.isMinimized = IsIconic(hWnd);
            item.iconBase64 = GetIconBase64(exePath);

            list.Add(item);
            return true;
        }, IntPtr.Zero);

        if (hDesk != IntPtr.Zero) CloseDesktop(hDesk);
        return list;
    }

    static void Main(string[] args) {
        Console.OutputEncoding = Encoding.UTF8;

        if (args.Length > 0) {
            string command = args[0].ToLowerInvariant();
            if (command == "focus" && args.Length > 1) {
                long hwndVal;
                if (long.TryParse(args[1], out hwndVal)) {
                    ToggleFocusWindow(new IntPtr(hwndVal));
                    return;
                }
            } else if (command == "focus-process" && args.Length > 1) {
                string pName = args[1];
                string fallback = args.Length > 2 ? args[2] : null;
                var windows = GetVisibleWindows();
                WindowEntry target = null;
                foreach (var w in windows) {
                    if (w.processName.Equals(pName, StringComparison.OrdinalIgnoreCase)) {
                        target = w;
                        break;
                    }
                }
                if (target != null) {
                    ToggleFocusWindow(new IntPtr(target.hWnd));
                    return;
                }
                if (!string.IsNullOrEmpty(fallback)) {
                    try {
                        Process.Start(new ProcessStartInfo {
                            FileName = "cmd.exe",
                            Arguments = "/c start \"\" " + fallback,
                            CreateNoWindow = true,
                            UseShellExecute = false,
                            WindowStyle = ProcessWindowStyle.Hidden
                        });
                    } catch {}
                }
                return;
            }
        }

        // Default: list windows as JSON
        List<WindowEntry> list = GetVisibleWindows();
        StringBuilder json = new StringBuilder();
        json.Append("[");
        for (int i = 0; i < list.Count; i++) {
            WindowEntry w = list[i];
            if (i > 0) json.Append(",");
            json.Append("{");
            json.AppendFormat("\"hWnd\":{0},", w.hWnd);
            json.AppendFormat("\"title\":\"{0}\",", EscapeJson(w.title));
            json.AppendFormat("\"processName\":\"{0}\",", EscapeJson(w.processName));
            json.AppendFormat("\"exePath\":\"{0}\",", EscapeJson(w.exePath));
            json.AppendFormat("\"isFocused\":{0},", w.isFocused ? "true" : "false");
            json.AppendFormat("\"isMinimized\":{0},", w.isMinimized ? "true" : "false");
            json.AppendFormat("\"iconBase64\":\"{0}\"", w.iconBase64);
            json.Append("}");
        }
        json.Append("]");

        Console.WriteLine(json.ToString());
    }

    private static string EscapeJson(string s) {
        if (string.IsNullOrEmpty(s)) return "";
        return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", "").Replace("\n", " ");
    }
}
