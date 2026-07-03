'use client';

/**
 * Admin Panel sidebar navigation.
 *
 * Client Component because it uses usePathname for active-state highlighting,
 * manages profile dropdown and theme toggle, and handles logout.
 */
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserProfile } from '@/components/layout/user-profile';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  CalendarDays,
  Users,
  Scissors,
  UserCircle,
  Palette,
  Image,
  Settings,
  ExternalLink,
  Tag,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: CalendarDays },
  { label: 'Staff', href: '/admin/staff', icon: Scissors },
  { label: 'Services', href: '/admin/services', icon: Users },
  { label: 'Customers', href: '/admin/customers', icon: UserCircle },
  { label: 'Discounts', href: '/admin/discounts', icon: Tag },
  { label: 'Design', href: '/admin/design', icon: Palette },
  { label: 'Branding', href: '/admin/branding', icon: Image },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

interface AdminSidebarProps {
  slug: string;
  customSiteName?: string | null;
  customAvatarUrl?: string | null;
}

// Constants for defaults
const DEFAULT_SITE_NAME = 'SimplyBook';
const DEFAULT_LOGO_URL = '/logo.svg';

export default function AdminSidebar({
  slug,
  customSiteName,
  customAvatarUrl,
}: AdminSidebarProps): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async (): Promise<void> => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const isActive = (href: string): boolean => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  // Display values with fallbacks
  const displaySiteName = customSiteName || DEFAULT_SITE_NAME;
  const displayAvatarUrl = customAvatarUrl || DEFAULT_LOGO_URL;

  return (
    <aside className="w-60 flex flex-col bg-white border-r border-slate-200 h-full">
      {/* Brand with custom branding */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <img
          src={displayAvatarUrl}
          alt={displaySiteName}
          className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{displaySiteName}</p>
          <p className="text-xs text-slate-500 truncate font-mono">{slug}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <a
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive(href)
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </a>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-slate-100 px-3 py-3 space-y-0.5">
        <a
          href={`https://${slug}.platform.com`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <ExternalLink className="h-4 w-4 flex-shrink-0" />
          Booking page
        </a>
      </div>

      {/* Avatar + Theme Toggle */}
      <div className="flex items-center gap-3 px-5 py-3 border-t border-slate-100">
        <UserProfile
          user={
            user
              ? {
                  name: user.name || user.slug,
                  email: user.email,
                  avatar: user.avatarUrl ?? undefined,
                }
              : undefined
          }
          onLogout={() => {
            void handleLogout();
          }}
        />
        <ThemeToggle />
      </div>
    </aside>
  );
}
