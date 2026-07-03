/**
 * Admin panel layout — wraps all /admin/* pages.
 *
 * This is a **Server Component** that validates the session server-side.
 * Unauthenticated requests are redirected to /login before any admin content
 * is rendered.
 */
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { verifySessionToken } from '@/lib/auth/session';
import { env } from '@/lib/env';
import { merchantBranding } from '@/lib/db/schema';
import * as schema from '@/lib/db/schema';
import AdminSidebar from '@/components/admin/AdminSidebar';

// Constants for defaults
const DEFAULT_SITE_NAME = 'SimplyBook';

// Get database pool
let _pool: Pool | null = null;
function getPool(): Pool {
  if (!_pool) _pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });
  return _pool;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Generate metadata for admin layout
 * Sets browser tab title with custom site name
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (!token) {
      return { title: `${DEFAULT_SITE_NAME} Admin` };
    }

    const authSecret = env.AUTH_SECRET;
    if (!authSecret) {
      return { title: `${DEFAULT_SITE_NAME} Admin` };
    }

    const session = await verifySessionToken(token, authSecret);
    if (!session) {
      return { title: `${DEFAULT_SITE_NAME} Admin` };
    }

    // Fetch merchant branding
    const publicDb = drizzle(getPool(), { schema });
    const branding = await publicDb.query.merchantBranding.findFirst({
      where: eq(merchantBranding.merchantId, session.merchantId),
    });

    const siteName = branding?.siteName || DEFAULT_SITE_NAME;

    return {
      title: `${siteName} Admin`,
      openGraph: {
        title: `${siteName} Admin`,
      },
    };
  } catch (error) {
    console.error('Error generating admin metadata:', error);
    return { title: `${DEFAULT_SITE_NAME} Admin` };
  }
}

export default async function AdminLayout({
  children,
}: AdminLayoutProps): Promise<React.JSX.Element> {
  // Read the session cookie server-side
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;

  const authSecret = env.AUTH_SECRET;

  if (!token || !authSecret) {
    redirect('/login');
  }

  const session = await verifySessionToken(token, authSecret);

  if (!session) {
    redirect('/login');
  }

  // Fetch merchant branding
  const publicDb = drizzle(getPool(), { schema });
  const branding = await publicDb.query.merchantBranding.findFirst({
    where: eq(merchantBranding.merchantId, session.merchantId),
  });

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar navigation with custom branding */}
      <AdminSidebar
        slug={session.slug}
        customSiteName={branding?.siteName ?? null}
        customAvatarUrl={branding?.avatarUrl ?? null}
      />

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
