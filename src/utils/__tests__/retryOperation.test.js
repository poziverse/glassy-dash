import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { retryOperation } from '../retryOperation'

describe('retryOperation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns result on first successful attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success')
    
    const result = await retryOperation(operation)
    
    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('retries operation on failure with exponential backoff', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('Failure 1'))
      .mockRejectedValueOnce(new Error('Failure 2'))
      .mockResolvedValue('success')
    
    const onRetryMock = vi.fn()
    
    const promise = retryOperation(operation, {
      maxRetries: 3,
      delay: 100,
      onRetry: onRetryMock,
    })

    // Fast forward through first retry
    vi.advanceTimersByTimeAsync(100)
    vi.advanceTimersByTimeAsync(200) // Second retry with exponential backoff
    
    const result = await promise
    
    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledTimes(3)
    expect(onRetryMock).toHaveBeenCalledWith(1, expect.any(Error), 100)
    expect(onRetryMock).toHaveBeenCalledWith(2, expect.any(Error), 200)
  })

  it('throws error after max retries exhausted', async () => {
    const error = new Error('Failed')
    const operation = vi.fn().mockRejectedValue(error)
    
    const promise = retryOperation(operation, {
      maxRetries: 2,
      delay: 50,
    })
    
    // Fast forward through all retries
    vi.advanceTimersByTimeAsync(50)
    vi.advanceTimersByTimeAsync(100)
    
    await expect(promise).rejects.toThrow('Failed')
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('uses default maxRetries of 3 when not specified', async () => {
    const error = new Error('Failed')
    const operation = vi.fn().mockRejectedValue(error)
    
    const promise = retryOperation(operation, { delay: 50 })
    
    // Fast forward through 3 default retries
    vi.advanceTimersByTimeAsync(50)
    vi.advanceTimersByTimeAsync(100)
    vi.advanceTimersByTimeAsync(200)
    
    await expect(promise).rejects.toThrow('Failed')
    expect(operation).toHaveBeenCalledTimes(3)
  })

  it('uses default delay of 1000ms when not specified', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('Failure'))
      .mockResolvedValue('success')
    
    const promise = retryOperation(operation, { maxRetries: 2 })
    
    // Fast forward 1 second (default delay)
    vi.advanceTimersByTimeAsync(1000)
    
    const result = await promise
    expect(result).toBe('success')
  })

  it('does not call onRetry when operation succeeds on first attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success')
    const onRetryMock = vi.fn()
    
    await retryOperation(operation, {
      maxRetries: 3,
      onRetry: onRetryMock,
    })
    
    expect(onRetryMock).not.toHaveBeenCalled()
  })

  it('passes retry attempt number to onRetry callback', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('Failure 1'))
      .mockRejectedValueOnce(new Error('Failure 2'))
      .mockResolvedValue('success')
    
    const onRetryMock = vi.fn()
    
    const promise = retryOperation(operation, {
      maxRetries: 3,
      delay: 50,
      onRetry: onRetryMock,
    })
    
    vi.advanceTimersByTimeAsync(50)
    vi.advanceTimersByTimeAsync(100)
    
    await promise
    
    expect(onRetryMock).toHaveBeenNthCalledWith(1, 1, expect.any(Error), 50)
    expect(onRetryMock).toHaveBeenNthCalledWith(2, 2, expect.any(Error), 100)
  })

  it('passes error object to onRetry callback', async () => {
    const error1 = new Error('Error 1')
    const error2 = new Error('Error 2')
    
    const operation = vi
      .fn()
      .mockRejectedValueOnce(error1)
      .mockRejectedValueOnce(error2)
      .mockResolvedValue('success')
    
    const onRetryMock = vi.fn()
    
    const promise = retryOperation(operation, {
      maxRetries: 3,
      delay: 50,
      onRetry: onRetryMock,
    })
    
    vi.advanceTimersByTimeAsync(50)
    vi.advanceTimersByTimeAsync(100)
    
    await promise
    
    expect(onRetryMock).toHaveBeenNthCalledWith(1, 1, error1, 50)
    expect(onRetryMock).toHaveBeenNthCalledWith(2, 2, error2, 100)
  })

  it('passes wait time to onRetry callback with exponential backoff', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('Failure 1'))
      .mockRejectedValueOnce(new Error('Failure 2'))
      .mockResolvedValue('success')
    
    const onRetryMock = vi.fn()
    
    const promise = retryOperation(operation, {
      maxRetries: 3,
      delay: 100,
      onRetry: onRetryMock,
    })
    
    vi.advanceTimersByTimeAsync(100) // First retry: 100 * 2^0 = 100
    vi.advanceTimersByTimeAsync(200) // Second retry: 100 * 2^1 = 200
    
    await promise
    
    expect(onRetryMock).toHaveBeenNthCalledWith(1, 1, expect.any(Error), 100)
    expect(onRetryMock).toHaveBeenNthCalledWith(2, 2, expect.any(Error), 200)
  })

  it('handles operation that rejects with null/undefined error', async () => {
    const operation = vi.fn().mockRejectedValue(null)
    
    const promise = retryOperation(operation, {
      maxRetries: 1,
      delay: 50,
    })
    
    vi.advanceTimersByTimeAsync(50)
    
    await expect(promise).rejects.toBeNull()
  })
})