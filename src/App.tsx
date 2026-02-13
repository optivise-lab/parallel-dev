import { useState, useCallback, useEffect, useRef } from 'react'
import { Info, X, GitCommit, GitBranch } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { Terminal } from './components/Terminal'
import { ChangedFiles } from './components/ChangedFiles'
import { Settings } from './components/Settings'
import { About } from './components/About'
import { DiffViewer } from './components/DiffViewer'
import { CommitModal } from './components/CommitModal'
import { ErrorBoundary } from './components/ErrorBoundary'
import type { Session, FileChange } from './types'

interface OpenTab {
  filePath: string
  diff: string
}

interface SessionState {
  session: Session
  changes: FileChange[]
  fileTabs: OpenTab[]
  activeFileTab: string | null
}

export default function App() {
  const [openSessions, setOpenSessions] = useState<SessionState[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [runningSessions, setRunningSessions] = useState<Set<string>>(new Set())
  const [showSettings, setShowSettings] = useState(false)
  const [showCommitModal, setShowCommitModal] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeState = openSessions.find(s => s.session.id === activeSessionId) ?? null
  const activeSession = activeState?.session ?? null
  const changes = activeState?.changes ?? []
  const openTabs = activeState?.fileTabs ?? []
  const activeTab = activeState?.activeFileTab ?? null
  const activeTabData = openTabs.find(t => t.filePath === activeTab)

  const updateSession = (sessionId: string, updater: (state: SessionState) => SessionState) => {
    setOpenSessions(prev => prev.map(s =>
      s.session.id === sessionId ? updater(s) : s
    ))
  }

  const refreshStatus = useCallback(async () => {
    if (!activeSession) return
    try {
      const status = await window.electronAPI.getStatus(activeSession.id)
      setOpenSessions(prev => prev.map(s =>
        s.session.id === activeSession.id ? { ...s, changes: status } : s
      ))
    } catch (err) {
      console.error('Failed to get status:', err)
    }
  }, [activeSession])

  useEffect(() => {
    refreshStatus()
    const interval = setInterval(refreshStatus, 3000)
    return () => clearInterval(interval)
  }, [refreshStatus])

  const handleSessionSelect = (session: Session) => {
    const existing = openSessions.find(s => s.session.id === session.id)
    if (existing) {
      setActiveSessionId(session.id)
      return
    }

    const newState: SessionState = {
      session,
      changes: [],
      fileTabs: [],
      activeFileTab: null,
    }
    setOpenSessions(prev => [...prev, newState])
    setActiveSessionId(session.id)
    setRunningSessions(prev => new Set(prev).add(session.id))
  }

  const handleCloseSessionTab = (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    window.electronAPI.killTerminal(sessionId)
    setOpenSessions(prev => prev.filter(s => s.session.id !== sessionId))
    setRunningSessions(prev => { const n = new Set(prev); n.delete(sessionId); return n })
    if (activeSessionId === sessionId) {
      const remaining = openSessions.filter(s => s.session.id !== sessionId)
      setActiveSessionId(remaining.length > 0 ? remaining[remaining.length - 1].session.id : null)
    }
  }

  const handleCommitAndPush = async (message: string) => {
    if (!activeSession) return
    await window.electronAPI.commitAndPush(activeSession.id, message)
    await refreshStatus()
  }

  const handleFileClick = async (filePath: string) => {
    if (!activeSession) return
    const existing = openTabs.find(t => t.filePath === filePath)
    if (existing) {
      updateSession(activeSession.id, s => ({ ...s, activeFileTab: filePath }))
      return
    }
    try {
      const diff = await window.electronAPI.getFileDiff(activeSession.id, filePath)
      updateSession(activeSession.id, s => ({
        ...s,
        fileTabs: [...s.fileTabs, { filePath, diff }],
        activeFileTab: filePath,
      }))
    } catch (err) {
      console.error('Failed to get diff:', err)
    }
  }

  const handleCloseFileTab = (filePath: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!activeSession) return
    updateSession(activeSession.id, s => {
      const remaining = s.fileTabs.filter(t => t.filePath !== filePath)
      return {
        ...s,
        fileTabs: remaining,
        activeFileTab: s.activeFileTab === filePath
          ? (remaining.length > 0 ? remaining[remaining.length - 1].filePath : null)
          : s.activeFileTab,
      }
    })
  }

  const fileName = (path: string) => path.split('/').pop() || path

  const hasChanges = changes.length > 0 && activeSession

  return (
    <ErrorBoundary>
      <div className="flex w-screen h-screen overflow-hidden bg-bg-primary">
        <div className="w-64 shrink-0">
          <Sidebar
            onSessionSelect={handleSessionSelect}
            activeSessionId={activeSessionId}
            runningSessions={runningSessions}
            onSessionDeleted={(id) => {
              window.electronAPI.killTerminal(id)
              setOpenSessions(prev => prev.filter(s => s.session.id !== id))
              setRunningSessions(prev => { const n = new Set(prev); n.delete(id); return n })
              if (activeSessionId === id) {
                const remaining = openSessions.filter(s => s.session.id !== id)
                setActiveSessionId(remaining.length > 0 ? remaining[remaining.length - 1].session.id : null)
              }
            }}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="h-12 shrink-0 flex items-center justify-between px-4 bg-bg-secondary border-b border-border">
            <div className="flex items-center gap-3">
              {activeSession && (
                <>
                  <span className="text-text-secondary text-sm">Branch:</span>
                  <span className="text-accent-mauve text-sm font-mono">{activeSession.branchName}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAbout(true)}
                className="p-2 rounded border-none bg-transparent text-text-secondary cursor-pointer hover:text-text-primary transition-colors"
                title="About"
              >
                <Info size={16} />
              </button>
              <button
                onClick={() => setShowCommitModal(true)}
                disabled={!hasChanges}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border-none text-[13px] font-semibold ${
                  hasChanges
                    ? 'bg-accent-green text-bg-primary cursor-pointer hover:opacity-90'
                    : 'bg-bg-hover text-text-muted cursor-default opacity-50'
                }`}
              >
                <GitCommit size={14} />
                {changes.length > 0 ? 'Commit & Push' : 'No Changes'}
              </button>
            </div>
          </div>

          {/* Session tabs */}
          {openSessions.length > 0 && (
            <div className="h-9 shrink-0 flex bg-[#11111b] border-b border-border overflow-auto">
              {openSessions.map(s => (
                <div
                  key={s.session.id}
                  onClick={() => setActiveSessionId(s.session.id)}
                  className={`flex items-center gap-1.5 px-3 text-xs cursor-pointer border-r border-bg-tertiary whitespace-nowrap ${
                    activeSessionId === s.session.id
                      ? 'bg-bg-primary text-accent-mauve'
                      : 'bg-transparent text-text-muted'
                  }`}
                >
                  <GitBranch size={12} />
                  <span className="font-mono">{s.session.branchName}</span>
                  <button
                    onClick={(e) => handleCloseSessionTab(s.session.id, e)}
                    className="flex items-center justify-center w-4 h-4 rounded-sm border-none bg-transparent text-text-muted cursor-pointer p-0 hover:bg-bg-hover"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Content */}
          {activeSession ? (
            <div ref={containerRef} className="flex-1 flex min-h-0 relative">
              <div className="flex-1 min-w-0 pb-[30px]">
                {openSessions.map(s => (
                  <div
                    key={s.session.id}
                    className={`h-full ${s.session.id === activeSessionId ? 'block' : 'hidden'}`}
                  >
                    <Terminal session={s.session} />
                  </div>
                ))}
              </div>

              <div className="w-[280px] shrink-0 border-l border-border overflow-auto">
                <ChangedFiles changes={changes} onRefresh={refreshStatus} onFileClick={handleFileClick} />
              </div>

              {activeTabData && (
                <div className="absolute inset-0 right-[280px] z-10 flex flex-col bg-bg-primary">
                  <div className="h-8 shrink-0 flex bg-bg-secondary border-b border-bg-tertiary overflow-auto">
                    {openTabs.map(tab => (
                      <div
                        key={tab.filePath}
                        onClick={() => updateSession(activeSession.id, s => ({ ...s, activeFileTab: tab.filePath }))}
                        className={`flex items-center gap-[5px] px-2.5 text-[11px] font-mono cursor-pointer border-r border-bg-tertiary whitespace-nowrap ${
                          activeTab === tab.filePath
                            ? 'bg-bg-primary text-text-primary'
                            : 'bg-transparent text-[#585b70]'
                        }`}
                      >
                        <span>{fileName(tab.filePath)}</span>
                        <button
                          onClick={(e) => handleCloseFileTab(tab.filePath, e)}
                          className="flex items-center justify-center w-3.5 h-3.5 rounded-sm border-none bg-transparent text-[#585b70] cursor-pointer p-0 hover:bg-bg-hover"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <DiffViewer diff={activeTabData.diff} fileName={activeTabData.filePath} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-muted">
              <div className="text-center">
                <p className="text-lg mb-2">No active session</p>
                <p className="text-sm">Add a repo and start a session to begin</p>
              </div>
            </div>
          )}
        </div>

        {showAbout && <About onClose={() => setShowAbout(false)} />}
        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
        {showCommitModal && (
          <CommitModal
            changes={changes}
            onCommit={handleCommitAndPush}
            onClose={() => setShowCommitModal(false)}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
