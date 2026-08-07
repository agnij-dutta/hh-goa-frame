import Generator from "@/components/Generator";

function RetroSun({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe27a" />
          <stop offset="55%" stopColor="#ffb830" />
          <stop offset="100%" stopColor="#ff2e63" />
        </linearGradient>
        <mask id="stripes">
          <rect width="100" height="100" fill="white" />
          <rect x="0" y="56" width="100" height="2.5" fill="black" />
          <rect x="0" y="64" width="100" height="4" fill="black" />
          <rect x="0" y="74" width="100" height="5.5" fill="black" />
          <rect x="0" y="86" width="100" height="7" fill="black" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#sg)" mask="url(#stripes)" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="relative overflow-x-clip">
      {/* header */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 pt-6">
        <div className="font-display text-sm tracking-widest text-cream">
          HH<span className="text-gold">☼</span>GOA
        </div>
        <div className="font-mono text-[11px] tracking-widest text-sand/70">
          HACKER HOUSE · GOA · 2026
        </div>
      </header>

      {/* hero */}
      <section className="relative mx-auto w-full max-w-5xl px-4 pb-10 pt-14 text-center sm:pt-20">
        <RetroSun className="sun-pulse mx-auto mb-6 h-24 w-24 sm:h-32 sm:w-32 rise" />
        <h1 className="font-display rise rise-1 text-4xl font-black leading-[1.05] tracking-tight text-cream sm:text-6xl">
          GET{" "}
          <span className="bg-gradient-to-b from-gold via-tangerine to-pink bg-clip-text text-transparent">
            FRAMED
          </span>{" "}
          IN.
        </h1>
        <p className="rise rise-2 mx-auto mt-5 max-w-xl font-mono text-sm leading-relaxed text-sand/80 sm:text-base">
          Upload a photo → get your HH Goa 2026 graphic in seconds.
          <br className="hidden sm:block" /> A framed PFP or a full builder ID.
          Post it with <span className="text-teal">#FrameInGoa</span>.
        </p>
        <div className="rise rise-3 mt-6 font-mono text-xs text-cream/40">
          no login · no signup · straight to the beach ↓
        </div>
      </section>

      <div className="rise rise-3">
        <Generator />
      </div>

      <footer className="border-t border-white/10 py-8 text-center">
        <div className="font-display text-xs tracking-widest text-cream/60">
          SEE YOU ON THE BEACH <span className="text-gold">☼</span> #FRAMEINGOA
        </div>
      </footer>
    </main>
  );
}
