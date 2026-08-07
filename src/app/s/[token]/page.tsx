import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

/** Only accept images that live in a Vercel Blob public store. */
function decodeToken(token: string): { url: string; isCard: boolean } | null {
  try {
    const url = Buffer.from(token, "base64url").toString("utf8");
    if (!/^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/shares\/[A-Za-z0-9_-]+\.png$/.test(url)) {
      return null;
    }
    return { url, isCard: url.includes("-card.png") };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const decoded = decodeToken(token);
  if (!decoded) return { title: "HH Goa 2026" };
  const dims = decoded.isCard
    ? { width: 1600, height: 1000 }
    : { width: 1200, height: 1200 };
  const title = "I'm framed in for HH Goa 2026 ☼";
  const description =
    "Builder credential secured. Make yours in seconds — no login. #FrameInGoa";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: decoded.url, ...dims }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [decoded.url],
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const decoded = decodeToken(token);
  if (!decoded) notFound();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="font-display text-xs tracking-widest text-gold">
        HH ☼ GOA 2026
      </div>
      <h1 className="font-display mt-3 text-2xl font-black text-cream sm:text-4xl">
        FRAMED IN.
      </h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={decoded.url}
        alt="HH Goa 2026 builder graphic"
        className={`mt-8 w-full rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] ${
          decoded.isCard ? "" : "max-w-md"
        }`}
      />
      <Link
        href="/"
        className="font-display mt-10 rounded-xl bg-gold px-8 py-4 text-sm tracking-wider text-night shadow-[0_0_32px_rgba(255,184,48,0.4)] transition-transform active:scale-95"
      >
        MAKE YOURS →
      </Link>
      <div className="mt-4 font-mono text-xs text-cream/50">
        30 seconds · no login · #FrameInGoa
      </div>
    </main>
  );
}
