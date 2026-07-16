import { describe, it, expect } from 'vitest';

/**
 * Regression test for VRTX-0434: /healthz-smoke-bugfix-804297523 endpoint
 *
 * This test verifies that the health check endpoint exists and returns
 * the correct response format for smoke testing and monitoring systems.
 */
describe('GET /api/healthz-smoke-bugfix-804297523', () => {
  it('should return 200 with ok true and correct variant', async () => {
    // Import the route handler
    const { GET } = await import('../route');

    // Call the handler
    const response = await GET();

    // Verify the response is a NextResponse
    expect(response).toBeDefined();
    expect(response.status).toBe(200);

    // Parse the JSON body
    const data = await response.json();

    // Verify the response structure and content
    expect(data).toEqual({
      ok: true,
      variant: '804297523',
    });

    // Verify content-type header
    expect(response.headers.get('content-type')).toContain('application/json');
  });
});
