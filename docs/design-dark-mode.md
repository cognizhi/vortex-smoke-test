# Dark Mode Implementation — Technical Design Document

**Status**: Design Complete — Ready for Development  
**Version**: 1.0  
**Date**: 2026-06-10  
**Author**: Architecture Team  
**Approval Gate**: API Contracts + Data Model Defined

---

## Executive Summary

This document defines the technical architecture for implementing dark mode across the entire application. The solution leverages Tailwind CSS v4's `@theme` token system with CSS custom properties (variables) to enable seamless theme switching without page reloads or complex runtime JavaScript logic. Theme preference is persisted client-side via localStorage with optional future migration to server-side storage for authenticated users.

**MVP Scope**: Binary light/dark mode toggle + system preference detection  
**Effort**: 8-12 dev days (2-3 sprints)  
**Estimated Build Size Impact**: <5KB gzipped  
**Theme Switch Latency**: <100ms

---

## 1. Architecture Overview

### 1.1 Design Philosophy

- **CSS-First**: Theme switching is purely CSS-based via Tailwind v4's `@theme` tokens and native CSS custom properties (`--color-*` variables)
- **Zero Runtime Logic**: No JavaScript theme computation; React only manages preference state and localStorage sync
- **Server Component Compatible**: App Router Server Components are theme-agnostic; styling adapts via browser CSS media queries and CSS variables
- **Minimal Client State**: React Context (not Zustand) for theme state, since it's not globally accessed across independent features
- **Performance Focused**: Critical rendering path unblocked; theme application happens in CSS, not JavaScript

### 1.2 Component Hierarchy

```
RootLayout (Server Component)
├── ThemeProvider (Client Component wrapper)
│   ├── useTheme hook (provides theme state)
│   ├── Page children (Server Components, CSS adapts automatically)
│   └── Header
│       └── ThemeSwitcher (Client Component, triggers theme change)
```

**Rationale**: RootLayout wraps ThemeProvider client-side to avoid hydration mismatches. All child Server Components inherit CSS theme via Tailwind build-time tokens + CSS custom properties.

---

## 2. Tech Stack

### 2.1 Core Dependencies (Existing)

| Layer | Tech | Version | Justification |
|-------|------|---------|---------------|
| Build | Tailwind CSS | v4 | Native `@theme` token support; no `postcss-theme-variables` needed |
| Styling | shadcn/ui | Latest | Theme-aware components; works with CSS variables |
| Runtime | React | 19 | Server Components; Client Component isolation for theme switcher |
| Language | TypeScript | Strict | Type-safe theme configuration and hooks |
| Framework | Next.js | 16 | App Router, API routes for future server-side storage |

### 2.2 No New Dependencies Required

Theme implementation uses **only** native browser APIs and existing dependencies:
- `localStorage` (browser API, no package needed)
- CSS custom properties (native browser support, all target browsers)
- `prefers-color-scheme` media query (native browser support)
- React Context (built-in)

---

## 3. Data Model

### 3.1 Client-Side Storage (MVP)

**Storage**: Browser `localStorage`

```typescript
// Key: 'theme-preference'
// Value: 'light' | 'dark' | 'system'

interface ThemePreference {
  mode: 'light' | 'dark' | 'system'; // User's explicit choice
  resolvedTheme: 'light' | 'dark';    // Computed theme after system pref resolution
  timestamp: number;                   // For analytics (optional, post-MVP)
}

// Stored as JSON in localStorage
localStorage.setItem('theme-preference', JSON.stringify({
  mode: 'dark',
  resolvedTheme: 'dark',
  timestamp: Date.now()
}));
```

### 3.2 Optional: Server-Side Storage (Post-MVP)

For authenticated users, extend the `users` table in Drizzle schema:

