import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorFallback from './ErrorFallback'

vi.mock('react-error-boundary', () => ({
  useErrorBoundary: vi.fn(),
}))

import { useErrorBoundary } from 'react-error-boundary'

describe('ErrorFallback', () => {
  const resetBoundaryMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useErrorBoundary.mockReturnValue({ resetBoundary: resetBoundaryMock })
  })

  it('renders error fallback with error message', () => {
    const error = new Error('Test error message')
    render(<ErrorFallback error={error} />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('renders generic message when no error provided', () => {
    render(<ErrorFallback />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
  })

  it('displays technical details when error has stack trace', () => {
    const error = new Error('Test error')
    error.stack = 'Error: Test error\n    at test.js:10:5'
    const { container } = render(<ErrorFallback error={error} />)

    expect(screen.getByText('Technical details')).toBeInTheDocument()
    
    const stackElement = container.querySelector('.error-stack')
    expect(stackElement).toBeInTheDocument()
    expect(stackElement.textContent).toContain('Test error')
    expect(stackElement.textContent).toContain('at test.js:10:5')
  })

  it('does not display technical details when error has no stack trace', () => {
    const error = new Error('Test error')
    error.stack = null
    render(<ErrorFallback error={error} />)

    expect(screen.queryByText('Technical details')).not.toBeInTheDocument()
  })

  it('has Try Again button that calls resetBoundary', () => {
    const error = new Error('Test error')
    render(<ErrorFallback error={error} />)

    const retryButton = screen.getByText('Try Again')
    expect(retryButton).toBeInTheDocument()
    
    retryButton.click()
    expect(resetBoundaryMock).toHaveBeenCalledTimes(1)
  })

  it('has Go to Home button that reloads page', () => {
    const error = new Error('Test error')
    render(<ErrorFallback error={error} />)

    const homeButton = screen.getByText('Go to Home')
    expect(homeButton).toBeInTheDocument()
    
    // Mock window.location.reload
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true
    })
    
    homeButton.click()
    expect(reloadMock).toHaveBeenCalledTimes(1)
  })

  it('has proper ARIA role for accessibility', () => {
    const error = new Error('Test error')
    const { container } = render(<ErrorFallback error={error} />)

    const alertDiv = container.querySelector('[role="alert"]')
    expect(alertDiv).toBeInTheDocument()
  })
})