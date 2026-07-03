# Technical Architecture

## Stack Overview

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js | 16 |
| Runtime | Node.js | 22.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | v4 |
| UI Components | shadcn/ui | Latest |
| Database ORM | Drizzle | Latest |
| Database | PostgreSQL | 15+ |
| Testing | Vitest | Latest |
| Package Manager | npm or Bun | Latest |
| Container | Docker | Latest |

## Architecture Layers

### Client Layer (React 19)
- Server Components by default (`app/`)
- Client Components marked with `"use client"`
- Form components using React Hook Form
- State management via Zustand (global only)

### API Layer (Next.js Routes)
- RESTful API endpoints in `app/api/`
- Request validation with Zod
- Error handling with consistent response format
- Authentication middleware (to be configured)

### Database Layer (Drizzle ORM)
- Schema in `src/lib/db/schema.ts`
- Type-safe queries via Drizzle
- Auto-migrations on schema changes
- Connection pooling for production

### Infrastructure
- Containerized via Docker (multi-stage build)
- Environment variables typed and validated
- Health check endpoint at `/api/health`

## Data Flow

1. **User Action**: React component triggers event
2. **Request**: Browser sends to Next.js API route
3. **Validation**: Zod schema validates request
4. **Business Logic**: Route handler processes data
5. **Database**: Drizzle ORM executes queries
6. **Response**: JSON response sent back to client
7. **UI Update**: React re-renders with new data

## Key Design Decisions

### Why Server Components?
- Reduced JavaScript shipped to browser
- Direct database access without API marshalling
- Simpler data fetching patterns
- Better security (API keys stay on server)

### Why Drizzle ORM?
- Type-safe SQL generation from TypeScript
- Zero runtime overhead (compiles to raw SQL)
- Auto-generated migrations
- Excellent DX for schema-driven development

### Why Tailwind + shadcn/ui?
- Rapid UI development with utility-first CSS
- Consistent design system out of the box
- Easy customization via theme tokens
- Accessible component primitives

## Deployment Model

### Development
```bash
npm run dev  # Starts Next.js dev server on port 3000
```

### Production
```bash
npm run build   # Optimize and output standalone build
npm run start   # Run production server
```

### Docker
```dockerfile
# Multi-stage: build → runtime
# Non-root user for security
# Health check endpoint
```

## Scaling Considerations

**Current**: Single deployment suitable for MVPs and small-scale applications

**Future**: Add as needed
- Load balancing (Vercel auto-scales)
- Caching layer (Redis)
- CDN for assets (Vercel Edge Network)
- Database read replicas
- Background job queue (BullMQ, Resque)

---

*Document key architecture decisions and trade-offs here. Update as the system evolves.*
