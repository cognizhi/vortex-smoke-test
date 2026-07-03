# Design Specification: Keyboard Shortcut for Theme Toggle
**Task**: W-0004 — Add keyboard shortcut to toggle theme with toast notification  
**Version**: 1.0  
**Date**: June 10, 2026

---

## Executive Summary

This design spec defines the UX and interaction model for a keyboard shortcut (Cmd/Ctrl+J) that toggles the application theme between light and dark modes with a transient toast notification confirming the change. The feature leverages existing theme infrastructure (W-0002) and adds keyboard-driven theme control for power users and accessibility.

**Key Design Principle**: Keyboard shortcuts should be **non-blocking**, **learnable** (discoverable via help), and **reversible** (immediate visual feedback without modals).

---

## Design Goals

1. **Efficiency**: Power users can toggle theme without touching the mouse
2. **Discoverability**: Shortcut is easy to learn (via help menu, status indicator, or onboarding)
3. **Feedback**: Toast notification confirms successful toggle (no ambiguity)
4. **Accessibility**: Keyboard-first interaction complies with WCAG 2.1 AA
5. **Non-Disruptive**: Toast doesn't interrupt workflow; auto-dismisses after brief duration
6. **Cross-Platform**: Works on Mac (Cmd+J) and Windows/Linux (Ctrl+J) seamlessly

---

## User Flows

### Flow 1: First-Time Keyboard Shortcut Discovery
```
User is browsing the application
    ↓
User notices keyboard shortcut help text (? or help menu)
    ↓
User learns: "Cmd/Ctrl+J toggles theme"
    ↓
User presses Cmd+J (or Ctrl+J on Windows/Linux)
    ↓
Theme toggles to opposite mode (light ↔ dark)
    ↓
Toast appears in bottom-right corner:
    "Theme changed to Dark" or "Theme changed to Light"
    ↓
Toast auto-dismisses after 3 seconds
    ↓
User continues browsing in new theme
```

### Flow 2: Rapid Theme Toggling
```
User in Light mode presses Cmd+J
    ↓
Toast: "Theme changed to Dark" (dismisses in 3s)
    ↓
User immediately presses Cmd+J again
    ↓
If previous toast still visible: dismiss it, show new toast
    (OR: stack multiple toasts, max 3)
    ↓
Theme toggles back to Light
    ↓
Toast: "Theme changed to Light" (replaces or stacks)
```

### Flow 3: System Mode Interaction
```
User in System mode (follows OS preference)
    ↓
User presses Cmd+J
    ↓
System toggles to explicit light/dark mode (respects current effective mode)
    ↓
If OS shows dark → toggle to light (explicitly)
    ↓
If OS shows light → toggle to dark (explicitly)
    ↓
Toast: "Theme changed to Light" or "Theme changed to Dark"
    ↓
Preference persisted to localStorage (system mode disabled)
```

### Flow 4: Mobile / Touch Device (No Native Keyboard)
```
User on mobile device (no native keyboard)
    ↓
Shortcut not available (gracefully ignored)
    ↓
User uses header theme toggle button (existing UI)
    ↓
No error or console warning
```

---

## Keyboard Shortcut Specification

### Shortcut Binding
| OS | Binding | Behavior |
|----|---------|----------|
| macOS | **Cmd + J** | Toggle theme immediately; show toast |
| Windows | **Ctrl + J** | Toggle theme immediately; show toast |
| Linux | **Ctrl + J** | Toggle theme immediately; show toast |

### Implementation Details

**Event Listener Target**: `document` or `window` (global hotkey, works anywhere on page)

**Conflict Resolution**:
- If Cmd/Ctrl+J conflicts with browser/app shortcuts, document it in release notes
- Recommend users rebind if conflict exists (via browser extension or app settings)
- Do NOT suppress default browser behavior unless intentional

**Key Codes (JavaScript)**:
```
Event.ctrlKey (Windows/Linux)
Event.metaKey (macOS)
Event.key === 'j' or Event.key === 'J' (case-insensitive)
```

---

## Toast Notification Specification

### Toast Component Design

**Position**: Bottom-right corner of viewport (standard placement, non-intrusive)

