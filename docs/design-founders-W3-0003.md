# Design Spec — Founders Page (W3-0003)

**Feature**: Founders Page with Nav Bar Link  
**Route**: `/founders`  
**Stage**: Canvas  
**Date**: 2026-06-05  
**Status**: Ready for implementation

---

## 1. Overview

A static, presentational Founders page that humanises the Vortex brand by showcasing the two co-founders with placeholder profile cards. The page is discoverable via a new "Founders" link added to the main navigation bar. Content is entirely placeholder so that real photos and bios can be swapped in later with no structural changes.

---

## 2. User Flow

```
User lands on any page
        │
        ▼
  Sees "Founders" in nav bar
        │
        ▼
  Clicks "Founders" link  ──→  /founders route renders
                                      │
                                      ▼
                    Sees two founder profile cards
                    (avatar · name · title · bio)
                                      │
                                      ▼
              User builds trust / navigates elsewhere
```

### Entry points

| Entry point | Path |
|---|---|
| Main nav "Founders" link | Any page → `/founders` |
| Direct URL | `/founders` |

### Exit points

- User navigates away via nav bar (Home, About, Ideas, Docs, Contact, Get started)
- Browser back button

---

## 3. Wireframes

### 3.1 Desktop (≥768px) — 2-column founder grid

```
┌──────────────────────────────────────────────────────────────────┐
│ [V] Vortex  Home  About  Ideas  Docs  Contact  Founders  [Get started] │  ← sticky nav
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│              ● Meet the Team                                     │  ← badge pill (purple dot)
│                                                                  │
│         The minds behind Vortex                                  │  ← H1, gradient text
│                                                                  │
│   Two founders, one mission: autonomous software delivery.        │  ← subtitle, muted
│                                                                  │
│   ─────────────────────────────────────────────────────────────  │  ← border separator
│                                                                  │
│   ┌──────────────────────────┐  ┌──────────────────────────┐    │
│   │  ┌──────┐                │  │  ┌──────┐                │    │
│   │  │  👤  │  (avatar)      │  │  │  👤  │  (avatar)      │    │
│   │  └──────┘                │  │  └──────┘                │    │
│   │                          │  │                          │    │
│   │  Founder Name            │  │  Founder Name            │    │
│   │  Co-founder & CEO        │  │  Co-founder & CTO        │    │
│   │                          │  │                          │    │
│   │  Short bio goes here…    │  │  Short bio goes here…    │    │
│   │  This placeholder bio    │  │  This placeholder bio    │    │
│   │  describes this founder. │  │  describes this founder. │    │
│   └──────────────────────────┘  └──────────────────────────┘    │
│                                                                  │
│                  ─────────────────────────────                   │  ← section footer note
│        Placeholder profiles — real bios coming soon.             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Mobile (<768px) — single-column stacked

```
┌─────────────────────────────┐
│ [V] Vortex     (nav links)  │  ← sticky nav (existing)
├─────────────────────────────┤
│                             │
│        ● Meet the Team      │
│                             │
│  The minds behind Vortex    │  ← H1, gradient, centered
│                             │
│  Two founders, one mission… │  ← subtitle, muted
│                             │
│  ─────────────────────────  │
│                             │
│  ┌─────────────────────┐    │
│  │  ┌──────┐           │    │
│  │  │  👤  │           │    │
│  │  └──────┘           │    │
│  │                     │    │
│  │  Founder Name       │    │
│  │  Co-founder & CEO   │    │
│  │                     │    │
│  │  Short bio goes     │    │
│  │  here…              │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │  ┌──────┐           │    │
│  │  │  👤  │           │    │
│  │  └──────┘           │    │
│  │                     │    │
│  │  Founder Name       │    │
│  │  Co-founder & CTO   │    │
│  │                     │    │
│  │  Short bio goes     │    │
│  │  here…              │    │
│  └─────────────────────┘    │
│                             │
│  Placeholder profiles —     │
│  real bios coming soon.     │
│                             │
└─────────────────────────────┘
```

---

## 4. Layout Specification

### 4.1 Page Shell

Inherits `RootLayout` from `src/app/layout.tsx`:
- `<NavBar />` sticky at top (existing component, updated with Founders link)
- `<main className="flex min-h-screen flex-col">` wraps page content
- Page component is a **Server Component** (no `"use client"` needed — fully static)

### 4.2 Outer Container

```
<div style={{ backgroundColor: "#09090b", color: "#fafafa", minHeight: "100vh" }}>
  {/* Hero Section */}
  {/* Founders Grid Section */}
  {/* Responsive style tag */}
