import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import type { Session } from '../types'

interface TerminalProps {
  session: Session
}

export function Terminal({ session }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const term = new XTerm({
      theme: {
        background: '#181825',
        foreground: '#cdd6f4',
        cursor: '#f5e0dc',
        selectionBackground: '#45475a',
        black: '#45475a',
        red: '#f38ba8',
        green: '#a6e3a1',
        yellow: '#f9e2af',
        blue: '#89b4fa',
        magenta: '#cba6f7',
        cyan: '#94e2d5',
        white: '#bac2de',
      },
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      cursorBlink: true,
      scrollback: 5000,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef.current)

    setTimeout(() => {
      fitAddon.fit()
      term.write('\x1b[' + term.rows + ';1H')
    }, 100)

    termRef.current = term
    fitAddonRef.current = fitAddon

    window.electronAPI.createTerminal(session.id)

    term.onData(data => {
      window.electronAPI.sendTerminalInput(session.id, data)
    })

    const removeListener = window.electronAPI.onTerminalData((sessionId, data) => {
      if (sessionId === session.id) {
        term.write(data)
      }
    })

    term.onResize(({ cols, rows }) => {
      window.electronAPI.resizeTerminal(session.id, cols, rows)
    })

    const handleResize = () => fitAddon.fit()
    const observer = new ResizeObserver(handleResize)
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      removeListener()
      window.electronAPI.killTerminal(session.id)
      term.dispose()
    }
  }, [session.id, session.path])

  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-bg-secondary p-2"
    />
  )
}
