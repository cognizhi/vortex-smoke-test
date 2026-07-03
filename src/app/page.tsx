import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home(): React.ReactElement {
  return (
    <div style={{ backgroundColor: '#09090b', color: '#fafafa', minHeight: '100vh' }}>
      {/* ─── Hero ──────────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="home-hero-heading"
        style={{
          borderBottom: '1px solid #18181b',
          padding: '72px 24px 64px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Radial glow */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 600,
            height: 400,
            background:
              'radial-gradient(ellipse at center top, rgba(124,58,237,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Badge pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            borderRadius: 99,
            padding: '5px 12px',
            marginBottom: 24,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#7c3aed',
              display: 'inline-block',
              animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
            }}
          />
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#a1a1aa',
            }}
          >
            Vortex fully Autonomous!
          </span>
        </div>

        {/* Headline */}
        <h1
          id="home-hero-heading"
          style={{
            fontSize: 42,
            fontWeight: 700,
            letterSpacing: '-1px',
            lineHeight: 1.15,
            marginBottom: 16,
            background: 'linear-gradient(180deg, #fafafa 0%, #a1a1aa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          The AI-native platform for autonomous development
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontSize: 16,
            color: '#71717a',
            maxWidth: 560,
            margin: '0 auto 32px',
            lineHeight: 1.7,
          }}
        >
          From idea to deployed feature — fully automated, fully traced, and fully
          version-controlled. Vortex puts autonomous AI agents at the heart of your engineering
          workflow.
        </p>

        {/* CTA buttons */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="default">Get started</Button>
          <div className="relative inline-flex">
            <Link
              href="/about"
              style={{ border: '1px solid #3f3f46', background: 'transparent' }}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 px-4 py-2 hover:border-[#7c3aed] text-foreground no-underline"
            >
              Learn more
            </Link>
            <span
              aria-label="New"
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                backgroundColor: '#7c3aed',
                color: '#fff',
                fontSize: 9,
                fontWeight: 600,
                padding: '1px 5px',
                borderRadius: 99,
                lineHeight: 1.6,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                pointerEvents: 'none',
              }}
            >
              NEW
            </span>
          </div>
        </div>
      </section>

      {/* ─── Cards ─────────────────────────────────────────────────────────────── */}
      <div style={{ padding: '48px 24px' }}>
        <div className="w-full max-w-2xl mx-auto space-y-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
                <CardDescription>Learn the basics of your new app</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  Check out the documentation in{' '}
                  <code className="rounded bg-gray-100 px-2 py-1">CLAUDE.md</code> to understand
                  the project structure and coding principles.
                </p>
                <Button variant="default" className="w-full">
                  Read Docs
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Build Features</CardTitle>
                <CardDescription>Add your first feature</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  Define your database schema in{' '}
                  <code className="rounded bg-gray-100 px-2 py-1">src/lib/db/schema.ts</code> and
                  run migrations.
                </p>
                <Button variant="outline" className="w-full">
                  Learn More
                </Button>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2">
              <CardHeader>
                <CardTitle>Technology Stack</CardTitle>
                <CardDescription>Everything you need for modern web development</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 text-sm text-gray-700">
                  <li>✨ Next.js 16 with App Router &amp; Turbopack</li>
                  <li>⚛️ React 19 Server &amp; Client Components</li>
                  <li>🎨 Tailwind CSS v4 with design tokens</li>
                  <li>🗄️ Drizzle ORM with PostgreSQL</li>
                  <li>📝 TypeScript with strict mode</li>
                  <li>🧪 Vitest with React Testing Library</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Footer CTA */}
          <div
            style={{
              borderTop: '1px solid #27272a',
              paddingTop: 32,
              textAlign: 'center',
              fontSize: 14,
              color: '#71717a',
            }}
          >
            <p>
              Ready to customize? Edit{' '}
              <code
                style={{
                  borderRadius: 4,
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  padding: '2px 8px',
                  color: '#a1a1aa',
                  fontSize: 13,
                }}
              >
                src/app/page.tsx
              </code>{' '}
              and see changes instantly.
            </p>
          </div>
        </div>
      </div>

      {/* @keyframes pulse — scoped to this page; no global conflict detected */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