**Dimensions**:
- Width: 300–320px (responsive, max 90vw on mobile)
- Height: Auto (48–64px depending on content)
- Padding: 16px (top/bottom/left/right)
- Margin from viewport edge: 16px (top/bottom/left/right)

**Visual States**:

#### Light Mode
```
┌────────────────────────────┐
│ ✓ Theme changed to Dark    │
└────────────────────────────┘
Background: hsl(217 91% 60%) [accent color]
Text: hsl(210 40% 98%) [accent-foreground]
Icon: Check mark (✓) or theme icon (🌙)
Border-radius: 8px
Box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15)
```

#### Dark Mode
```
┌────────────────────────────┐
│ ✓ Theme changed to Light   │
└────────────────────────────┘
Background: hsl(217 91% 60%) [accent color]
Text: hsl(210 40% 98%) [accent-foreground]
Icon: Check mark (✓) or theme icon (☀️)
Border-radius: 8px
Box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3)
```

### Toast Content

**Format**:
```
[Icon] Theme changed to [Light|Dark]
```

**Icon Options** (choose one):
1. **Check mark**: ✓ (universal success indicator)
2. **Theme icon**: ☀️ (light) or 🌙 (dark) to show new theme visually
3. **Both**: Icon + theme emoji for clarity

**Recommended**: Check mark + theme emoji combo
```
✓ 🌙 Theme changed to Dark
✓ ☀️ Theme changed to Light
```

**Font Styling**:
- Font-size: 14px (body text, readable at distance)
- Font-weight: 500 (medium, slightly emphasized)
- Line-height: 1.5 (loose, readable)
- Font-family: System font (matches app typography)

### Toast Lifecycle

**Timing**:
- **Appearance**: Instant (no delay, immediate feedback)
- **Duration**: 3 seconds (standard, long enough to read, short enough to not clutter)
- **Dismissal**: Auto-fade-out over 300ms (smooth exit)

**Animation**:
- **Entry**: Slide in from bottom-right (150ms, ease-out)
- **Idle**: Static display (2.7 seconds)
- **Exit**: Fade out (300ms, ease-in)

**Accessibility**:
- Respects `prefers-reduced-motion`: animations disabled, instant show/hide
- `role="status"` or `role="alert"` for screen reader announcement
- Announcement: "Theme changed to Dark" or "Theme changed to Light"

### Toast Stacking (Optional)

**Single Toast (Recommended)**:
- Only one toast visible at a time
- New toast replaces previous toast (if still showing)
- Prevents clutter; clean UX

**Stacked Toasts (Alternative)**:
- Multiple toasts stack vertically (max 3)
- Each toast has own close button (×)
- Useful for rapid-fire keyboard shortcuts
- More complex, use only if rapid toggling is common

**Recommended Approach**: Single toast with replacement (simpler, cleaner)

---

## Interaction Patterns

### Keyboard Interaction Pattern

```
┌─────────────────────────────┐
│ User presses Cmd/Ctrl+J     │
└──────────┬──────────────────┘
           ↓
    ┌──────────────────┐
    │ Event listener   │
    │ captures keydown │
    └────────┬─────────┘
             ↓
    ┌───────────────────────┐
    │ Check: ctrlKey/metaKey│
    │ Check: key === 'j'    │
    └────────┬──────────────┘
             ↓
    ┌───────────────────────┐
    │ Call toggleTheme()    │
    │ (from useTheme hook)  │
    └────────┬──────────────┘
             ↓
    ┌──────────────────────────┐
    │ Theme updates immediately│
    │ (light ↔ dark)           │
    └────────┬─────────────────┘
             ↓
    ┌──────────────────────────┐
    │ Show toast notification  │
    │ "Theme changed to [X]"   │
    └────────┬─────────────────┘
             ↓
    ┌──────────────────────────┐
    │ Auto-dismiss after 3s    │
    └──────────────────────────┘
```

### Special Cases

#### Case 1: System Mode to Explicit Mode
**Current state**: System mode (follows OS preference, currently showing dark)  
**User action**: Presses Cmd+J

