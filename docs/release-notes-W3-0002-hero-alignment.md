# Release Notes — W3-0002 (Assembly): Align Home Page Hero Visuals with About Page

**Release date:** 2026-06-05  
**PR:** [#12](https://github.com/sweeho/web-app-react-typescript-nexjs-sample-3/pull/12)  
**Branch:** `feat/W3-0002-hero-visual-alignment`  
**CI:** ✅ All checks green (typecheck · lint · test · build)

---

## What changed

The home page (`/`) now shows the same fully-branded Hero section that's been live on the About page since W3-0002. Previously, first-time visitors landed on a generic Next.js starter template Hero ("Welcome to Your App"). That placeholder is gone.

### Visual changes — `src/app/page.tsx`

| Element | Before | After |
|---|---|---|
| Page background | White (default) | `#09090b` dark, `#fafafa` body text |
| Radial glow | None | Purple ellipse `rgba(124,58,237,0.15)` centred at Hero top |
| Badge pill | None | Dark pill with animated `#7c3aed` pulsing dot + "Vortex fully Autonomous!" |
| `<h1>` copy | "Welcome to Your App" | "The AI-native platform for autonomous development" |
| `<h1>` style | Plain black text | White-to-grey gradient (`#fafafa` → `#a1a1aa`) with `-webkit-text-fill-color: transparent` |
| Subheadline | "Built with Next.js 16…" (generic) | Verbatim About page tagline — 16 px, `#71717a`, max-width 560 px, line-height 1.7 |
| `@keyframes pulse` | Not present | Injected via `<style>` tag (scoped, no global conflict) |
| Footer CTA | Light-mode inline styles | Updated to dark-palette inline styles |
| Cards / buttons / nav | Unchanged | Unchanged |

---

## Why it matters

New visitors encountering the product for the first time now see consistent Vortex branding on both entry points (`/` and `/about`). The generic starter-template feel that made the home page look unfinished is eliminated.

---

## Acceptance criteria — verified ✅

- [x] Home page background is `#09090b`; body text base is `#fafafa`
- [x] Purple radial glow appears centred at the top of the Hero section
- [x] Animated badge pill with pulsing dot and "Vortex fully Autonomous!" renders above headline
- [x] `<h1>` reads "The AI-native platform for autonomous development" with gradient treatment
- [x] Subheadline matches About page copy and styling verbatim
- [x] Old placeholder text ("Welcome to Your App" / "Built with Next.js 16…") absent
- [x] Cards, CTA footer, and buttons adapt cleanly to dark background
- [x] `pulse` keyframe runs smoothly — no layout shift, no FOUC
- [x] All 13 existing tests pass (nav, utils, contact) — no regressions
- [x] CI: typecheck ✅ lint ✅ test ✅ build ✅

---

## CI results

| Job | Status |
|---|---|
| typecheck | ✅ SUCCESS |
| lint | ✅ SUCCESS |
| test | ✅ SUCCESS (13/13) |
| build | ✅ SUCCESS |
| docker | ⏭ SKIPPED (PR; runs on merge) |

---

## Files changed

| File | Change |
|---|---|
| `src/app/page.tsx` | Updated — full Hero visual treatment (+217 / −88 lines) |
| `docs/release-notes-W3-0002-hero-alignment.md` | New — this file |

---

## Staging

Staging preview available via GitHub Actions / Vercel preview deploy for PR #12.  
No database migrations required. No environment variable changes required.

---

## Out of scope (per task spec)

- Copying sections below the Hero (feature cards, stack chips, About CTA) onto the home page
- Changing the About page
- Updating any other page or component outside `src/app/page.tsx`
- New CSS modules or external stylesheets
