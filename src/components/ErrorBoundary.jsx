import React, { Component } from 'react';
import logger from '../utils/logger';

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays a fallback UI
 * Prevents the entire app from crashing due to errors in specific components
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to our logger
    logger.error('react_error_boundary', {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      boundaryName: this.props.name || 'Unknown'
    }, error);

    // Store error info for display
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Optional: Reload the page to clear state
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              An unexpected error occurred. The app has been protected from crashing, 
              but you may need to refresh to continue.
            </p>

            {error && (
              <details className="text-left bg-gray-100 dark:bg-gray-700/50 rounded-lg p-4 mb-6 text-sm">
                <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Error details (click to expand)
                </summary>
                <pre className="overflow-auto text-red-600 dark:text-red-400 whitespace-pre-wrap">
                  {error.toString()}
                </pre>
                {errorInfo && errorInfo.componentStack && (
                  <pre className="mt-2 text-gray-600 dark:text-gray-400 whitespace-pre-wrap text-xs">
                    {errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2.5 bg-[var(--color-accent)] hover:brightness-110 text-white rounded-lg font-medium transition-colors shadow-lg shadow-[var(--color-accent)]/20"
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = window.location.href.split('#')[0] + '#/login'}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;