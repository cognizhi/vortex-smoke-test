import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { adminFetch } from '../useAdminData'

// Mock console for testing logging
const mockConsoleWarn = vi.fn()
const mockConsoleError = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  console.warn = mockConsoleWarn
  console.error = mockConsoleError
})

afterEach(() => {
  vi.restoreAllMocks()
})

/**
 * Test helper: Create a mock Response object
 */
function createMockResponse(
  options: {
    ok?: boolean
    status?: number
    contentLength?: string | null
    jsonData?: unknown
    jsonError?: Error
    body?: string
  }
) {
  const {
    ok = true,
    status = 200,
    contentLength,
    jsonData,
    jsonError,
    body
  } = options

  const headers = new Map<string, string>()
  if (contentLength !== undefined && contentLength !== null) {
    headers.set('content-length', contentLength)
  }

  return {
    ok,
    status,
    headers: {
      get: (name: string) => headers.get(name) || null
    },
    json: jsonError
      ? async () => {
          throw jsonError
        }
      : async () => jsonData,
    body
  } as unknown as Response
}

describe('adminFetch', () => {
  describe('empty response handling', () => {
    it('TC-1.1: handles empty response with Content-Length: 0', async () => {
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: true,
          status: 200,
          contentLength: '0'
        })
      )
      global.fetch = mockFetch

      const result = await adminFetch<{ items: string[] }>('/api/test')

      expect(result.data).toBeNull()
      expect(result.error).toBeNull()
      expect(mockConsoleWarn).not.toHaveBeenCalled()
    })

    it('TC-1.2: handles empty response without Content-Length header', async () => {
      const parseErr = new SyntaxError('Unexpected end of JSON input')
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: true,
          status: 200,
          contentLength: null,
          jsonError: parseErr
        })
      )
      global.fetch = mockFetch

      const result = await adminFetch<{ items: string[] }>('/api/test')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Invalid response format')
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('JSON parse error'),
        expect.any(Object)
      )
    })

    it('TC-1.3: handles 204 No Content response', async () => {
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: true,
          status: 204,
          contentLength: '0'
        })
      )
      global.fetch = mockFetch

      const result = await adminFetch<{ items: string[] }>('/api/test')

      expect(result.data).toBeNull()
      expect(result.error).toBeNull()
    })
  })

  describe('malformed JSON handling', () => {
    it('TC-2.1: catches malformed JSON with broken syntax', async () => {
      const parseErr = new SyntaxError('Unexpected token }')
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: true,
          status: 200,
          contentLength: '50',
          jsonError: parseErr
        })
      )
      global.fetch = mockFetch

      const result = await adminFetch<{ items: string[] }>('/api/test')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Invalid response format')
      expect(mockConsoleWarn).toHaveBeenCalled()
    })

    it('TC-2.2: catches incomplete JSON', async () => {
      const parseErr = new SyntaxError('Unexpected end of JSON input')
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: true,
          status: 200,
          contentLength: '10',
          jsonError: parseErr
        })
      )
      global.fetch = mockFetch

      const result = await adminFetch<{ items: string[] }>('/api/test')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Invalid response format')
    })

    it('TC-2.3: handles HTML response instead of JSON', async () => {
      const parseErr = new SyntaxError('Unexpected token <')
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: false,
          status: 500,
          contentLength: '100',
          jsonError: parseErr
        })
      )
      global.fetch = mockFetch

      const result = await adminFetch<{ items: string[] }>('/api/test')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Invalid response format')
    })
  })

  describe('valid response parsing', () => {
    it('TC-3.1: parses valid JSON response with data', async () => {
      const mockData = { staff: [{ id: '1', name: 'John' }] }
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: true,
          status: 200,
          contentLength: '100',
          jsonData: { data: mockData, error: null }
        })
      )
      global.fetch = mockFetch

      const result = await adminFetch<{ staff: { id: string; name: string }[] }>(
        '/api/admin/staff'
      )

      expect(result.data).toEqual(mockData)
      expect(result.error).toBeNull()
    })

    it('TC-3.2: parses valid JSON response with empty array', async () => {
      const mockData = { services: [] }
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: true,
          status: 200,
          contentLength: '50',
          jsonData: { data: mockData, error: null }
        })
      )
      global.fetch = mockFetch

      const result = await adminFetch<{ services: { id: string }[] }>(
        '/api/admin/services'
      )

      expect(result.data).toEqual(mockData)
      expect(result.error).toBeNull()
    })

    it('TC-3.3: parses valid JSON response with null data', async () => {
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: true,
          status: 200,
          contentLength: '30',
          jsonData: { data: null, error: null }
        })
      )
      global.fetch = mockFetch

      const result = await adminFetch<{ id: string }>('/api/test')

      expect(result.data).toBeNull()
      expect(result.error).toBeNull()
    })
  })

  describe('error response handling', () => {
    it('TC-4.1: handles 400 Bad Request with error message', async () => {
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: false,
          status: 400,
          contentLength: '50',
          jsonData: { data: null, error: { message: 'Invalid discount code' } }
        })
      )
      global.fetch = mockFetch

      const result = await adminFetch<{ id: string }>('/api/test')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Invalid discount code')
    })

    it('TC-4.2: handles 401 Unauthorized', async () => {
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: false,
          status: 401,
          contentLength: '50',
          jsonData: { data: null, error: { message: 'Token expired' } }
        })
      )
      global.fetch = mockFetch

      const result = await adminFetch<{ id: string }>('/api/test')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Token expired')
    })

    it('TC-4.3: handles 403 Forbidden', async () => {
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: false,
          status: 403,
          contentLength: '50',
          jsonData: { data: null, error: { message: 'Insufficient permissions' } }
        })
      )
      global.fetch = mockFetch

      const result = await adminFetch<{ id: string }>('/api/test')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Insufficient permissions')
    })

    it('TC-4.4: handles 500 Server Error with error message', async () => {
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: false,
          status: 500,
          contentLength: '50',
          jsonData: { data: null, error: { message: 'Database connection failed' } }
        })
      )
      global.fetch = mockFetch

      const result = await adminFetch<{ id: string }>('/api/test')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Database connection failed')
    })

    it('TC-4.5: handles error response without message using status code', async () => {
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: false,
          status: 400,
          contentLength: '50',
          jsonData: { data: null, error: null }
        })
      )
      global.fetch = mockFetch

      const result = await adminFetch<{ id: string }>('/api/test')

      expect(result.data).toBeNull()
      expect(result.error).toBe('HTTP 400')
    })

    it('TC-4.6: handles error response with empty content', async () => {
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: false,
          status: 500,
          contentLength: '0'
        })
      )
      global.fetch = mockFetch

      const result = await adminFetch<{ id: string }>('/api/test')

      expect(result.data).toBeNull()
      expect(result.error).toBe('HTTP 500')
    })
  })

  describe('network error handling', () => {
    it('TC-5.1: handles network error from fetch', async () => {
      const networkErr = new Error('Failed to fetch')
      const mockFetch = vi.fn(async () => {
        throw networkErr
      })
      global.fetch = mockFetch

      const result = await adminFetch<{ id: string }>('/api/test')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Failed to fetch')
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Network error'),
        expect.any(Object)
      )
    })

    it('TC-5.2: handles timeout error', async () => {
      const timeoutErr = new Error('Request timeout')
      const mockFetch = vi.fn(async () => {
        throw timeoutErr
      })
      global.fetch = mockFetch

      const result = await adminFetch<{ id: string }>('/api/test')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Request timeout')
    })

    it('TC-5.3: handles CORS error', async () => {
      const corsErr = new TypeError('Failed to fetch (CORS)')
      const mockFetch = vi.fn(async () => {
        throw corsErr
      })
      global.fetch = mockFetch

      const result = await adminFetch<{ id: string }>('/api/test')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Failed to fetch (CORS)')
    })

    it('TC-5.4: handles non-Error object thrown by fetch', async () => {
      const mockFetch = vi.fn(async () => {
        throw { code: 123 }
      })
      global.fetch = mockFetch

      const result = await adminFetch<{ id: string }>('/api/test')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Network error')
    })
  })

  describe('logging', () => {
    it('TC-6.1: logs warning on JSON parse error', async () => {
      const parseErr = new SyntaxError('Parse error')
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: true,
          status: 200,
          contentLength: '50',
          jsonError: parseErr
        })
      )
      global.fetch = mockFetch

      await adminFetch<{ id: string }>('/api/test')

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('JSON parse error'),
        expect.objectContaining({
          url: '/api/test',
          status: 200,
          error: expect.any(String)
        })
      )
    })

    it('TC-6.2: logs error on network failure', async () => {
      const networkErr = new Error('Network failed')
      const mockFetch = vi.fn(async () => {
        throw networkErr
      })
      global.fetch = mockFetch

      await adminFetch<{ id: string }>('/api/test')

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Network error'),
        expect.objectContaining({
          url: '/api/test',
          error: 'Network failed'
        })
      )
    })

    it('TC-6.3: does not log on success', async () => {
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: true,
          status: 200,
          contentLength: '50',
          jsonData: { data: { id: '1' }, error: null }
        })
      )
      global.fetch = mockFetch

      await adminFetch<{ id: string }>('/api/test')

      expect(mockConsoleWarn).not.toHaveBeenCalled()
      expect(mockConsoleError).not.toHaveBeenCalled()
    })
  })

  describe('type safety', () => {
    it('TC-7.1: preserves type parameter in return type', async () => {
      const mockData = { staff: [{ id: '1', name: 'John' }] }
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: true,
          status: 200,
          contentLength: '100',
          jsonData: { data: mockData, error: null }
        })
      )
      global.fetch = mockFetch

      const result = await adminFetch<{ staff: { id: string; name: string }[] }>(
        '/api/admin/staff'
      )

      expect(result.data).not.toBeNull()
      if (result.data) {
        expect(result.data.staff).toBeDefined()
        expect(result.data.staff[0].name).toBe('John')
      }
    })

    it('TC-7.2: generic type inference works correctly', async () => {
      const mockData = { bookings: [{ id: '1', status: 'confirmed' as const }] }
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: true,
          status: 200,
          contentLength: '100',
          jsonData: { data: mockData, error: null }
        })
      )
      global.fetch = mockFetch

      const result = await adminFetch<{
        bookings: { id: string; status: 'confirmed' | 'cancelled_customer' }[]
      }>('/api/admin/bookings')

      expect(result.data?.bookings[0].status).toBe('confirmed')
    })
  })

  describe('edge cases', () => {
    it('handles response with ok=true but error field set', async () => {
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: true,
          status: 200,
          contentLength: '100',
          jsonData: { data: null, error: { message: 'Logic error' } }
        })
      )
      global.fetch = mockFetch

      const result = await adminFetch<{ id: string }>('/api/test')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Logic error')
    })

    it('preserves original data even if ok=false when no error in JSON', async () => {
      const mockData = { id: '1' }
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: false,
          status: 400,
          contentLength: '50',
          jsonData: { data: mockData, error: null }
        })
      )
      global.fetch = mockFetch

      const result = await adminFetch<{ id: string }>('/api/test')

      expect(result.data).toBeNull()
      expect(result.error).toBe('HTTP 400')
    })
  })

  describe('credentials and fetch options', () => {
    it('includes credentials in fetch call', async () => {
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: true,
          status: 200,
          contentLength: '50',
          jsonData: { data: { id: '1' }, error: null }
        })
      )
      global.fetch = mockFetch

      await adminFetch<{ id: string }>('/api/test')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({ credentials: 'include' })
      )
    })

    it('merges custom options with default fetch options', async () => {
      const mockFetch = vi.fn(async () =>
        createMockResponse({
          ok: true,
          status: 200,
          contentLength: '50',
          jsonData: { data: { id: '1' }, error: null }
        })
      )
      global.fetch = mockFetch

      const customHeaders = { 'X-Custom': 'header' }
      await adminFetch<{ id: string }>('/api/test', { headers: customHeaders })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          credentials: 'include',
          headers: customHeaders
        })
      )
    })
  })
})
