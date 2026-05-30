import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

export const runtime = "edge";
export const alt = "Quartermaster — Local-first SaaS Audit Agent";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Brand-themed Open Graph card. Brand hex is inlined here because this is a
 *  standalone image generator with no access to the app's CSS variables. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#070E1A",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <svg width="64" height="64" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="7" fill="#0F1A2E" />
            <circle cx="16" cy="16" r="10.5" fill="none" stroke="#22324F" strokeWidth="1" />
            <polygon points="16,3.5 18.2,15 16,13.4 13.8,15" fill="#E4B66B" />
            <polygon points="16,28.5 18.2,17 16,18.6 13.8,17" fill="#5C6B85" />
            <polygon points="3.5,16 15,13.8 13.4,16 15,18.2" fill="#5BD2C7" />
            <polygon points="28.5,16 17,13.8 18.6,16 17,18.2" fill="#5C6B85" />
            <circle cx="16" cy="16" r="2.1" fill="#E4B66B" />
          </svg>
          <div style={{ color: "#E8EEF7", fontSize: 30, fontWeight: 600 }}>
            {SITE_NAME}
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div
            style={{
              color: "#E8EEF7",
              fontSize: 62,
              fontWeight: 700,
              lineHeight: 1.05,
              maxWidth: 960,
            }}
          >
            Audit every SaaS seat with one federated SQL query.
          </div>
          <div style={{ color: "#9AA7BD", fontSize: 28, maxWidth: 920 }}>
            Join HRIS, Okta, GitHub, Slack &amp; Stripe — find zombie accounts,
            ghost seats, and shadow IT. No warehouse. PII never leaves.
          </div>
        </div>

        {/* Capability chips */}
        <div style={{ display: "flex", gap: "12px" }}>
          {["Coral federated SQL", "Local-first", "Read-only by design"].map(
            (chip) => (
              <div
                key={chip}
                style={{
                  display: "flex",
                  color: "#5BD2C7",
                  fontSize: 22,
                  border: "1px solid #22324F",
                  borderRadius: 999,
                  padding: "8px 18px",
                }}
              >
                {chip}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
