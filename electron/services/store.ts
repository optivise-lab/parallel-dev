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
}

interface StoreData {
  repos: Repo[]
  sessions: Session[]
  settings: Settings
}

const STORE_PATH = path.join(os.homedir(), '.paralleldev', 'store.json')

export class StoreService {
  private data: StoreData

  constructor() {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true })
    const defaultSettings: Settings = {
      workspacePath: path.join(os.homedir(), '.paralleldev', 'sessions'),
    }
    if (fs.existsSync(STORE_PATH)) {
      this.data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'))
      if (!this.data.settings) {
        this.data.settings = defaultSettings
        this.save()
      }
    } else {
      this.data = { repos: [], sessions: [], settings: defaultSettings }
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

  updateSettings(settings: Partial<Settings>) {
    this.data.settings = { ...this.data.settings, ...settings }
    this.save()
    return this.data.settings
  }
}
