import simpleGit, { SimpleGit } from 'simple-git'
import path from 'node:path'
import fs from 'node:fs'
import { StoreService } from './store'
import type { Repo, Session, FileChange } from './store'

const RANDOM_NAMES = [
  'organic', 'cosmic', 'stellar', 'amber', 'crystal', 'thunder', 'velvet', 'mystic',
  'crimson', 'silver', 'golden', 'shadow', 'falcon', 'phoenix', 'dragon', 'glacier',
  'summit', 'marble', 'ember', 'coral', 'breeze', 'aurora', 'nova', 'zenith',
  'pulse', 'spark', 'flint', 'cedar', 'maple', 'orchid', 'lotus', 'sage',
  'raven', 'wolf', 'hawk', 'lynx', 'panda', 'tiger', 'viper', 'cobra',
  'iron', 'steel', 'copper', 'bronze', 'jade', 'onyx', 'opal', 'ruby',
  'delta', 'omega', 'pixel', 'quartz', 'prism', 'sonic', 'turbo', 'rapid',
  'blaze', 'frost', 'storm', 'surge', 'drift', 'orbit', 'comet', 'lunar',
]

function pickRandomName(): string {
  return RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]
}

export class GitService {
  private store: StoreService

  constructor(store: StoreService) {
    this.store = store
  }

  private async getGitUsername(): Promise<string> {
    const git = simpleGit()
    try {
      const name = await git.getConfig('user.name', 'global')
      if (name.value) {
        return name.value.toLowerCase().replace(/\s+/g, '')
      }
    } catch {}
    return 'user'
  }

  private getWorkspaceDir(): string {
    const dir = this.store.getSettings().workspacePath
    fs.mkdirSync(dir, { recursive: true })
    return dir
  }

  async addRepo(repoUrl: string): Promise<Repo> {
    const name = repoUrl.split('/').pop()?.replace('.git', '') || 'unknown'
    const repo: Repo = {
      id: crypto.randomUUID(),
      name,
      url: repoUrl,
      addedAt: Date.now(),
    }
    this.store.addRepo(repo)
    return repo
  }

  async listRemoteBranches(repoUrl: string): Promise<{ branches: string[], defaultBranch: string }> {
    const git = simpleGit()
    const result = await git.listRemote(['--heads', repoUrl])
    const branches = result
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const match = line.match(/refs\/heads\/(.+)$/)
        return match ? match[1] : ''
      })
      .filter(Boolean)

    const defaultResult = await git.listRemote(['--symref', repoUrl, 'HEAD'])
    const defaultMatch = defaultResult.match(/ref: refs\/heads\/(\S+)/)
    const defaultBranch = defaultMatch ? defaultMatch[1] : (branches.includes('main') ? 'main' : branches[0] || 'main')

    return { branches, defaultBranch }
  }

  async createSession(repoId: string, branchName: string, baseBranch?: string): Promise<Session> {
    const repo = this.store.getRepo(repoId)
    if (!repo) throw new Error('Repo not found')

    const timestamp = Date.now()
    const safeName = branchName.replace(/\//g, '-')
    const sessionDir = path.join(this.getWorkspaceDir(), `${repo.name}-${safeName}`)

    const git: SimpleGit = simpleGit()
    const cloneArgs = baseBranch ? ['--branch', baseBranch] : []
    await git.clone(repo.url, sessionDir, cloneArgs)

    const sessionGit = simpleGit(sessionDir)
    const branchSummary = await sessionGit.branch()
    const defaultBranch = branchSummary.current

    await sessionGit.checkoutLocalBranch(branchName)

    const session: Session = {
      id: crypto.randomUUID(),
      repoId,
      branchName,
      defaultBranch,
      path: sessionDir,
      createdAt: timestamp,
    }
    this.store.addSession(session)
    return session
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessions = this.store.getSessions('')
    const allSessions = this.store.getRepos().flatMap(r => this.store.getSessions(r.id))
    const session = allSessions.find(s => s.id === sessionId)
    if (!session) throw new Error('Session not found')

    if (fs.existsSync(session.path)) {
      fs.rmSync(session.path, { recursive: true, force: true })
    }
    this.store.removeSession(sessionId)
  }

  async getStatus(sessionPath: string): Promise<FileChange[]> {
    const git = simpleGit(sessionPath)
    const status = await git.status()
    const changes: FileChange[] = []

    for (const file of status.modified) {
      changes.push({ path: file, status: 'modified' })
    }
    for (const file of status.not_added) {
      changes.push({ path: file, status: 'untracked' })
    }
    for (const file of status.created) {
      changes.push({ path: file, status: 'added' })
    }
    for (const file of status.deleted) {
      changes.push({ path: file, status: 'deleted' })
    }
    return changes
  }

  async getFileDiff(sessionPath: string, filePath: string): Promise<string> {
    const git = simpleGit(sessionPath)
    try {
      const diff = await git.diff([filePath])
      if (diff) return diff
      const diffCached = await git.diff(['--cached', filePath])
      if (diffCached) return diffCached
      // For untracked files, read the file content
      const fullPath = path.join(sessionPath, filePath)
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8')
        return content.split('\n').map(line => `+ ${line}`).join('\n')
      }
      return 'No diff available'
    } catch {
      return 'Failed to get diff'
    }
  }

  async commitAndPush(sessionPath: string, message: string): Promise<void> {
    const git = simpleGit(sessionPath)
    const branchSummary = await git.branch()
    await git.add('.')
    await git.commit(message)
    await git.push('origin', branchSummary.current, ['--set-upstream'])
  }
}
