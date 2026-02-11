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

  const colors = {
    add: { bg: 'rgba(166, 227, 161, 0.1)', color: '#a6e3a1' },
    remove: { bg: 'rgba(243, 139, 168, 0.1)', color: '#f38ba8' },
    header: { bg: 'rgba(137, 180, 250, 0.08)', color: '#89b4fa' },
    normal: { bg: 'transparent', color: '#cdd6f4' },
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#1e1e2e' }}>
      <div style={{ padding: '8px 0', fontFamily: 'Menlo, Monaco, "Courier New", monospace', fontSize: 13, lineHeight: '20px' }}>
        {lines.map(line => (
          <div
            key={line.key}
            style={{
              padding: '0 16px',
              background: colors[line.type].bg,
              color: colors[line.type].color,
              whiteSpace: 'pre',
              minHeight: 20,
            }}
          >
            {line.text || ' '}
          </div>
        ))}
      </div>
    </div>
  )
}