**Expected behavior**:
```
System (dark) → Explicit Light mode
    ↓
Toast: "Theme changed to Light"
    ↓
localStorage now stores "light" (system mode disabled)
```

#### Case 2: Rapid Toggle (Cmd+J pressed twice quickly)
**First press**: Light → Dark (toast appears)  
**Second press** (before toast dismisses): Dark → Light (first toast replaced, new toast appears)

**Implementation**:
- Cancel pending toast dismissal
- Show new toast immediately
- Restart 3-second timer for new toast

#### Case 3: Keyboard Shortcut While Modal/Dialog Open
**Current state**: Modal dialog open (e.g., settings, form submission)  
**User presses**: Cmd+J

**Expected behavior** (two options):

*Option A* (Recommended): **Allow global shortcut**
```
Toast appears and overlays modal
Theme changes in background
User can dismiss modal and see theme change
Less intrusive to workflow
```

*Option B*: **Disable during modal**
```
Check: document.activeElement === modal
If true: ignore Cmd+J, don't toggle
Better focus management, no surprise changes
```

**Recommendation**: Option A (global shortcut always works) — consistent with power-user expectations

---

## Wireframes & Visual States

### Toast Notification Position

```
Desktop Layout (top-right corner preferred alternative):
┌──────────────────────────────────┐
│ App content...                   │
│                                  │
│                                  │
│              ┌──────────────────┐│
│              │ ✓ Theme changed  ││
│              │   to Dark        ││
│              └──────────────────┘│
└──────────────────────────────────┘

Desktop Layout (bottom-right, RECOMMENDED):
┌──────────────────────────────────┐
│ App content...                   │
│                                  │
│              ┌──────────────────┐│
│              │ ✓ Theme changed  ││
│              │   to Dark        ││
│              └──────────────────┘│
└──────────────────────────────────┘

Mobile Layout (full width, bottom):
┌──────────────────┐
│ App content...   │
│                  │
│ ┌────────────────┤
│ │ ✓ Theme changed│
│ │   to Dark      │
│ └────────────────┤
└──────────────────┘
```

### Toast States Over Time

**State 1: Entering (0–150ms)**
```
┌──────────────────────────┐
│ ✓ Theme changed to Dark  │ ← Slides in from bottom-right
└──────────────────────────┘
  Opacity: 0% → 100%
  Transform: translateX(+24px), translateY(+24px) → (0, 0)
```

**State 2: Idle (150ms–2850ms)**
```
┌──────────────────────────┐
│ ✓ Theme changed to Dark  │ ← Static display
└──────────────────────────┘
  Opacity: 100%
  Transform: (0, 0)
```

**State 3: Exiting (2850–3150ms)**
```
┌──────────────────────────┐
│ ✓ Theme changed to Dark  │ ← Fades out
└──────────────────────────┘
  Opacity: 100% → 0%
  Transform: (0, 0) [no slide, just fade]
```

### Responsive Behavior

**Desktop (≥768px)**:
- Toast: 300px wide
- Position: Bottom-right, 16px from edges
- Font: 14px (normal readability)

**Tablet (480px–768px)**:
- Toast: 280px wide (90vw max)
- Position: Bottom-right, 12px from edges
- Font: 14px (same)

**Mobile (<480px)**:
- Toast: Full width, 90vw
- Position: Bottom, full-width notification bar
- Font: 14px (may need to stack lines)

---

## Design Tokens & Color Reference

### Toast Colors

**Light Mode**:
- **Background**: `--color-accent` = hsl(217 91% 60%) = #3B82F6
- **Text**: `--color-accent-foreground` = hsl(210 40% 98%) = #F0F4F8
- **Icon**: Inherit text color

**Dark Mode**:
- **Background**: `--color-accent` = hsl(217 91% 60%) = #3B82F6
- **Text**: `--color-accent-foreground` = hsl(210 40% 98%) = #F0F4F8
- **Icon**: Inherit text color

**Note**: Toast uses consistent accent color across both modes (high contrast, good visibility)

### Typography

- **Font-family**: System font stack (inherit from app)
- **Font-size**: 14px (--text-sm or similar)
- **Font-weight**: 500 (medium)
- **Line-height**: 1.5

