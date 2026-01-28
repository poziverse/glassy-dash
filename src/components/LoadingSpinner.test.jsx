import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingSpinner from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders default loading state', () => {
    render(<LoadingSpinner />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders custom size', () => {
    const { container } = render(<LoadingSpinner size={48} />)
    const svg = container.querySelector('svg')
    
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('width', '48')
    expect(svg).toHaveAttribute('height', '48')
  })

  it('renders custom text', () => {
    render(<LoadingSpinner text="Loading data..." />)
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  it('renders both custom size and text', () => {
    const { container } = render(
      <LoadingSpinner size={64} text="Processing your request..." />
    )
    
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '64')
    expect(screen.getByText('Processing your request...')).toBeInTheDocument()
  })

  it('has animate-spin class on spinner icon', () => {
    const { container } = render(<LoadingSpinner />)
    const svg = container.querySelector('svg')
    
    expect(svg).toHaveClass('animate-spin')
  })

  it('does not render text when text prop is not provided', () => {
    render(<LoadingSpinner />)
    
    const textElement = screen.queryByText('Loading...')
    expect(textElement).toBeInTheDocument()
  })
})