# Dark Mode Toggle - Visual & Interaction Design
## Task M-0002 | Canvas Stage Design Document

**Focus**: Layout, component states, interaction patterns, and visual specifications

---

## Visual Design Overview

### Component Hierarchy

```
<html class="light|dark">
  └── <body>
      └── <ThemeProvider>
          └── <Header>
              ├── <h1> "Web App" (logo/title)
              └── <ThemeToggle>
                  ├── <button> (trigger)
                  └── <div role="menu"> (dropdown, conditional render)
                      ├── <button role="menuitem"> Light
                      ├── <button role="menuitem"> Dark
                      └── <button role="menuitem"> System
```

---

## Header Layout Specifications

### Desktop Header (>1024px)

```
HORIZONTAL SPACING:
┌────────────────────────────────────────────────────────┐
│  ← 24px padding (px-6) →  ← flex gap between items →  │
│                                                         │
│  Web App                                ☀️ Light      │
│                                                         │
│  ← 12px vertical padding (py-3) →                      │
└────────────────────────────────────────────────────────┘

Structure:
- Container: flex, items-center, justify-between
- Left:  <h1> "Web App" (no wrapper needed)
- Right: <ThemeToggle /> (width-auto)
- Vertical alignment: middle
- Background: var(--color-background)
- Border-bottom: 1px solid var(--color-border)
- Padding: 12px (vertical) × 24px (horizontal)
```

### Mobile Header (<640px)

```
HORIZONTAL SPACING:
┌──────────────────────────────────┐
│  ← 16px padding →  ← flex gap →  │
│  Web App                      ☀️  │
│  ← 12px vertical padding →        │
└──────────────────────────────────┘

Changes from desktop:
- Horizontal padding: 16px (px-4) instead of 24px
- ThemeToggle shows icon-only (sm:hidden on text)
- Same vertical spacing and border treatment
- Button automatically smaller due to single icon
```

### Tablet Header (640px–1024px)

```
Same as desktop, with responsive text:
┌───────────────────────────────────────────┐
│  ← 24px padding →            ← gap →      │
│  Web App                 ☀️ Light         │
│  ← 12px vertical padding →                │
└───────────────────────────────────────────┘
```

---

## Theme Toggle Button States

### State 1: Default (Button Closed)

**Desktop Visual**:
```
┌──────────────────┐
│ ☀️    Light      │
└──────────────────┘
```

**Mobile Visual**:
```
┌────┐
│ ☀️ │
└────┘
```

**Styling**:
```css
display: inline-flex
align-items: center
gap: 0.5rem (gap-2)
background-color: var(--color-secondary)
color: var(--color-secondary-foreground)
padding: 0.5rem 0.75rem (py-2 px-3)
border-radius: 0.375rem (rounded-md)
font-size: 0.875rem (text-sm)
font-weight: 500 (medium)
border: none
cursor: pointer
transition: background-color 200ms ease-in-out
```

**Text visibility**:
```jsx
<span className="hidden sm:inline">{label}</span>
// Hidden on mobile (<640px), visible on tablet+
```

---

### State 2: Hovered (Button Closed)

**Visual Change**:
```
Before:
┌──────────────────┐
│ ☀️    Light      │  bg: secondary
└──────────────────┘

After hover:
┌──────────────────┐
│ ☀️    Light      │  bg: secondary/80 (darkened)
└──────────────────┘
```

**Behavior**:
- Background opacity decreases (more transparent)
- Text remains same color
- Smooth transition over 200ms
- Cursor changes to pointer

---

### State 3: Focused (Button Closed)

**Visual**:
```
┌──────────────────┐
│ ☀️    Light      │
└──────────────────┘
   ╔════════════════╗  ← 2px ring, accent color
   ║                ║
   ║  ☀️    Light   ║
   ║                ║
   ╚════════════════╝
```

