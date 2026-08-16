# 🪟 Custom Windows Taskbar

Una **Barra de Tareas Flotante, Minimalista y Ultra Rápida para Windows**, diseñada para funcionar **100% mediante navegación por teclado** con diseño Glassmorphism oscuro y animaciones fluidas aceleradas por hardware.

---

## ✨ Características Principales

* 💼 **Workspaces / Espacios de Trabajo Personalizables (`workspaces.json`):** Escribe en el buscador (`Alt + Space`) términos como `"editar"`, `"dev"`, `"gaming"` para abrir y organizar tus aplicaciones en slots predefinidos (ej: Premiere en `1`, Omni en `2`).
* 🔒 **Botón Seguro de Reordenamiento (Drag & Drop):** Botón con candado en la barra (o `Shift + Alt + Space`) que desbloquea temporalmente el ratón para **arrastrar y reordenar las aplicaciones entre los slots `1..9`**. Al cerrar el candado o presionar `Esc`, el orden se guarda y la barra vuelve al modo seguro de transparencia total al ratón.
* 🖥️ **Soporte Multi-Monitor Nativo:** La barra de tareas se proyecta de forma sincronizada e independiente en **todas las pantallas conectadas**, adaptándose a las resoluciones de cada monitor en tiempo real.
* 🚀 **Inicio Automático con Windows (*Auto-Start on Boot*):** Se inicia de forma 100% silenciosa en segundo plano cada vez que inicias sesión en tu equipo.
* ⚡ **Feedback Visual Instantáneo (0ms):** Al presionar `Super + 1..9` (`Win+1..9` o `Alt+1..9`), el foco se traslada de inmediato en el mismo fotograma sin retrasos perceptibles.
* 🎞️ **Píldora Activa Deslizante (*Sliding Pill*):** Indicador de foco suave con física elástica (`cubic-bezier`) acelerada por GPU (`CSS transform: translateX`) que viaja entre las aplicaciones activas.
* 🔄 **Conmutación Inteligente (*Toggle Minimize*):**
  * Si la aplicación está en segundo plano o minimizada ➔ se restaura y pasa al frente.
  * Si la aplicación ya tiene el foco activo ➔ se **minimiza al instante**.
* 🛡️ **Garantía de Primer Plano en Windows (Z-Order Fix):** Supera las restricciones de *Foreground Lock* de Windows para colocar siempre la aplicación por encima de cualquier ventana maximizada.
* 👻 **Atenuación Fluida por Proximidad (*Mouse Proximity Dimming*):** Al acercar el ratón a la barra, esta se atenúa suavemente al 22% de opacidad para no obstaculizar la vista. Los clics del ratón atraviesan la barra por completo (*click-through* total).
* 🚀 **Lanzador de Aplicaciones Sin Parpadeo (`Alt + Space`):** Buscador rápido que se despliega hacia arriba con animación fluida.
* 📂 **Lista de Aplicaciones 100% Personalizable (`apps.json`):** Muestra única y exclusivamente las aplicaciones y herramientas que tú usas, con soporte para **Hot-Reload en vivo** (recarga instantánea al guardar el archivo sin reiniciar).
* 🎨 **Iconos Nativos de Windows:** Extracción automática de los iconos a color en alta resolución directamente de los archivos `.exe` y accesos directos `.lnk`.

---

## ⌨️ Atajos de Teclado Globales

| Atajo | Acción |
| :--- | :--- |
| **`Win + 1` .. `Win + 9`** | Enfocar / Restaurar ventana abierta (o Minimizar si ya tiene el foco) |
| **`Alt + 1` .. `Alt + 9`** | Alternativa al atajo numérico para teclados sin tecla Super/Win |
| **`Alt + Space`** | Abrir / Cerrar el Buscador y Lanzador de aplicaciones personalizado |
| **`Shift + Alt + Space`** | Activar / Desactivar el Modo Seguro de Reordenamiento (Arrastrar y Soltar) |
| **`Alt + Shift + T`** | Enfocar la barra para navegar con **Flechas (`←` / `→`)**, **`Tab`**, **`Enter`** y **`Esc`** |

---

## 🚀 Inicio Rápido

