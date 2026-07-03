'use client';

import { SidebarProvider } from '@/lib/sidebar-context';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutClientProps {
  slug: string;
  children: React.ReactNode;
}

/**
 * Client-side wrapper for admin layout that provides sidebar state management
 */
export function AdminLayoutClient({
  slug,
  children,
}: AdminLayoutClientProps): React.JSX.Element {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-slate-50">
        {/* Sidebar navigation */}
        <AdminSidebar slug={slug} />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
