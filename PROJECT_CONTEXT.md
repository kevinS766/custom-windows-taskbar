# Contexto del Proyecto: Custom Windows Taskbar (Barra de Tareas Personalizada para Windows)

## 📌 Resumen del Proyecto
Se ha desarrollado una **Barra de Tareas Flotante y Ultra Personalizada para Windows** utilizando **Electron (Node.js + Web Tech)**. Está optimizada para trabajar en conjunto con el modo *"Ocultar automáticamente la barra de tareas de Windows"* y funcionar **100% mediante navegación fluida por teclado**.

---

## 🛠️ Especificaciones Técnicas y Arquitectura

* **Directorio del Proyecto:** `C:\Users\omega\custom-taskbar`
* **Tecnología Principal:** Electron v35, Node.js v26, HTML5, CSS3 Glassmorphism, JavaScript ES6+.
* **Librerías Clave:**
  * `node-global-key-listener`: Intercepta pulsaciones físicas de teclado a bajo nivel (*Low-Level Keyboard Hook*) a través de Win32 API (`SetWindowsHookEx`), capturando `Win+1..9` al instante.
  * `systeminformation`: Monitoreo en tiempo real del estado del sistema (CPU % y Memoria RAM %).

---

## ✨ Características e Interacciones Implementadas

1. **⚡ Feedback Visual Instantáneo y Minimización por Conmutación (`Win+1..9` / `Super+1..N`):**
   - **Enfoque Instantáneo (0ms):** Al presionar el atajo numérico de una aplicación inactiva o minimizada, la barra traslada el foco y la píldora inmediatamente y restaura la ventana en pantalla.
   - **Minimización al Repetir Atajo (Toggle Minimize):** Si la aplicación ya tiene el foco activo en pantalla y presionas nuevamente su mismo número (`Super + N`), la ventana **se minimiza inmediatamente** a la barra y la píldora se desvanece de forma fluida. Al presionar nuevamente, se vuelve a restaurar.

2. **🎞️ Animación Suave de Traslado (Sliding Active Pill):**
   - Píldora de foco deslizante con aceleración por hardware (`CSS transform: translateX`) y curva suave tipo física (`cubic-bezier(0.16, 1, 0.3, 1)`), que viaja suavemente entre los botones.

3. **👻 Atenuación Rápida y Fluida al Pasar el Ratón (*Mouse Proximity Dimming*):**
   - Monitoreo en tiempo real de la proximidad del cursor.
   - Transición CSS suave (`opacity: 0.22`, `transform: translateY(2px)`) en lugar de saltos bruscos.
   - Clics del ratón continúan pasando a través (*click-through* total).

4. **🚀 Buscador y Lanzador Dinámico Sin Flicker (`Alt + Space`):**
   - Eliminado todo parpadeo (*flicker*) gracias a un canvas fijo transparente sin reajustes de tamaño del sistema operativo (`mainWindow.setBounds`).
   - El menú se despliega verticalmente hacia arriba de manera instantánea y elegante con CSS.

5. **📂 Lista de Aplicaciones 100% Personalizable (`apps.json`):**
   - El buscador (`Alt + Space`) ahora muestra **única y exclusivamente tus aplicaciones configuradas**, sin programas genéricos de Windows.
   - Archivo de configuración: [`apps.json`](file:///c:/Users/omega/custom-taskbar/apps.json).
   - Puedes agregar, quitar o cambiar cualquier ruta a `.exe`, `.lnk` o comando.
   - **Hot-Reload en Vivo:** Al guardar cambios en `apps.json`, la barra actualiza la lista y los iconos automáticamente sin necesidad de reiniciar.

6. **🎨 Badges Numéricos y Sin Avisos Invasivos:**
   - Badges numéricos claros y contrastados.
   - Eliminada la notificación toast flotante del rayo.

---

## 📁 Archivos del Proyecto

| Archivo | Propósito |
| :--- | :--- |
| `window-tracker.cs` / `.exe` | Motor nativo Win32 ultra-rápido en C# que rastrea ventanas abiertas y gestiona el foco. |
| `main.js` | Proceso principal de Electron, escáner de aplicaciones instaladas de Windows y gestión de atajos globales. |
| `index.html` | Estructura HTML con la barra de tareas y el lanzador de aplicaciones. |
| `styles.css` | Sistema de diseño Glassmorphic oscuro con animaciones aceleradas por hardware para la píldora y transiciones. |
| `renderer.js` | Lógica de cliente: selección instantánea optimista, animación de traslado, búsqueda y filtrado en vivo de apps. |
| `quitar-barra-windows.bat` / `.ps1` | Oculta la barra nativa de Windows. |
| `poner-barra-windows.bat` / `.ps1` | Restaura la barra nativa de Windows. |
| `start-taskbar.bat` | Inicia la barra personalizada en segundo plano. |
| `stop-taskbar.bat` | Cierra la barra personalizada. |

---

## 🚀 Cómo Iniciar y Detener la Aplicación

* **Para iniciar:** ejecuta [`start-taskbar.bat`](file:///c:/Users/omega/custom-taskbar/start-taskbar.bat) o `npm start`
* **Para cerrar:** ejecuta [`stop-taskbar.bat`](file:///c:/Users/omega/custom-taskbar/stop-taskbar.bat) o `npm run stop`
* **Ocultar barra de Windows:** [`hide-native-taskbar.bat`](file:///c:/Users/omega/custom-taskbar/hide-native-taskbar.bat)
* **Restaurar barra de Windows:** [`show-native-taskbar.bat`](file:///c:/Users/omega/custom-taskbar/show-native-taskbar.bat)
