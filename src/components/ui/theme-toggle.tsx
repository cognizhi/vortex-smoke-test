'use client';

import { useEffect, useRef, useState, type ReactElement, type ComponentType } from 'react';
import { Sun, Moon, Zap } from 'lucide-react';
import { useTheme, type ThemeMode } from '@/lib/theme-context';

interface ThemeOption {
  mode: ThemeMode;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}

const THEME_OPTIONS: ThemeOption[] = [
  { mode: 'light', label: 'Light', Icon: Sun },
  { mode: 'dark', label: 'Dark', Icon: Moon },
  { mode: 'system', label: 'System', Icon: Zap },
];

export function ThemeToggle(): ReactElement {
  const { mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentOption = THEME_OPTIONS.find((opt) => opt.mode === mode) || THEME_OPTIONS[2];

  // Handle menu visibility
  const handleToggleMenu = (): void => {
    setOpen(!open);
    if (!open) {
      setFocusedIndex(0);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return (): void => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [open]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!open) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % THEME_OPTIONS.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + THEME_OPTIONS.length) % THEME_OPTIONS.length);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleSelectOption(THEME_OPTIONS[focusedIndex].mode);
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  // Handle option selection
  const handleSelectOption = (newMode: ThemeMode): void => {
    setMode(newMode);
    setOpen(false);
  };

  // Keep focus on focused menu item for keyboard navigation
  useEffect(() => {
    if (open && menuRef.current) {
      const items = menuRef.current.querySelectorAll('[role="menuitem"]');
      (items[focusedIndex] as HTMLElement | undefined)?.focus();
    }
  }, [focusedIndex, open]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={handleToggleMenu}
        aria-label="Theme options"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-0"
      >
        <currentOption.Icon className="h-4 w-4" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          onKeyDown={handleKeyDown}
          className="absolute left-full -ml-2 bottom-full z-50 mb-2 min-w-[120px] rounded-lg border border-border bg-secondary py-2 shadow-lg"
        >
          {THEME_OPTIONS.map((option, index) => {
            const isActive = mode === option.mode;
            const isFocused = focusedIndex === index;

            return (
              <button
                key={option.mode}
                role="menuitem"
                onClick={(): void => handleSelectOption(option.mode)}
                aria-checked={isActive}
                tabIndex={isFocused ? 0 : -1}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset ${
                  isActive
                    ? 'bg-secondary/60 text-secondary-foreground'
                    : 'text-secondary-foreground hover:bg-secondary/40'
                }`}
              >
                <option.Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{option.label}</span>
                {isActive && (
                  <span aria-hidden="true" className="ml-auto text-accent">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
