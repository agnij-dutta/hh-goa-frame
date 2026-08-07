import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "HH Goa 2026 — Frame In";

async function loadUnbounded(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Unbounded:wght@900&display=swap",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    ).then((r) => r.text());
    const m = css.match(/src: url\((.+?)\) format\('(woff2?|opentype|truetype)'\)/);
    if (!m) return null;
    return fetch(m[1]).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OG() {
  const font = await loadUnbounded();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(180deg, #160b33 0%, #2a1458 30%, #6c2bd9 55%, #ff2e63 78%, #ff6b35 92%, #ffb830 100%)",
          fontFamily: font ? "Unbounded" : "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: -160,
            width: 420,
            height: 420,
            borderRadius: 9999,
            background: "linear-gradient(180deg,#ffe27a,#ffb830 55%,#ff2e63)",
            boxShadow: "0 0 120px 40px rgba(255,184,48,0.55)",
          }}
        />
        <div
          style={{
            color: "#19e3c2",
            fontSize: 26,
            letterSpacing: 14,
            marginBottom: 18,
          }}
        >
          HACKER HOUSE
        </div>
        <div
          style={{
            color: "#fff3e0",
            fontSize: 110,
            fontWeight: 900,
            letterSpacing: -2,
            textShadow: "6px 6px 0 #ff2e63",
          }}
        >
          HH GOA 2026
        </div>
        <div
          style={{
            marginTop: 26,
            color: "#160b33",
            background: "#ffb830",
            borderRadius: 9999,
            padding: "14px 36px",
            fontSize: 30,
            fontWeight: 900,
          }}
        >
          GET FRAMED IN → #FrameInGoa
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [{ name: "Unbounded", data: font, weight: 900 as const, style: "normal" as const }]
        : undefined,
    }
  );
}
