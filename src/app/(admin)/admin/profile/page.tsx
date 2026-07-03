'use client';

/**
 * Admin profile page — /admin/profile (PROJ-42).
 *
 * Displays the signed-in admin's profile and lets them upload a new avatar.
 * On success the navbar avatar is refreshed via the auth context.
 */
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth-context';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { AvatarUpload } from '@/components/profile/AvatarUpload';

export default function ProfilePage(): React.JSX.Element {
  const { profile, loading, error, refetch, uploadAvatar } = useProfile();
  const { user, refresh } = useAuth();

  const name = profile?.name ?? user?.name ?? '';
  const email = profile?.email ?? user?.email ?? '';
  const role = user?.role ?? 'admin';

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Profile</h1>

      <ProfileCard
        name={name}
        email={email}
        role={role}
        avatarUrl={profile?.avatarUrl ?? null}
        loading={loading}
        error={error}
        onRetry={() => void refetch()}
        avatarSlot={
          <AvatarUpload
            src={profile?.avatarUrl ?? null}
            name={name || 'User'}
            uploadAvatar={uploadAvatar}
            onUploadSuccess={() => void refresh()}
          />
        }
      />
    </div>
  );
}
