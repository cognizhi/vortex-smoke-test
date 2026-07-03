'use client';

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { LogOut, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Minimum space required below dropdown to expand downward (pixels)
const MIN_SPACE_BELOW = 300;

interface UserProfileProps {
  user?: {
    name?: string | null;
    email?: string;
    avatar?: string | null;
  };
  onLogout?: () => void;
}

interface AvatarProps extends VariantProps<typeof avatarVariants> {
  name?: string | null;
  src?: string | null;
  className?: string;
}

/**
 * Avatar variants using CVA
 */
const avatarVariants = cva(
  'inline-flex items-center justify-center font-semibold text-sm flex-shrink-0',
  {
    variants: {
      size: {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
      },
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

/**
 * Avatar Component - displays user picture or first letter fallback
 */
function Avatar({ name, src, size, variant, className }: AvatarProps): ReactElement {
  const getInitials = (fullName?: string | null): string => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 0 ? parts[0].charAt(0).toUpperCase() : 'U';
  };

  const initials = getInitials(name);

  if (src) {
    return (
      <div
        className={cn(avatarVariants({ size, variant }), 'overflow-hidden rounded-full', className)}
      >
        <img
          src={src}
          alt={name || 'User avatar'}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(avatarVariants({ size, variant }), 'rounded-full', className)}
      title={name || 'User'}
    >
      {initials}
    </div>
  );
}

/**
 * UserProfileDropdown Component - dropdown menu with username, email, and logout
 */
interface UserProfileDropdownProps extends UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

function UserProfileDropdown({
  user,
  onLogout,
  isOpen,
  onClose,
  dropdownRef,
  buttonRef,
}: UserProfileDropdownProps): ReactElement | null {
  const [expandUpward, setExpandUpward] = useState(false);

  // Calculate dropdown position (up or down) based on available space
  useEffect(() => {
    if (!isOpen || !buttonRef.current || !dropdownRef.current) return;

    // Use requestAnimationFrame to ensure DOM is updated before measuring
    const timerId = requestAnimationFrame(() => {
      const buttonRect = buttonRef.current?.getBoundingClientRect();
      const dropdownRect = dropdownRef.current?.getBoundingClientRect();

      if (!buttonRect || !dropdownRect) return;

      // Calculate space below button
      const spaceBelow = window.innerHeight - buttonRect.bottom;

      // If not enough space below, expand upward
      setExpandUpward(spaceBelow < MIN_SPACE_BELOW);
    });

    return () => cancelAnimationFrame(timerId);
  }, [isOpen, buttonRef, dropdownRef]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        onClose();
        buttonRef.current?.focus();
        break;
      case 'Tab':
        onClose();
        break;
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return (): void => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, dropdownRef, buttonRef, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      role="menu"
      onKeyDown={handleKeyDown}
      className={cn(
        'absolute left-full -ml-2 z-50 min-w-[240px] rounded-lg border border-border bg-background shadow-lg',
        expandUpward ? 'bottom-full mb-2' : 'top-full mt-2'
      )}
    >
      {/* User Info Section */}
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">{user?.name || 'User'}</p>
        <p className="text-xs text-gray-500">{user?.email || 'No email'}</p>
      </div>

      {/* Edit Profile Link */}
      <a
        href="/admin/profile"
        role="menuitem"
        onClick={onClose}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
      >
        <UserCircle className="h-4 w-4" />
        <span>Edit profile</span>
      </a>

      {/* Logout Button */}
      <button
        role="menuitem"
        onClick={onLogout}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
      >
        <LogOut className="h-4 w-4" />
        <span>Log out</span>
      </button>
    </div>
  );
}

/**
 * UserProfile Component - main component combining avatar and dropdown
 */
export function UserProfile({ user, onLogout }: UserProfileProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggleMenu = (): void => {
    setIsOpen(!isOpen);
  };

  const handleClose = (): void => {
    setIsOpen(false);
  };

  const handleButtonKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (isOpen && event.key === 'Escape') {
      event.preventDefault();
      handleClose();
    }
  };

  return (
    <div className="relative inline-block">
      {/* Avatar Button */}
      <button
        ref={buttonRef}
        onClick={handleToggleMenu}
        onKeyDown={handleButtonKeyDown}
        aria-label={`${user?.name || 'User'} profile menu`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-2 rounded-full transition-all hover:ring-2 hover:ring-primary hover:ring-offset-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <Avatar
          name={user?.name}
          src={user?.avatar}
          size="md"
          variant="default"
        />
      </button>

      {/* Dropdown Menu */}
      <UserProfileDropdown
        user={user}
        onLogout={onLogout}
        isOpen={isOpen}
        onClose={handleClose}
        dropdownRef={dropdownRef}
        buttonRef={buttonRef}
      />
    </div>
  );
}

// Export Avatar for potential reuse
export { Avatar };