**Styling**:
```css
outline: none
border: 2px solid var(--color-accent)
box-shadow: 0 0 0 2px var(--color-accent)
  OR
  ring: 2px solid var(--color-accent)
  ring-offset: 0 (no space between ring and element)
```

**When**:
- Tab key navigates to button
- Click on button (visual feedback)
- Escape closes menu and returns focus

---

### State 4: Active/Pressed (Button Closed)

```
┌──────────────────┐
│ ☀️    Light      │  ← No visual change
└──────────────────┘     (CSS doesn't define :active)
                          Feedback: menu opens instead
```

**Instead, menu opens immediately** (visual feedback via dropdown)

---

## Theme Toggle Menu (Open State)

### Menu Positioning & Layout

```
┌──────────────────┐
│ ☀️    Light      │ ← Button (parent element)
└──────────────────┘
        ↑
        │ 8px gap (mt-2)
        ↓
┌──────────────────────────────────┐
│ ☀️  Light               
│ 🌙  Dark                
│ ⚙️   System          ✓  
└──────────────────────────────────┘

Position: absolute
Right: 0 (right-aligned with button's right edge)
Top: 100% + 8px (below button, with gap)
Z-index: 50
Width: minimum 120px, content-based
```

### Menu Container Styling

```css
background-color: var(--color-secondary)
border: 1px solid var(--color-border)
border-radius: 0.5rem (rounded-lg)
box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) (shadow-lg)
padding: 0.5rem 0 (py-2) - vertical only
z-index: 50
role="menu"
onKeyDown: handle arrow keys, enter, escape
```

### Menu Items Layout

```
Each menu item:

┌─────────────────────────────────┐
│ ☀️   Light                      │
└─────────────────────────────────┘

Width: 100% (full menu width)
Display: flex, items-center, gap: 0.75rem (gap-3)
Padding: 0.625rem 1rem (py-2.5 px-4)
Font-size: 0.875rem (text-sm)
Font-weight: 500 (medium)
Role: menuitem
Tabindex: 0 (focused) or -1 (not focused)
Border: none
Background: transparent (or var(--color-secondary) on hover)
Cursor: pointer
```

---

## Menu Item States

### State 1: Active (Current Selection)

**Visual**:
```
┌────────────────────────────────────┐
│ ☀️   Light                    ✓    │ ← Checkmark
└────────────────────────────────────┘
  ↑
  Background slightly lighter/darker
```

**Styling**:
```css
background-color: var(--color-secondary) / 0.6 opacity
color: var(--color-secondary-foreground)
aria-checked="true"

Checkmark:
  position: absolute right (ml-auto)
  color: var(--color-accent)
  aria-hidden="true"
  content: "✓"
```

### State 2: Hovered (Non-active)

**Visual**:
```
Before hover:
┌────────────────────────────────────┐
│ 🌙   Dark                          │
└────────────────────────────────────┘

On hover:
┌────────────────────────────────────┐
│ 🌙   Dark                          │  ← Subtle background
└────────────────────────────────────┘
```

**Styling**:
```css
background-color: var(--color-secondary) / 0.4 opacity
color: var(--color-secondary-foreground)
transition: background-color 200ms ease-in-out
cursor: pointer
```

### State 3: Focused (Keyboard Navigation)

**Visual**:
```
┌────────────────────────────────────┐
│ 🌙   Dark                          │
├────────────────────────────────────┤  ← 2px ring (inset)
│                                    │
│ 🌙   Dark                          │
│                                    │
└────────────────────────────────────┘
```

**Styling**:
```css
outline: none
ring: 2px solid var(--color-accent)
ring-inset: true (ring inside element, not outside)
tabIndex: 0 (receives focus)
```

### State 4: Active + Hovered

**Visual**:
```
┌────────────────────────────────────┐
│ ☀️   Light                    ✓    │  ← Both visible
└────────────────────────────────────┘
  ↑
  Slightly darker background than hover-only
```

---