### Spacing

- **Padding**: 16px (all sides)
- **Margin from viewport**: 16px
- **Icon margin**: 8px right of icon
- **Border-radius**: 8px (matches component library)

---

## Accessibility Requirements

### Keyboard Accessibility

✓ **Shortcut discoverability**:
- Document shortcut in help menu
- Display shortcut in footer ("Cmd+J to toggle theme")
- Show shortcut in tooltip on hover of theme toggle button

✓ **No keyboard conflicts**:
- Verify Cmd/Ctrl+J doesn't conflict with browser (Edge, Chrome, Firefox, Safari)
- If conflict exists, document and offer rebinding

✓ **Keyboard interaction**:
- Shortcut works globally (anywhere on page, any focus state)
- No tab-key interaction needed (shortcut is global)

### Screen Reader Support

✓ **Toast announcement**:
- Role: `role="status"` or `role="alert"`
- Live region: `aria-live="polite"` (doesn't interrupt ongoing announcements)
- Content: "Theme changed to Dark" (clear, actionable)
- Auto-dismissed toast is still announced before dismissal

**HTML Example**:
```html
<div role="status" aria-live="polite" aria-label="Theme notification">
  ✓ Theme changed to Dark
</div>
```

✓ **Color Independence**:
- Toast uses check mark (✓) icon in addition to color
- Text clearly states "Theme changed to [X]"
- No color-only indication

### Motion & Animation

✓ **Respects prefers-reduced-motion**:
```css
@media (prefers-reduced-motion: reduce) {
  /* Disable toast animations */
  .toast {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

**When reduced motion enabled**:
- Toast appears instantly (no slide/fade animation)
- Toast remains visible for full 3 seconds
- Toast disappears instantly (no fade-out animation)

### Focus Management

✓ **Focus remains with user**:
- Toast does NOT steal focus (no auto-focus)
- User focus remains where it was
- Toast is purely notification (non-interactive)

✓ **If toast includes close button** (optional):
- Close button accessible via Tab
- Announce: "Close theme notification"

---

## Implementation Architecture

### React Hook (useKeyboardShortcut)

**File**: `src/hooks/useKeyboardShortcut.ts`

```typescript
import { useEffect } from 'react';

interface ShortcutOptions {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  callback: () => void;
}

export function useKeyboardShortcut({
  key,
  ctrlKey,
  metaKey,
  callback,
}: ShortcutOptions): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isJ = event.key.toLowerCase() === key.toLowerCase();
      
      // Check platform-specific modifier
      const modifierPressed = isMac ? event.metaKey : event.ctrlKey;
      
      if (isJ && modifierPressed) {
        event.preventDefault(); // Prevent default browser behavior (if needed)
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, callback]);
}
```

### Toast Component (useToast)

**File**: `src/hooks/useToast.ts` (or extend existing toast library)

```typescript
import { useState, useCallback } from 'react';