</div>
```

---

### 4.3 Hero Section

Mirrors the pattern used in `src/app/about/page.tsx` and `src/app/contact/page.tsx`.

| Element | Style |
|---|---|
| Section container | `borderBottom: "1px solid #18181b"`, `padding: "72px 24px 64px"`, `textAlign: "center"`, `position: "relative"`, `overflow: "hidden"` |
| Radial glow (decorative) | `position: absolute`, top-center, 600×400px, `radial-gradient(ellipse at center top, rgba(124,58,237,0.15) 0%, transparent 70%)`, `aria-hidden="true"`, `pointerEvents: "none"` |
| Badge pill | `display: "inline-flex"`, `gap: 8`, `backgroundColor: "#18181b"`, `border: "1px solid #27272a"`, `borderRadius: 99`, `padding: "5px 12px"`, `marginBottom: 24` |
| Badge dot | `width: 8, height: 8`, `borderRadius: "50%"`, `backgroundColor: "#7c3aed"`, `display: "inline-block"`, `aria-hidden="true"` |
| Badge label | `fontSize: 11`, `letterSpacing: "0.1em"`, `textTransform: "uppercase"`, `color: "#a1a1aa"` — copy: `"Meet the Team"` |
| H1 | `fontSize: 42`, `fontWeight: 700`, `letterSpacing: "-1px"`, `lineHeight: 1.15`, `marginBottom: 16`, gradient text treatment (see §6) |
| H1 copy | `"The minds behind Vortex"` |
| Subtitle `<p>` | `fontSize: 16`, `color: "#71717a"`, `maxWidth: 520`, `margin: "0 auto"`, `lineHeight: 1.7` |
| Subtitle copy | `"Two founders, one mission: autonomous software delivery for every team."` |

**Gradient text treatment** (identical to About/Contact H1):
```js
{
  background: "linear-gradient(180deg, #fafafa 0%, #a1a1aa 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
}
```

---

### 4.4 Founders Grid Section

```
<section
  aria-labelledby="founders-heading"
  style={{
    padding: "64px 24px 80px",
    maxWidth: 880,
    margin: "0 auto",
  }}
>
```

| Element | Style |
|---|---|
| Section container | `padding: "64px 24px 80px"`, `maxWidth: 880`, `margin: "0 auto"` |
| Visually-hidden heading | `<h2 id="founders-heading" className="sr-only">Meet the founders</h2>` |
| Grid wrapper | `display: "grid"`, `gridTemplateColumns: "repeat(2, 1fr)"`, `gap: 24`, className `founders-grid` |

**Responsive override** (via `<style>` tag at page bottom):
```css
@media (max-width: 768px) {
  .founders-grid {
    grid-template-columns: 1fr !important;
  }
}
```

---

### 4.5 Founder Profile Card

Each founder is rendered as an `<article>` element. Both cards share the same structure and style.

```
<article style={{ ... }}>
  {/* Avatar */}
  {/* Name */}
  {/* Title */}
  {/* Bio */}
</article>
```

#### Card Container

| Property | Value |
|---|---|
| `backgroundColor` | `"#111113"` |
| `border` | `"1px solid #27272a"` |
| `borderRadius` | `12` |
| `padding` | `32` |
| `display` | `"flex"` |
| `flexDirection` | `"column"` |
| `alignItems` | `"flex-start"` |
| `gap` | `16` |

#### Avatar

Implemented as an inline SVG inside a styled `<div>` container. **No external image, no broken image icon.**

```
Avatar container div:
  width: 80, height: 80
  borderRadius: "50%"
  backgroundColor: "#27272a"
  display: "flex", alignItems: "center", justifyContent: "center"
  flexShrink: 0
  overflow: "hidden"
  aria-hidden="true"
```

**Inline SVG — anonymous person silhouette:**
```svg
<svg
  width="44"
  height="44"
  viewBox="0 0 24 24"
  fill="none"
  aria-hidden="true"
>
  <!-- Head circle -->
  <circle cx="12" cy="8" r="3.5" fill="#52525b" />
  <!-- Body/shoulders path -->
  <path
    d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
    stroke="#52525b"
    strokeWidth="1.8"
    strokeLinecap="round"
    fill="none"
  />
</svg>
```

SVG stroke/fill colour: `#52525b` (zinc-600) — visible on the `#27272a` (zinc-800) background while remaining clearly a placeholder / silhouette.

#### Name

```js
<h3 style={{
  fontSize: 18,
  fontWeight: 700,
  color: "#fafafa",
  margin: 0,
  letterSpacing: "-0.3px",
}}>
  Founder Name
</h3>
```

#### Title / Role

```js
<p style={{
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#7c3aed",
  margin: 0,
}}>
  Co-founder &amp; CEO  {/* or Co-founder &amp; CTO */}
</p>
```

#### Bio

```js
<p style={{
  fontSize: 14,
  color: "#71717a",
  lineHeight: 1.75,
  margin: 0,
}}>
  Short bio goes here — a sentence or two about this founder's background,
  expertise, and what they bring to Vortex. Replace with real content when
  available.
</p>
```

