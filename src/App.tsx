import { useState, useCallback, useEffect, useRef } from 'react'
import { Settings as SettingsIcon, Info, X, GitCommit, GitBranch } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { Terminal } from './components/Terminal'
import { ChangedFiles } from './components/ChangedFiles'
import { Settings } from './components/Settings'
import { About } from './components/About'
import { DiffViewer } from './components/DiffViewer'
import { CommitModal } from './components/CommitModal'
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
  const [terminalHeight, setTerminalHeight] = useState(256)
  const isResizing = useRef(false)
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      const newHeight = containerRect.bottom - e.clientY
      setTerminalHeight(Math.max(100, Math.min(newHeight, containerRect.height - 100)))
    }
    const handleMouseUp = () => {
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const startResize = () => {
    isResizing.current = true
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
  }

  const refreshStatus = useCallback(async () => {
    if (!activeSession) return
    try {
      const status = await window.electronAPI.getStatus(activeSession.path)
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
    await window.electronAPI.commitAndPush(activeSession.path, message)
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
      const diff = await window.electronAPI.getFileDiff(activeSession.path, filePath)
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

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: '#1e1e2e' }}>
      <div style={{ width: 256, flexShrink: 0 }}>
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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: '#181825', borderBottom: '1px solid #45475a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {activeSession && (
              <>
                <span style={{ color: '#a6adc8', fontSize: 14 }}>Branch:</span>
                <span style={{ color: '#cba6f7', fontSize: 14, fontFamily: 'monospace' }}>{activeSession.branchName}</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setShowAbout(true)}
              style={{ padding: 8, borderRadius: 4, border: 'none', background: 'transparent', color: '#a6adc8', cursor: 'pointer' }}
              title="About"
            >
              <Info size={16} />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              style={{ padding: 8, borderRadius: 4, border: 'none', background: 'transparent', color: '#a6adc8', cursor: 'pointer' }}
              title="Settings"
            >
              <SettingsIcon size={16} />
            </button>
            <button
              onClick={() => setShowCommitModal(true)}
              disabled={!activeSession || changes.length === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 4, border: 'none',
                background: changes.length > 0 && activeSession ? '#a6e3a1' : '#45475a',
                color: changes.length > 0 && activeSession ? '#1e1e2e' : '#6c7086',
                fontSize: 13, fontWeight: 600,
                cursor: changes.length > 0 && activeSession ? 'pointer' : 'default',
                opacity: changes.length > 0 && activeSession ? 1 : 0.5,
              }}
            >
              <GitCommit size={14} />
              {changes.length > 0 ? 'Commit & Push' : 'No Changes'}
            </button>
          </div>
        </div>

        {/* Session tabs */}
        {openSessions.length > 0 && (
          <div style={{ height: 36, flexShrink: 0, display: 'flex', background: '#11111b', borderBottom: '1px solid #45475a', overflow: 'auto' }}>
            {openSessions.map(s => (
              <div
                key={s.session.id}
                onClick={() => setActiveSessionId(s.session.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', fontSize: 12,
                  cursor: 'pointer', borderRight: '1px solid #313244',
                  background: activeSessionId === s.session.id ? '#1e1e2e' : 'transparent',
                  color: activeSessionId === s.session.id ? '#cba6f7' : '#6c7086',
                  whiteSpace: 'nowrap',
                }}
              >
                <GitBranch size={12} />
                <span style={{ fontFamily: 'Menlo, Monaco, monospace' }}>{s.session.branchName}</span>
                <button
                  onClick={(e) => handleCloseSessionTab(s.session.id, e)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: 3, border: 'none', background: 'transparent', color: '#6c7086', cursor: 'pointer', padding: 0 }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.background = '#45475a' }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent' }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {activeSession ? (
          <div ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* File tabs */}
                {openTabs.length > 0 && (
                  <div style={{ height: 32, flexShrink: 0, display: 'flex', background: '#181825', borderBottom: '1px solid #313244', overflow: 'auto' }}>
                    {openTabs.map(tab => (
                      <div
                        key={tab.filePath}
                        onClick={() => updateSession(activeSession.id, s => ({ ...s, activeFileTab: tab.filePath }))}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px', fontSize: 11,
                          fontFamily: 'Menlo, Monaco, monospace', cursor: 'pointer', borderRight: '1px solid #313244',
                          background: activeTab === tab.filePath ? '#1e1e2e' : 'transparent',
                          color: activeTab === tab.filePath ? '#cdd6f4' : '#585b70', whiteSpace: 'nowrap',
                        }}
                      >
                        <span>{fileName(tab.filePath)}</span>
                        <button
                          onClick={(e) => handleCloseFileTab(tab.filePath, e)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: 3, border: 'none', background: 'transparent', color: '#585b70', cursor: 'pointer', padding: 0 }}
                          onMouseEnter={e => { (e.target as HTMLElement).style.background = '#45475a' }}
                          onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent' }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                  {activeTabData ? (
                    <DiffViewer diff={activeTabData.diff} fileName={activeTabData.filePath} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c7086' }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 18, marginBottom: 4 }}>Session Active</p>
                        <p style={{ fontSize: 13, fontFamily: 'monospace' }}>{activeSession.path}</p>
                        <p style={{ fontSize: 12, marginTop: 12, color: '#585b70' }}>Click a changed file to view diff</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ width: 280, flexShrink: 0, borderLeft: '1px solid #45475a', overflow: 'auto' }}>
                <ChangedFiles changes={changes} onRefresh={refreshStatus} onFileClick={handleFileClick} />
              </div>
            </div>

            <div
              onMouseDown={startResize}
              style={{ height: 4, flexShrink: 0, cursor: 'row-resize', background: '#45475a', transition: 'background 0.15s' }}
              onMouseEnter={e => { (e.target as HTMLElement).style.background = '#89b4fa' }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = '#45475a' }}
            />

            <div style={{ height: terminalHeight, flexShrink: 0, paddingBottom: 30 }}>
              {openSessions.map(s => (
                <div
                  key={s.session.id}
                  style={{
                    height: '100%',
                    display: s.session.id === activeSessionId ? 'block' : 'none',
                  }}
                >
                  <Terminal session={s.session} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c7086' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 18, marginBottom: 8 }}>No active session</p>
              <p style={{ fontSize: 14 }}>Add a repo and start a session to begin</p>
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
  )
}
