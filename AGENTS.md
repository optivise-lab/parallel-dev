# AGENTS.md — ParallelDev

## Commands

- **Dev server:** `npm run dev`
- **Typecheck:** `npx tsc --noEmit`
- **Build:** `npm run build` (runs tsc + vite build + electron-builder)
- **Postinstall:** `npm run postinstall` (rebuilds node-pty for Electron)

## Architecture

Electron desktop app with React frontend, built with Vite.

### Main process (`electron/`)

- `main.ts` — App entry, window creation, IPC handlers, native menu
- `preload.ts` — Context bridge exposing `window.electronAPI` to renderer
- `services/git.ts` — Git operations (clone, branch, status, diff, commit, push) via `simple-git`
- `services/store.ts` — Persistent storage for repos, sessions, settings
- `services/pty.ts` — Terminal process management via `node-pty`

### Renderer (`src/`)

- `main.tsx` — React entry point
- `App.tsx` — Root component, session management, IPC event listeners
- `types.ts` — Shared types and `ElectronAPI` interface declaration
- `index.css` — Tailwind CSS entry

### Components (`src/components/`)

- `Sidebar.tsx` — Repo/session navigation
- `Terminal.tsx` — xterm.js terminal per session
- `ChangedFiles.tsx` — Git status file list
- `DiffViewer.tsx` — File diff display
- `CommitModal.tsx` — Commit message dialog
- `NewSessionModal.tsx` — Branch creation with remote branch selection
- `Settings.tsx` — App settings (workspace path)
- `About.tsx` — About page
- `PushButton.tsx` — Commit and push action

## Conventions

- **Language:** TypeScript (strict mode)
- **Frontend:** React 18 with functional components and hooks
- **Styling:** Tailwind CSS, dark theme (`bg-[#1e1e2e]` base)
- **IPC pattern:** `ipcMain.handle` / `ipcRenderer.invoke` for async; `ipcMain.on` / `ipcRenderer.send` for fire-and-forget (terminals)
- **Preload bridge:** All renderer↔main communication goes through `window.electronAPI` defined in `preload.ts` with types in `src/types.ts`
- **No comments** unless code is complex and requires context
- **Window:** `titleBarStyle: 'hiddenInset'` on macOS
- **External modules:** `node-pty` is externalized in Vite rollup config

## Key Patterns

- When adding a new IPC channel: add handler in `main.ts`, expose in `preload.ts`, add type to `ElectronAPI` in `src/types.ts`
- Components are exported as named exports
- State is managed with React `useState`/`useCallback`/`useEffect` (no state library)
