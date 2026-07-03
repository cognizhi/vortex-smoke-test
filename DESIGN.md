# Design System

The app has **two visual surfaces**, each with its own design language:

1. **The platform UI** — marketing pages + the merchant admin dashboard. Uses a
   fixed, token-driven design system with light/dark modes (documented here).
2. **The public booking page** (`{slug}.<domain>`) — **per-merchant themeable**
   at runtime from the `merchant_design` table, so each business can brand its
   own calendar.

> See `PRODUCT.md` for what the product does and `ARCHITECTURE.md` for how it's
> built. Feature-level design specs live in `docs/DESIGN_SPEC_*` and
> `docs/design-*`.

---

## 1. Platform design tokens

Tokens are defined as CSS custom properties in `src/globals.css` and consumed
through Tailwind (`tailwind.config.ts`). Colors are stored as **HSL channel
triples** (`H S% L%`) and wrapped with `hsl(var(--token) / <alpha-value>)` so
Tailwind opacity utilities work.

### Color tokens

| Token | Tailwind class | Light (`H S% L%`) | Dark |
|-------|---------------|-------------------|------|
| `--color-background` | `bg-background` | `0 0% 100%` | `217 33% 11%` |
| `--color-foreground` | `text-foreground` | `222 84% 5%` | `210 40% 98%` |
| `--color-border` | `border-border` | `210 40% 96%` | `217 33% 20%` |
| `--color-primary` | `bg-primary` | `222 47% 11%` | `217 91% 53%` |
| `--color-primary-foreground` | `text-primary-foreground` | `210 40% 98%` | `0 0% 100%` |
| `--color-secondary` | `bg-secondary` | `210 40% 96%` | `217 33% 22%` |
| `--color-secondary-foreground` | `text-secondary-foreground` | `222 84% 5%` | `210 40% 98%` |
| `--color-accent` | `bg-accent` | `217 91% 60%` | `217 91% 60%` |
| `--color-accent-foreground` | `text-accent-foreground` | `210 40% 98%` | `0 0% 100%` |

The accent is a blue (`hsl(217 91% 60%)`) used for interactive emphasis. In light
mode `primary` is a near-black navy; in dark mode primary shifts to the blue so
buttons stay vivid on dark surfaces.

### Radius, type, spacing

| Token | Value |
|-------|-------|
| `--radius-lg` / `rounded-lg` | `0.5rem` |
| `--radius-md` / `rounded-md` | `0.375rem` |
| `--radius-sm` / `rounded-sm` | `0.25rem` |
| `--font-sans` | `system-ui, -apple-system, sans-serif` |
| `--font-mono` | `ui-monospace, monospace` |

Spacing follows Tailwind's default scale. The system font stack keeps payloads
light and renders natively per-OS.

## 2. Theming (light / dark)

Three-tier resolution in `src/globals.css`:

1. **Default** `:root` → light palette.
2. **System** `@media (prefers-color-scheme: dark)` → dark palette when the OS
   prefers dark and no explicit choice is set.
3. **Explicit override** `html.light` / `html.dark` → a user's toggle choice
   wins over the system preference.

The toggle is `components/ui/theme-toggle.tsx`, backed by
`lib/theme-context.tsx` (persists the choice and sets the `html` class).
Theme changes animate via a 200ms `background-color`/`border-color`/`color`
transition, **gated on `prefers-reduced-motion: no-preference`**.

## 3. Base element styles

Set once in the `@layer base` block:

- Every element inherits the `border-border` color.
- `body` → `bg-background text-foreground`.
- Links → `text-primary`, underline on hover (offset 4).
- Buttons → `rounded-md`, medium weight, color transitions.
- Inputs/textarea/select → `rounded-md`, bordered, `bg-background`, gray-500
  placeholder, `focus:ring-2 focus:ring-primary`.

## 4. Components

Reusable primitives follow the **shadcn/ui** pattern (Radix-style composition,
`class-variance-authority` variants, `cn()` from `lib/utils.ts` for class
merging via `tailwind-merge`):

- `components/ui/` — `button`, `card`, `theme-toggle`.
- `components/layout/` — `header`, `user-profile`.
- `components/admin/` — dashboard building blocks (`BookingListTable`,
  `AvailabilityEditor`, `RescheduleModal`, `BrandingForm`, `ServiceForm`,
  `StaffForm`, `CustomerDetail`, `AdminSidebar`, …).
- `components/profile/` — `AvatarUpload`, `ProfileCard`.

Icons come from `lucide-react`. Accessibility is a first-class concern in feature
specs (focus states, `prefers-reduced-motion`, keyboard shortcuts — see
`docs/DESIGN_SPEC_KEYBOARD_SHORTCUT_W0004.md`).

## 5. Public booking page — per-merchant theming

Unlike the platform UI, the customer-facing booking page is styled from each
merchant's **`merchant_design`** row (editable under **Admin → Design**). These
values are applied inline/as CSS variables to the calendar at render time — not
from the token file above.

| Field | Purpose | Default |
|-------|---------|---------|
| `page_headline` | Booking page title | `Book an appointment` |
| `page_subheadline` | Subtitle | `Fast, easy, online booking` |
| `slot_available_bg` | Available slot background | `#ECFDF5` (mint) |
| `slot_available_text` | Available slot text | `#065F46` (green) |
| `slot_unavailable_bg` | Unavailable slot background | `#F1F5F9` (slate-100) |
| `slot_unavailable_text` | Unavailable slot text | `#475569` (slate-600) |
| `calendar_border_width` | Calendar border (px) | `1` |
| `calendar_border_color` | Calendar border color | `#E2E8F0` (slate-200) |
| `calendar_border_radius` | Calendar corner radius (px) | `8` |
| `calendar_font_size` | Calendar font size (px) | `14` |

Merchant **branding** (`merchant_branding`: custom site name + logo/avatar) is a
separate concern from these design tokens and is managed under **Admin →
Branding**.

## 6. Conventions

- Prefer Tailwind utility classes over custom CSS; keep custom CSS minimal.
- Design tokens are the source of truth for platform-UI colors, radius, and type
  — change the token, not the call site.
- New shared UI goes in `components/ui/` following the shadcn/ui pattern; compose
  variants with `class-variance-authority`, merge classes with `cn()`.
- Respect `prefers-reduced-motion` for any animation.

---

## Changelog

### 2026-07-03 — SPRINT-0006: Variant smoke test endpoint (no design changes)

This sprint focused on adding deployment verification infrastructure. No changes to the design system, platform tokens, or visual components.

### 2026-07-03 — SPRINT-0005: Design system finalization

**No changelog entry for this sprint at time of SPRINT-0005 authoring.**

### 2026-07-03 — SPRINT-0004: Design system established

**No changelog entry for this sprint at time of SPRINT-0004 authoring.**
