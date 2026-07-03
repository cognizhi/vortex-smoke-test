import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Founders — Vortex",
  description:
    "Meet the two co-founders behind Vortex — the AI-native platform for autonomous software delivery.",
};

interface Founder {
  id: string;
  name: string;
  title: string;
  bio: string;
}

const FOUNDERS: Founder[] = [
  {
    id: "founder-1",
    name: "Founder Name",
    title: "Co-founder & CEO",
    bio: "Short bio goes here — a sentence or two about this founder's background, expertise, and what they bring to Vortex. Replace with real content when available.",
  },
  {
    id: "founder-2",
    name: "Founder Name",
    title: "Co-founder & CTO",
    bio: "Short bio goes here — a sentence or two about this founder's background, expertise, and what they bring to Vortex. Replace with real content when available.",
  },
];

function FounderAvatar(): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 80,
        height: 80,
        borderRadius: "50%",
        backgroundColor: "#27272a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <svg
        width="44"
        height="44"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        {/* Head circle */}
        <circle cx="12" cy="8" r="3.5" fill="#52525b" />
        {/* Body / shoulders */}
        <path
          d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
          stroke="#52525b"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

export default function FoundersPage(): React.ReactElement {
  return (
    <div
      style={{ backgroundColor: "#09090b", color: "#fafafa", minHeight: "100vh" }}
    >
      {/* ─── Hero ──────────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="founders-hero-heading"
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
            Meet the Team
          </span>
        </div>

        {/* H1 */}
        <h1
          id="founders-hero-heading"
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
          The minds behind Vortex
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 16,
            color: "#71717a",
            maxWidth: 520,
            margin: "0 auto",
            lineHeight: 1.7,
          }}
        >
          Two founders, one mission: autonomous software delivery for every team.
        </p>
      </section>

      {/* ─── Founders Grid ─────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="founders-heading"
        style={{
          padding: "64px 24px 80px",
          maxWidth: 880,
          margin: "0 auto",
        }}
      >
        <h2 id="founders-heading" className="sr-only">
          Meet the founders
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 24,
          }}
          className="founders-grid"
        >
          {FOUNDERS.map((founder) => (
            <article
              key={founder.id}
              style={{
                backgroundColor: "#111113",
                border: "1px solid #27272a",
                borderRadius: 12,
                padding: 32,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <FounderAvatar />

              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#fafafa",
                  margin: 0,
                  letterSpacing: "-0.3px",
                }}
              >
                {founder.name}
              </h3>

              <p
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#7c3aed",
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                {founder.title}
              </p>

              <p
                style={{
                  fontSize: 14,
                  color: "#71717a",
                  lineHeight: 1.75,
                  margin: 0,
                }}
              >
                {founder.bio}
              </p>
            </article>
          ))}
        </div>

        {/* Footer note */}
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#3f3f46",
            marginTop: 48,
            letterSpacing: "0.02em",
          }}
        >
          Placeholder profiles — real photos and bios coming soon.
        </p>
      </section>

      {/* Responsive grid */}
      <style>{`
        @media (max-width: 768px) {
          .founders-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
