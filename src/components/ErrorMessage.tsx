import React from 'react';

/**
 * ErrorMessage Component Props
 */
interface ErrorMessageProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  title?: string;
  type?: 'error' | 'warning' | 'info';
}

/**
 * ErrorMessage Component
 * 
 * Displays error messages with optional retry and dismiss actions.
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onDismiss,
  title = 'Error',
  type = 'error',
}) => {
  if (!error) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'error':
      default:
        return '❌';
    }
  };

  return (
    <div
      className={`error-message glass-card error-message-${type}`}
      role="alert"
      aria-live="polite"
    >
      <div className="error-message-content">
        <div className="error-icon">{getIcon()}</div>
        <div className="error-text-container">
          <h3 className="error-title">{title}</h3>
          <p className="error-text">{error}</p>
        </div>
        {(onRetry || onDismiss) && (
          <div className="error-actions">
            {onRetry && (
              <button
                onClick={onRetry}
                className="btn btn-secondary btn-sm"
                type="button"
                aria-label="Try again"
              >
                Try Again
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="btn btn-ghost btn-sm"
                type="button"
                aria-label="Dismiss error"
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * GlobalError Component
 * 
 * Full-page error display for critical errors.
 */
export const GlobalError: React.FC<{ message: string; onReload?: () => void }> = ({
  message,
  onReload,
}) => (
  <div className="global-error">
    <div className="global-error-content glass-card">
      <div className="global-error-icon">⚠️</div>
      <h1 className="global-error-title">Oops!</h1>
      <p className="global-error-message">{message}</p>
      <button
        onClick={onReload || (() => window.location.reload())}
        className="btn btn-primary btn-lg"
        type="button"
      >
        Reload Page
      </button>
    </div>
  </div>
);

/**
 * InlineError Component
 * 
 * Compact inline error display for form fields.
 */
export const InlineError: React.FC<{ message: string }> = ({ message }) => (
  <span className="inline-error" role="alert">
    <span className="inline-error-icon">⚠️</span>
    {message}
  </span>
);

/**
 * APIError Component
 * 
 * Specialized error display for API errors.
 */
export const APIError: React.FC<{
  status?: number;
  message: string;
  endpoint?: string;
  onRetry?: () => void;
}> = ({ status, message, endpoint, onRetry }) => {
  const getStatusMessage = (status: number) => {
    switch (status) {
      case 400:
        return 'Bad Request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return 'Not Found';
      case 500:
        return 'Server Error';
      case 503:
        return 'Service Unavailable';
      default:
        return 'Error';
    }
  };

  return (
    <div className="api-error glass-card" role="alert">
      <div className="api-error-header">
        {status && (
          <span className="api-error-status">{status} {getStatusMessage(status)}</span>
        )}
        <h3 className="api-error-title">API Error</h3>
      </div>
      {endpoint && (
        <code className="api-error-endpoint">{endpoint}</code>
      )}
      <p className="api-error-message">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary btn-sm" type="button">
          Retry Request
        </button>
      )}
    </div>
  );
};

/**
 * NetworkError Component
 * 
 * Error display for network connectivity issues.
 */
export const NetworkError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <div className="network-error glass-card" role="alert">
    <div className="network-error-icon">🌐</div>
    <h3 className="network-error-title">Network Error</h3>
    <p className="network-error-message">
      Unable to connect to the server. Please check your internet connection.
    </p>
    {onRetry && (
      <button onClick={onRetry} className="btn btn-primary" type="button">
        Retry
      </button>
    )}
  </div>
);

/**
 * ValidationError Component
 * 
 * Error display for form validation errors.
 */
export const ValidationError: React.FC<{
  errors: Record<string, string[]>;
  onDismiss?: () => void;
}> = ({ errors, onDismiss }) => {
  const errorEntries = Object.entries(errors);

  if (errorEntries.length === 0) return null;

  return (
    <div className="validation-error glass-card" role="alert">
      <div className="validation-error-header">
        <span className="validation-error-icon">⚠️</span>
        <h3 className="validation-error-title">Validation Errors</h3>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="btn btn-ghost btn-sm"
            type="button"
            aria-label="Dismiss errors"
          >
            ✕
          </button>
        )}
      </div>
      <ul className="validation-error-list">
        {errorEntries.map(([field, messages]) => (
          <li key={field} className="validation-error-item">
            <strong className="validation-error-field">{field}:</strong>
            {messages.map((msg, idx) => (
              <span key={idx} className="validation-error-message">
                {msg}
              </span>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * LoadingError Component
 * 
 * Error display for loading failures.
 */
export const LoadingError: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <div className="loading-error" role="alert">
    <div className="loading-error-content">
      <div className="loading-error-icon">⚠️</div>
      <p className="loading-error-message">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary" type="button">
          Try Again
        </button>
      )}
    </div>
  </div>
);

/**
 * EmptyState Component
 * 
 * Display for empty data states (not an error, but related).
 */
export const EmptyState: React.FC<{
  icon?: string;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({ icon = '📭', title, message, action }) => (
  <div className="empty-state">
    <div className="empty-state-content glass-card">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {message && <p className="empty-state-message">{message}</p>}
      {action && (
        <button onClick={action.onClick} className="btn btn-primary" type="button">
          {action.label}
        </button>
      )}
    </div>
  </div>
);

export default ErrorMessage;