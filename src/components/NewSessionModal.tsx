import { useState, useEffect, useRef } from 'react'
import { X, Loader2, GitBranch, ChevronDown, Search } from 'lucide-react'

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

interface NewSessionModalProps {
  repoName: string
  repoUrl: string
  onConfirm: (branchName: string, baseBranch: string) => Promise<void>
  onClose: () => void
}

export function NewSessionModal({ repoName, repoUrl, onConfirm, onClose }: NewSessionModalProps) {
  const [branchName, setBranchName] = useState('')
  const [baseBranch, setBaseBranch] = useState('')
  const [branches, setBranches] = useState<string[]>([])
  const [loadingBranches, setLoadingBranches] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [branchSearch, setBranchSearch] = useState('')
  const [showBranchDropdown, setShowBranchDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowBranchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredBranches = branches.filter(b =>
    b.toLowerCase().includes(branchSearch.toLowerCase())
  )

  useEffect(() => {
    const load = async () => {
      try {
        const result = await window.electronAPI.listBranches(repoUrl)
        const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]
        setBranchName(randomName)
        setBranches(result.branches)
        setBaseBranch(result.defaultBranch)
      } catch (err: any) {
        console.error('Failed to load branches:', err)
        setError(err?.message || 'Failed to load branches')
        const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]
        setBranchName(randomName)
        setBranches(['main', 'master'])
        setBaseBranch('main')
      } finally {
        setLoadingBranches(false)
      }
    }
    load()
  }, [repoUrl])

  const handleConfirm = async () => {
    if (!branchName.trim() || !baseBranch) return
    setIsCreating(true)
    setError(null)
    try {
      await onConfirm(branchName.trim(), baseBranch)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to create session')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border rounded-lg w-[450px] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <GitBranch size={16} className="text-accent-blue" />
            <span className="text-sm font-semibold text-text-primary">New Session</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <span className="text-xs text-text-muted">Repository</span>
            <p className="text-sm text-text-primary font-mono mt-1">{repoName}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Clone From Branch
            </label>
            {loadingBranches ? (
              <div className="flex items-center gap-2 text-text-muted text-sm py-2">
                <Loader2 size={14} className="animate-spin" />
                Loading branches...
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => { setShowBranchDropdown(!showBranchDropdown); setBranchSearch('') }}
                  className="w-full flex items-center justify-between rounded px-3 py-2 text-sm font-mono border border-border cursor-pointer"
                  style={{ background: '#313244', color: '#cdd6f4' }}
                >
                  <span className="truncate">{baseBranch || 'Select branch...'}</span>
                  <ChevronDown size={14} className="text-text-muted shrink-0 ml-2" />
                </button>

                {showBranchDropdown && (
                  <div className="absolute z-50 mt-1 w-full rounded border border-border shadow-xl" style={{ background: '#313244' }}>
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                      <Search size={13} className="text-text-muted shrink-0" />
                      <input
                        type="text"
                        value={branchSearch}
                        onChange={e => setBranchSearch(e.target.value)}
                        placeholder="Search branches..."
                        className="w-full bg-transparent text-sm text-text-primary outline-none placeholder-text-muted font-mono"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredBranches.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-text-muted">No branches found</div>
                      ) : (
                        filteredBranches.map(b => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => { setBaseBranch(b); setShowBranchDropdown(false) }}
                            className="w-full text-left px-3 py-1.5 text-sm font-mono hover:bg-bg-hover transition-colors"
                            style={{ color: b === baseBranch ? '#89b4fa' : '#cdd6f4' }}
                          >
                            {b}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              New Branch Name
            </label>
            <input
              type="text"
              value={branchName}
              onChange={e => setBranchName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirm() }}
              className="w-full bg-bg-tertiary text-text-primary text-sm rounded px-3 py-2 outline-none focus:ring-1 focus:ring-accent-blue placeholder-text-muted border border-border font-mono"
              placeholder="username/branch-name"
              autoFocus
            />
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
              onClick={handleConfirm}
              disabled={!branchName.trim() || !baseBranch || isCreating || loadingBranches}
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-accent-blue text-bg-primary rounded hover:opacity-90 disabled:opacity-30 transition-opacity"
            >
              {isCreating ? <Loader2 size={14} className="animate-spin" /> : <GitBranch size={14} />}
              {isCreating ? 'Cloning...' : 'Create Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