### Requisitos
* Windows 10 o Windows 11
* [Node.js](https://nodejs.org/) (v18 o superior)
* .NET Framework (incluido por defecto en Windows)

### Instalación
1. Clona el repositorio:
   ```bash
   git clone https://github.com/kevinS766/custom-windows-taskbar.git
   cd custom-windows-taskbar
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```

### Ejecutar
* **Iniciar la barra personalizada:** Haz doble clic en [`start-taskbar.bat`](./start-taskbar.bat) o ejecuta:
  ```bash
  npm start
  ```
* **Cerrar la barra personalizada:** Haz doble clic en [`stop-taskbar.bat`](./stop-taskbar.bat) o ejecuta:
  ```bash
  npm run stop
  ```

---

## ⚙️ Personalización de Aplicaciones (`apps.json`)

Edita el archivo [`apps.json`](./apps.json) para definir exactamente las aplicaciones que aparecerán en el buscador (`Alt + Space`):

```json
[
  {
    "name": "Brave Browser",
    "path": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
    "desc": "Navegador Web"
  },
  {
    "name": "Discord",
    "path": "C:\\Users\\tu-usuario\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Discord.lnk",
    "desc": "Chat y Comunidad"
  },
  {
    "name": "Git Bash",
    "path": "C:\\Program Files\\Git\\git-bash.exe",
    "desc": "Terminal de Comandos"
  }
]
```
> **Nota:** Puedes usar rutas a ejecutables (`.exe`), accesos directos (`.lnk`) o comandos del sistema. Los cambios se reflejan en tiempo real al guardar el archivo.

---

## 💼 Configuración de Espacios de Trabajo (`workspaces.json`)

Puedes definir tus propios espacios de trabajo en [`workspaces.json`](./workspaces.json) (tienes una plantilla de referencia en [`workspaces.example.json`](./workspaces.example.json)). 

Al escribir en el buscador (`Alt + Space`) palabras clave como `"editar"` o el nombre de tu workspace, se abrirán y organizarán automáticamente las aplicaciones en sus slots correspondientes (`1..9`):

```json
[
  {
    "id": "editar",
    "name": "Workspace: Edición de Video",
    "desc": "Adobe Premiere Pro [1] + Omni Media Explorer [2]",
    "keywords": ["editar", "video", "premiere", "omni", "multimedia", "edit"],
    "slots": [
      {
        "slot": 1,
        "name": "Adobe Premiere Pro",
        "processName": "Adobe Premiere Pro",
        "path": "C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Adobe Premiere Pro 2026.lnk"
      },
      {
        "slot": 2,
        "name": "Omni Media Explorer",
        "processName": "OmniMediaExplorer",
        "path": "C:\\Users\\omega\\Documents\\Omni\\tools\\OmniMediaExplorer.exe"
      }
    ]
  }
]
```
* **Hot-Reload:** Al guardar [`workspaces.json`](./workspaces.json), la barra recarga los espacios en vivo de forma instantánea sin necesidad de reiniciar la app.

---

## 🛠️ Control Opcional de la Barra Nativa de Windows

Si deseas ocultar o restaurar la barra de tareas estándar de Windows:
* **Ocultar barra de Windows:** Ejecuta [`quitar-barra-windows.bat`](./quitar-barra-windows.bat)
* **Restaurar barra de Windows:** Ejecuta [`poner-barra-windows.bat`](./poner-barra-windows.bat)

---

## 🏗️ Arquitectura Técnica

* **Electron v35 + Node.js:** Gestión de ventana transparente sin marco (*frameless*), eventos globales y renderizado Web.
* **Win32 API Hooking (`node-global-key-listener`):** Captura de combinaciones de teclas a bajo nivel antes de ser interceptadas por el explorador de Windows.
* **Motor Nativo en C# (`window-tracker.cs`):** Enumeración de ventanas activas, extracción nativa de iconos en Base64 y gestión avanzada de capas *Z-Order*.
* **CSS Glassmorphism & GPU Acceleration:** Transiciones fluidas a 60fps con `backdrop-filter: blur()`.

---

## 📄 Licencia

MIT License © 2026.
