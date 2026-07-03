# Release Notes — W3-0002: About Page

**Release date:** 2026-06-03  
**PR:** [#8](https://github.com/sweeho/web-app-react-typescript-nexjs-sample-3/pull/8)  
**Branch:** `feature/W3-0002-about-page`  
**CI:** ✅ All checks green (typecheck · lint · test · build)

---

## What's new

### About page (`/about`)

A new About page is now live at `/about`, giving visitors a clear picture of the Vortex platform in one place.

The page covers:

1. **Hero** — badge, headline, and tagline establish the platform identity at a glance
2. **What is Vortex** — a concise plain-English explanation of how Vortex works: teams drop ideas in, AI agents turn them into code, PRs, and deployed features
3. **Core capabilities** — six feature cards in a 3-column grid:
   - 💡 Ideas Cloud
   - 🤖 AI Agents
   - 🔀 Workspace Management
   - ✅ Automated Reviews
   - 📊 Full Traceability
   - ⚡ Zero Handoff Latency
4. **Technology stack** — pill badges listing the open-source stack (Next.js 16, React 19, TypeScript, Tailwind CSS v4, PostgreSQL, Drizzle ORM, Claude API, Anthropic SDK)
5. **CTA** — "Get started free" and "View the docs" buttons to drive next actions

The page is statically rendered (no client-side data fetching) and meets WCAG 2.1 AA accessibility standards.

### Navigation update

The shared nav bar now includes an **"About"** link that highlights with an active state when you're on `/about`.

### Home page "Learn more" button

A secondary CTA — **"Learn more"** (outline style) — has been added to the home page hero, directly to the right of "Get started". It links to `/about` and carries a "NEW" pill badge for the initial launch.

---

## Files changed

| File | Change |
|------|--------|
| `src/app/about/page.tsx` | New — full About page (492 lines) |
| `src/components/nav.tsx` | New — shared navigation bar with About link and active state |
| `src/app/layout.tsx` | Updated — NavBar added to root layout |
| `src/app/page.tsx` | Updated — "Learn more" hero CTA added |

### CI infrastructure fixes (bundled in this release)

| File | Change |
|------|--------|
| `package-lock.json` | Added to git (was gitignored — caused all CI jobs to fail) |
| `package.json` | Added `"vite": "^5.0.0"` to devDependencies to fix TS2769 |
| `.gitignore` | Removed `package-lock.json` from ignore list |
| `eslint.config.js` | Added `.claude` to ignore list (stops linting worktree artifacts) |
| `bun.lock` | Updated to reflect vite@5 addition |

---

## Smoke test checklist

- [x] `/about` renders without errors
- [x] All 6 page sections visible in correct order
- [x] Feature card grid is 3 columns on desktop, 1 column on mobile
- [x] Nav shows "About" with active state when on `/about`
- [x] Home page hero has "Learn more" → `/about`
- [x] CI: typecheck ✅ lint ✅ test ✅ build ✅

---

## Out of scope (v1)

- Internationalisation / localisation
- CMS-driven content
- Team bios, legal pages, contact forms
- Home page redesign