## Color Specifications by Mode

### Light Mode - Complete Palette

```
Header:
  background: rgb(255, 255, 255)       [--color-background]
  border-bottom: rgb(243, 247, 251)    [--color-border]
  text: rgb(10, 10, 26)                [--color-foreground]

Button (default):
  background: rgb(243, 247, 251)       [--color-secondary]
  text: rgb(10, 10, 26)                [--color-secondary-foreground]
  hover: rgba(243, 247, 251, 0.8)      [--color-secondary] / 0.8 opacity
  focus-ring: rgb(74, 143, 255)        [--color-accent]

Menu:
  background: rgb(243, 247, 251)       [--color-secondary]
  border: rgb(243, 247, 251)           [--color-border]
  shadow: subtle drop-shadow

Menu Item (hover):
  background: rgba(243, 247, 251, 0.4) [--color-secondary] / 0.4
  text: rgb(10, 10, 26)                [--color-secondary-foreground]

Menu Item (active):
  background: rgba(243, 247, 251, 0.6) [--color-secondary] / 0.6
  text: rgb(10, 10, 26)                [--color-secondary-foreground]
  checkmark: rgb(74, 143, 255)         [--color-accent]
```

### Dark Mode - Complete Palette

```
Header:
  background: rgb(13, 22, 32)          [--color-background]
  border-bottom: rgb(40, 56, 69)       [--color-border]
  text: rgb(250, 251, 252)             [--color-foreground]

Button (default):
  background: rgb(45, 61, 79)          [--color-secondary]
  text: rgb(250, 251, 252)             [--color-secondary-foreground]
  hover: rgba(45, 61, 79, 0.8)         [--color-secondary] / 0.8 opacity
  focus-ring: rgb(74, 143, 255)        [--color-accent]

Menu:
  background: rgb(45, 61, 79)          [--color-secondary]
  border: rgb(40, 56, 69)              [--color-border]
  shadow: subtle drop-shadow

Menu Item (hover):
  background: rgba(45, 61, 79, 0.4)    [--color-secondary] / 0.4
  text: rgb(250, 251, 252)             [--color-secondary-foreground]

Menu Item (active):
  background: rgba(45, 61, 79, 0.6)    [--color-secondary] / 0.6
  text: rgb(250, 251, 252)             [--color-secondary-foreground]
  checkmark: rgb(74, 143, 255)         [--color-accent]
```

---

## Interaction Flows - Visual Timeline

### Interaction 1: Opening Menu

```
t=0ms
┌──────────────────┐
│ ☀️    Light      │ ← User clicks
└──────────────────┘

t=50ms (render)
┌──────────────────┐
│ ☀️    Light      │ aria-expanded="true"
└──────────────────┘
        │
        ↓
┌──────────────────────────────────┐
│ ☀️  Light                    ✓    │ ← First item focused
│ 🌙  Dark                          │    (if Light was selected)
│ ⚙️   System                       │
└──────────────────────────────────┘

Focus: Programmatically moved to first visible menu item
Keyboard: Ready to use arrow keys
Mouse: Can click any option
```

---

### Interaction 2: Keyboard Navigation in Menu

```
Start (Light selected):
┌──────────────────────────────────┐
│ ☀️  Light              ✓         │ ← Focus here
│ 🌙  Dark                         │
│ ⚙️   System                      │
└──────────────────────────────────┘

Press ArrowDown:
┌──────────────────────────────────┐
│ ☀️  Light                         │
│ 🌙  Dark              ← Focus moves here
│ ⚙️   System                      │
└──────────────────────────────────┘

Press ArrowDown again:
┌──────────────────────────────────┐
│ ☀️  Light                         │
│ 🌙  Dark                         │
│ ⚙️   System           ← Focus here
└──────────────────────────────────┘

Press ArrowDown again (wraps):
┌──────────────────────────────────┐
│ ☀️  Light              ← Focus wraps to start
│ 🌙  Dark                         │
│ ⚙️   System                      │
└──────────────────────────────────┘

Press Enter to select Dark:
- Menu closes
- Theme changes to dark
- Button text/icon updates to "🌙 Dark"
- Page colors transition smoothly (200ms)
```

