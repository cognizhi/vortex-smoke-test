# Release Notes — W3-0003: Add Founders Page with Nav Bar Link

**Release date:** 2026-06-05
**PR:** [#13](https://github.com/sweeho/web-app-react-typescript-nexjs-sample-3/pull/13)
**Branch:** `feat/W3-0003-founders-page`
**CI:** ✅ All checks green (typecheck · lint · test · build)

---

## What's new

### Founders page (`/founders`)

A new Founders page is now live at `/founders`, giving visitors a dedicated place to learn who is behind Vortex. This builds team credibility and trust — especially important for early-stage products evaluated by customers, investors, and partners.

The page includes:

1. **Hero section** — a "Meet the Team" badge pill, a gradient headline ("The minds behind Vortex"), and a short sub-headline summarising the team's mission.
2. **Two founder profile cards** in a responsive 2-column grid:
   - **Silhouette avatar** — inline SVG of an anonymous person icon on a dark grey (`#27272a`) circular background. No external image dependencies; no broken-image icons.
   - **Placeholder name** — "Founder Name" (clearly labelled for replacement)
   - **Placeholder title** — "Co-founder & CEO" / "Co-founder & CTO" (styled in Vortex purple `#7c3aed`)
   - **Placeholder bio** — "Short bio goes here…" paragraph ready to be swapped for real content
3. **Footer note** — "Placeholder profiles — real photos and bios coming soon." confirms the content is temporary.
4. **Responsive layout** — 2-column grid on desktop (≥ 768 px); single column stacked on mobile via an inline `@media` query, consistent with the About and Contact page patterns.

The page is statically rendered (no API calls) and matches the existing dark-themed site style (`#09090b` background, `#fafafa` text, zinc/purple palette, radial glow, border-bottom hero divider).

### Navigation update

The shared nav bar now includes a **"Founders"** link. The existing active-link logic automatically highlights it when you're on `/founders`.

---

## Files changed

| File | Change |
|------|--------|
| `src/app/founders/page.tsx` | New — full Founders page (hero + 2-column profile card grid + responsive style) |
| `src/components/nav.tsx` | Updated — `{ href: "/founders", label: "Founders" }` added to `NAV_LINKS` |
| `src/app/founders/__tests__/page.test.tsx` | New — 10 unit tests (h1 heading, two article cards, name headings, CEO/CTO titles, bio placeholder, footer note, badge pill, sr-only h2) |
| `docs/design-founders-W3-0003.md` | New — design spec used to guide implementation |

---

## Acceptance criteria — all met ✅

- [x] `/founders` route exists and renders without errors
- [x] Page displays two founder profile cards, each with: silhouette avatar, placeholder name, placeholder title, placeholder bio paragraph
- [x] Placeholder copy is clearly marked (e.g. "Founder Name", "Co-founder & CTO", "Short bio goes here…")
- [x] "Founders" link added to `NAV_LINKS` in `src/components/nav.tsx`, routes to `/founders`
- [x] Active-link highlight works correctly when on `/founders`
- [x] Page matches existing site layout (dark background, consistent typography and spacing)
- [x] Desktop (≥ 768 px): cards displayed side-by-side in 2-column grid
- [x] Mobile (< 768 px): cards stack vertically (1 column)

---

## CI results

| Job | Status |
|---|---|
| typecheck | ✅ PASS |
| lint | ✅ PASS |
| test | ✅ PASS (23/23) |
| build | ✅ PASS |
| docker | ⏭ SKIPPED (PR; runs on merge) |

CI run: https://github.com/sweeho/web-app-react-typescript-nexjs-sample-3/actions/runs/27026263018

---

## Staging

PR preview deploy available via the GitHub Actions / Vercel preview for PR #13.
No database migrations required. No environment variable changes required.

---

## Swap-in guide (when real content is ready)

To replace placeholders with real content, edit only `src/app/founders/page.tsx`:

1. **Names** — update `name` in the `FOUNDERS` array (lines 18 and 23)
2. **Titles** — update `title` (e.g. "Co-founder & CEO")
3. **Bios** — update `bio` (one or two sentences per founder)
4. **Avatars** — replace `<FounderAvatar />` with an `<Image>` component pointing to the real photo; no other layout changes needed

---

## Out of scope (v1)

- Real founder photos or written bios (placeholder only)
- Social media or external profile links
- Any CMS or dynamic data source
- Animation or interactive hover effects beyond the existing design system
