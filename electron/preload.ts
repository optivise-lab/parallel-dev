import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: any) => ipcRenderer.invoke('settings:update', settings),
  pickFolder: () => ipcRenderer.invoke('settings:pickFolder'),

  getGitUsername: () => ipcRenderer.invoke('git:username'),

  // Repos
  listRepos: () => ipcRenderer.invoke('repo:list'),
  addRepo: (repoUrl: string) => ipcRenderer.invoke('repo:add', repoUrl),
  removeRepo: (repoId: string) => ipcRenderer.invoke('repo:remove', repoId),

  // Sessions
  listBranches: (repoUrl: string) => ipcRenderer.invoke('repo:branches', repoUrl),
  createSession: (repoId: string, branchName: string, baseBranch?: string) => ipcRenderer.invoke('session:create', repoId, branchName, baseBranch),
  listSessions: (repoId: string) => ipcRenderer.invoke('session:list', repoId),
  deleteSession: (sessionId: string) => ipcRenderer.invoke('session:delete', sessionId),

  // Git
  getStatus: (sessionPath: string) => ipcRenderer.invoke('git:status', sessionPath),
  getFileDiff: (sessionPath: string, filePath: string) => ipcRenderer.invoke('git:diff', sessionPath, filePath),
  commitAndPush: (sessionPath: string, message: string) => ipcRenderer.invoke('git:commitAndPush', sessionPath, message),

  // Terminal
  createTerminal: (sessionId: string, sessionPath: string) => ipcRenderer.send('terminal:create', sessionId, sessionPath),
  sendTerminalInput: (sessionId: string, data: string) => ipcRenderer.send('terminal:input', sessionId, data),
  resizeTerminal: (sessionId: string, cols: number, rows: number) => ipcRenderer.send('terminal:resize', sessionId, cols, rows),
  killTerminal: (sessionId: string) => ipcRenderer.send('terminal:kill', sessionId),
  onTerminalData: (callback: (sessionId: string, data: string) => void) => {
    const listener = (_event: any, sessionId: string, data: string) => callback(sessionId, data)
    ipcRenderer.on('terminal:data', listener)
    return () => ipcRenderer.removeListener('terminal:data', listener)
  },

  // Menu
  onMenuAbout: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('menu:about', listener)
    return () => ipcRenderer.removeListener('menu:about', listener)
  },
})
