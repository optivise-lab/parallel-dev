import { useState, useEffect } from 'react'
import { X, FolderOpen } from 'lucide-react'
import type { Settings as SettingsType } from '../types'

interface SettingsProps {
  onClose: () => void
}

export function Settings({ onClose }: SettingsProps) {
  const [settings, setSettings] = useState<SettingsType | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.electronAPI.getSettings().then(setSettings)
  }, [])

  const handlePickFolder = async () => {
    const folder = await window.electronAPI.pickFolder()
    if (folder && settings) {
      setSaving(true)
      const updated = await window.electronAPI.updateSettings({ workspacePath: folder })
      setSettings(updated)
      setSaving(false)
    }
  }

  if (!settings) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border rounded-lg w-[500px] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
              Workspace Directory
            </label>
            <p className="text-xs text-text-muted mb-3">
              Sessions will be cloned into this directory.
            </p>
            <div className="flex gap-2">
              <div className="flex-1 bg-bg-tertiary rounded px-3 py-2 text-sm text-text-primary font-mono truncate border border-border">
                {settings.workspacePath}
              </div>
              <button
                onClick={handlePickFolder}
                disabled={saving}
                className="flex items-center gap-2 px-3 py-2 bg-accent-blue text-bg-primary text-sm font-medium rounded hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
              >
                <FolderOpen size={14} />
                {saving ? 'Saving...' : 'Browse'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
