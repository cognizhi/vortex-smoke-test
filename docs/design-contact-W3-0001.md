# Design Spec — Contact Page (W3-0001)

**Feature**: Static Contact Page  
**Route**: `/contact`  
**Stage**: Canvas  
**Date**: 2026-06-04  
**Status**: Ready for implementation

---

## 1. Overview

A static, presentational Contact page that gives users a clear, discoverable place to find the organisation's placeholder contact details (email and phone). The page is reachable via a new "Contact" link in the main navigation and must match the existing Vortex site layout and visual language.

---

## 2. User Flow

```
User lands on any page
        │
        ▼
  Sees "Contact" in nav bar
        │
        ▼
  Clicks "Contact" link  ──→  /contact route renders
                                    │
                                    ▼
                          Reads email address
                          Reads phone number
                                    │
                                    ▼
                      User copies/uses contact details
```

### Entry points
| Entry point | Path |
|---|---|
| Main nav "Contact" link | Any page → `/contact` |
| Direct URL | `/contact` |

### Exit points
- User navigates away via nav bar (Home, About, Ideas, Docs, Get started)
- Browser back button

---

## 3. Wireframes

### 3.1 Desktop (≥1024px)

```
┌────────────────────────────────────────────────────────────┐
│  [V] Vortex   Home  About  Ideas  Docs  Contact   [Get started] │  ← sticky nav, #09090b bg
├────────────────────────────────────────────────────────────┤
│                                                            │
│                   Contact Us                               │  ← H1, centered
│          We'd love to hear from you.                       │  ← subtitle, text-gray-600
│          Reach us through any of the channels below.       │
│                                                            │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  ✉  Email            │  │  📞  Phone            │        │
│  │                      │  │                       │        │
│  │  hello@example.com   │  │  +1 (555) 000-0000    │        │
│  │  [Copy]              │  │  [Copy]               │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                            │
│  ─────────────────────────────────────────────────────     │
│  Placeholder details only. Real info coming soon.          │  ← muted footnote
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 3.2 Mobile (<640px)

```
┌────────────────────────────┐
│ [V] Vortex  ≡ (hamburger)  │  ← nav collapses (existing pattern)
├────────────────────────────┤
│                            │
│       Contact Us           │
│  We'd love to hear         │
│  from you.                 │
│                            │
│ ┌──────────────────────┐   │
│ │  ✉  Email            │   │
│ │  hello@example.com   │   │
│ │  [Copy]              │   │
│ └──────────────────────┘   │
│                            │
│ ┌──────────────────────┐   │
│ │  📞  Phone            │   │
│ │  +1 (555) 000-0000   │   │
│ │  [Copy]              │   │
│ └──────────────────────┘   │
│                            │
│ Placeholder details only.  │
│                            │
└────────────────────────────┘
```

### 3.3 Tablet (640px–1024px)

Cards display in 2-column grid (`sm:grid-cols-2`), same as desktop, constrained to `max-w-2xl`.

---

## 4. Layout Specification

### Page Shell

Inherits `RootLayout` from `src/app/layout.tsx`:
- `<NavBar />` sticky at top (existing component, updated with Contact link)
- `<main className="flex min-h-screen flex-col">` wraps page content

### Contact Page Content

```
<div className="flex flex-1 items-center justify-center">
  <div className="w-full max-w-2xl space-y-8 px-4 py-16">
    <!-- Hero block -->
    <!-- Contact cards grid -->
    <!-- Footer note -->
  </div>
</div>
```

Mirrors the exact pattern used in `src/app/page.tsx` for visual consistency.

#### Hero Block
| Element | Class / Style |
|---|---|
| Container | `text-center` |
| H1 | `text-4xl font-bold tracking-tight` |
| Subtitle | `mt-2 text-lg text-gray-600` |

**Copy**:
- H1: `"Contact Us"`
- Subtitle: `"We'd love to hear from you. Reach us through any of the channels below."`

#### Contact Cards Grid
| Element | Class |
|---|---|
| Grid container | `grid gap-6 sm:grid-cols-2` |
| Each card | shadcn/ui `<Card>` |
| Card header | `<CardHeader>` with icon + `<CardTitle>` |
| Card body | `<CardContent>` — contact detail + copy button |

**Card content:**

| Card | Icon | Title | Detail |
|---|---|---|---|
| Email | `✉` (or lucide `Mail`) | `"Email"` | `hello@example.com` |
| Phone | `📞` (or lucide `Phone`) | `"Phone"` | `+1 (555) 000-0000` |

Each card includes a secondary action — a subtle `"Copy"` button (`variant="ghost"`, small size) that copies the contact value to clipboard. This uses `navigator.clipboard.writeText()` client-side and shows a momentary `"Copied!"` feedback state (see §7 Interaction Notes).

#### Footer Note
| Element | Class |
|---|---|
| Container | `border-t border-border pt-8 text-center text-sm text-gray-600` |
| Text | `"Placeholder details only. Real contact information will be added soon."` |

Mirrors the footer note pattern from `src/app/page.tsx`.

---

## 5. Navigation Update

File: `src/components/nav.tsx`

Add `{ href: "/contact", label: "Contact" }` to the `NAV_LINKS` array, inserted after `"Docs"`:

```ts
const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/ideas", label: "Ideas" },
  { href: "/docs", label: "Docs" },
  { href: "/contact", label: "Contact" },   // ← new
] as const;
```

Active/inactive states follow the existing pattern:
- **Active** (`pathname === "/contact"`): color `#fafafa`, fontWeight 500
- **Inactive**: color `#a1a1aa`, fontWeight 400, hover → `#fafafa`