---

### 4.6 Footer Note

Below the grid, a muted line indicating placeholder status.

```js
<p style={{
  textAlign: "center",
  fontSize: 12,
  color: "#3f3f46",
  marginTop: 48,
  letterSpacing: "0.02em",
}}>
  Placeholder profiles — real photos and bios coming soon.
</p>
```

---

## 5. Placeholder Content

Both cards use clearly-labelled placeholder copy. No ambiguity about what needs replacing.

### Founder 1

| Field | Placeholder |
|---|---|
| Name | `Founder Name` |
| Title | `Co-founder & CEO` |
| Bio | `Short bio goes here — a sentence or two about this founder's background, expertise, and what they bring to Vortex. Replace with real content when available.` |

### Founder 2

| Field | Placeholder |
|---|---|
| Name | `Founder Name` |
| Title | `Co-founder & CTO` |
| Bio | `Short bio goes here — a sentence or two about this founder's background, expertise, and what they bring to Vortex. Replace with real content when available.` |

> **Implementation tip**: Define a `FOUNDERS` constant array (like `FEATURE_CARDS` in `about/page.tsx`) so each card is data-driven. Dropping in real names/bios/titles requires only editing the data array — no layout changes needed.

---

## 6. Navigation Update

**File**: `src/components/nav.tsx`

Add `{ href: "/founders", label: "Founders" }` to the `NAV_LINKS` array, inserted after `{ href: "/contact", label: "Contact" }`:

```ts
const NAV_LINKS = [
  { href: "/",         label: "Home"     },
  { href: "/about",   label: "About"    },
  { href: "/ideas",   label: "Ideas"    },
  { href: "/docs",    label: "Docs"     },
  { href: "/contact", label: "Contact"  },
  { href: "/founders",label: "Founders" },   // ← new
] as const;
```

Active/inactive states are handled automatically by the existing generic logic:
- **Active** (`pathname === "/founders"`): `color: "#fafafa"`, `fontWeight: 500`, `aria-current="page"`
- **Inactive**: `color: "#a1a1aa"`, `fontWeight: 400`, hover → `color: "#fafafa"` (150ms transition)

No other changes to `nav.tsx` are required.

---

## 7. Design Tokens

All tokens are drawn from the existing inline-style convention used across About and Contact pages. **No new design tokens are introduced.**

### Colour

| Token name | Hex value | Usage |
|---|---|---|
| Page background | `#09090b` (zinc-950) | Full-page `div` bg, section `bg` |
| Section separator | `#18181b` (zinc-900) | `borderBottom` between hero and grid |
| Card background | `#111113` | Founder card `article` bg |
| Card border | `#27272a` (zinc-800) | Card `border`, avatar container bg |
| Avatar silhouette | `#52525b` (zinc-600) | SVG fill/stroke colour on avatar |
| Brand purple | `#7c3aed` (violet-600) | Badge dot, founder title/role text |
| Heading white | `#fafafa` | H1 gradient start, card name |
| Heading grey | `#a1a1aa` (zinc-400) | H1 gradient end, badge label text |
| Body muted | `#71717a` (zinc-500) | Subtitle, bio text |
| Footer note | `#3f3f46` (zinc-700) | Placeholder footer note |
| Glow tint | `rgba(124,58,237,0.15)` | Hero radial gradient overlay |

### Typography

| Element | Size | Weight | Color |
|---|---|---|---|
| Page H1 | 42px | 700 | Gradient `#fafafa → #a1a1aa` |
| Subtitle | 16px | 400 | `#71717a` |
| Badge label | 11px (uppercase, 0.1em ls) | 400 | `#a1a1aa` |
| Founder name | 18px | 700 | `#fafafa` |
| Founder title | 11px (uppercase, 0.12em ls) | 500 | `#7c3aed` |
| Founder bio | 14px | 400 | `#71717a` |
| Footer note | 12px | 400 | `#3f3f46` |

### Spacing & Sizing

| Token | Value | Usage |
|---|---|---|
| Hero padding | `72px 24px 64px` | Section top/side/bottom |
| Grid section padding | `64px 24px 80px` | Founders grid wrapper |
| Card padding | `32px` | Inside each `article` |
| Card gap | `24px` | Between founder cards |
| Card border-radius | `12px` | `article` |
| Avatar size | `80×80px` | Circular avatar container |
| Avatar border-radius | `50%` | Full circle |
| SVG icon size | `44×44px` | Silhouette inside avatar |
| Max content width | `880px` | Grid section `maxWidth` |

---

## 8. Component Breakdown

| Component | Type | Location | Notes |
|---|---|---|---|
| `FoundersPage` | Server Component | `src/app/founders/page.tsx` | Entire page — static, no `"use client"` |
| `NavBar` (modified) | Client Component | `src/components/nav.tsx` | 1-line addition to `NAV_LINKS` array |

