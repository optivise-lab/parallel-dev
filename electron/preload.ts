import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: Partial<{workspacePath: string}>) => ipcRenderer.invoke('settings:update', settings),
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
  getStatus: (sessionId: string) => ipcRenderer.invoke('git:status', sessionId),
  getFileDiff: (sessionId: string, filePath: string) => ipcRenderer.invoke('git:diff', sessionId, filePath),
  commitAndPush: (sessionId: string, message: string) => ipcRenderer.invoke('git:commitAndPush', sessionId, message),

  // Terminal
  createTerminal: (sessionId: string) => ipcRenderer.send('terminal:create', sessionId),
  sendTerminalInput: (sessionId: string, data: string) => ipcRenderer.send('terminal:input', sessionId, data),
  resizeTerminal: (sessionId: string, cols: number, rows: number) => ipcRenderer.send('terminal:resize', sessionId, cols, rows),
  killTerminal: (sessionId: string) => ipcRenderer.send('terminal:kill', sessionId),
  onTerminalData: (callback: (sessionId: string, data: string) => void) => {
    const listener = (_event: any, sessionId: string, data: string) => callback(sessionId, data)
    ipcRenderer.on('terminal:data', listener)
    return () => ipcRenderer.removeListener('terminal:data', listener)
  },
})