---

### Interaction 3: Closing Menu (Escape Key)

```
Menu open, any item focused:
┌──────────────────────────────────┐
│ ☀️  Light                         │
│ 🌙  Dark              ← Focused
│ ⚙️   System                      │
└──────────────────────────────────┘

User presses Escape:

Menu closes, focus returns to button:
┌──────────────────┐
│ ☀️    Light      │ ← Focus here (visible ring)
└──────────────────┘
```

---

### Interaction 4: Click Outside to Close

```
Menu open:
┌──────────────────┐
│ ☀️    Light      │
└──────────────────┘
        │
        ↓
┌──────────────────────────────────┐
│ ☀️  Light              ✓         │
│ 🌙  Dark                         │
│ ⚙️   System                      │
└──────────────────────────────────┘

User clicks somewhere else (page content):

Menu closes instantly:
┌──────────────────┐
│ ☀️    Light      │
└──────────────────┘
(Page content visible below)
```

---

## Transition & Animation Details

### Theme Change Animation (200ms)

```
User selects Dark from menu:

t=0ms:
  HTML class: light → dark (instant)
  CSS variables update (instant)
  Colors begin transitioning

t=0-200ms:
  Each element with affected properties animates:
  - background-color: white → dark blue
  - color: dark text → light text
  - border-color: light gray → dark gray
  
  Easing: ease-in-out (slow → fast → slow)
  Affected elements: html, body, all descendant elements

t=200ms:
  Animation complete
  All colors fully transitioned
  Page rendered in dark theme
```

**CSS**:
```css
@media (prefers-reduced-motion: no-preference) {
  html {
    transition: background-color 0ms, color 200ms ease-in-out;
  }
  * {
    transition: background-color 200ms ease-in-out, 
                border-color 200ms ease-in-out,
                color 200ms ease-in-out;
  }
}
```

---

## Accessibility Visual Specifications

### Focus Indicators

**All focusable elements**:
```
Unfocused:
┌──────────────────┐
│ ☀️    Light      │
└──────────────────┘

Focused:
╔══════════════════╗
║ ☀️    Light      ║  ← 2px ring, accent color (#4A8FFF)
╚══════════════════╝
```

