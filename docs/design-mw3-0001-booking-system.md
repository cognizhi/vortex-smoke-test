# Design Spec — Self-Serve Booking System
**Task**: MW3-0001-canvas  
**Stage**: Canvas → Design  
**Author**: UX/UI Designer (SDLC Agent)  
**Date**: 2026-06-07  
**Status**: Ready for Review

---

## Table of Contents
1. [Design Tokens](#1-design-tokens)
2. [Screen Inventory](#2-screen-inventory)
3. [Flow A — Merchant Registration (Onboarding)](#3-flow-a--merchant-registration)
4. [Flow B — Admin Dashboard](#4-flow-b--admin-dashboard)
5. [Flow C — Staff Management](#5-flow-c--staff-management)
6. [Flow D — Services Management](#6-flow-d--services-management)
7. [Flow E — Customer Management](#7-flow-e--customer-management)
8. [Flow F — Design Customization](#8-flow-f--design-customization)
9. [Flow G — Settings](#9-flow-g--settings)
10. [Flow H — Customer Booking Page](#10-flow-h--customer-booking-page)
11. [Flow I — Booking Cancellation](#11-flow-i--booking-cancellation)
12. [Component States](#12-component-states)
13. [Responsive Layout](#13-responsive-layout)
14. [Interaction Notes](#14-interaction-notes)
15. [Email Template Layouts](#15-email-template-layouts)
16. [Accessibility](#16-accessibility)

---

## 1. Design Tokens

### 1.1 Brand

| Token | Value | Usage |
|-------|-------|-------|
| Brand name | BookFlow | Product name (internal — can be swapped) |
| Brand voice | Calm, professional, reliable | Friendly-business; not overly startup-y |
| Icon style | Rounded, filled with stroke accent | Consistency with shadcn/ui aesthetic |

### 1.2 Color Palette

#### Primary (Indigo family — trust, professionalism)

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--color-primary-600` | `#4F46E5` | `indigo-600` | Primary buttons, active nav, links |
| `--color-primary-700` | `#4338CA` | `indigo-700` | Hover on primary buttons |
| `--color-primary-100` | `#E0E7FF` | `indigo-100` | Selected-state backgrounds |
| `--color-primary-50` | `#EEF2FF` | `indigo-50` | Subtle tints, sidebar backgrounds |

#### Slot States (Admin-customisable — defaults)

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--slot-available-bg` | `#ECFDF5` | `emerald-50` | Available slot background (merchant configurable) |
| `--slot-available-text` | `#065F46` | `emerald-800` | Available slot text (merchant configurable) |
| `--slot-unavailable-bg` | `#F1F5F9` | `slate-100` | Unavailable/blocked slot background |
| `--slot-unavailable-text` | `#94A3B8` | `slate-400` | Unavailable slot text |
| `--slot-selected-bg` | `#4F46E5` | `indigo-600` | Customer-selected slot |
| `--slot-selected-text` | `#FFFFFF` | `white` | Selected slot text |

#### Semantic / Functional

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--color-success` | `#10B981` | `emerald-500` | Confirmed booking badges, success toasts |
| `--color-warning` | `#F59E0B` | `amber-500` | Expiry countdowns, pending states |
| `--color-error` | `#EF4444` | `red-500` | Error states, destructive actions |
| `--color-info` | `#3B82F6` | `blue-500` | Informational badges, help text |

#### Neutrals

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--color-bg` | `#F8FAFC` | `slate-50` | Page background |
| `--color-surface` | `#FFFFFF` | `white` | Card, modal, panel backgrounds |
| `--color-border` | `#E2E8F0` | `slate-200` | Dividers, input borders |
| `--color-border-focus` | `#4F46E5` | `indigo-600` | Input focus rings |
| `--color-text-primary` | `#0F172A` | `slate-900` | Headings, primary text |
| `--color-text-secondary` | `#475569` | `slate-600` | Body text, descriptions |
| `--color-text-muted` | `#94A3B8` | `slate-400` | Placeholders, disabled text, captions |

### 1.3 Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | `Inter, system-ui, sans-serif` | All body + UI text |
| `--font-heading` | `Inter, system-ui, sans-serif` | Headings (weight 600–700) |
| `--font-mono` | `JetBrains Mono, monospace` | Time slots, slugs, code |

| Scale | Size | Weight | Line-height | Usage |
|-------|------|--------|-------------|-------|
| `text-3xl` | 30px | 700 | 1.2 | Page titles (dashboard H1) |
| `text-2xl` | 24px | 600 | 1.25 | Section headings |
| `text-xl` | 20px | 600 | 1.4 | Card titles, modal headings |
| `text-lg` | 18px | 500 | 1.5 | Sub-section labels |
| `text-base` | 16px | 400 | 1.6 | Body copy, form labels |
| `text-sm` | 14px | 400 | 1.5 | Secondary labels, table cells |
| `text-xs` | 12px | 400 | 1.4 | Badges, captions, timestamps |

### 1.4 Spacing Scale

Tailwind v4 default; key tokens:

| Token | px | Usage |
|-------|----|-------|
| `spacing-1` | 4px | Icon gaps |
| `spacing-2` | 8px | Inline padding, compact |
| `spacing-3` | 12px | Form field padding |
| `spacing-4` | 16px | Component internal padding |
| `spacing-6` | 24px | Between form fields |
| `spacing-8` | 32px | Section spacing |
| `spacing-12` | 48px | Page section gaps |
| `spacing-16` | 64px | Hero / large section padding |

### 1.5 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Badges, small tags |
| `rounded-md` | 6px | Buttons, inputs, chips |
| `rounded-lg` | 8px | Cards, modals |
| `rounded-xl` | 12px | Large cards, calendar container |
| `rounded-full` | 9999px | Avatars, pill badges |

*Note: Calendar border-radius is merchant-configurable via Design module (see Flow F).*

### 1.6 Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Inputs, subtle elements |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Cards, dropdowns |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.10)` | Modals, popovers |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.12)` | Floating panels |

### 1.7 Motion / Transitions

| Property | Value | Usage |
|----------|-------|-------|
| Transition default | `150ms ease-in-out` | Hover/focus state transitions |
| Transition slow | `300ms ease-in-out` | Modal appear, panel slide |
| Transition instant | `75ms ease` | Toggle switches |

---

## 2. Screen Inventory

### Admin Panel (merchant-facing, authenticated)

| ID | Screen | Route | Notes |
|----|--------|-------|-------|
| A01 | Registration | `/register` | Public |
| A02 | Login | `/login` | Public |
| A03 | Dashboard — Calendar View | `/admin` | Default |
| A04 | Dashboard — List View | `/admin?view=list` | Toggle |
| A05 | Booking Detail / Edit Modal | overlay on A03/A04 | |
| A06 | Staff List | `/admin/staff` | |
| A07 | Staff Add / Edit | `/admin/staff/new`, `/admin/staff/:id` | |
| A08 | Staff Availability | `/admin/staff/:id/availability` | |
| A09 | Services List | `/admin/services` | |
| A10 | Service Add / Edit | Modal or page | |
| A11 | Customer List | `/admin/customers` | |
| A12 | Customer Detail | `/admin/customers/:id` | |
| A13 | Design | `/admin/design` | With live preview |
| A14 | Settings | `/admin/settings` | Tabbed |

### Customer-Facing (public, no auth)

| ID | Screen | Route | Notes |
|----|--------|-------|-------|
| C01 | Booking Home | `{slug}.platform.com/` | Staff + Service selection |
| C02 | Time Slot Picker | Same page, step 3 | Appears after selection |
| C03 | Booking Form | Same page, step 4 | Inline below calendar |
| C04 | Booking Confirmed | `{slug}.platform.com/confirmed` | Receipt page |
| C05 | Cancel Confirmation | `{slug}.platform.com/cancel/:token` | |
| C06 | Cancel Success | After cancel action | Minimal, no rebook |
| C07 | Cancel Expired | Same route, expired token | |

---

## 3. Flow A — Merchant Registration

### 3.1 Flow Map

```
[Marketing Landing] → [Register Page] → [Slug Availability Check]
                                              ↓
                                     [Submit Form] → [Database Provisioned]
                                                            ↓
                                              [Admin Dashboard (empty state)]
```

### 3.2 Registration Page Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│                         ◆ BookFlow                              │
│                  Launch your booking page in minutes            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Create your account                    │   │
│  │                                                          │   │
│  │  Business name                                           │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  e.g. Glamour Studio                               │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │  Your booking page address                               │   │
│  │  ┌─────────────────────────────────────┐ .platform.com  │   │
│  │  │  glamour-studio          ✓ Available │                │   │
│  │  └─────────────────────────────────────┘                │   │
│  │  ↑ 400ms debounce real-time check. Shows:               │   │
│  │    ✓ Available (green)                                   │   │
│  │    ✗ Already taken (red)                                 │   │
│  │    ⏳ Checking… (loading spinner)                        │   │
│  │                                                          │   │
│  │  Email address                                           │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  admin@glamourstudio.com                           │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │  Password                                                │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  ••••••••••••                              [👁 show]│  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  Minimum 8 characters                                    │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │        Create account & go live →                  │  │   │  ← primary indigo button
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │  Already have an account? Sign in                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Slug Validation States

| State | UI Indicator | Notes |
|-------|-------------|-------|
| Empty | No indicator | Show placeholder `e.g. my-business` |
| Typing | Neutral border | Debounce 400ms |
| Checking | `⏳ Checking…` spinner | API call in flight |
| Available | `✓ Available` — green text + border | Submit button enabled |
| Taken | `✗ glamour-studio is taken` — red text + border | Submit button disabled |
| Invalid format | `Only letters, numbers, hyphens. 3–30 chars.` — red | Client-side validation |

### 3.4 Post-Registration Success

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    🎉 You're live!                               │
│                                                                  │
│   Your booking page is ready at:                                │
│   glamour-studio.platform.com                    [Visit →]       │
│                                                                  │
│   ┌────────────────────────────────────────────────────────┐    │
│   │         Go to your dashboard →                        │    │
│   └────────────────────────────────────────────────────────┘    │
│                                                                  │
│   Next steps:                                                    │
│   ○ Add your services                                            │
│   ○ Add your staff                                               │
│   ○ Share your booking link                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Flow B — Admin Dashboard

### 4.1 Global Admin Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ◆ BookFlow  │  glamour-studio.platform.com [↗]       [Account ▾]  [Logout] │  ← topbar
├─────────────────────────────────────────────────────────────────────────────┤
│         │                                                                    │
│  ◼ Dash  │                    MAIN CONTENT AREA                              │
│  👥 Staff │                                                                  │
│  🛍 Svcs  │                                                                  │
│  👤 Cust  │                                                                  │
│  🎨 Design│                                                                  │
│  ⚙ Sett  │                                                                  │
│         │                                                                    │
│  [180px] │                  [remaining viewport width]                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Sidebar details:**
- Width: 180px (collapsed to icon-only 56px on tablet)
- Background: `slate-900` (dark sidebar) with white text
- Active item: `indigo-600` left border + `indigo-900` background tint
- Hover: `slate-800` background
- Bottom: Avatar + account name

### 4.2 Dashboard — Calendar View (default)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Dashboard                              [+ New booking]  [📅 Calendar] [≡ List] │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  ◄ May 2026                   June 2026                  July 2026 ►    │
│  ┌────┬────┬────┬────┬────┬────┬────┐                                   │
│  │ Mo │ Tu │ We │ Th │ Fr │ Sa │ Su │                                   │
│  ├────┼────┼────┼────┼────┼────┼────┤                                   │
│  │  1 │  2 │  3 │  4 │  5 │  6 │  7 │                                   │
│  │    │ ●2 │    │ ●1 │    │    │    │  ● = booking dot (indigo)         │
│  ├────┼────┼────┼────┼────┼────┼────┤                                   │
│  │  8 │  9 │ 10 │[11]│ 12 │ 13 │ 14 │  [today] = indigo bg             │
│  │ ●3 │    │ ●1 │    │ ●2 │    │    │                                   │
│  ├────┼────┼────┼────┼────┼────┼────┤                                   │
│  │ 15 │ 16 │ 17 │ 18 │ 19 │ 20 │ 21 │                                   │
│  │    │ ●4 │    │ ●2 │    │    │    │                                   │
│  └────┴────┴────┴────┴────┴────┴────┘                                   │
│                                                                          │
│  [Click any date with bookings → expand day panel below]                │
│                                                                          │
│  ▼ Tuesday 9 June 2026  (2 bookings)                                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  10:00 AM │ Sarah Chen   │ Haircut (45min)   │ Alice (Staff)  │ ⋮ │  │
│  │  11:30 AM │ Tom Baker    │ Beard Trim (30min)│ Bob (Staff)    │ ⋮ │  │
│  └─────────────────────────────────────────────────────────────────┘    │
│  [⋮ action menu: View details | Edit | Reschedule | Cancel booking]     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Dashboard — List View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Dashboard                              [+ New booking]  [📅 Calendar] [≡ List] │
│                                                                          │
│  Filter: [All ▾]  [Any Staff ▾]  [Any Service ▾]  [Date range ▾]  [🔍] │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  ┌──┬──────────────────┬───────────────┬────────────────┬──────┬──────┐ │
│  │  │ Customer         │ Date & Time   │ Service        │ Staff│      │ │
│  ├──┼──────────────────┼───────────────┼────────────────┼──────┼──────┤ │
│  │✓ │ Sarah Chen       │ Jun 9, 10:00  │ Haircut (45m)  │Alice │  ⋮   │ │
│  │  │ sarah@email.com  │               │ $45            │      │      │ │
│  ├──┼──────────────────┼───────────────┼────────────────┼──────┼──────┤ │
│  │✓ │ Tom Baker        │ Jun 9, 11:30  │ Beard Trim     │ Bob  │  ⋮   │ │
│  │  │ tom@email.com    │               │ $25            │      │      │ │
│  ├──┼──────────────────┼───────────────┼────────────────┼──────┼──────┤ │
│  │✗ │ Lisa Park        │ Jun 8, 14:00  │ Colour (120m)  │Alice │  —   │ │  ← cancelled
│  │  │ lisa@email.com   │ CANCELLED     │ $120           │      │      │ │
│  └──┴──────────────────┴───────────────┴────────────────┴──────┴──────┘ │
│                                                                          │
│  Showing 1–25 of 47   [← Prev]  Page 1 of 2  [Next →]                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Booking Detail / Edit Modal

```
┌─────────────────────────────────────────────────────────────────────┐
│  Booking #1042                                          [✕ Close]   │
│  ─────────────────────────────────────────────────────────────────  │
│  ● Confirmed                                                        │
│                                                                     │
│  Customer         Sarah Chen                                        │
│  Email            sarah@email.com   [✉ Resend confirmation]        │
│  Phone            +65 9123 4567                                     │
│  Verified         ✓ Email verified                                  │
│                                                                     │
│  Service          Haircut (45 min)  |  $45                         │
│  Staff            Alice Tan                                         │
│  Date & Time      Tuesday, 9 June 2026  10:00 AM – 10:45 AM        │
│  Booked at        7 June 2026, 9:14 AM                              │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│  [✎ Edit directly]   [↺ Reschedule]   [✕ Cancel booking]          │
│                                                                     │
│  Note: Rescheduling will send an automatic email to the customer.  │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.5 Reschedule Flow (within modal)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Reschedule booking #1042                              [✕ Close]    │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Current:  Tuesday 9 June, 10:00 AM (Alice Tan — Haircut 45m)     │
│                                                                     │
│  New date  ┌───────────────────────────────┐                       │
│            │  📅 Thu, 12 June 2026          │                       │
│            └───────────────────────────────┘                       │
│                                                                     │
│  Available slots for Alice Tan:                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│  │ 09:00 AM│  │ 10:00 AM│  │ 02:00 PM│  │ 04:00 PM│              │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘              │
│                                                                     │
│  ⚠ Customer will receive a rescheduling email automatically.       │
│    No re-confirmation needed.                                       │
│                                                                     │
│  [Cancel]                         [Confirm reschedule →]           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Flow C — Staff Management

### 5.1 Staff List

```
┌─────────────────────────────────────────────────────────────────────┐
│  Staff                                              [+ Add staff]   │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ┌──────────┬─────────────────────────┬──────────────┬───────────┐ │
│  │          │                         │              │           │ │
│  │  [photo] │ Alice Tan               │ +65 9111 2222│  ⋮        │ │
│  │          │ alice@glamourstudio.com │              │           │ │
│  ├──────────┼─────────────────────────┼──────────────┼───────────┤ │
│  │  [photo] │ Bob Lim                 │ +65 9333 4444│  ⋮        │ │
│  │          │ bob@glamourstudio.com   │              │           │ │
│  ├──────────┼─────────────────────────┼──────────────┼───────────┤ │
│  │  [photo] │ Carol Wong              │ +65 9555 6666│  ⋮        │ │
│  │          │ carol@glamourstudio.com │              │           │ │
│  └──────────┴─────────────────────────┴──────────────┴───────────┘ │
│                                                                     │
│  [⋮ menu: Edit profile | Manage availability | Block dates | Remove]│
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Add / Edit Staff

```
┌─────────────────────────────────────────────────────────────────────┐
│  Add staff member                                      [✕ Close]   │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Photo           ┌───────────────────┐                             │
│                  │  [avatar circle]  │  [Upload photo]             │
│                  │      + Add        │                             │
│                  └───────────────────┘                             │
│                                                                     │
│  Full name       ┌───────────────────────────────────────────────┐ │
│                  │  Alice Tan                                     │ │
│                  └───────────────────────────────────────────────┘ │
│                                                                     │
│  Contact number  ┌───────────────────────────────────────────────┐ │
│                  │  +65 9111 2222                                 │ │
│                  └───────────────────────────────────────────────┘ │
│                                                                     │
│  Email (optional)┌───────────────────────────────────────────────┐ │
│                  │  alice@glamourstudio.com                       │ │
│                  └───────────────────────────────────────────────┘ │
│                                                                     │
│  Show on booking page   [● ON]                                      │  ← toggle, per Settings
│                                                                     │
│  [Cancel]                                        [Save staff →]    │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3 Availability Configuration

```
┌─────────────────────────────────────────────────────────────────────┐
│  Alice Tan — Availability                          [← Back to Staff]│
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Working hours                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Mon  [● ON]   09:00 ▾  to  18:00 ▾                        │   │
│  │  Tue  [● ON]   09:00 ▾  to  18:00 ▾                        │   │
│  │  Wed  [● ON]   09:00 ▾  to  18:00 ▾                        │   │
│  │  Thu  [● ON]   09:00 ▾  to  18:00 ▾                        │   │
│  │  Fri  [● ON]   09:00 ▾  to  17:00 ▾                        │   │
│  │  Sat  [○ OFF]                                               │   │
│  │  Sun  [○ OFF]                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Max concurrent bookings per slot                                   │
│  ┌────────────────────┐                                             │
│  │  1  [− / +]       │  (1 = exclusive slot; 2+ = group booking)  │
│  └────────────────────┘                                             │
│                                                                     │
│  Blocked dates                       [+ Block a date range]        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  📅 20 Jun – 27 Jun 2026   Annual leave        [✕ Remove]   │   │
│  │  📅 15 Jul 2026            MC (sick day)        [✕ Remove]   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [Save availability →]                                              │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.4 Block Date Modal

```
┌──────────────────────────────────────────────────┐
│  Block dates for Alice Tan          [✕ Close]     │
│  ──────────────────────────────────────────────   │
│                                                   │
│  Type     ○ Single day  ● Date range              │
│                                                   │
│  From     ┌─────────────────────┐                 │
│           │  📅 20 June 2026     │                 │
│           └─────────────────────┘                 │
│  To       ┌─────────────────────┐                 │
│           │  📅 27 June 2026     │                 │
│           └─────────────────────┘                 │
│                                                   │
│  Reason   ┌─────────────────────────────────────┐ │
│           │  Annual leave                       │ │
│           └─────────────────────────────────────┘ │
│  (Optional — internal note only)                  │
│                                                   │
│  [Cancel]                    [Block dates →]      │
└──────────────────────────────────────────────────┘
```

---

## 6. Flow D — Services Management

### 6.1 Services List

```
┌─────────────────────────────────────────────────────────────────────┐
│  Services                                       [+ Add service]     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ┌────────────────────────────┬──────────┬──────────┬────┬────────┐ │
│  │ Service name               │ Duration │ Price    │ On │        │ │
│  ├────────────────────────────┼──────────┼──────────┼────┼────────┤ │
│  │ Haircut                    │ 45 min   │ $45.00   │ ● │  ⋮     │ │
│  │ Beard Trim                 │ 30 min   │ $25.00   │ ● │  ⋮     │ │
│  │ Hair Colour (full)         │ 120 min  │ $120.00  │ ● │  ⋮     │ │
│  │ Hair Colour (partial)      │ 90 min   │ $85.00   │ ○ │  ⋮     │ │  ← disabled, hidden from booking
│  └────────────────────────────┴──────────┴──────────┴────┴────────┘ │
│  ● = enabled (visible on booking page)                              │
│  ○ = disabled (hidden from booking page)                            │
│                                                                     │
│  [⋮ menu: Edit | Disable / Enable | Delete]                         │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Add / Edit Service

```
┌──────────────────────────────────────────────────┐
│  Add service                        [✕ Close]    │
│  ──────────────────────────────────────────────   │
│                                                   │
│  Service name                                     │
│  ┌────────────────────────────────────────────┐   │
│  │  Haircut                                   │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  Duration                                         │
│  ┌────────────────────────────────────────────┐   │
│  │  45 min                              [▾]   │   │  ← select or number input
│  └────────────────────────────────────────────┘   │
│  Duration controls slot length on booking page    │
│                                                   │
│  Price (optional)                                 │
│  ┌────────────────────────────────────────────┐   │
│  │  $ 45.00                                   │   │
│  └────────────────────────────────────────────┘   │
│  Leave blank to hide price from booking page      │
│                                                   │
│  Description (optional)                           │
│  ┌────────────────────────────────────────────┐   │
│  │  Includes wash, cut, and blowdry.          │   │
│  │                                            │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  Show on booking page   [● ON]                    │
│                                                   │
│  [Cancel]                    [Save service →]     │
└──────────────────────────────────────────────────┘
```

---

## 7. Flow E — Customer Management

### 7.1 Customer List

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Customers                                                              │
│  [🔍 Search by name, email…]            Filter: [All ▾] [Verified ▾]   │
│  ───────────────────────────────────────────────────────────────────    │
│                                                                         │
│  ┌──────────────────────┬──────────────┬──────────┬────────┬──────────┐ │
│  │ Name / Email         │ Phone        │ Bookings │ Status │          │ │
│  ├──────────────────────┼──────────────┼──────────┼────────┼──────────┤ │
│  │ Sarah Chen           │ +65 9123 4567│    8     │ ✓ Verified │  ⋮   │ │
│  │ sarah@email.com      │              │          │        │          │ │
│  ├──────────────────────┼──────────────┼──────────┼────────┼──────────┤ │
│  │ Tom Baker            │ +65 9876 5432│    3     │ ◐ Guest│  ⋮       │ │
│  │ tom@email.com        │              │          │        │          │ │
│  ├──────────────────────┼──────────────┼──────────┼────────┼──────────┤ │
│  │ Lisa Park            │ +65 9111 0000│    1     │ ◐ Guest│  ⋮       │ │
│  │ lisa@email.com       │              │          │        │          │ │
│  └──────────────────────┴──────────────┴──────────┴────────┴──────────┘ │
│                                                                         │
│  ✓ Verified = clicked verification link in confirmation email           │
│  ◐ Guest    = booked but has not clicked verification link              │
│                                                                         │
│  [⋮ menu: View history | Resend confirmation email | Send offer email | ]│
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Customer Detail Panel

```
┌─────────────────────────────────────────────────────────────────────┐
│  Sarah Chen                                         [✕ Close]       │
│  ─────────────────────────────────────────────────────────────────  │
│  sarah@email.com  ·  +65 9123 4567  ·  ✓ Verified                  │
│                                                                     │
│  [✉ Resend confirmation]  [✉ Send offer email]                      │
│                                                                     │
│  Booking history (8 bookings)                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  ✓ Jun 9, 10:00 AM   Haircut (Alice)           Confirmed     │   │
│  │  ✓ May 15, 2:00 PM   Hair Colour (Alice)       Confirmed     │   │
│  │  ✗ Apr 20, 11:00 AM  Beard Trim (Bob)          Cancelled     │   │
│  │  ✓ Mar 3, 9:00 AM    Haircut (Alice)            Confirmed    │   │
│  │                                              [Show more ▾]   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.3 Send Offer Email Modal

```
┌──────────────────────────────────────────────────┐
│  Send offer email                   [✕ Close]    │
│  ──────────────────────────────────────────────   │
│                                                   │
│  To   ● Sarah Chen (sarah@email.com)              │
│       ○ All customers (47)                        │
│       ○ Verified customers only (32)              │
│                                                   │
│  Subject                                          │
│  ┌────────────────────────────────────────────┐   │
│  │  Special offer — 20% off this week!        │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  Message body                                     │
│  ┌────────────────────────────────────────────┐   │
│  │  Hi {first_name},                          │   │
│  │  We're running a special for loyal         │   │
│  │  clients. Book this week and get 20% off.  │   │
│  │  [Book now] → link to booking page         │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  ⚠ This sends immediately via SendGrid            │
│                                                   │
│  [Cancel]                    [Send email →]       │
└──────────────────────────────────────────────────┘
```

---

## 8. Flow F — Design Customization

### 8.1 Design Module Layout (Split-Panel)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Design                                                                         │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ┌────────────────────────────────────┐  ┌──────────────────────────────────┐  │
│  │  CONTROLS (left panel, 380px)      │  │  LIVE PREVIEW (right panel)      │  │
│  │                                    │  │  (iframe of booking page)        │  │
│  │  ▸ Slot Colours                   │  │                                  │  │
│  │  ┌──────────────────────────────┐ │  │  ┌──────────────────────────┐   │  │
│  │  │ Available slot               │ │  │  │  09:00 AM                │   │  │
│  │  │  Text: [███ #065F46 ▾]       │ │  │  │  10:00 AM  ← available  │   │  │
│  │  │  Background: [███ #ECFDF5 ▾] │ │  │  │  11:00 AM                │   │  │
│  │  └──────────────────────────────┘ │  │  │  12:00 PM  ← blocked    │   │  │
│  │  ┌──────────────────────────────┐ │  │  │  01:00 PM                │   │  │
│  │  │ Unavailable slot             │ │  │  └──────────────────────────┘   │  │
│  │  │  Text: [███ #94A3B8 ▾]       │ │  │                                  │  │
│  │  │  Background: [███ #F1F5F9 ▾] │ │  │  Preview updates in real-time   │  │
│  │  └──────────────────────────────┘ │  │  as you change controls          │  │
│  │                                    │  │                                  │  │
│  │  ▸ Calendar Style                 │  │                                  │  │
│  │  ┌──────────────────────────────┐ │  │                                  │  │
│  │  │ Border width     1px  [− +]  │ │  │                                  │  │
│  │  │ Border colour    [███ #E2E8F0▾]│  │                                  │  │
│  │  │ Border radius    8px  [─────]  │  │                                  │  │  ← slider
│  │  │ Font size        14px [─────]  │  │                                  │  │
│  │  └──────────────────────────────┘ │  │                                  │  │
│  │                                    │  │                                  │  │
│  │  ▸ Business Info                  │  │                                  │  │
│  │  ┌──────────────────────────────┐ │  │                                  │  │
│  │  │ Page headline                │ │  │                                  │  │
│  │  │ ┌────────────────────────┐   │ │  │                                  │  │
│  │  │ │ Book an appointment    │   │ │  │                                  │  │
│  │  │ └────────────────────────┘   │ │  │                                  │  │
│  │  │ Sub-headline                 │ │  │                                  │  │
│  │  │ ┌────────────────────────┐   │ │  │                                  │  │
│  │  │ │ Fast, easy, online     │   │ │  │                                  │  │
│  │  │ └────────────────────────┘   │ │  │                                  │  │
│  │  └──────────────────────────────┘ │  │                                  │  │
│  │                                    │  │                                  │  │
│  │  [Save design →]                   │  │                                  │  │
│  └────────────────────────────────────┘  └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Colour Picker Component

```
┌──────────────────────────────────────────┐
│  Available slot — background colour      │
│  ┌──────────────────────────────────┐    │
│  │  [colour wheel / spectrum strip]  │    │
│  └──────────────────────────────────┘    │
│  ┌──────────┐  Opacity: [████░░] 100%   │
│  │ #ECFDF5  │                            │
│  └──────────┘                            │
│  ○ Hex  ○ RGB  ○ HSL                     │
│  [✓ Apply]                               │
└──────────────────────────────────────────┘
```

---

## 9. Flow G — Settings

### 9.1 Settings — Tabbed Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings                                                           │
│  ─────────────────────────────────────────────────────────────────  │
│  [Admin Users] [Booking Config] [Display] [Danger Zone]            │  ← tabs
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  (TAB: Admin Users)                                                 │
│                                                                     │
│  Admin accounts                              [+ Add admin]          │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │  You (owner)   admin@glamourstudio.com      Owner   —     │     │
│  │  James Yeo     james@glamourstudio.com      Admin   [✕]   │     │
│  └───────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.2 Booking Config Tab

```
│  (TAB: Booking Config)                                              │
│                                                                     │
│  Time slot duration                                                 │
│  ┌──────────────┐                                                   │
│  │  30 min [▾]  │  ← affects how slots are split during the day    │
│  └──────────────┘                                                   │
│  Note: Service duration controls how many slots a booking occupies. │
│                                                                     │
│  Booking expiry window                                              │
│  ┌──────────────┐                                                   │
│  │  15 min [▾]  │  (5–60 min)                                      │
│  └──────────────┘                                                   │
│  Holds slot for this many minutes after customer starts form.       │
│                                                                     │
│  [Save config →]                                                    │
```

### 9.3 Display Tab

```
│  (TAB: Display)                                                     │
│                                                                     │
│  Language           ┌──────────────────┐                           │
│                     │  English [▾]      │                           │
│                     └──────────────────┘                           │
│                                                                     │
│  Show staff on booking page                                         │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  Alice Tan     ● Show  ○ Hide                            │     │
│  │  Bob Lim       ● Show  ○ Hide                            │     │
│  │  Carol Wong    ○ Show  ● Hide                            │     │
│  └──────────────────────────────────────────────────────────┘     │
│  Hidden staff cannot be selected on the customer booking page.     │
│                                                                     │
│  [Save display settings →]                                          │
```

### 9.4 Danger Zone Tab

```
│  (TAB: Danger Zone)                                                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ⚠ Danger Zone                                              │  │
│  │                                                              │  │
│  │  Export my data            [Export all data →]               │  │
│  │  Downloads all bookings, customers, and settings as JSON.   │  │
│  │                                                              │  │
│  │  Cancel my account         [Cancel account]                  │  │  ← red destructive button
│  │  All data will be retained for 30 days then permanently     │  │
│  │  deleted. You cannot undo this action.                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
```

---

## 10. Flow H — Customer Booking Page

### 10.1 Page Shell (`{slug}.platform.com`)

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                       Glamour Studio                                 │
│                  Book an appointment online                          │  ← merchant's headline
│                                                                      │
│  ───────────────────────────────────────────────────────────────     │
│                                                                      │
│  [  STEP 1 — SELECT STAFF      ]  →  STEP 2 — SELECT SERVICE        │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  [photo]         │  │  [photo]         │  │  [photo]         │   │
│  │  Alice Tan       │  │  Bob Lim         │  │  Carol Wong      │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
│  (click to select — selected card gets indigo ring + checkmark)      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 10.2 Staff Selected → Service Selection

```
┌──────────────────────────────────────────────────────────────────────┐
│                       Glamour Studio                                 │
│                  Book an appointment online                          │
│  ───────────────────────────────────────────────────────────────     │
│                                                                      │
│  STEP 1 — STAFF ✓          [  STEP 2 — SELECT SERVICE  ]            │
│  ┌──────────┐  Alice Tan  ✓                                          │
│  │ [photo]  │  [Change]                                              │
│  └──────────┘                                                        │
│                                                                      │
│  ┌──────────────────────────────────────────┐                        │
│  │  Haircut                      45 min  $45│  ← selectable card    │
│  └──────────────────────────────────────────┘                        │
│  ┌──────────────────────────────────────────┐                        │
│  │  Hair Colour (full)          120 min $120│                        │
│  └──────────────────────────────────────────┘                        │
│  ┌──────────────────────────────────────────┐                        │
│  │  Beard Trim                   30 min  $25│                        │
│  └──────────────────────────────────────────┘                        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 10.3 Service Selected → Time Slot Picker

```
┌──────────────────────────────────────────────────────────────────────┐
│                       Glamour Studio                                 │
│  ───────────────────────────────────────────────────────────────     │
│                                                                      │
│  STEP 1 ✓ Alice Tan [Change]   STEP 2 ✓ Haircut – 45min [Change]    │
│                                                                      │
│  STEP 3 — PICK A DATE & TIME                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │               ◄  June 2026  ►                                  │  │
│  │  Mo  Tu  We  Th  Fr  Sa  Su                                    │  │
│  │                      1   2   3   4   5   6   7                 │  │
│  │   8   9  10  11  12  13  14                                    │  │
│  │  15  16  17  18  19  20  21                                    │  │
│  │  22  23  24  25  26  27  28                                    │  │
│  │  29  30                                                        │  │
│  │                                                                │  │
│  │  [past dates greyed + not clickable]                           │  │
│  │  [dates with availability = normal text]                        │  │
│  │  [fully booked dates = strikethrough or muted]                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Available times for Monday 8 June (Alice Tan — Haircut 45m)        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ 09:00 AM│ │ 09:45 AM│ │ 10:30 AM│ │ 02:00 PM│ │ 02:45 PM│      │  ← merchant-styled green bg
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                                      │
│  ┌─────────┐ ← selected slot (indigo)                               │
│  │ 10:30 AM│                                                        │
│  └─────────┘                                                        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 10.4 Booking Form (Step 4)

```
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 4 — YOUR DETAILS                                               │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Summary                                                     │   │
│  │  👤 Alice Tan  ·  ✂ Haircut (45 min)  ·  Mon 8 Jun 10:30 AM │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  First name *                                                        │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  Sarah                                                     │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  Email address *                                                     │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  sarah@email.com                                           │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  Contact number *                                                    │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  +65 9123 4567                                             │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ⏱ Slot held for 14:32  (15-min window set by merchant)             │  ← countdown
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │              Confirm booking →                             │     │  ← primary button
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  By booking, you agree to our cancellation policy.                   │
└──────────────────────────────────────────────────────────────────────┘
```

### 10.5 Booking Confirmed Page

```
┌──────────────────────────────────────────────────────────────────────┐
│                       Glamour Studio                                 │
│  ───────────────────────────────────────────────────────────────     │
│                                                                      │
│                    ✅  Booking confirmed!                            │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Booking receipt                                             │   │
│  │                                                              │   │
│  │  Staff        Alice Tan                                      │   │
│  │  Service      Haircut (45 min)   ·   $45                     │   │
│  │  Date         Monday, 8 June 2026                            │   │
│  │  Time         10:30 AM – 11:15 AM                           │   │
│  │                                                              │   │
│  │  Name         Sarah Chen                                    │   │
│  │  Email        sarah@email.com                               │   │
│  │  Phone        +65 9123 4567                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  A confirmation email has been sent to sarah@email.com              │
│  It contains a link to cancel this booking if needed.               │
│                                                                      │
│  ← Back to Glamour Studio                                           │  ← link back to home (NOT a rebook CTA)
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 11. Flow I — Booking Cancellation

### 11.1 Cancel Link Landing (valid — before appointment time)

```
┌──────────────────────────────────────────────────────────────────────┐
│                       Glamour Studio                                 │
│  ───────────────────────────────────────────────────────────────     │
│                                                                      │
│  Cancel your booking                                                 │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Your booking details                                        │   │
│  │                                                              │   │
│  │  Staff        Alice Tan                                      │   │
│  │  Service      Haircut (45 min)                               │   │
│  │  Date         Monday, 8 June 2026                            │   │
│  │  Time         10:30 AM – 11:15 AM                           │   │
│  │  Name         Sarah Chen                                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Are you sure you want to cancel this booking?                       │
│                                                                      │
│  [Keep my booking]              [Yes, cancel this booking]          │  ← destructive secondary
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 11.2 Cancellation Success (no rebook CTA)

```
┌──────────────────────────────────────────────────────────────────────┐
│                       Glamour Studio                                 │
│  ───────────────────────────────────────────────────────────────     │
│                                                                      │
│                    ✓  Booking cancelled                              │
│                                                                      │
│  Your booking has been cancelled and the time slot                   │
│  is now available for others.                                        │
│                                                                      │
│  Booking reference:  #1042                                          │
│  Date:               Monday, 8 June 2026, 10:30 AM                  │
│                                                                      │
│  ← Return to Glamour Studio homepage                                │  ← ONLY action; NO "Book again" CTA
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 11.3 Cancel Link Expired (at/after appointment start time)

```
┌──────────────────────────────────────────────────────────────────────┐
│                       Glamour Studio                                 │
│  ───────────────────────────────────────────────────────────────     │
│                                                                      │
│                    ⏱  This link has expired                         │
│                                                                      │
│  This cancellation link is no longer valid because the              │
│  appointment time has already passed.                                │
│                                                                      │
│  Booking reference:  #1042                                          │
│  Appointment was:    Monday, 8 June 2026, 10:30 AM                  │
│                                                                      │
│  If you need assistance, please contact Glamour Studio directly.    │
│  [merchant contact info if configured]                              │
│                                                                      │
│  ← Return to homepage                                               │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 12. Component States

### 12.1 Time Slot Button States

| State | Visual Treatment |
|-------|-----------------|
| Available (default) | Merchant-configured bg/text (default: emerald-50 bg, emerald-800 text) |
| Hover | 5% darker bg, cursor pointer |
| Selected | `--slot-selected-bg` (indigo-600) bg + white text + checkmark icon |
| Unavailable | `--slot-unavailable-bg` (slate-100) bg + slate-400 text + cursor not-allowed |
| Loading | Skeleton shimmer animation |
| Past time | Same as Unavailable, visually identical |

### 12.2 Booking Status Badges

| Status | Badge Color | Label |
|--------|------------|-------|
| Confirmed | Emerald (green) | ● Confirmed |
| Cancelled (customer) | Slate | ✕ Cancelled |
| Cancelled (admin) | Slate | ✕ Cancelled (admin) |
| Rescheduled | Blue | ↺ Rescheduled |
| Past / Completed | Slate-lighter | ✓ Completed |

### 12.3 Customer Verification Badges

| State | Badge | Color |
|-------|-------|-------|
| Verified | ✓ Verified | Emerald |
| Guest (unverified) | ◐ Guest | Slate/Amber |

### 12.4 Slug Availability States (Registration)

| State | Input border | Indicator text | Color |
|-------|-------------|----------------|-------|
| Idle / empty | Slate-200 | none | — |
| Typing (debounce) | Slate-300 | none | — |
| Checking | Slate-300 | ⏳ Checking… | Slate-400 |
| Available | Emerald-400 | ✓ Available | Emerald-600 |
| Taken | Red-400 | ✗ Already taken | Red-600 |
| Invalid (format) | Red-400 | ⚠ Letters, numbers, hyphens only (3–30 chars) | Red-600 |

### 12.5 Form Input States

| State | Border | Background | Notes |
|-------|--------|------------|-------|
| Default | Slate-200 | White | `shadow-sm` |
| Focus | Indigo-500 (2px ring) | White | `ring-2 ring-indigo-500` |
| Error | Red-500 | Red-50 | + error message below |
| Disabled | Slate-100 | Slate-50 | `cursor-not-allowed` |
| Success | Emerald-500 | White | Short-lived confirmation |

### 12.6 Expiry Countdown

- **Displayed on**: booking form (step 4) when a slot is held
- **Format**: `⏱ Slot held for MM:SS`
- **Colour transitions**: 
  - >5 min: Slate-600 (neutral)
  - 1–5 min: Amber-600 (warning)
  - <1 min: Red-600 (urgent)
- **On expiry**: toast notification "Your held slot has expired. Please select a new time." + slot grid re-appears

### 12.7 Toast Notifications (admin panel)

| Type | Icon | Accent |
|------|------|--------|
| Success | ✓ | Emerald-500 left border |
| Error | ✕ | Red-500 left border |
| Info | ℹ | Blue-500 left border |
| Warning | ⚠ | Amber-500 left border |

Auto-dismiss: 4 seconds. Dismissable by click. Stack max 3, FIFO.

---

## 13. Responsive Layout

### 13.1 Breakpoints

| Name | Width | Notes |
|------|-------|-------|
| Mobile | < 640px | Admin panel collapses to top nav + bottom tab bar |
| Tablet | 640px – 1024px | Admin sidebar icon-only (56px), design panel stacked |
| Desktop | > 1024px | Full sidebar (180px), split panels, calendar+list full |

### 13.2 Admin Panel — Mobile Adaptation

```
Mobile admin (< 640px):
┌──────────────────────────────────┐
│  ◆ BookFlow     [Menu ≡]         │  ← topbar only
├──────────────────────────────────┤
│                                  │
│  MAIN CONTENT (full width)       │
│                                  │
│  Calendar renders as:            │
│  - Week view (not month)         │
│  - Day taps open booking list    │
│                                  │
├──────────────────────────────────┤
│  🏠 Dashboard │ Staff │ More     │  ← bottom tab bar
└──────────────────────────────────┘
```

### 13.3 Customer Booking Page — Mobile

- Single-column layout
- Staff cards: 2-per-row grid on mobile, 3-per-row on desktop
- Service cards: full-width
- Time slots: 3-per-row grid (flex-wrap)
- Calendar: full-width, 7-column grid
- Form: full-width single column
- No split panels — sequential vertical flow

---

## 14. Interaction Notes

### 14.1 Slug Real-Time Availability Check
- **Debounce**: 400ms after last keystroke
- **Min length to trigger**: 3 characters
- **API**: `GET /api/check-slug?slug=xxx`
- **Response time target**: <300ms (show spinner if >300ms)
- **Do not** submit the form if slug unavailable — button stays disabled

### 14.2 Calendar Date Selection (Customer)
- Past dates: `pointer-events: none`, visual dimming
- Clicking a date re-fetches available slots for that date + selected staff + service duration
- Slots are computed server-side: working hours − blocked dates − existing bookings
- Slot duration granularity = merchant's configured slot duration (e.g. 30 min increments)
- Service duration consumes consecutive slots (e.g. 90-min service at 10:00 blocks 10:00, 10:30, 11:00)

### 14.3 Slot Hold / Expiry
- **Trigger**: customer submits booking form (not slot selection)  
  *(rationale: holding on slot-click causes false scarcity; hold only when form begins)*
- **Actually**: per requirements, expiry window is configured but the booking is confirmed on submission — the "expiry window" is really a UX note that the slot shown may have been taken by the time they submit. Consider the expiry timer as the suggested max time to complete the form.
- **Resolution**: If slot was taken by another customer before form submit, return error with "Sorry, this slot was just taken. Please choose another time." and bounce back to step 3.

### 14.4 Admin Reschedule Email Behaviour
- Email sends automatically and immediately after admin confirms reschedule
- No "send email" toggle for admin — it always sends (non-optional)
- Email subject: `Your booking at {business} has been rescheduled`
- Cancel link NOT included in rescheduling email — admin-initiated change is final; customer who wants to cancel after a reschedule must use their original confirmation email's cancel link (or merchant provides a new one)

### 14.5 Cancel Link Token
- Format: HMAC-SHA256 signed JWT or opaque UUID tied to booking record
- Validation: token matches booking record + `current_time < booking.start_time`
- Edge case: customer cancels at `T = booking.start_time - 1 second` → cancellation succeeds
- Edge case: customer cancels at `T = booking.start_time` → returns expired page
- Rate limit: max 10 cancel attempts per token per hour to prevent brute-force

### 14.6 Booking Page Progressive Disclosure
- Step 3 (calendar) is hidden until BOTH staff AND service are selected
- Changing staff resets service and calendar
- Changing service resets calendar (but keeps staff selection)
- URL state: use query params (`?staff=alice&service=haircut&date=2026-06-08`) so deep links work and browser back works

### 14.7 Empty States

| Screen | Empty State Message |
|--------|---------------------|
| Dashboard (no bookings) | "No bookings yet. Share your booking page to get started." + [Copy link] button |
| Staff list (none added) | "Add your first staff member to start taking bookings." + [+ Add staff] button |
| Services list (none) | "Add services so customers know what to book." + [+ Add service] button |
| Customer list (none) | "Customer records appear here after your first booking." |
| Slot picker (no slots) | "No available slots on this date. Try another date or contact the business." |

---

## 15. Email Template Layouts

*Note: All emails sent via SendGrid. Plain HTML emails with inline CSS for maximal client compatibility.*

### 15.1 Booking Confirmation (to Customer)

```
┌─────────────────────────────────────────────────────┐
│  [Business Logo/Name]                               │
│                                                     │
│  ✅ Booking confirmed                               │
│                                                     │
│  Hi Sarah,                                          │
│  Your appointment at Glamour Studio is confirmed.   │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  📍 Staff:    Alice Tan                       │  │
│  │  ✂ Service:  Haircut (45 min)                 │  │
│  │  📅 Date:     Monday, 8 June 2026             │  │
│  │  ⏰ Time:     10:30 AM – 11:15 AM             │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  Need to cancel?                                    │
│  [Cancel my booking →]   ← signed cancel link       │
│  (This link is valid until your appointment time)   │
│                                                     │
│  See you soon!                                      │
│  The Glamour Studio team                            │
└─────────────────────────────────────────────────────┘
```

### 15.2 Rescheduling Notification (to Customer)

```
│  ↺ Your booking has been rescheduled               │
│                                                     │
│  Hi Sarah, we've updated your appointment.          │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  New Date:  Wednesday, 12 June 2026           │  │
│  │  New Time:  2:00 PM – 2:45 PM                │  │
│  │  Staff:     Alice Tan                         │  │
│  │  Service:   Haircut (45 min)                  │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  If you have questions, contact Glamour Studio.     │
```

### 15.3 Cancellation Confirmation (to Customer)

```
│  ✕ Booking cancelled                               │
│                                                     │
│  Hi Sarah, your booking has been cancelled.         │
│                                                     │
│  Haircut · Monday 8 June · 10:30 AM                │
│                                                     │
│  The time slot has been released.                   │
│  [← Visit Glamour Studio]   ← NOT a "rebook" CTA   │
```

### 15.4 New Booking Notification (to Merchant)

```
│  📅 New booking received                           │
│                                                     │
│  Customer:  Sarah Chen (sarah@email.com)            │
│  Service:   Haircut (45 min)                        │
│  Staff:     Alice Tan                               │
│  Date/Time: Monday 8 June 2026, 10:30 AM            │
│  Phone:     +65 9123 4567                           │
│                                                     │
│  [View in dashboard →]                              │
```

### 15.5 Cancellation Alert (to Merchant)

```
│  ✕ Booking cancelled by customer                   │
│                                                     │
│  Customer:  Sarah Chen                              │
│  Service:   Haircut (45 min)  ·  Alice Tan          │
│  Was:       Monday 8 June 2026, 10:30 AM            │
│                                                     │
│  The slot is now available.                         │
│  [View dashboard →]                                 │
```

---

## 16. Accessibility

### 16.1 Target Standard
WCAG 2.1 AA compliance across all public-facing and admin screens.

### 16.2 Requirements

| Area | Requirement |
|------|-------------|
| Color contrast | ≥4.5:1 for all text/background combinations |
| Focus indicators | Visible `ring-2 ring-indigo-500` on all interactive elements |
| Keyboard navigation | Full tab-order on booking flow; Esc to close modals |
| ARIA labels | All icon-only buttons must have `aria-label` |
| Form errors | Errors announced via `aria-live="polite"` region |
| Calendar | Slots announced with `aria-label="10:30 AM, available"` etc. |
| Loading states | Spinners wrapped in `role="status"` + `aria-label="Loading"` |
| Modal focus trap | Focus trapped inside open modals; returns on close |
| Skip link | "Skip to main content" at top of each page |
| Semantic HTML | `<main>`, `<nav>`, `<header>`, `<button>` (not `<div>`) throughout |

### 16.3 Colour Contrast Checks (against design tokens)

| Pair | Ratio | Pass |
|------|-------|------|
| Slate-900 on White | 16.1:1 | ✓ AAA |
| Indigo-600 on White | 5.1:1 | ✓ AA |
| White on Indigo-600 | 5.1:1 | ✓ AA |
| Emerald-800 on Emerald-50 | 7.2:1 | ✓ AAA |
| Slate-400 on Slate-100 | 2.4:1 | ⚠ FAIL — use Slate-600 on Slate-100 instead |
| White on Emerald-500 | 4.6:1 | ✓ AA (marginal — test carefully) |

> **Note**: The default unavailable slot colours must use Slate-600 text (not Slate-400) to meet AA contrast on Slate-100 background. The merchant-configurable colours in the Design module should include a real-time contrast ratio warning if the chosen combo falls below 4.5:1.

---

## Appendix: Open UX Decisions

| # | Question | Recommendation |
|---|----------|----------------|
| D-01 | Where should "Any staff" option appear on booking page? | Include as first card ("No preference") — system assigns based on availability. Post-MVP. |
| D-02 | Should time slots display staff capacity (e.g. "2 spots left")? | No by default — creates scarcity pressure that may conflict with merchant's tone. Configurable. |
| D-03 | How to handle merchant with single staff member? | Skip staff selection step automatically; go directly to service selection. |
| D-04 | Should there be a booking summary sidebar sticky on desktop? | Yes — sticky mini-summary at top of booking form so customer always sees what they're booking. |
| D-05 | Should cancellation confirmation email include the original cancel link? | No — the cancel link in confirmation email already handles this; a separate "you cancelled" email has no action needed. |
| D-06 | What is the empty state for a merchant with no services added yet? | Booking page shows "Coming soon" placeholder with merchant name + "Check back later." |

---

*Design spec produced by UX/UI Designer for task MW3-0001-canvas. All primary flows covered, design tokens defined, states documented. Ready for engineering handoff.*
