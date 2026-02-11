export class PtyService {
  private process: any

  constructor(cwd: string, onData: (data: string) => void) {
    const shell = process.platform === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/zsh'

    let pty: any
    try {
      pty = require('node-pty')
    } catch (err) {
      console.error('Failed to load node-pty:', err)
      onData(`\r\nError: node-pty module failed to load.\r\n`)
      return
    }

    try {
      this.process = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd,
        env: { ...process.env, HOME: process.env.HOME } as Record<string, string>,
      })
      this.process.onData(onData)
    } catch (err: any) {
      console.error('Failed to spawn pty:', err)
      onData(`\r\nError: Failed to spawn terminal: ${err.message}\r\n`)
    }
  }

  write(data: string) {
    this.process?.write(data)
  }

  resize(cols: number, rows: number) {
    this.process?.resize(cols, rows)
  }

  kill() {
    this.process?.kill()
  }
}