interface ToastMessage {
  id: string;
  message: string;
  duration: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback((message: string, duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    setToasts((prev) => [{id, message, duration}]);

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  return { toasts, show };
}
```

### Theme Toggle with Keyboard Shortcut

**File**: `src/hooks/useTheme.ts` (extend existing)

```typescript
import { useEffect } from 'react';
import { useTheme } from '@/lib/theme-context';
import { useToast } from '@/hooks/useToast';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

export function useThemeShortcut() {
  const { mode, setMode, effectiveMode } = useTheme();
  const { show: showToast } = useToast();

  const toggleTheme = useCallback(() => {
    // Determine next theme
    let nextMode: 'light' | 'dark';
    
    if (mode === 'system') {
      // If in system mode, toggle the effective theme
      nextMode = effectiveMode === 'light' ? 'dark' : 'light';
    } else {
      // If in explicit mode, toggle between light/dark
      nextMode = mode === 'light' ? 'dark' : 'light';
    }

    // Update theme
    setMode(nextMode);

    // Show toast
    const displayName = nextMode.charAt(0).toUpperCase() + nextMode.slice(1);
    showToast(`✓ Theme changed to ${displayName}`);
  }, [mode, effectiveMode, setMode, showToast]);

  // Register keyboard shortcut
  useKeyboardShortcut({
    key: 'j',
    callback: toggleTheme,
  });

  return { toggleTheme };
}
```

### Toast Component

**File**: `src/components/ui/toast.tsx`

```typescript
interface ToastProps {
  message: string;
  onDismiss: () => void;
  autoClose?: number;
}

export function Toast({ message, onDismiss, autoClose = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, autoClose);
    return () => clearTimeout(timer);
  }, [autoClose, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 bg-accent text-accent-foreground px-4 py-3 rounded-lg shadow-lg animate-slide-in-bottom"
    >
      {message}
    </div>
  );
}
```

### Tailwind CSS Animations

**File**: `tailwind.config.ts` (extend theme)

```typescript
export default {
  theme: {
    extend: {
      animation: {
        'slide-in-bottom': 'slideInBottom 150ms ease-out',
        'fade-out': 'fadeOut 300ms ease-in forwards',
      },
      keyframes: {
        slideInBottom: {
          '0%': { opacity: '0', transform: 'translateY(24px) translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0) translateX(0)' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
    },
  },
};
```

### Root Layout Integration

**File**: `src/app/layout.tsx` (extend existing)

```typescript
import { useThemeShortcut } from '@/hooks/useThemeShortcut';
import { ToastProvider } from '@/providers/toast-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ToastProvider>
            {/* Enable keyboard shortcut */}
            <ThemeShortcutListener />
            <Header />
            <main>{children}</main>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

function ThemeShortcutListener() {
  useThemeShortcut();
  return null; // Invisible component, just registers listener
}
```

---

## Help & Discoverability

### Shortcut Documentation Locations

1. **Help Menu / Help Page**
   ```
   Keyboard Shortcuts
   - Cmd+J (Mac) / Ctrl+J (Windows/Linux): Toggle theme
   ```

2. **Footer Status Bar**
   ```
   Cmd+J to toggle theme | © 2026
   ```

3. **Theme Toggle Button Tooltip**
   ```
   Hover on theme toggle button: "Theme Options (Cmd+J)"
   ```

4. **Onboarding / First-Time User**
   - Optional toast on first visit: "Tip: Press Cmd+J to toggle theme"
   - Shown once, can be dismissed

5. **Release Notes**
   ```
   ### New Features
   - Keyboard shortcut (Cmd/Ctrl+J) to toggle theme with toast feedback
   ```

---

## Testing & QA Checklist

### Functional Testing

- [ ] Cmd+J toggles theme on macOS
- [ ] Ctrl+J toggles theme on Windows/Linux
- [ ] Toast appears immediately after toggle
- [ ] Toast shows correct theme name ("Theme changed to Light/Dark")
- [ ] Toast auto-dismisses after 3 seconds
- [ ] Rapid toggles replace toast (or stack, per implementation)
- [ ] System mode toggles to explicit light/dark (localStorage updated)
- [ ] Returned user's saved preference persists after toggle

### Accessibility Testing

- [ ] Toast announced by screen reader (role="status")
- [ ] No keyboard conflicts with browser shortcuts
- [ ] Shortcut works with any element focused (global)
- [ ] Toast does NOT steal focus
- [ ] `prefers-reduced-motion` disables animations
- [ ] Toast is readable in light AND dark modes (4.5:1 contrast)
- [ ] Check mark icon distinguishable from text

### Visual/UX Testing

- [ ] Toast position correct on desktop (bottom-right)
- [ ] Toast position correct on mobile (full-width bottom)
- [ ] Toast animation smooth (no jank)
- [ ] Toast colors match design tokens
- [ ] Toast text readable (font-size, weight)
- [ ] Toast shadow appropriate for light/dark modes
- [ ] No visual overlap with other UI elements

### Cross-Browser Testing

- [ ] Chrome (Windows/Linux/Mac)
- [ ] Firefox (Windows/Linux/Mac)
- [ ] Safari (macOS/iOS)
- [ ] Edge (Windows)

### Platform Testing

- [ ] Works on desktop (keyboard present)
- [ ] Gracefully ignored on mobile (no keyboard)
- [ ] Works in fullscreen mode
- [ ] Works in PWA mode (if applicable)

### Edge Cases

- [ ] Shortcut pressed while modal open (toggle works or docs state it won't)
- [ ] Shortcut pressed while form submitting
- [ ] Multiple tabs open (toggle affects this tab only)
- [ ] Shortcut pressed during page transition

---

## Design System Consistency

### Reused Design Tokens

**Colors**:
- `--color-accent`: hsl(217 91% 60%) [#3B82F6]
- `--color-accent-foreground`: hsl(210 40% 98%) [#F0F4F8]

**Spacing**:
- Padding: 16px (matches existing component spacing)
- Margin: 16px from viewport edges
- Gap between icon & text: 8px

**Border Radius**:
- 8px (matches button, card, and component library defaults)

**Typography**:
- Font-size: 14px (matches body text secondary size)
- Font-weight: 500 (medium, matches button labels)
- Font-family: System font stack (inherited from app)

**Shadows**:
- Box-shadow: `0 4px 12px rgba(0, 0, 0, 0.15)` [light]
- Box-shadow: `0 4px 12px rgba(0, 0, 0, 0.3)` [dark]
- Matches existing component shadows

**Animation Timing**:
- Entry: 150ms (matches existing UI animations)
- Auto-dismiss: 3000ms (standard toast duration)
- Exit: 300ms (smooth, not abrupt)

### No New Tokens Required

All design tokens are already defined in W-0002 (dark mode spec). This feature reuses:
- Accent color (primary action indicator)
- Accent-foreground (text on accent)
- Border-radius and shadows (existing theme)
- Typography (system font stack)

---

## Edge Cases & Decisions

### Decision 1: System Mode Toggle Behavior

**Question**: When user in "System" mode presses Cmd+J, what should happen?

**Options**:
- A. Toggle to the opposite of current effective theme (dark→light, light→dark)
- B. Toggle to explicit light mode only (stays explicit until user changes)
- C. Show a menu to select explicit mode

**Decision**: **Option A** (Recommended)
- Most intuitive: immediate opposite theme
- Mirrors user expectation from light/dark mode
- Still updates localStorage (system mode disabled)

### Decision 2: Toast Position

**Question**: Bottom-right vs. Top-right vs. Bottom-center?

**Options**:
- A. Bottom-right (standard toast position, non-intrusive)
- B. Top-right (common in enterprise apps)
- C. Bottom-center (full-width mobile, hard to position desktop)

**Decision**: **Bottom-right** (Recommended)
- Standard web convention
- Doesn't overlap header or navigation
- Works on both desktop and mobile (90vw max-width)

### Decision 3: Single vs. Stacked Toasts

**Question**: If user presses Cmd+J twice rapidly, should toasts stack or replace?

**Options**:
- A. Single toast: new toast replaces previous
- B. Stacked toasts: multiple toasts visible (max 3)

**Decision**: **Single toast** (Recommended)
- Cleaner UI, less clutter
- Sufficient for typical usage
- Simpler implementation
- If rapid toggling is discovered to be common, can add stacking later

### Decision 4: Close Button on Toast

**Question**: Should toast include a close button (×)?

**Options**:
- A. No close button (auto-dismiss only)
- B. Close button present (user can dismiss early)

**Decision**: **No close button** (Recommended)
- Toasts are for brief feedback (3 seconds)
- Close button adds complexity
- If user dismisses, they may miss feedback
- Can add later if UX testing shows need

---

## Migration & Rollout

### Phase 1: Planning & Design (CURRENT)
✓ Create design spec (this document)
✓ Define flows, components, interactions
✓ Verify design tokens (reusing W-0002)
✓ Gate: Primary flows covered, tokens defined

### Phase 2: Implementation
- Create keyboard shortcut hook (`useKeyboardShortcut`)
- Create/extend toast component
- Integrate into theme context
- Wire into root layout

### Phase 3: Testing
- Functional testing (keyboard shortcut works)
- Accessibility testing (screen reader, focus, WCAG AA)
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile testing (gracefully ignored)

### Phase 4: Documentation & Rollout
- Update help menu with shortcut
- Add to release notes
- Document in CLAUDE.md
- Deploy to production

---

## Acceptance Criteria Mapping

| Acceptance Criteria | Design Spec Coverage |
|---------------------|----------------------|
| Keyboard shortcut Cmd/Ctrl+J toggles theme | ✓ Shortcut Spec (§3), User Flows (§2) |
| Toast confirms successful toggle | ✓ Toast Component (§5) |
| Works on light & dark modes | ✓ Toast Colors (§6), Design Tokens (§8) |
| System mode toggles to explicit | ✓ Flow 3 (§2), Edge Cases (§14) |
| Accessible (WCAG AA, keyboard, screen reader) | ✓ Accessibility (§9) |
| Non-blocking, doesn't steal focus | ✓ Toast Lifecycle (§5), Interaction Patterns (§7) |
| Auto-discovers discoverability | ✓ Help & Discoverability (§11) |

---

## Design System Tokens Reference

### Colors (Reused from W-0002)

```
Accent (Toast Background):
├── Light & Dark: hsl(217 91% 60%) [#3B82F6]

Accent-Foreground (Toast Text):
├── Light & Dark: hsl(210 40% 98%) [#F0F4F8]
```

### Spacing

```
Toast Padding: 16px
Toast Margin from viewport: 16px
Icon-to-text gap: 8px
```

### Typography

```
Font-size: 14px
Font-weight: 500 (medium)
Line-height: 1.5
Font-family: System font stack
```

### Border Radius

```
Toast: 8px (matches component library)
```

### Shadows

```
Light mode: 0 4px 12px rgba(0, 0, 0, 0.15)
Dark mode: 0 4px 12px rgba(0, 0, 0, 0.3)
```

### Animations

```
Slide-in: 150ms ease-out
Fade-out: 300ms ease-in
Static display: 2700ms
Total duration: 3150ms (3 seconds)
```

---

## Notes for Development

### Potential Implementation Challenges

1. **Keyboard shortcut library vs. manual handling**: Consider using library like `react-hotkeys-hook` vs. custom implementation. Custom is simpler for one shortcut.

2. **Global event listener cleanup**: Ensure keyboard listener is removed on component unmount to prevent memory leaks.

3. **Toast dismissal race condition**: If toast is dismissed manually AND auto-dismiss timer fires, prevent double-removal (check if toast exists before removing).

4. **Mobile detection**: Detect mobile and disable shortcut (no native keyboard), or let it be ignored gracefully.

5. **Focus management**: Verify shortcut works with input fields focused (may need `event.preventDefault()` for some cases).

### Browser Compatibility

- **Keyboard events**: Supported in all modern browsers
- **Cmd+J on Mac**: Built-in Jump to search in some browsers; may need rebind instruction
- **Ctrl+J on Windows**: May conflict with dev tools (Ctrl+J opens download manager in Chrome); document if needed

### Recommendation for Conflicts

If Cmd/Ctrl+J conflicts with browser shortcut:
1. Offer alternative shortcut (e.g., Cmd+Shift+J, Cmd+K)
2. Document in release notes
3. Provide browser extension for rebinding (future enhancement)

---

## References

- **WCAG 2.1 AA Accessibility**: https://www.w3.org/WAI/WCAG21/Understanding/
- **Keyboard Events (MDN)**: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
- **Toast UI Patterns**: https://material.io/components/snackbars
- **React Hooks**: https://react.dev/reference/react/useEffect
- **Tailwind CSS Animations**: https://tailwindcss.com/docs/animation
- **Screen Reader Testing**: https://www.w3.org/WAI/ATAG/test-evaluate/screens/

---

**Design Spec Status**: ✓ Ready for Implementation  
**Gate Assessment**: 
- ✓ Primary flows covered (discovery, toggling, rapid toggle, system mode)
- ✓ Toast design specs complete (colors, timing, animations, accessibility)
- ✓ Keyboard shortcut specification (Cmd+J, Ctrl+J)
- ✓ Design tokens verified (all reused from W-0002, no new tokens)
- ✓ Accessibility requirements defined (WCAG AA, keyboard, screen reader)
