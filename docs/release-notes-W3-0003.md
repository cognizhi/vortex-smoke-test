# Release Notes — W3-0003: Fix Docker CI Build

**Date:** 2026-06-04  
**Type:** Bug Fix  
**Scope:** CI / Docker / Deployment  

## Summary

The GitHub CI Docker build step was failing on every run because two required files/directories were missing from the build output. Engineers were unable to produce a deployable Docker image via CI. This release fixes both root causes.

## What Changed

### 1. `next.config.js` — Added `output: 'standalone'`

The Dockerfile's runner stage copies `.next/standalone` to assemble the production image, but Next.js only generates this directory when `output: 'standalone'` is explicitly set in the config. Without it, the `COPY --from=builder /app/.next/standalone ./` instruction failed with a "path does not exist" error.

**Fix:** Added `output: 'standalone'` to `nextConfig`. Next.js will now produce a self-contained `.next/standalone/` bundle containing only the files needed to run the server — resulting in a smaller, faster Docker image.

### 2. `public/.gitkeep` — Created the missing `public/` directory

The Dockerfile copies `/app/public` into the runner image (for static assets). No `public/` directory existed in the repository, causing `COPY --from=builder /app/public ./public` to error.

**Fix:** Added an empty `public/.gitkeep` so the directory exists in the repository and the COPY instruction succeeds. Actual static assets can be added here as the project grows.

## Impact

- **Before:** Every CI run failed at the Docker build step. No deployable image was produced.
- **After:** CI passes end-to-end. A deployable Docker image is built on every push to `main`. The container starts correctly and the `/api/health` healthcheck returns HTTP 200.

## Risk Assessment

**Low.** Both changes are minimal and targeted:
- `output: 'standalone'` is the officially recommended Next.js mode for containerised deployments. No SSR, API routes, or static pages are affected.
- `public/.gitkeep` is an empty placeholder; it changes no application behaviour.
- All CI checks (typecheck, lint, test, build, **docker**) pass with zero errors.

## Files Changed

| File | Change |
|---|---|
| `next.config.js` | Added `output: 'standalone'` to `nextConfig` |
| `public/.gitkeep` | New empty file (directory placeholder) |

## CI Evidence

- Run: https://github.com/sweeho/web-app-react-typescript-nexjs-sample-3/actions/runs/26951402980
- All 5 jobs passed: lint ✅ test ✅ typecheck ✅ build ✅ docker ✅
