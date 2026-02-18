import { useState, useEffect, useRef } from 'react'
import { Plus, GitBranch, Trash2, Loader2, ChevronDown, ChevronRight, Circle } from 'lucide-react'
import { NewSessionModal } from './NewSessionModal'
import type { Repo, Session } from '../types'

interface SidebarProps {
  onSessionSelect: (session: Session) => void
  activeSessionId: string | null
  runningSessions: Set<string>
  onSessionDeleted: (sessionId: string) => void
}

interface DeleteConfirm {
  session: Session
  typedName: string
}

export function Sidebar({ onSessionSelect, activeSessionId, runningSessions, onSessionDeleted }: SidebarProps) {
  const [repos, setRepos] = useState<Repo[]>([])
  const [sessions, setSessions] = useState<Record<string, Session[]>>({})
  const [expandedRepos, setExpandedRepos] = useState<Set<string>>(new Set())
  const [showAddRepo, setShowAddRepo] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [creatingSessions, setCreatingSessions] = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [newSessionRepoId, setNewSessionRepoId] = useState<string | null>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadRepos()
  }, [])

  useEffect(() => {
    if (!showAddRepo) return
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setShowAddRepo(false)
        setRepoUrl('')
      }
    }
    window.addEventListener('mousedown', handleClickOutside, true)
    return () => window.removeEventListener('mousedown', handleClickOutside, true)
  }, [showAddRepo])

  const loadRepos = async () => {
    try {
      const repos = await window.electronAPI.listRepos()
      setRepos(repos)
      for (const repo of repos) {
        const repoSessions = await window.electronAPI.listSessions(repo.id)
        setSessions(prev => ({ ...prev, [repo.id]: repoSessions }))
      }
    } catch (err) {
      console.error('Failed to load repos:', err)
    }
  }

  const handleAddRepo = async () => {
    if (!repoUrl.trim()) return
    setIsAdding(true)
    try {
      await window.electronAPI.addRepo(repoUrl.trim())
      setRepoUrl('')
      setShowAddRepo(false)
      await loadRepos()
    } catch (err) {
      console.error('Failed to add repo:', err)
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveRepo = async (repoId: string) => {
    await window.electronAPI.removeRepo(repoId)
    await loadRepos()
  }

  const handleCreateSession = async (repoId: string, branchName: string, baseBranch: string) => {
    setCreatingSessions(prev => new Set(prev).add(repoId))
    try {
      const session = await window.electronAPI.createSession(repoId, branchName, baseBranch)
      const repoSessions = await window.electronAPI.listSessions(repoId)
      setSessions(prev => ({ ...prev, [repoId]: repoSessions }))
      setExpandedRepos(prev => new Set(prev).add(repoId))
      onSessionSelect(session)
    } catch (err) {
      console.error('Failed to create session:', err)
      throw err
    } finally {
      setCreatingSessions(prev => {
        const next = new Set(prev)
        next.delete(repoId)
        return next
      })
    }
  }

  const handleDeleteSession = async () => {
    if (!deleteConfirm) return
    setIsDeleting(true)
    try {
      await window.electronAPI.deleteSession(deleteConfirm.session.id)
      if (activeSessionId === deleteConfirm.session.id) {
        onSessionDeleted(deleteConfirm.session.id)
      }
      await loadRepos()
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Failed to delete session:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleExpand = (repoId: string) => {
    setExpandedRepos(prev => {
      const next = new Set(prev)
      if (next.has(repoId)) next.delete(repoId)
      else next.add(repoId)
      return next
    })
  }

  const isDeleteMatch = deleteConfirm
    ? deleteConfirm.typedName === deleteConfirm.session.branchName
    : false

  return (
    <>
      <div className="bg-bg-secondary border-r border-border flex flex-col h-full w-full">
        <div className="h-12 flex items-center px-20 border-b border-border app-drag">
          <span className="text-sm font-bold text-accent-blue tracking-wide">ParallelDev</span>
        </div>
        <div className="h-10 flex items-center justify-between px-4 border-b border-border">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Repos</span>
          <button
            onClick={() => setShowAddRepo(!showAddRepo)}
            className="p-1 rounded hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors no-drag"
          >
            <Plus size={16} />
          </button>
        </div>

        {showAddRepo && (
          <div ref={sidebarRef} className="p-3 border-b border-border">
            <input
              type="text"
              value={repoUrl}
              onChange={e => setRepoUrl(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddRepo()
                if (e.key === 'Escape') { setShowAddRepo(false); setRepoUrl('') }
              }}
              placeholder="https://github.com/user/repo.git"
              className="w-full bg-bg-tertiary text-text-primary text-sm rounded px-3 py-2 outline-none focus:ring-1 focus:ring-accent-blue placeholder-text-muted"
              autoFocus
            />
            <button
              onClick={handleAddRepo}
              disabled={isAdding || !repoUrl.trim()}
              className="mt-2 w-full bg-accent-blue text-bg-primary text-sm font-medium py-1.5 rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isAdding ? 'Adding...' : 'Add Repository'}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {repos.map(repo => (
            <div key={repo.id}>
              <div className="flex items-center gap-1 px-3 py-2 hover:bg-bg-hover group">
                <button onClick={() => toggleExpand(repo.id)} className="text-text-muted">
                  {expandedRepos.has(repo.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <GitBranch size={14} className="text-accent-blue shrink-0" />
                <span onClick={() => toggleExpand(repo.id)} className="text-sm text-text-primary truncate flex-1 cursor-pointer">{repo.name}</span>
                <button
                  onClick={() => setNewSessionRepoId(repo.id)}
                  disabled={creatingSessions.has(repo.id)}
                  className="p-0.5 rounded hover:bg-bg-tertiary text-accent-green opacity-0 group-hover:opacity-100 transition-opacity"
                  title="New session"
                >
                  {creatingSessions.has(repo.id) ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                </button>
                <button
                  onClick={() => handleRemoveRepo(repo.id)}
                  className="p-0.5 rounded hover:bg-bg-tertiary text-accent-red opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {expandedRepos.has(repo.id) && sessions[repo.id]?.map(session => (
                <div
                  key={session.id}
                  className={`flex items-center group pl-10 pr-3 py-1.5 transition-colors ${
                    activeSessionId === session.id
                      ? 'bg-bg-tertiary'
                      : 'hover:bg-bg-hover'
                  }`}
                >
                  {runningSessions.has(session.id) && (
                    <Circle size={7} className="text-accent-green shrink-0 mr-1.5 fill-accent-green" />
                  )}
                  <button
                    onClick={() => onSessionSelect(session)}
                    className={`flex-1 text-left text-xs font-mono truncate ${
                      activeSessionId === session.id
                        ? 'text-accent-mauve'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {session.branchName}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirm({ session, typedName: '' })
                    }}
                    className="p-0.5 rounded hover:bg-bg-tertiary text-accent-red opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1"
                    title="Delete session"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          ))}

          {repos.length === 0 && (
            <div className="p-4 text-center text-text-muted text-sm">
              No repos added yet.<br />
              Click + to add one.
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-bg-secondary border border-border rounded-lg w-[420px] shadow-2xl">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">Delete Session</h2>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-text-secondary">
                This will permanently delete the workspace directory and remove the session. Type the branch name to confirm:
              </p>
              <div className="bg-bg-tertiary rounded px-3 py-2 text-sm text-accent-mauve font-mono border border-border">
                {deleteConfirm.session.branchName}
              </div>
              <input
                type="text"
                value={deleteConfirm.typedName}
                onChange={e => setDeleteConfirm({ ...deleteConfirm, typedName: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && isDeleteMatch && handleDeleteSession()}
                placeholder="Type branch name to confirm"
                className="w-full bg-bg-tertiary text-text-primary text-sm rounded px-3 py-2 outline-none focus:ring-1 focus:ring-accent-red placeholder-text-muted border border-border"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-1.5 text-sm text-text-secondary hover:text-text-primary rounded hover:bg-bg-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSession}
                  disabled={!isDeleteMatch || isDeleting}
                  className="px-4 py-1.5 text-sm font-medium bg-accent-red text-bg-primary rounded hover:opacity-90 disabled:opacity-30 transition-opacity"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New session modal */}
      {newSessionRepoId && (() => {
        const repo = repos.find(r => r.id === newSessionRepoId)
        if (!repo) return null
        return (
          <NewSessionModal
            repoName={repo.name}
            repoUrl={repo.url}
            onConfirm={async (branchName, baseBranch) => {
              await handleCreateSession(newSessionRepoId, branchName, baseBranch)
            }}
            onClose={() => setNewSessionRepoId(null)}
          />
        )
      })()}
    </>
  )
}
