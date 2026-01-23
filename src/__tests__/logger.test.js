import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLogger, default as loggerInstance } from '../utils/logger';

describe('Logger Utility', () => {
  beforeEach(() => {
    // Mock localStorage with proper object structure
    const localStorageMock = {
      getItem: vi.fn(() => '[]'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    vi.stubGlobal('localStorage', localStorageMock);
    
    // Mock fetch
    global.fetch = vi.fn(() => Promise.resolve({ ok: true }));
    
    // Reset logger instance state
    loggerInstance.setUserId(null);
    loggerInstance.setToken(null);
    loggerInstance.clearPendingLogs();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useLogger Hook', () => {
    it('should provide logger methods', () => {
      const { result } = renderHook(() => useLogger());
      
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('warn');
      expect(result.current).toHaveProperty('info');
      expect(result.current).toHaveProperty('debug');
      expect(result.current).toHaveProperty('setUserId');
      expect(result.current).toHaveProperty('clearUserId');
      expect(result.current).toHaveProperty('getSessionInfo');
      expect(result.current).toHaveProperty('clearPendingLogs');
    });

    it('should generate request ID', () => {
      const { result } = renderHook(() => useLogger());
      
      const sessionInfo = result.current.getSessionInfo();
      
      expect(sessionInfo.requestId).toBeDefined();
      expect(sessionInfo.requestId).toMatch(/^-?\d+-[a-z0-9]+$/);
    });

    it('should track user ID', () => {
      const { result } = renderHook(() => useLogger());
      
      act(() => {
        result.current.setUserId('user-123');
      });
      
      expect(result.current.getSessionInfo().userId).toBe('user-123');
      
      act(() => {
        result.current.clearUserId();
      });
      
      expect(result.current.getSessionInfo().userId).toBeNull();
    });
  });

  describe('Log Levels', () => {
    it('should log error with context', async () => {
      const { result } = renderHook(() => useLogger());
      const error = new Error('Test error');
      
      // Set token so logger will actually send (use instance directly)
      act(() => {
        loggerInstance.setToken('test-token');
      });
      
      await act(async () => {
        await result.current.error('test_error', { key: 'value' }, error);
      });
      
      expect(fetch).toHaveBeenCalledWith('/api/logs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: expect.stringContaining('"action":"test_error"'),
      });
    });

    it('should log warning', async () => {
      const { result } = renderHook(() => useLogger());
      
      // Set token so logger will actually send (use instance directly)
      act(() => {
        loggerInstance.setToken('test-token');
      });
      
      await act(async () => {
        await result.current.warn('test_warning', { key: 'value' });
      });
      
      expect(fetch).toHaveBeenCalledWith('/api/logs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: expect.stringContaining('"level":"warn"'),
      });
    });

    it('should log info', async () => {
      const { result } = renderHook(() => useLogger());
      
      // Set token so logger will actually send (use instance directly)
      act(() => {
        loggerInstance.setToken('test-token');
      });
      
      await act(async () => {
        await result.current.info('test_info', { key: 'value' });
      });
      
      expect(fetch).toHaveBeenCalledWith('/api/logs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: expect.stringContaining('"level":"info"'),
      });
    });

    it('should log debug to console', async () => {
      const consoleDebugSpy = vi.spyOn(console, 'debug');
      const { result } = renderHook(() => useLogger());
      
      await act(async () => {
        await result.current.debug('test_debug', { key: 'value' });
      });
      
      expect(consoleDebugSpy).toHaveBeenCalled();
      consoleDebugSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should store failed logs in localStorage', async () => {
      // Set token so logger tries to send
      act(() => {
        loggerInstance.setToken('test-token');
      });
      
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
      
      const { result } = renderHook(() => useLogger());
      
      await act(async () => {
        await result.current.error('test_error', { key: 'value' });
      });
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'pending_logs',
        expect.stringContaining('"action":"test_error"')
      );
    });

    it('should retry pending logs on successful connection', async () => {
      const pendingLogs = [
        { action: 'pending_error', level: 'error', timestamp: new Date().toISOString() }
      ];
      
      // Set up localStorage to return pending logs
      const localStorageMock = {
        getItem: vi.fn(() => JSON.stringify(pendingLogs)),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      vi.stubGlobal('localStorage', localStorageMock);
      
      // Set token so logger can send
      act(() => {
        loggerInstance.setToken('test-token');
      });
      
      global.fetch = vi.fn(() => Promise.resolve({ ok: true }));
      
      const { result } = renderHook(() => useLogger());
      
      // Load pending logs by creating a new logger instance
      loggerInstance.loadPendingLogs();
      
      await act(async () => {
        await loggerInstance.sendPendingLogs();
      });
      
      expect(fetch).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
      
      // Set token so logger tries to send
      act(() => {
        loggerInstance.setToken('test-token');
      });
      
      const { result } = renderHook(() => useLogger());
      
      await act(async () => {
        await result.current.error('network_error', { endpoint: '/api/test' });
      });
      
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Log Entry Structure', () => {
    it('should include required fields in log entry', async () => {
      const { result } = renderHook(() => useLogger());
      const testUserId = 'user-456';
      
      // Set token so logger sends (use instance directly)
      act(() => {
        result.current.setUserId(testUserId);
        loggerInstance.setToken('test-token');
      });
      
      await act(async () => {
        await result.current.info('test_action', { data: 'test' });
      });
      
      const fetchCall = global.fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('level');
      expect(body).toHaveProperty('action');
      expect(body).toHaveProperty('context');
      expect(body).toHaveProperty('requestId');
      expect(body).toHaveProperty('userId', testUserId);
      expect(body).toHaveProperty('sessionDuration');
      expect(body).toHaveProperty('url');
      expect(body).toHaveProperty('userAgent');
    });

    it('should include error details when provided', async () => {
      const { result } = renderHook(() => useLogger());
      const error = new Error('Test error with stack');
      
      // Set token so logger sends (use instance directly)
      act(() => {
        loggerInstance.setToken('test-token');
      });
      
      await act(async () => {
        await result.current.error('error_with_details', {}, error);
      });
      
      const fetchCall = global.fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      
      expect(body.error).toBeDefined();
      expect(body.error.message).toBe('Test error with stack');
      expect(body.error.name).toBe('Error');
      expect(body.error.stack).toBeDefined();
    });
  });

  describe('Session Tracking', () => {
    it('should track session duration', async () => {
      const { result } = renderHook(() => useLogger());
      
      const sessionInfo1 = result.current.getSessionInfo();
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const sessionInfo2 = result.current.getSessionInfo();
      
      expect(sessionInfo2.sessionDuration).toBeGreaterThan(sessionInfo1.sessionDuration);
    });

    it('should provide session start time', () => {
      const { result } = renderHook(() => useLogger());
      
      const sessionInfo = result.current.getSessionInfo();
      
      expect(sessionInfo.startTime).toBeDefined();
      expect(sessionInfo.startTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});