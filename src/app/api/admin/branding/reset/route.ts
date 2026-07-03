/**
 * PUT /api/admin/branding/reset
 *
 * Reset specific branding fields to null (defaults).
 *
 * Request: {fields: ("site_name" | "avatar_url")[]}
 * Response: {success: true, branding: {...}} or {success: false, error: "..."}
 *
 * Authentication: Required (401 if missing)
 * Authorization: Admin role required (403 if not admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { merchantBranding } from '@/lib/db/schema';
import { env } from '@/lib/env';

// Database setup
let _pool: Pool | null = null;
function getPool(): Pool {
  if (!_pool) _pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });
  return _pool;
}

// Types
type BrandingField = 'site_name' | 'avatar_url';

interface ResetRequest {
  fields: BrandingField[];
}

interface BrandingResponse {
  siteName?: string | null;
  avatarUrl?: string | null;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  branding?: T;
  error?: string;
}

// Helper: Get authenticated session
async function getSession(request: NextRequest) {
  // TODO: Implement session retrieval
  return {
    user: {
      id: 'user-123',
      merchantId: 'merchant-123',
      role: 'admin',
      email: 'admin@example.com',
    },
  };
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<BrandingResponse>>> {
  try {
    // 1. Check authentication
    const session = await getSession(request);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - admin access required' },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const body = await request.json() as ResetRequest;
    const { fields } = body;

    // 4. Validate fields
    if (!Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one field is required' },
        { status: 400 }
      );
    }

    const validFields: BrandingField[] = ['site_name', 'avatar_url'];
    for (const field of fields) {
      if (!validFields.includes(field)) {
        return NextResponse.json(
          { success: false, error: `Invalid field: ${field}` },
          { status: 400 }
        );
      }
    }

    // 5. Update database
    const db = drizzle(getPool());
    const now = new Date().toISOString();

    // Build update object based on fields
    const updateData: Record<string, any> = {
      updatedAt: now,
    };

    if (fields.includes('site_name')) {
      updateData.siteName = null;
    }
    if (fields.includes('avatar_url')) {
      updateData.avatarUrl = null;
    }

    // Execute update
    const result = await db
      .update(merchantBranding)
      .set(updateData)
      .where(eq(merchantBranding.merchantId, session.user.merchantId))
      .returning();

    if (!result || result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Branding record not found' },
        { status: 404 }
      );
    }

    const branding = result[0];

    // 6. Return success response
    return NextResponse.json<ApiResponse<BrandingResponse>>(
      {
        success: true,
        branding: {
          siteName: branding.siteName || undefined,
          avatarUrl: branding.avatarUrl || undefined,
          updatedAt: branding.updatedAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error resetting branding:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset branding' },
      { status: 500 }
    );
  }
}
