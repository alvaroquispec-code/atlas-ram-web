import { Component, type ErrorInfo, type ReactNode } from 'react'
import Button from './Button'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error de renderizado', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Algo salió mal en esta pantalla</h1>
        <p className="text-sm text-slate-500">Puedes recargar la página. Si el problema sigue, avísanos.</p>
        <Button onClick={() => window.location.reload()}>Recargar</Button>
      </div>
    )
  }
}
