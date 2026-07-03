# Modern Web Application

A production-ready web application built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, and Drizzle ORM.

## Quick Start

### Prerequisites
- Node.js 22.x
- Docker & Docker Compose (for PostgreSQL)
- Make (available on macOS and Linux)

### Setup

```bash
# Install dependencies and setup environment
make setup

# Start PostgreSQL and pgAdmin
make docker-up

# Start development server
make dev
```

The application will be available at `http://localhost:3000`.

## Available Commands

```bash
make dev           # Start development server
make build         # Build for production
make start         # Start production server
make test          # Run tests
make lint          # Run linter
make format        # Format code
make typecheck     # Type checking
make docker-up     # Start services
make docker-down   # Stop services
make db-generate   # Generate migrations
make db-migrate    # Apply migrations
make db-studio     # Open Drizzle Studio
```

## Project Structure

```
src/
├── app/           # Next.js App Router
├── components/    # React components
├── lib/
│   ├── db/        # Database schema & utilities
│   └── env.ts     # Typed environment variables
└── globals.css    # Tailwind & design tokens

docs/
├── product.md     # Product vision
├── design.md      # Design system
└── architecture.md # Technical decisions
```

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5.x
- **Runtime**: React 19 (Server & Client Components)
- **Styling**: Tailwind CSS v4 with design tokens
- **UI Components**: shadcn/ui patterns
- **Database**: Drizzle ORM + PostgreSQL
- **Testing**: Vitest + React Testing Library
- **Package Manager**: npm (Node 22.x)

## Database Setup

### Local Development

```bash
# Start PostgreSQL in Docker
make docker-up

# Create initial migrations
make db-generate

# Apply migrations
make db-migrate

# Open Drizzle Studio for visual DB management
make db-studio
```

### Adding a Table

1. Edit `src/lib/db/schema.ts`
2. Run `make db-generate`
3. Run `make db-migrate`

## Code Quality

- **Type Safety**: Strict TypeScript configuration
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier auto-formatting
- **Testing**: Vitest with React Testing Library
- **CI/CD**: GitHub Actions workflow

## Deployment

### Docker

```bash
docker build -t my-app .
docker run -p 3000:3000 -e DATABASE_URL=... my-app
```

### Vercel

Connect your GitHub repository and Vercel will automatically deploy on push to `main`.

## Documentation

- `CLAUDE.md` — Project standards and principles
- `docs/product.md` — Product specifications
- `docs/design.md` — Design system and brand guidelines
- `docs/architecture.md` — Technical architecture decisions

## License

MIT
