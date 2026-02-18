export interface Repo {
  id: string
  name: string
  url: string
  addedAt: number
}

export interface Session {
  id: string
  repoId: string
  branchName: string
  defaultBranch: string
  path: string
  createdAt: number
}

export interface FileChange {
  path: string
  status: 'modified' | 'added' | 'deleted' | 'untracked'
}

export interface Settings {
  workspacePath: string
  username: string
}

export interface ElectronAPI {
  getSettings: () => Promise<Settings>
  updateSettings: (settings: Partial<Settings>) => Promise<Settings>
  pickFolder: () => Promise<string | null>
  getGitUsername: () => Promise<string>
  listRepos: () => Promise<Repo[]>
  addRepo: (repoUrl: string) => Promise<Repo>
  removeRepo: (repoId: string) => Promise<void>
  listBranches: (repoUrl: string) => Promise<{ branches: string[], defaultBranch: string }>
  getCachedBranches: (repoUrl: string) => Promise<string[]>
  syncBranches: (repoUrl: string) => Promise<{ branches: string[], defaultBranch: string }>
  createSession: (repoId: string, branchName: string, baseBranch?: string) => Promise<Session>
  listSessions: (repoId: string) => Promise<Session[]>
  deleteSession: (sessionId: string) => Promise<void>
  getStatus: (sessionId: string) => Promise<FileChange[]>
  getFileDiff: (sessionId: string, filePath: string) => Promise<string>
  commitAndPush: (sessionId: string, message: string) => Promise<void>
  readEnv: (sessionId: string) => Promise<string>
  writeEnv: (sessionId: string, content: string) => Promise<void>
  createTerminal: (terminalId: string, sessionId: string) => void
  sendTerminalInput: (terminalId: string, data: string) => void
  resizeTerminal: (terminalId: string, cols: number, rows: number) => void
  killTerminal: (terminalId: string) => void
  onTerminalData: (callback: (terminalId: string, data: string) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
