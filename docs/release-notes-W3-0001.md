# Release Notes — W3-0001: Contact Page

**Release date:** 2026-06-04
**PR:** [#11](https://github.com/sweeho/web-app-react-typescript-nexjs-sample-3/pull/11)
**Branch:** `feat/W3-0001-contact-page`
**CI:** ✅ All checks green (typecheck · lint · test · build)

---

## What's new

### Contact page (`/contact`)

A new Contact page is now live at `/contact`, giving visitors a clear and easy-to-find place to reach the team.

The page includes:

1. **Hero section** — a badge pill ("Get in touch"), gradient headline ("We'd love to hear from you"), and a short sub-headline inviting visitors to reach out with questions or feedback.
2. **Contact method cards** — two side-by-side cards in a responsive grid:
   - ✉️ **Email** — `hello@example.com` (placeholder, renders as a `mailto:` link)
   - 📞 **Phone** — `+1 (555) 000-0000` (placeholder, renders as a `tel:` link)
3. **Responsive layout** — the two-column card grid collapses to a single column on screens narrower than 480 px.

The page is statically rendered (no API calls, no form, no backend) and matches the existing dark-themed site style (zinc/purple palette, radial glow, border-bottom hero divider).

### Navigation update

The shared nav bar now includes a **"Contact"** link that highlights with an active state when you're on `/contact`.

---

## Files changed

| File | Change |
|------|--------|
| `src/app/contact/page.tsx` | New — full Contact page (hero + contact-method card grid) |
| `src/components/nav.tsx` | Updated — `{ href: "/contact", label: "Contact" }` added to `NAV_LINKS` |
| `src/app/contact/__tests__/page.test.tsx` | New — 7 unit tests (heading, email, phone, link hrefs, labels) |
| `src/components/__tests__/nav.test.tsx` | New — 2 unit tests verifying Contact nav link renders and routes correctly |
| `docs/design-contact-W3-0001.md` | New — design spec used to guide implementation |

---

## Smoke test checklist

- [x] `/contact` route exists and renders without errors
- [x] Page displays placeholder email `hello@example.com`
- [x] Page displays placeholder phone `+1 (555) 000-0000`
- [x] "Contact" link present in main navigation, routes to `/contact`
- [x] Active state highlights the Contact link when on `/contact`
- [x] Card grid collapses to 1 column on narrow viewports
- [x] Page matches existing dark-themed site layout and styles
- [x] CI: typecheck ✅ lint ✅ test ✅ build ✅

---

## Out of scope (v1)

- Functional contact / enquiry form
- Backend email routing or submission handling
- Live / real contact details (placeholder content only)
- CAPTCHA or spam protection
