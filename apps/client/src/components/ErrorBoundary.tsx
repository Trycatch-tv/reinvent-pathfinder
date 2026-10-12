import React from 'react'

export interface ErrorBoundaryProps {
  readonly children: React.ReactNode
}

export interface ErrorBoundaryState {
  readonly hasError: boolean
  readonly error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }

  handleResetState = (): void => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('pathfinder_journey_state_demo')
        window.localStorage.removeItem('pathfinder_journey_state_live')
        window.localStorage.removeItem('pathfinder_journey_state')
        window.location.reload()
      }
    } catch {
      // ignore
    }
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            maxWidth: '640px',
            margin: '3rem auto',
            padding: '2rem',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #fecaca',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.8rem' }}>⚠️</span>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#991b1b' }}>
              Error al renderizar el estado
            </h2>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
            Ocurrió un error inesperado al procesar la sesión guardada. Puedes restablecer el estado local
            para recuperar la experiencia limpia.
          </p>
          {this.state.error?.message && (
            <pre
              style={{
                backgroundColor: '#fef2f2',
                color: '#b91c1c',
                padding: '0.8rem',
                borderRadius: '6px',
                fontSize: '0.82rem',
                overflowX: 'auto',
                marginBottom: '1.5rem',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button
            type="button"
            onClick={this.handleResetState}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Restablecer Journey y Recargar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
