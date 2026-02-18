import { useState, useEffect, useRef, useCallback } from 'react'
import { TerminalSquare, FileEdit, GripHorizontal, RefreshCw, Loader2, Plus, X } from 'lucide-react'
import { Terminal } from './Terminal'
import type { Session } from '../types'

interface SidePanelProps {
  session: Session
}

type Tab = 'setup' | number

const MAX_TERMINALS = 3

export function SidePanel({ session }: SidePanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>(1)
  const [terminals, setTerminals] = useState<number[]>([1])
  const [panelHeight, setPanelHeight] = useState(150)
  const [envContent, setEnvContent] = useState('')
  const [syncing, setSyncing] = useState(false)
  const nextId = useRef(2)
  const dragging = useRef(false)
  const startY = useRef(0)
  const startH = useRef(0)

  useEffect(() => {
    window.electronAPI.readEnv(session.id).then(setEnvContent).catch(() => {})
  }, [session.id])

  const handleSync = useCallback(async () => {
    setSyncing(true)
    try {
      await window.electronAPI.writeEnv(session.id, envContent)
    } catch (err) {
      console.error('Failed to sync .env:', err)
    } finally {
      setSyncing(false)
    }
  }, [session.id, envContent])

  const addTerminal = useCallback(() => {
    if (terminals.length >= MAX_TERMINALS) return
    const id = nextId.current++
    setTerminals(prev => [...prev, id])
    setActiveTab(id)
  }, [terminals.length])

  const closeTerminal = useCallback((id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    window.electronAPI.killTerminal(`${session.id}:panel-${id}`)
    setTerminals(prev => {
      const next = prev.filter(t => t !== id)
      if (next.length === 0) {
        const newId = nextId.current++
        setActiveTab(newId)
        return [newId]
      }
      return next
    })
    setActiveTab(prev => {
      if (prev === id) {
        const remaining = terminals.filter(t => t !== id)
        return remaining.length > 0 ? remaining[remaining.length - 1] : 'setup'
      }
      return prev
    })
  }, [session.id, terminals])

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    startY.current = e.clientY
    startH.current = panelHeight

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const delta = startY.current - ev.clientY
      const newH = Math.max(100, Math.min(600, startH.current + delta))
      setPanelHeight(newH)
    }

    const onUp = () => {
      dragging.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [panelHeight])

  return (
    <div className="flex flex-col border-t border-border" style={{ height: panelHeight }}>
      <div
        onMouseDown={onDragStart}
        className="h-2 shrink-0 flex items-center justify-center cursor-row-resize hover:bg-bg-hover transition-colors"
      >
        <GripHorizontal size={12} className="text-text-muted" />
      </div>

      <div className="h-8 shrink-0 flex items-center border-b border-border bg-bg-secondary overflow-x-auto">
        <button
          onClick={() => setActiveTab('setup')}
          className={`flex items-center gap-1.5 px-3 h-full text-xs font-medium transition-colors shrink-0 ${
            activeTab === 'setup'
              ? 'text-text-primary border-b-2 border-accent-blue'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <FileEdit size={12} />
          Setup
        </button>
        {terminals.map(id => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1 px-2 h-full text-xs font-medium transition-colors shrink-0 group ${
              activeTab === id
                ? 'text-text-primary border-b-2 border-accent-blue'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <TerminalSquare size={12} />
            <span>{terminals.length > 1 ? `Term ${terminals.indexOf(id) + 1}` : 'Terminal'}</span>
            <span
              onClick={(e) => closeTerminal(id, e)}
              className="ml-0.5 p-0.5 rounded hover:bg-bg-hover opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={10} />
            </span>
          </button>
        ))}
        {terminals.length < MAX_TERMINALS && (
          <button
            onClick={addTerminal}
            className="flex items-center px-1.5 h-full text-text-muted hover:text-text-primary transition-colors shrink-0"
            title="New terminal"
          >
            <Plus size={13} />
          </button>
        )}
        {activeTab === 'setup' && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="ml-auto mr-2 p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors disabled:opacity-50 shrink-0"
            title="Sync .env"
          >
            {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'setup' ? (
          <div className="h-full flex flex-col p-2">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">.env</label>
            <textarea
              value={envContent}
              onChange={e => setEnvContent(e.target.value)}
              className="flex-1 w-full bg-bg-tertiary text-text-primary text-xs font-mono rounded px-3 py-2 outline-none border border-border resize-none placeholder-text-muted focus:ring-1 focus:ring-accent-blue"
              style={{ minHeight: 400 }}
              placeholder="KEY=value&#10;DATABASE_URL=..."
              spellCheck={false}
            />
          </div>
        ) : (
          terminals.map(id => (
            <div key={id} className={`h-full pb-[30px] ${activeTab === id ? 'block' : 'hidden'}`}>
              <Terminal session={session} terminalId={`${session.id}:panel-${id}`} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
