import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HH Goa 2026 — Frame In",
  description:
    "Upload a photo, get your HH Goa 2026 builder graphic — framed PFP or builder ID card. Download it, post it. #FrameInGoa",
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#160b33",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Classic stylesheet load so canvas can use the real family names */}
        <link
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;800;900&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="grain min-h-full flex flex-col">{children}</body>
    </html>
  );
}