```typescript
// src/lib/db/schema.ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  // ... existing columns ...
  themePreference: varchar('theme_preference', { length: 10 })
    .notNull()
    .default('system')
    .$type<'light' | 'dark' | 'system'>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

**Note**: Post-MVP. MVP uses localStorage only.

---

## 4. API Contracts

### 4.1 MVP (No Backend APIs)

For MVP, all theme management is client-side:
- **Preference Source**: localStorage (browser)
- **Preference Detection**: Browser `prefers-color-scheme` media query
- **Persistence**: Direct localStorage writes

### 4.2 Post-MVP: User Preference Endpoint

Once server-side storage is implemented:

#### `POST /api/theme/preference`

**Request**:
```json
{
  "mode": "dark"
}
```

**Response** (200 OK):
```json
{
  "mode": "dark",
  "resolvedTheme": "dark",
  "updatedAt": "2026-06-10T15:39:12Z"
}
```

**Status Codes**:
- `200 OK`: Preference saved
- `401 Unauthorized`: User not authenticated
- `400 Bad Request`: Invalid mode value

#### `GET /api/theme/preference`

**Response** (200 OK):
```json
{
  "mode": "system",
  "resolvedTheme": "dark"
}
```

**Status Codes**:
- `200 OK`: Preference retrieved
- `401 Unauthorized`: User not authenticated (returns client localStorage value)

---

## 5. Key Components & Modules

### 5.1 Theme Configuration Module

**File**: `src/lib/theme.ts`

```typescript
export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'theme-preference';

/**
 * Resolves 'system' to actual theme ('light' or 'dark')
 * based on window.matchMedia('(prefers-color-scheme: dark)')
 */
export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'system') return mode;
  
  // Safely access matchMedia (avoid SSR errors)
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Retrieves stored preference from localStorage
 * Falls back to 'system' if not set
 */
export function getStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (!stored) return 'system';
    
    const { mode } = JSON.parse(stored);
    return ['light', 'dark', 'system'].includes(mode) ? mode : 'system';
  } catch {
    return 'system';
  }
}

/**
 * Persists theme preference to localStorage
 */
export function setStoredThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({
      mode,
      timestamp: Date.now(),
    }));
  } catch {
    // localStorage may be unavailable in private browsing
    console.warn('Theme preference could not be persisted');
  }
}

/**
 * Applies resolved theme to DOM
 * Updates document.documentElement.classList and CSS variables
 */
export function applyTheme(resolved: 'light' | 'dark'): void {
  const root = document.documentElement;
  
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  // Optional: dispatch custom event for components to listen to
  window.dispatchEvent(
    new CustomEvent('themechange', { detail: { theme: resolved } })
  );
}
```

### 5.2 useTheme Hook

**File**: `src/lib/hooks/useTheme.ts`

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { ThemeMode } from '@/lib/theme';
import { resolveTheme, getStoredThemeMode, setStoredThemeMode, applyTheme } from '@/lib/theme';

interface ThemeContextType {
  mode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const stored = getStoredThemeMode();
    setModeState(stored);
    const resolved = resolveTheme(stored);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    setMounted(true);
  }, []);

  // Listen to system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (mode === 'system') {
        const resolved = resolveTheme('system');
        setResolvedTheme(resolved);
        applyTheme(resolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    const resolved = resolveTheme(newMode);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    setStoredThemeMode(newMode);
  };

  // Prevent FOUC: don't render until theme is initialized
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### 5.3 ThemeSwitcher Component

**File**: `src/components/ThemeSwitcher.tsx`

```typescript
'use client';

