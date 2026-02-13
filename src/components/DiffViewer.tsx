import { useMemo } from 'react'

interface DiffViewerProps {
  diff: string
  fileName: string
}

export function DiffViewer({ diff, fileName }: DiffViewerProps) {
  const lines = useMemo(() => {
    return diff.split('\n')
      .filter(line =>
        !line.startsWith('diff --git') &&
        !line.startsWith('index ') &&
        !line.startsWith('---') &&
        !line.startsWith('+++')
      )
      .map((line, i) => {
        let type: 'add' | 'remove' | 'header' | 'normal' = 'normal'
        if (line.startsWith('+')) type = 'add'
        else if (line.startsWith('-')) type = 'remove'
        else if (line.startsWith('@@')) type = 'header'

        return { text: line, type, key: i }
      })
  }, [diff])

  const typeClasses = {
    add: 'bg-accent-green/10 text-accent-green',
    remove: 'bg-accent-red/10 text-accent-red',
    header: 'bg-accent-blue/[0.08] text-accent-blue',
    normal: 'bg-transparent text-text-primary',
  }

  return (
    <div className="h-full overflow-auto bg-bg-primary">
      <div className="py-2 font-mono text-[13px] leading-5">
        {lines.map(line => (
          <div
            key={line.key}
            className={`px-4 whitespace-pre min-h-[20px] ${typeClasses[line.type]}`}
          >
            {line.text || ' '}
          </div>
        ))}
      </div>
    </div>
  )
}
