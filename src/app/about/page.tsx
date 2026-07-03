import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — Vortex",
  description:
    "Vortex is the AI-native platform for autonomous development. Learn what it is, what it does, and who it is for.",
};

interface FeatureCard {
  icon: string;
  title: string;
  tint: string;
  description: string;
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    icon: "💡",
    title: "Ideas Cloud",
    tint: "rgba(124,58,237,0.15)",
    description:
      "Capture, refine, and prioritise product ideas with AI-assisted facilitation before a single line of code is written.",
  },
  {
    icon: "🤖",
    title: "AI Agents",
    tint: "rgba(79,70,229,0.15)",
    description:
      "Claude-powered agents autonomously plan, code, and review — operating directly inside your workspaces.",
  },
  {
    icon: "🔀",
    title: "Workspace Management",
    tint: "rgba(6,182,212,0.15)",
    description:
      "Isolated git worktrees per task keep work clean, parallel, and conflict-free across your entire team.",
  },
  {
    icon: "✅",
    title: "Automated Reviews",
    tint: "rgba(16,185,129,0.15)",
    description:
      "Every change is reviewed by AI before it reaches humans — catching bugs, style issues, and security risks early.",
  },
  {
    icon: "📊",
    title: "Full Traceability",
    tint: "rgba(245,158,11,0.15)",
    description:
      "From idea to deploy, every decision and artifact is linked — giving teams complete audit trails without extra work.",
  },
  {
    icon: "⚡",
    title: "Zero Handoff Latency",
    tint: "rgba(239,68,68,0.15)",
    description:
      "Agents hand off to the next stage automatically. No waiting for stand-ups, no lost context between engineers.",
  },
];

const STACK_CHIPS = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Tailwind CSS v4",
  "PostgreSQL",
  "Drizzle ORM",
  "Claude API",
  "Anthropic SDK",
];

export default function AboutPage(): React.ReactElement {
  return (
    <div style={{ backgroundColor: "#09090b", color: "#fafafa", minHeight: "100vh" }}>
      {/* ─── 1. Hero ──────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="about-hero-heading"
        style={{
          borderBottom: "1px solid #18181b",
          padding: "72px 24px 64px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 400,
            background:
              "radial-gradient(ellipse at center top, rgba(124,58,237,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Badge pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            borderRadius: 99,
            padding: "5px 12px",
            marginBottom: 24,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#7c3aed",
              display: "inline-block",
              animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
            }}
          />
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#a1a1aa",
            }}
          >
            Vortex fully Autonomous!
          </span>
        </div>

        {/* Headline */}
        <h1
          id="about-hero-heading"
          style={{
            fontSize: 42,
            fontWeight: 700,
            letterSpacing: "-1px",
            lineHeight: 1.15,
            marginBottom: 16,
            background: "linear-gradient(180deg, #fafafa 0%, #a1a1aa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          The AI-native platform for autonomous development
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontSize: 16,
            color: "#71717a",
            maxWidth: 560,
            margin: "0 auto",
            lineHeight: 1.7,
          }}
        >
          From idea to deployed feature — fully automated, fully traced, and
          fully version-controlled. Vortex puts autonomous AI agents at the
          heart of your engineering workflow.
        </p>
      </section>

      {/* ─── 2. What is Vortex ────────────────────────────────────────────────── */}
      <section
        aria-labelledby="what-is-vortex-heading"
        style={{
          borderBottom: "1px solid #18181b",
          padding: "56px 24px",
          maxWidth: 760,
          margin: "0 auto",
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#7c3aed",
            marginBottom: 12,
          }}
        >
          What is Vortex
        </p>
        <h2
          id="what-is-vortex-heading"
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.5px",
            color: "#fafafa",
            marginBottom: 16,
          }}
        >
          Where AI meets your codebase
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "#71717a",
            maxWidth: 640,
            lineHeight: 1.8,
          }}
        >
          Vortex bridges the gap between human intent and working software.
          Teams create Ideas in the Ideas Cloud, and autonomous AI agents —
          powered by Claude — turn them into code, pull requests, and deployed
          features. Every workspace is version-controlled, every change is
          traced, and every handoff is automatic.
        </p>
      </section>

      {/* ─── 3. Core Capabilities ─────────────────────────────────────────────── */}
      <section
        aria-labelledby="capabilities-heading"
        style={{ borderBottom: "1px solid #18181b", padding: "56px 24px" }}
      >
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#7c3aed",
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            Core Capabilities
          </p>
          <h2
            id="capabilities-heading"
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.5px",
              color: "#fafafa",
              marginBottom: 36,
              textAlign: "center",
            }}
          >
            Built for the autonomous era
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
            className="about-feature-grid"
          >
            {FEATURE_CARDS.map((card) => (
              <article
                key={card.title}
                style={{
                  backgroundColor: "#111113",
                  border: "1px solid #27272a",
                  borderRadius: 10,
                  padding: 20,
                }}
              >
                {/* Icon box */}
                <div
                  aria-hidden="true"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: card.tint,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    marginBottom: 12,
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </div>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fafafa",
                    marginBottom: 6,
                  }}
                >
                  {card.title}
                </h3>
                <p style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. Technology ────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="technology-heading"
        style={{
          borderBottom: "1px solid #18181b",
          padding: "56px 24px",
          maxWidth: 760,
          margin: "0 auto",
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#7c3aed",
            marginBottom: 12,
          }}
        >
          Technology
        </p>
        <h2
          id="technology-heading"
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.5px",
            color: "#fafafa",
            marginBottom: 12,
          }}
        >
          Modern, open, and production-ready
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "#71717a",
            marginBottom: 24,
            lineHeight: 1.7,
          }}
        >
          Vortex is built on a battle-tested open-source stack.
        </p>

        {/* Stack chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
          role="list"
          aria-label="Technology stack"
        >
          {STACK_CHIPS.map((chip) => (
            <span
              key={chip}
              role="listitem"
              style={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: 6,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 500,
                color: "#a1a1aa",
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </section>

      {/* ─── 5. CTA ───────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="cta-heading"
        style={{
          padding: "72px 24px 80px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Bottom radial glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 400,
            background:
              "radial-gradient(ellipse at center bottom, rgba(124,58,237,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <h2
          id="cta-heading"
          style={{
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "-0.5px",
            color: "#fafafa",
            marginBottom: 12,
          }}
        >
          Ready to build autonomously?
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "#71717a",
            marginBottom: 32,
          }}
        >
          Start a workspace, drop in an idea, and let Vortex do the rest.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            style={{
              backgroundColor: "#7c3aed",
              color: "#fff",
              padding: "10px 22px",
              borderRadius: 7,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
            className="transition-opacity hover:opacity-90"
          >
            Get started free
          </Link>
          <Link
            href="/docs"
            style={{
              backgroundColor: "transparent",
              color: "#fafafa",
              border: "1px solid #27272a",
              padding: "10px 22px",
              borderRadius: 7,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
            className="transition-colors hover:border-[#7c3aed]"
          >
            View the docs
          </Link>
        </div>
      </section>

      {/* Responsive grid fix for mobile */}
      <style>{`
        @media (max-width: 768px) {
          .about-feature-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .about-feature-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
