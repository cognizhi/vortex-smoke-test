# Infrastructure — Wildcard DNS & SSL Certificate Provisioning

**Task**: MW3-0001-construct-infra-tenant  
**Author**: Engineer (SDLC Agent)  
**Date**: 2026-06-07  
**Status**: Implementation complete

---

## Overview

The self-serve booking platform requires every merchant to be reachable at
`{slug}.platform.com`.  Supporting an unbounded number of subdomains requires:

1. **Wildcard DNS** — a single DNS record that resolves all subdomains.
2. **Wildcard TLS certificate** — a single certificate covering `*.platform.com`.
3. **Reverse proxy** — routes all traffic to the Next.js application, preserving
   the `Host` header so the middleware can extract the merchant slug.

All three concerns are addressed by **Caddy v2** with a DNS-01 ACME challenge.

---

## 1. DNS Configuration

### Required Records

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `platform.com` | `<server-IP>` | 300 |
| A | `*.platform.com` | `<server-IP>` | 300 |

Add both records at your DNS provider (Cloudflare, Route 53, etc.).

> **Cloudflare proxy note**: If using Cloudflare's orange-cloud (proxied), the
> TLS termination is at Cloudflare's edge.  Caddy still needs an origin cert.
> Use Cloudflare's "Full (strict)" SSL mode with an origin CA certificate, OR
> disable Cloudflare proxying (grey-cloud) and let Caddy handle TLS directly.

### Local Development

For local testing with subdomains, add entries to `/etc/hosts`:

```
127.0.0.1   platform.com
127.0.0.1   glamour-studio.localhost
```

The Next.js middleware handles `*.localhost` subdomains out of the box (see
`src/middleware.ts`).

---

## 2. TLS Certificate Provisioning (Caddy)

### Why Caddy + DNS-01

Wildcard certificates (`*.platform.com`) **cannot** be issued via HTTP-01
challenge — the ACME spec requires DNS-01 for wildcard domains.  Caddy's
DNS providers automate this entirely.

### Installation

```bash
# Build Caddy with Cloudflare DNS plugin (replace with your provider if needed)
xcaddy build \
  --with github.com/caddy-dns/cloudflare

# Other DNS providers: https://caddyserver.com/docs/modules/dns.providers
# Route 53:    github.com/caddy-dns/route53
# Google DNS:  github.com/caddy-dns/googleclouddns
# Namecheap:   github.com/caddy-dns/namecheap
```

### Environment Variables

```env
CF_API_TOKEN=<Cloudflare API token with Zone:DNS:Edit permission>
PLATFORM_DOMAIN=platform.com
```

### Start Caddy

```bash
# Run as systemd service (recommended for production)
sudo systemctl enable caddy
sudo systemctl start caddy

# Or run directly (dev/staging)
caddy run --config Caddyfile
```

Caddy will:
1. Read the `Caddyfile` at the repo root.
2. Request a wildcard cert from Let's Encrypt via DNS-01 challenge.
3. Auto-renew the cert ~30 days before expiry (no manual intervention needed).

### Certificate Location

Caddy stores certs in `$HOME/.local/share/caddy/` (Linux) or
`%AppData%\Caddy\` (Windows).  Do not modify these files manually.

---

## 3. Alternative: Nginx + Certbot (manual renewal)

If Caddy is not available, use Nginx + Certbot with a DNS plugin:

```bash
# Issue wildcard cert (Cloudflare DNS example)
certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials ~/.secrets/cloudflare.ini \
  -d platform.com \
  -d '*.platform.com'

# Renew automatically via cron
echo "0 0 * * * certbot renew --quiet && nginx -s reload" | crontab -
```

```nginx
# /etc/nginx/sites-available/platform.conf
server {
    listen 443 ssl;
    server_name ~^(?<slug>.+)\.platform\.com$;

    ssl_certificate     /etc/letsencrypt/live/platform.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/platform.com/privkey.pem;

    location / {
        proxy_pass       http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl;
    server_name platform.com;

    ssl_certificate     /etc/letsencrypt/live/platform.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/platform.com/privkey.pem;

    location / {
        proxy_pass       http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

---

## 4. Vercel Deployment

When deploying to Vercel:

1. Add `platform.com` as a custom domain in the Vercel project dashboard.
2. Add `*.platform.com` as a wildcard domain (Vercel Pro/Enterprise tier required).
3. Vercel provisions TLS certificates automatically — no Caddyfile needed.
4. Set `PLATFORM_DOMAIN=platform.com` in the Vercel environment variables.

---

## 5. Application-Layer Routing

The Next.js middleware (`src/middleware.ts`) performs subdomain routing:

```
Request: glamour-studio.platform.com/
  ↓
middleware.ts: extracts slug = "glamour-studio"
  ↓
Rewrites internally to: /site/glamour-studio/
  ↓
Sets header: x-merchant-slug: glamour-studio
  ↓
Next.js: resolves src/app/site/[slug]/page.tsx
```

The `x-merchant-slug` header is used by API routes to resolve the merchant
database without re-parsing the `Host` header.

See `src/middleware.ts` for the full logic including reserved slug protection
and local-dev `*.localhost` support.

---

## 6. Per-Merchant Database Provisioning

On successful registration (`POST /api/register`), the server:

1. Validates the slug (format + uniqueness).
2. Calls `provisionMerchant()` in `src/lib/db/provision-merchant.ts`.
3. `provisionMerchant()` creates:
   - A row in `platform.merchants` (registry).
   - A private PostgreSQL schema `merchant_<32hexchars>`.
   - All 9 merchant tables inside that schema.
   - Default settings and design seed rows.
   - The owner `admin_users` record.
4. Returns the booking page URL and dashboard URL.

No DNS changes are needed when a merchant registers — the wildcard DNS record
already routes `*.platform.com` to the server.

---

## 7. Operational Notes

| Concern | Solution |
|---------|----------|
| Cert expiry | Caddy auto-renews; Certbot cron for Nginx |
| New merchant subdomains | No DNS change required — wildcard covers all |
| Merchant cancellation | Schema retained for 30-day grace period, then `DROP SCHEMA … CASCADE` |
| Slug conflicts | Unique constraint on `platform.merchants.slug`; checked at `/api/check-slug` |
| Monitoring | Alert on `platform.merchants.status = 'provisioning'` for > 60 seconds |

---

*Produced by Engineer for MW3-0001-construct-infra-tenant.*
