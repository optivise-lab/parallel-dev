# ParallelDev

**Run Multiple AI Coding Agents in Parallel — Natively.**

Isolated branches. Real terminals. Any CLI AI agent. Zero vendor lock-in.

[![Open Source & Free Forever](https://img.shields.io/badge/Open%20Source-Free%20Forever-brightgreen)](https://github.com/optivise-lab/parallel-dev)
[![GitHub Stars](https://img.shields.io/github/stars/optivise-lab/parallel-dev?style=social)](https://github.com/optivise-lab/parallel-dev)

🌐 [Website](https://paralleldev.optiviselab.com) · [GitHub](https://github.com/optivise-lab/parallel-dev) · [Twitter](https://x.com/ALEMRANCU)

---

## Features

- **Parallel Sessions** — Run multiple agents simultaneously without context collision.
- **Branch Isolation** — Each AI session runs on its own Git branch and workspace.
- **Native Terminal** — Claude, Codex, Amp — run exactly as designed.
- **Agent Agnostic** — Works with any CLI-based AI coding agent.
- **Open Source** — Fully open source. Inspect, modify, and contribute to the codebase.
- **Developer First** — No wrappers. No abstractions. No vendor lock-in. Full control.

---

## Installation

### macOS

1. Download the `.dmg` from the [website](https://paralleldev.optiviselab.com) or [GitHub Releases](https://github.com/optivise-lab/parallel-dev/releases).
2. Open the downloaded `.dmg` file to mount it.
3. Drag the **ParallelDev** app to your Applications folder.
4. If macOS blocks the app, run this in Terminal:
   ```bash
   xattr -d com.apple.quarantine /Applications/parallel-dev.app
   ```
5. Launch ParallelDev from Applications or Spotlight.

### Windows

Coming soon.

---

## Build from Source

```bash
# Clone the repository
git clone https://github.com/optivise-lab/parallel-dev.git
cd parallel-dev

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build the app
npm run build
```

---

## Tech Stack

- [Electron](https://www.electronjs.org/) — Desktop application framework
- [React](https://react.dev/) — UI library
- [TypeScript](https://www.typescriptlang.org/) — Type-safe JavaScript
- [Vite](https://vitejs.dev/) — Fast build tool
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- [xterm.js](https://xtermjs.org/) — Terminal emulator
- [node-pty](https://github.com/microsoft/node-pty) — Native terminal bindings
- [simple-git](https://github.com/steveukx/git-js) — Git operations

---

## Contributing

ParallelDev is fully open source. Contributions are welcome.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request on [GitHub](https://github.com/optivise-lab/parallel-dev)

---

## License

Open Source — Free Forever.
