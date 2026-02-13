import { Component } from 'react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-bg-primary">
          <div className="text-center space-y-4">
            <p className="text-lg text-text-primary">Something went wrong</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-accent-blue text-bg-primary rounded text-sm font-medium hover:opacity-90"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
