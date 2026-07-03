'use client';

import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { UserProfile } from '@/components/layout/user-profile';
import { useAuth } from '@/lib/auth-context';

export function Header(): React.ReactElement {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async (): Promise<void> => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <h1 className="text-lg font-bold text-foreground">Booking</h1>
        <div className="flex items-center gap-4">
          <ThemeToggle />
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
        </div>
      </div>
    </header>
  );
}
