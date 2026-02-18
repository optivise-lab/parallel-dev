import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

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

interface StoreData {
  repos: Repo[]
  sessions: Session[]
  settings: Settings
  branchCache: Record<string, { branches: string[], updatedAt: number }>
}

const STORE_PATH = path.join(os.homedir(), '.paralleldev', 'store.json')

export class StoreService {
  private data: StoreData

  constructor() {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true })
    const defaultSettings: Settings = {
      workspacePath: path.join(os.homedir(), '.paralleldev', 'sessions'),
      username: '',
    }
    if (fs.existsSync(STORE_PATH)) {
      try {
        this.data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'))
      } catch {
        const backup = STORE_PATH + '.corrupt.' + Date.now()
        fs.copyFileSync(STORE_PATH, backup)
        this.data = { repos: [], sessions: [], settings: defaultSettings, branchCache: {} }
        this.save()
        return
      }
      if (!this.data.settings) {
        this.data.settings = defaultSettings
        this.save()
      }
      if (this.data.settings.username === undefined) {
        this.data.settings.username = ''
      }
      if (!this.data.branchCache) {
        this.data.branchCache = {}
      }
    } else {
      this.data = { repos: [], sessions: [], settings: defaultSettings, branchCache: {} }
      this.save()
    }
  }

  private save() {
    fs.writeFileSync(STORE_PATH, JSON.stringify(this.data, null, 2))
  }

  getRepos(): Repo[] {
    return this.data.repos
  }

  getRepo(id: string): Repo | undefined {
    return this.data.repos.find(r => r.id === id)
  }

  addRepo(repo: Repo) {
    this.data.repos.push(repo)
    this.save()
  }

  removeRepo(id: string) {
    this.data.repos = this.data.repos.filter(r => r.id !== id)
    this.data.sessions = this.data.sessions.filter(s => s.repoId !== id)
    this.save()
  }

  getSessions(repoId: string): Session[] {
    return this.data.sessions.filter(s => s.repoId === repoId)
  }

  addSession(session: Session) {
    this.data.sessions.push(session)
    this.save()
  }

  removeSession(id: string) {
    this.data.sessions = this.data.sessions.filter(s => s.id !== id)
    this.save()
  }

  getSettings(): Settings {
    return this.data.settings
  }

  getSessionById(id: string): Session | undefined {
    return this.data.sessions.find(s => s.id === id)
  }

  getCachedBranches(repoUrl: string): string[] {
    return this.data.branchCache[repoUrl]?.branches ?? []
  }

  setCachedBranches(repoUrl: string, branches: string[]) {
    this.data.branchCache[repoUrl] = { branches, updatedAt: Date.now() }
    this.save()
  }

  updateSettings(settings: Partial<Settings>) {
    if (settings.workspacePath !== undefined) {
      const p = settings.workspacePath
      if (!p || p === '/' || p.length < 5) {
        throw new Error('Invalid workspace path')
      }
    }
    this.data.settings = { ...this.data.settings, ...settings }
    this.save()
    return this.data.settings
  }
}
