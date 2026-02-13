# Contributing to ParallelDev

Thanks for your interest in contributing to ParallelDev.

## Development Setup

```bash
git clone https://github.com/optivise-lab/parallel-dev.git
cd parallel-dev
npm install
npm run dev
```

## Running Checks

```bash
npx tsc --noEmit    # typecheck
npm run build       # full build (requires native deps)
```

## Making Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run `npx tsc --noEmit` to verify no type errors
5. Commit with a clear message
6. Push and open a Pull Request

## Code Style

- TypeScript strict mode
- React 18 functional components with hooks
- Tailwind CSS for styling (use existing theme colors)
- No comments unless the code is complex and requires context
- Named exports for components
- When adding IPC channels: add handler in `main.ts`, expose in `preload.ts`, add type to `ElectronAPI` in `src/types.ts`

## Reporting Issues

Use [GitHub Issues](https://github.com/optivise-lab/parallel-dev/issues) with the provided templates.