---

## 6. Design Tokens

All tokens are sourced from `src/globals.css` `:root` and the existing inline nav styles. No new tokens are introduced.

| Token | Value | Usage |
|---|---|---|
| `--color-background` | `hsl(0 0% 100%)` | Page body background |
| `--color-foreground` | `hsl(222 84% 5%)` | Body text |
| `--color-border` | `hsl(210 40% 96%)` | Card borders, divider |
| Nav bg | `#09090b` (zinc-950) | Sticky header |
| Nav border | `#27272a` (zinc-800) | Header bottom border |
| Brand purple | `#7c3aed` (violet-600) | Logo, CTA button |
| Active nav text | `#fafafa` | Active nav link |
| Inactive nav text | `#a1a1aa` (zinc-400) | Inactive nav links |
| Muted text | `text-gray-600` | Subtitles, footnotes |
| Card description | `text-gray-700` / `text-sm` | Detail text in cards |

**Typography**:
| Element | Class |
|---|---|
| Page H1 | `text-4xl font-bold tracking-tight` |
| Subtitle | `text-lg text-gray-600` |
| Card title | shadcn CardTitle defaults |
| Detail value | `text-sm font-mono text-gray-700` (monospace for contact values) |
| Footnote | `text-sm text-gray-600` |

**Spacing**: follows the existing `space-y-8` / `gap-6` / `py-16` / `px-4` scale from `page.tsx`.

---

## 7. Component Breakdown

| Component | Type | Notes |
|---|---|---|
| `src/app/contact/page.tsx` | Server Component | Static page, no `"use client"` needed unless copy-button used |
| `src/components/contact-card.tsx` | Client Component (`"use client"`) | Handles clipboard copy + feedback state |
| `src/components/nav.tsx` | Modified | Add Contact to NAV_LINKS |

### ContactCard props interface

```ts
interface ContactCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;        // displayed contact detail
  copyValue: string;    // value written to clipboard (same as value here)
}
```

If the copy interaction adds complexity beyond the task scope (static-only), the Copy button may be omitted in v1 and the contact value rendered as a plain `<a href="mailto:...">` or `<a href="tel:...">` link instead.

---

## 8. States & Interactions

### 8.1 Nav link — Contact

| State | Visual |
|---|---|
| Default | Color `#a1a1aa`, weight 400 |
| Hover | Color `#fafafa` (transition 150ms) |
| Active (on `/contact`) | Color `#fafafa`, weight 500, `aria-current="page"` |

### 8.2 Copy Button (per card)

| State | Visual |
|---|---|
| Default | Ghost button, label "Copy", muted text |
| Hover | Slight background tint (shadcn ghost hover) |
| Clicked / success | Label changes to "Copied ✓" for 1500ms, then resets |
| Error (clipboard denied) | Silent fallback — button remains, no error shown |

The copy button marks the ContactCard as a Client Component. The page itself (`contact/page.tsx`) remains a Server Component.

### 8.3 Email / Phone links (fallback if no copy button)

- Email value wraps in `<a href="mailto:hello@example.com">` — opens mail client
- Phone value wraps in `<a href="tel:+15550000000">` — opens dialler on mobile

Both links styled with `text-violet-600 underline-offset-4 hover:underline` to match brand.

---

## 9. Accessibility

- Page `<h1>` is unique and describes the page intent
- Contact cards use semantic `<article>` or shadcn Card (renders `<div>` with role implied by heading)
- Email and phone links include descriptive `aria-label` (e.g., `aria-label="Send email to hello@example.com"`)
- Copy buttons have `aria-label="Copy email address"` / `aria-label="Copy phone number"`
- After copy, success state announced via `aria-live="polite"` region
- Full keyboard navigation supported (Tab order: nav → cards → footer)
- Color contrast: `#fafafa` on `#09090b` = 20:1 ✓ · body text on white background ≥7:1 ✓

---

## 10. Responsive Behaviour

| Breakpoint | Cards layout | Max content width |
|---|---|---|
| Mobile (<640px) | Single column (stacked) | 100% − 2×16px padding |
| Tablet (640–1024px) | 2-column grid | `max-w-2xl` (672px) |
| Desktop (>1024px) | 2-column grid | `max-w-2xl` (672px) |

Nav bar responsive behaviour is unchanged (existing component handles it).

---

## 11. Out of Scope (Design)

- Contact/enquiry form UI
- Field validation states
- Success / error toast for form submission
- Map or location embed
- Social media links
- Live chat widget

---

## 12. Open Questions / Resolved

| Question | Resolution |
|---|---|
| Branding / design guidelines? | Use existing Vortex tokens — purple `#7c3aed`, zinc-950 nav, white body, shadcn/ui cards. No new brand decisions needed. |
| Real contact details? | Out of scope — placeholder only: `hello@example.com`, `+1 (555) 000-0000` |
| Copy-to-clipboard or mailto/tel links? | Recommend mailto/tel links as primary (simpler, no client component needed for page.tsx). Copy button as progressive enhancement in ContactCard client component. |

---

*Design spec produced by UX/UI Designer agent — W3-0001 canvas stage.*
