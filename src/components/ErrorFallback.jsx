import { useErrorBoundary } from 'react-error-boundary'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function ErrorFallback({ error }) {
  const { resetBoundary } = useErrorBoundary()

  if (!error) {
    return (
      <div className="error-fallback" role="alert">
        <AlertTriangle size={48} className="error-icon" />
        <h2>Something went wrong</h2>
        <p>An unexpected error occurred</p>
        <div className="error-actions">
          <button onClick={resetBoundary} className="retry-button">
            <RefreshCw size={16} />
            Try Again
          </button>
          <button onClick={() => window.location.reload()} className="refresh-button">
            <Home size={16} />
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="error-fallback" role="alert">
      <AlertTriangle size={48} className="error-icon" />
      <h2>Something went wrong</h2>
      <p>{error.message || 'An unexpected error occurred'}</p>
      {error.stack && (
        <details className="error-details">
          <summary>Technical details</summary>
          <pre className="error-stack">{error.stack}</pre>
        </details>
      )}
      <div className="error-actions">
        <button onClick={resetBoundary} className="retry-button">
          <RefreshCw size={16} />
          Try Again
        </button>
        <button onClick={() => window.location.reload()} className="refresh-button">
          <Home size={16} />
          Go to Home
        </button>
      </div>
    </div>
  )
}