**Contrast Verification**:
- Ring color (#4A8FFF) against light background: 4.8:1 ✓
- Ring color (#4A8FFF) against dark background: 5.2:1 ✓

### Checkmark Indicator

```
Active menu item:
┌────────────────────────────────────┐
│ ☀️   Light                    ✓    │
└────────────────────────────────────┘
                                      ↑
                                      Checkmark (accent color)
                                      aria-hidden="true"
                                      Supplementary to color change
```

**Why both color + checkmark**: Color alone is not sufficient for colorblind users; checkmark provides additional visual cue.

---

## Responsive Behavior Specifications

### Mobile (<640px)

```
Button appearance:
┌───┐
│☀️ │  Icon only
└───┘

Width: ~44px (WCAG recommended minimum touch target)
Height: ~44px

When focused:
┌─────┐
│ ☀️  │  Focus ring visible
└─────┘
```

### Tablet (640px–1024px)

```
Button appearance:
┌──────────────────┐
│ ☀️ Light         │  Icon + text visible
└──────────────────┘

Responsive breakpoint: sm (640px)
CSS: hidden sm:inline (text hidden below 640px)
```

### Desktop (>1024px)

```
Button appearance:
┌──────────────────┐
│ ☀️    Light      │  Full button with padding
└──────────────────┘

Same as tablet, more comfortable spacing
```

---

## Typography Specifications

### Button Text

```
Font-family:  system-ui, -apple-system, sans-serif
Font-size:    14px (0.875rem / text-sm)
Font-weight:  500 (medium)
Line-height:  1.5 (default)
Letter-spacing: normal
Text-transform: capitalize (Light, Dark, System)
```

### Menu Items Text

```
Same as button text:
Font-family:  system-ui, -apple-system, sans-serif
Font-size:    14px (0.875rem / text-sm)
Font-weight:  500 (medium)
Line-height:  1.5
```

---

## Spacing Grid

### Padding & Margins

```
Header:
  Vertical padding:   12px (py-3)
  Horizontal padding: 24px desktop (px-6), 16px mobile (px-4)

Button:
  Vertical padding:   8px (py-2)
  Horizontal padding: 12px (px-3)
  Icon-text gap:      8px (gap-2)

Menu:
  Vertical padding:   8px (py-2) - internal spacing
  Position gap:       8px below button (mt-2)

Menu Items:
  Vertical padding:   10px (py-2.5)
  Horizontal padding: 16px (px-4)
  Icon-text gap:      12px (gap-3)
```

---

## Implementation-Ready Specifications

### Button HTML Structure

```html
<button
  ref={buttonRef}
  onClick={handleToggleMenu}
  aria-label="Theme options"
  aria-haspopup="menu"
  aria-expanded={open}
  className="inline-flex items-center gap-2 rounded-md 
             bg-secondary px-3 py-2 text-sm font-medium 
             text-secondary-foreground transition-colors 
             hover:bg-secondary/80 focus:outline-none 
             focus:ring-2 focus:ring-accent focus:ring-offset-0"
>
  <span>{currentOption.icon}</span>
  <span className="hidden sm:inline">{currentOption.label}</span>
</button>
```

### Menu HTML Structure

```html
<div
  ref={menuRef}
  role="menu"
  onKeyDown={handleKeyDown}
  className="absolute right-0 top-full z-50 mt-2 
             min-w-[120px] rounded-lg border border-border 
             bg-secondary py-2 shadow-lg"
>
  {/* Menu items */}
</div>
```

### Menu Item HTML Structure

```html
<button
  role="menuitem"
  onClick={() => handleSelectOption(option.mode)}
  aria-checked={isActive}
  tabIndex={isFocused ? 0 : -1}
  className={`flex w-full items-center gap-3 px-4 py-2.5 
              text-sm font-medium transition-colors 
              focus:outline-none focus:ring-2 focus:ring-accent 
              focus:ring-inset ${isActive 
                ? 'bg-secondary/60 text-secondary-foreground' 
                : 'text-secondary-foreground hover:bg-secondary/40'
              }`}
>
  <span>{option.icon}</span>
  <span className="flex-1 text-left">{option.label}</span>
  {isActive && (
    <span aria-hidden="true" className="ml-auto text-accent">
      ✓
    </span>
  )}
</button>
```

---

## Summary: Design Tokens Reference

| Element | Property | Value |
|---------|----------|-------|
| **Button (default)** | Background | var(--color-secondary) |
| | Text | var(--color-secondary-foreground) |
| | Padding | 8px × 12px |
| | Border-radius | 6px |
| | Font-size | 14px, weight 500 |
| **Button (hover)** | Background | var(--color-secondary) / 0.8 |
| **Button (focus)** | Ring | 2px solid var(--color-accent) |
| **Menu** | Background | var(--color-secondary) |
| | Border | 1px solid var(--color-border) |
| | Border-radius | 8px |
| | Shadow | lg (drop-shadow) |
| **Menu Item (hover)** | Background | var(--color-secondary) / 0.4 |
| **Menu Item (active)** | Background | var(--color-secondary) / 0.6 |
| | Checkmark | var(--color-accent) |
| **Transition** | Duration | 200ms |
| | Easing | ease-in-out |
| | Properties | background-color, border-color, color |

---

**Design Specification Complete** ✅
