import { RefreshCw, FileEdit, FilePlus, FileX, File } from 'lucide-react'
import type { FileChange } from '../types'

interface ChangedFilesProps {
  changes: FileChange[]
  onRefresh: () => void
  onFileClick: (filePath: string) => void
}

const statusConfig = {
  modified: { icon: FileEdit, color: 'text-accent-yellow', label: 'M' },
  added: { icon: FilePlus, color: 'text-accent-green', label: 'A' },
  deleted: { icon: FileX, color: 'text-accent-red', label: 'D' },
  untracked: { icon: File, color: 'text-text-muted', label: '?' },
}

export function ChangedFiles({ changes, onRefresh, onFileClick }: ChangedFilesProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="h-10 flex items-center justify-between px-3 border-b border-border">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Changes ({changes.length})
        </span>
        <button
          onClick={onRefresh}
          className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {changes.length === 0 ? (
          <div className="p-4 text-center text-text-muted text-xs">
            No changes detected
          </div>
        ) : (
          changes.map((change, i) => {
            const config = statusConfig[change.status]
            const Icon = config.icon
            return (
              <div
                key={`${change.path}-${i}`}
                onClick={() => onFileClick(change.path)}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-bg-hover group cursor-pointer"
              >
                <Icon size={14} className={config.color} />
                <span className="text-xs text-text-primary truncate flex-1 font-mono">
                  {change.path}
                </span>
                <span className={`text-xs font-mono ${config.color}`}>
                  {config.label}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
