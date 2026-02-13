import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron'
import path from 'node:path'
import simpleGit from 'simple-git'
import { GitService } from './services/git'
import { StoreService } from './services/store'
import { PtyService } from './services/pty'

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

const store = new StoreService()
const gitService = new GitService(store)
const ptyServices = new Map<string, PtyService>()

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1e1e2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST!, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(process.platform === 'darwin' ? [{
      label: app.name,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const },
      ],
    }] : []),
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(process.platform === 'darwin' ? [
          { type: 'separator' as const },
          { role: 'front' as const },
        ] : [
          { role: 'close' as const },
        ]),
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'About ParallelDev',
          click: () => shell.openExternal('https://paralleldev.optiviselab.com'),
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  createWindow()

  // Settings
  ipcMain.handle('settings:get', () => store.getSettings())
  ipcMain.handle('settings:update', (_event, settings) => {
    return store.updateSettings(settings)
  })
  ipcMain.handle('settings:pickFolder', async () => {
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Workspace Directory',
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  ipcMain.handle('git:username', async () => {
    const git = simpleGit()
    try {
      const name = await git.getConfig('user.name', 'global')
      return name.value ? name.value.toLowerCase().replace(/\s+/g, '') : 'user'
    } catch {
      return 'user'
    }
  })

  // Repo management
  ipcMain.handle('repo:list', () => store.getRepos())
  ipcMain.handle('repo:add', async (_event, repoUrl: string) => {
    return gitService.addRepo(repoUrl)
  })
  ipcMain.handle('repo:remove', async (_event, repoId: string) => {
    return store.removeRepo(repoId)
  })

  // Session management
  ipcMain.handle('repo:branches', async (_event, repoUrl: string) => {
    return gitService.listRemoteBranches(repoUrl)
  })
  ipcMain.handle('session:create', async (_event, repoId: string, branchName: string, baseBranch?: string) => {
    return gitService.createSession(repoId, branchName, baseBranch)
  })
  ipcMain.handle('session:list', (_event, repoId: string) => {
    return store.getSessions(repoId)
  })
  ipcMain.handle('session:delete', async (_event, sessionId: string) => {
    return gitService.deleteSession(sessionId)
  })

  // Git operations
  ipcMain.handle('git:status', async (_event, sessionPath: string) => {
    return gitService.getStatus(sessionPath)
  })
  ipcMain.handle('git:diff', async (_event, sessionPath: string, filePath: string) => {
    return gitService.getFileDiff(sessionPath, filePath)
  })
  ipcMain.handle('git:commitAndPush', async (_event, sessionPath: string, message: string) => {
    return gitService.commitAndPush(sessionPath, message)
  })

  // Terminal
  ipcMain.on('terminal:create', (_event, sessionId: string, sessionPath: string) => {
    try {
      const existing = ptyServices.get(sessionId)
      if (existing) {
        existing.kill()
      }
      const pty = new PtyService(sessionPath, (data: string) => {
        win?.webContents.send('terminal:data', sessionId, data)
      })
      ptyServices.set(sessionId, pty)
    } catch (err) {
      console.error('terminal:create failed:', err)
      win?.webContents.send('terminal:data', sessionId, `\r\nFailed to create terminal: ${err}\r\n`)
    }
  })

  ipcMain.on('terminal:input', (_event, sessionId: string, data: string) => {
    ptyServices.get(sessionId)?.write(data)
  })

  ipcMain.on('terminal:resize', (_event, sessionId: string, cols: number, rows: number) => {
    ptyServices.get(sessionId)?.resize(cols, rows)
  })

  ipcMain.on('terminal:kill', (_event, sessionId: string) => {
    ptyServices.get(sessionId)?.kill()
    ptyServices.delete(sessionId)
  })
})