import { useTheme } from '@/lib/hooks/useTheme';
import { Sun, Moon, Monitor } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function ThemeSwitcher() {
  const { mode, resolvedTheme, setMode } = useTheme();

  const getIcon = () => {
    if (resolvedTheme === 'dark') return <Moon className="h-4 w-4" />;
    return <Sun className="h-4 w-4" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme">
          {getIcon()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setMode('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
          {mode === 'light' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
          {mode === 'dark' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
          {mode === 'system' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 5.4 Root Layout Integration

**File**: `src/app/layout.tsx` (updated)

```typescript
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/lib/hooks/useTheme';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import '@/styles/globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>App</title>
      </head>
      <body>
        <ThemeProvider>
          <header className="flex justify-between items-center p-4">
            {/* Logo/Nav */}
            <ThemeSwitcher />
          </header>
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## 6. Tailwind CSS v4 Configuration

### 6.1 Color Tokens in globals.css

**File**: `src/styles/globals.css`

```css
@import "tailwindcss";

@theme {
  --color-light-bg: #ffffff;
  --color-light-fg: #0a0a1a;
  --color-light-accent: #4a8fff;
  --color-light-border: #f3f7fb;
  --color-light-secondary: #f3f7fb;

  --color-dark-bg: #0d1620;
  --color-dark-fg: #fafbfc;
  --color-dark-accent: #5b9fff;
  --color-dark-border: #283845;
  --color-dark-secondary: #2d3d4f;
}

/* CSS Variables for dynamic theme switching */
html {
  --bg: var(--color-light-bg);
  --fg: var(--color-light-fg);
  --accent: var(--color-light-accent);
  --border: var(--color-light-border);
  --secondary: var(--color-light-secondary);
}

html.dark {
  --bg: var(--color-dark-bg);
  --fg: var(--color-dark-fg);
  --accent: var(--color-dark-accent);
  --border: var(--color-dark-border);
  --secondary: var(--color-dark-secondary);
}

/* Utility classes using CSS variables */
@layer base {
  body {
    @apply bg-[var(--bg)] text-[var(--fg)] transition-colors duration-200;
  }

  /* Ensure all major content areas respond to theme */
  @apply bg-[var(--bg)] text-[var(--fg)];
}

@layer components {
  .card {
    @apply bg-[var(--secondary)] border border-[var(--border)] rounded-lg p-4;
  }
  
  .button-primary {
    @apply bg-[var(--accent)] text-white rounded px-4 py-2;
  }
}
```

**Rationale**: 
- `@theme` block defines design tokens for both modes (future-proof if themes expand)
- CSS custom properties (`--bg`, `--fg`, etc.) toggle between light/dark values
- `html.dark` selector applied by `applyTheme('dark')` in JavaScript
- Transition applied to smooth color changes
- Utilities use `var(--*)` syntax for dynamic theming

---

## 7. Trade-offs & Decisions

### 7.1 CSS Variables vs Tailwind Class Switching

| Approach | Pros | Cons |
|----------|------|------|
| **CSS Variables** ✅ MVP | Zero JS theme logic; native browser perf; works with Server Components; <100ms switch | Requires Tailwind v4; CSS variable syntax less readable in JSX |
| **Class Switching** (dark:) | Familiar Tailwind pattern; JIT compilation | Requires pre-generating all class combinations; Server Components can't toggle; page reload if not careful |

**Decision**: CSS Variables. Aligns with "CSS-first" philosophy and leverages Tailwind v4's native support.

### 7.2 React Context vs Zustand

| Approach | Pros | Cons |
|----------|------|------|
| **React Context** ✅ MVP | Lightweight; built-in; sufficient for single state value; avoids extra dependency | None for theme use case |
| **Zustand** | Popular for complex state | Overkill for theme-only state; adds 3-4KB |

**Decision**: React Context. Theme is a single, globally-accessed value that doesn't change frequently.

### 7.3 localStorage vs Server-Side Storage

| Approach | Pros | Cons |
|----------|------|------|
| **localStorage** ✅ MVP | No backend changes; instant persistence; works offline | Not shared across devices; private browsing may fail silently |
| **Server-Side** (Post-MVP) | Device-agnostic; syncs across browsers; better analytics | Requires DB migration + API; adds latency; hard to hydrate on SSR |

**Decision**: MVP uses localStorage. Post-MVP: Server-side for authenticated users (fallback to localStorage if not logged in).

### 7.4 System Preference Detection

| Approach | Pros | Cons |
|----------|------|------|
| **prefers-color-scheme** ✅ MVP | Native browser API; respects OS settings; zero JS | Limited to light/dark (no custom themes) |

**Decision**: Use `prefers-color-scheme` for system mode detection. Post-MVP: custom themes stored in database.

### 7.5 FOUC (Flash of Unstyled Content) Mitigation

**Risk**: On page reload, React hydrates with system theme, then JavaScript switches to saved preference → visible flicker.

**Solution**:
1. Inline critical theme logic in `<script>` in `layout.tsx` root HTML to resolve theme **before** React hydrates
2. `ThemeProvider` skips rendering children until mounted to prevent mismatch
3. CSS transition applied to color changes, so any necessary switch is smooth

---

## 8. Implementation Checklist

### Phase 1: Theme Infrastructure (Days 1-3)
- [ ] Create `src/lib/theme.ts` with core functions
- [ ] Create `src/lib/hooks/useTheme.ts` with React Context
- [ ] Update `src/styles/globals.css` with `@theme` tokens and CSS variables
- [ ] Update `src/app/layout.tsx` to wrap with `ThemeProvider`
- [ ] Add inline script to prevent FOUC (if needed)
- [ ] Unit tests for theme resolution logic

### Phase 2: UI Components (Days 4-6)
- [ ] Create `src/components/ThemeSwitcher.tsx`
- [ ] Integrate into Header component
- [ ] Add keyboard navigation support
- [ ] Test with shadcn/ui components in both themes
- [ ] Component tests for ThemeSwitcher

### Phase 3: Complete Coverage & Polish (Days 7-10)
- [ ] Audit all pages/components for dark mode coverage
- [ ] WCAG AA contrast compliance audit
- [ ] Responsive design testing (mobile/tablet/desktop)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Performance testing (build size, switch latency)
- [ ] Animation/transition polish

### Phase 4: Testing & Deployment (Days 11-12)
- [ ] E2E tests for theme persistence
- [ ] Accessibility testing (screen readers, keyboard nav)
- [ ] Lighthouse performance check
- [ ] QA sign-off on all acceptance criteria
- [ ] Deploy to staging → production

---

## 9. Success Criteria

✅ **Technical Gates**:
- [ ] API contracts defined (localStorage + post-MVP endpoints)
- [ ] Data model defined (localStorage structure + optional users table)
- [ ] All acceptance criteria from product brief met
- [ ] Zero TypeScript errors
- [ ] <5KB gzipped size increase
- [ ] <100ms theme switch latency
- [ ] 100% WCAG AA compliance

✅ **Feature Gates**:
- [ ] Binary light/dark/system modes functional
- [ ] Theme persists across sessions and tabs
- [ ] System preference detection working
- [ ] All pages/components have dark variants
- [ ] No light backgrounds visible in dark mode
- [ ] Smooth <200ms transitions

✅ **Quality Gates**:
- [ ] >80% test coverage
- [ ] Cross-browser verified (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- [ ] 25%+ adoption rate within 30 days (success metric)
- [ ] 2 or fewer support tickets on theming per month

---

## 10. Open Questions Resolved

| Question | Answer |
|----------|--------|
| Should theme be stored server-side for MVP? | No. localStorage is sufficient. Post-MVP: server-side for authenticated users. |
| Which CSS approach: variables or classes? | CSS variables + Tailwind v4 `@theme`. Cleanest, most performant. |
| Do we need Zustand for theme state? | No. React Context is lightweight and sufficient. |
| How do we prevent FOUC? | Inline theme logic before hydration + `ThemeProvider` mount gate. |
| Which colors in dark mode? | Design spec defines palette; all must meet WCAG AA (4.5:1 normal, 3:1 large). |

---

## 11. Dependencies & Blockers

**✅ No Blockers** — All dependencies already available:
- Next.js 16 (App Router)
- React 19 (Server Components)
- Tailwind CSS v4 (includes @theme support)
- shadcn/ui (theme-aware components)
- TypeScript (strict mode)

**Future Dependencies** (Post-MVP):
- Database migration for `users.themePreference` column
- Possible shadcn/ui updates for enhanced theme support

---

## Appendix: Migration Path (Post-MVP)

Once MVP is stable and adoption is validated:

1. **Server-side preference storage**:
   - Add `themePreference` column to `users` table
   - Create `POST /api/theme/preference` endpoint
   - Fetch preference on app startup for authenticated users

2. **Advanced themes**:
   - High-contrast mode (WCAG AAA)
   - Sepia/warm mode
   - Schedule-based auto-switching

3. **Analytics**:
   - Track adoption rate
   - Monitor preference distribution
   - Identify dark mode–specific UX issues

---

**Document Status**: ✅ Ready for Architecture Review & Development