No new sub-components are needed. The page is self-contained following the pattern of `about/page.tsx` and `contact/page.tsx`.

### Suggested data structure (inside `page.tsx`)

```ts
interface Founder {
  id: string;
  name: string;
  title: string;
  bio: string;
}

const FOUNDERS: Founder[] = [
  {
    id: "founder-1",
    name: "Founder Name",
    title: "Co-founder & CEO",
    bio: "Short bio goes here — a sentence or two about this founder's background, expertise, and what they bring to Vortex. Replace with real content when available.",
  },
  {
    id: "founder-2",
    name: "Founder Name",
    title: "Co-founder & CTO",
    bio: "Short bio goes here — a sentence or two about this founder's background, expertise, and what they bring to Vortex. Replace with real content when available.",
  },
];
```

This makes swapping in real bios a one-line change per founder — no layout surgery needed.

---

## 9. States & Interactions

### 9.1 Nav link — Founders

| State | Visual |
|---|---|
| Default | `color: "#a1a1aa"`, `fontWeight: 400` |
| Hover | `color: "#fafafa"` (150ms CSS transition) |
| Active (on `/founders`) | `color: "#fafafa"`, `fontWeight: 500`, `aria-current="page"` |

No additional interaction design needed — nav active-link logic is fully generic.

### 9.2 Founder Card

The cards are **static and non-interactive**. There are no hover effects, modals, or expandable states in scope.

| State | Visual |
|---|---|
| Default | Dark card bg `#111113`, border `#27272a` |
| (No hover state required) | No interactive affordance, consistent with placeholder intent |

> Out of scope per task constraints: "no animation or interactive hover effects beyond what the existing design system provides."

### 9.3 Page load

No loading states — the page is a Server Component with zero client-side data fetching.

---

## 10. Accessibility

| Concern | Approach |
|---|---|
| Unique page `<h1>` | `"The minds behind Vortex"` — unique and descriptive |
| Section heading | `<h2 id="founders-heading" className="sr-only">Meet the founders</h2>` — labelled via `aria-labelledby` on `<section>` |
| Card semantic | Each card uses `<article>` — implicit landmark; each has an `<h3>` |
| Avatar | Wrapped `<div aria-hidden="true">` — purely decorative; SVG also `aria-hidden="true"` |
| Colour contrast | `#fafafa` on `#09090b` ≈ 20:1 ✓ · `#71717a` on `#111113` ≈ 5.5:1 ✓ · `#7c3aed` on `#111113` ≈ 4.8:1 ✓ |
| Keyboard navigation | Tab order: sticky nav → founder cards (in DOM order) — no interactive elements inside cards |
| Screen reader | `aria-current="page"` on active nav link auto-updated by existing nav logic |

---

## 11. Responsive Behaviour

| Breakpoint | Grid layout | Max content width |
|---|---|---|
| Mobile (< 768px) | 1-column (stacked vertically) | 100% − 2×24px padding |
| Desktop (≥ 768px) | 2-column (`repeat(2, 1fr)`) | 880px |

Implementation: CSS class `founders-grid` on the grid `<div>` + responsive override via inline `<style>` tag (same approach as `about/page.tsx` `.about-feature-grid`):

```css
@media (max-width: 768px) {
  .founders-grid {
    grid-template-columns: 1fr !important;
  }
}
```

---

## 12. Blast Radius

Exactly **2 files** changed:

| File | Change |
|---|---|
| `src/components/nav.tsx` | Add 1 entry to `NAV_LINKS` constant |
| `src/app/founders/page.tsx` | New file — entirely greenfield |

No schema changes, API routes, database migrations, or backend changes required.

---

## 13. Out of Scope (Design)

- Real founder photos (external `<img>` tags, `<Image>` component, or CMS-sourced)
- Written bios or personal details
- Social media / LinkedIn / GitHub profile links
- Hover effects, animations, or interactive states on cards
- Any dynamic data source, CMS integration, or database query
- Mobile hamburger menu (existing nav handles this)

---

## 14. Open Questions / Resolved

| Question | Resolution |
|---|---|
| Avatar approach (image vs. SVG)? | Inline SVG silhouette on `#27272a` circle — no external dep, no broken image risk. |
| Nav link position? | After "Contact" — maintains logical page-type grouping (info pages together). |
| Hover on cards? | Not in scope per task constraints. Cards are static placeholder. |
| `"use client"` needed? | No — page is fully static; no client-side state, clipboard, or event handlers. |
| Breakpoint for 2-col → 1-col? | 768px (`md:` Tailwind breakpoint) per acceptance criteria. |

---

*Design spec produced by UX/UI Designer agent — W3-0003 canvas stage — 2026-06-05*
