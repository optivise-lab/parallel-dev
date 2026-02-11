import { useState } from 'react'
import { X, Loader2, GitCommit } from 'lucide-react'
import type { FileChange } from '../types'

interface CommitModalProps {
  changes: FileChange[]
  onCommit: (message: string) => Promise<void>
  onClose: () => void
}

function generateDefaultMessage(changes: FileChange[]): string {
  const modified = changes.filter(c => c.status === 'modified')
  const added = changes.filter(c => c.status === 'added' || c.status === 'untracked')
  const deleted = changes.filter(c => c.status === 'deleted')

  const parts: string[] = []
  if (modified.length > 0) {
    parts.push(`update ${modified.map(f => f.path.split('/').pop()).join(', ')}`)
  }
  if (added.length > 0) {
    parts.push(`add ${added.map(f => f.path.split('/').pop()).join(', ')}`)
  }
  if (deleted.length > 0) {
    parts.push(`remove ${deleted.map(f => f.path.split('/').pop()).join(', ')}`)
  }

  if (parts.length === 0) return 'update files'

  let message = parts.join('; ')
  if (message.length > 72) {
    const summary: string[] = []
    if (modified.length) summary.push(`${modified.length} modified`)
    if (added.length) summary.push(`${added.length} added`)
    if (deleted.length) summary.push(`${deleted.length} deleted`)
    message = summary.join(', ')
  }

  return message
}

export function CommitModal({ changes, onCommit, onClose }: CommitModalProps) {
  const [message, setMessage] = useState(generateDefaultMessage(changes))
  const [isCommitting, setIsCommitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCommit = async () => {
    if (!message.trim()) return
    setIsCommitting(true)
    setError(null)
    try {
      await onCommit(message.trim())
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Commit failed')
    } finally {
      setIsCommitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border rounded-lg w-[500px] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <GitCommit size={16} className="text-accent-green" />
            <span className="text-sm font-semibold text-text-primary">Commit & Push</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              {changes.length} changed file{changes.length !== 1 ? 's' : ''}
            </span>
            <div className="mt-2 max-h-32 overflow-y-auto bg-bg-tertiary rounded border border-border">
              {changes.map((c, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1 text-xs font-mono">
                  <span className={
                    c.status === 'modified' ? 'text-accent-yellow' :
                    c.status === 'added' || c.status === 'untracked' ? 'text-accent-green' :
                    'text-accent-red'
                  }>
                    {c.status === 'modified' ? 'M' : c.status === 'deleted' ? 'D' : c.status === 'added' ? 'A' : '?'}
                  </span>
                  <span className="text-text-primary truncate">{c.path}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Commit Message
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleCommit() }}
              rows={3}
              className="w-full bg-bg-tertiary text-text-primary text-sm rounded px-3 py-2 outline-none focus:ring-1 focus:ring-accent-green placeholder-text-muted border border-border resize-none font-mono"
              placeholder="Enter commit message..."
              autoFocus
            />
            <p className="text-xs text-text-muted mt-1">⌘+Enter to commit</p>
          </div>

          {error && (
            <div className="text-xs text-accent-red bg-accent-red/10 rounded px-3 py-2 border border-accent-red/20">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-1.5 text-sm text-text-secondary hover:text-text-primary rounded hover:bg-bg-hover transition-colors">
              Cancel
            </button>
            <button
              onClick={handleCommit}
              disabled={!message.trim() || isCommitting}
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-accent-green text-bg-primary rounded hover:opacity-90 disabled:opacity-30 transition-opacity"
            >
              {isCommitting ? <Loader2 size={14} className="animate-spin" /> : <GitCommit size={14} />}
              {isCommitting ? 'Pushing...' : 'Commit & Push'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
