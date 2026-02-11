import { Upload, Loader2 } from 'lucide-react'

interface PushButtonProps {
  onPush: () => void
  isPushing: boolean
  disabled: boolean
}

export function PushButton({ onPush, isPushing, disabled }: PushButtonProps) {
  return (
    <button
      onClick={onPush}
      disabled={disabled || isPushing}
      className="flex items-center gap-2 px-3 py-1.5 bg-accent-green text-bg-primary text-sm font-medium rounded hover:opacity-90 disabled:opacity-40 transition-opacity no-drag"
    >
      {isPushing ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Upload size={14} />
      )}
      Push Changes
    </button>
  )
}
