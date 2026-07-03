'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Booking, Staff, Service, Customer, Discount } from '@/types/admin'

export type ApiResponse<T> = { data: T | null; error: string | null; loading: boolean }

/**
 * Parse response JSON safely, handling empty and malformed bodies.
 *
 * @param res - The fetch Response object
 * @param url - The request URL (for logging)
 * @returns Parsed data and error message (one will be null)
 */
async function parseResponseJson<T>(
  res: Response,
  url: string
): Promise<{ data: T | null; error: string | null }> {
  // Check if response has content before attempting to parse JSON
  const contentLength = res.headers.get('content-length')
  if (contentLength === '0') {
    // Empty body is acceptable for 2xx responses
    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status}` }
    }
    return { data: null, error: null }
  }

  // Attempt to parse JSON with error handling
  let json: { data: T; error: { message: string } | null }
  try {
    json = await res.json()
  } catch (parseErr) {
    // Log JSON parse errors for debugging
    console.warn('[adminFetch] JSON parse error', {
      url,
      status: res.status,
      contentLength,
      error: parseErr instanceof Error ? parseErr.message : 'Unknown error'
    })
    return { data: null, error: 'Invalid response format' }
  }

  // Check HTTP status and error field in response
  if (!res.ok || json.error) {
    return { data: null, error: json.error?.message ?? `HTTP ${res.status}` }
  }

  return { data: json.data, error: null }
}

/**
 * Generic admin API fetcher (relative URL).
 * Handles empty responses, malformed JSON, and network errors gracefully.
 */
async function adminFetch<T>(url: string, opts?: RequestInit): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, { credentials: 'include', ...opts })
    return await parseResponseJson<T>(res, url)
  } catch (e) {
    // Log network errors for debugging
    console.error('[adminFetch] Network error', {
      url,
      error: e instanceof Error ? e.message : 'Unknown error'
    })
    return { data: null, error: e instanceof Error ? e.message : 'Network error' }
  }
}

export function useBookings(params?: { status?: string; date?: string; staffId?: string }) {
  const [state, setState] = useState<ApiResponse<{ bookings: Booking[] }>>({ data: null, error: null, loading: true })

  const refetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true }))
    const qs = new URLSearchParams()
    if (params?.status) qs.set('status', params.status)
    if (params?.date) qs.set('date', params.date)
    if (params?.staffId) qs.set('staffId', params.staffId)
    const result = await adminFetch<{ bookings: Booking[] }>('/api/admin/bookings?' + qs.toString())
    setState({ ...result, loading: false })
  }, [params?.status, params?.date, params?.staffId])

  useEffect(() => { void refetch() }, [refetch])
  return { ...state, refetch }
}

export function useStaff() {
  const [state, setState] = useState<ApiResponse<{ staff: Staff[] }>>({ data: null, error: null, loading: true })

  const refetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true }))
    const result = await adminFetch<{ staff: Staff[] }>('/api/admin/staff')
    setState({ ...result, loading: false })
  }, [])

  useEffect(() => { void refetch() }, [refetch])
  return { ...state, refetch }
}

export function useServices() {
  const [state, setState] = useState<ApiResponse<{ services: Service[] }>>({ data: null, error: null, loading: true })

  const refetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true }))
    const result = await adminFetch<{ services: Service[] }>('/api/admin/services')
    setState({ ...result, loading: false })
  }, [])

  useEffect(() => { void refetch() }, [refetch])
  return { ...state, refetch }
}

export function useCustomers() {
  const [state, setState] = useState<ApiResponse<{ customers: Customer[] }>>({ data: null, error: null, loading: true })

  const refetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true }))
    const result = await adminFetch<{ customers: Customer[] }>('/api/admin/customers')
    setState({ ...result, loading: false })
  }, [])

  useEffect(() => { void refetch() }, [refetch])
  return { ...state, refetch }
}

export { adminFetch }

export function useDiscounts() {
  const [state, setState] = useState<ApiResponse<{ discounts: Discount[] }>>({ data: null, error: null, loading: true })

  const refetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true }))
    const result = await adminFetch<{ discounts: Discount[] }>('/api/admin/discounts')
    setState({ ...result, loading: false })
  }, [])

  useEffect(() => { void refetch() }, [refetch])
  return { ...state, refetch }
}
