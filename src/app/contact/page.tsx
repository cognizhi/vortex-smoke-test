import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Vortex",
  description:
    "Get in touch with the Vortex team. Find our placeholder contact email and phone number here.",
};

interface ContactMethod {
  icon: string;
  label: string;
  value: string;
  href: string;
  tint: string;
}

const CONTACT_METHODS: ContactMethod[] = [
  {
    icon: "✉️",
    label: "Email",
    value: "hello@example.com",
    href: "mailto:hello@example.com",
    tint: "rgba(124,58,237,0.15)",
  },
  {
    icon: "📞",
    label: "Phone",
    value: "+1 (555) 000-0000",
    href: "tel:+15550000000",
    tint: "rgba(79,70,229,0.15)",
  },
];

export default function ContactPage(): React.ReactElement {
  return (
    <div
      style={{ backgroundColor: "#09090b", color: "#fafafa", minHeight: "100vh" }}
    >
      {/* ─── Hero ─────────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="contact-hero-heading"
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
            Get in touch
          </span>
        </div>

        {/* Headline */}
        <h1
          id="contact-hero-heading"
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
          We&apos;d love to hear from you
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontSize: 16,
            color: "#71717a",
            maxWidth: 480,
            margin: "0 auto",
            lineHeight: 1.7,
          }}
        >
          Have a question, feedback, or just want to say hello? Reach out using
          any of the contact details below.
        </p>
      </section>

      {/* ─── Contact Methods ──────────────────────────────────────────────────── */}
      <section
        aria-labelledby="contact-methods-heading"
        style={{
          padding: "64px 24px",
          maxWidth: 640,
          margin: "0 auto",
        }}
      >
        <h2
          id="contact-methods-heading"
          className="sr-only"
        >
          Contact methods
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
          }}
          className="contact-methods-grid"
        >
          {CONTACT_METHODS.map((method) => (
            <article
              key={method.label}
              style={{
                backgroundColor: "#111113",
                border: "1px solid #27272a",
                borderRadius: 12,
                padding: 28,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* Icon box */}
              <div
                aria-hidden="true"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: method.tint,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                {method.icon}
              </div>

              <div>
                <p
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#71717a",
                    marginBottom: 6,
                  }}
                >
                  {method.label}
                </p>
                <a
                  href={method.href}
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: "#fafafa",
                    textDecoration: "none",
                  }}
                  className="hover:text-purple-400 transition-colors"
                >
                  {method.value}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Responsive grid fix */}
      <style>{`
        @media (max-width: 480px) {
          .contact-methods-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
