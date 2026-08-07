"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadPhoto, LoadedImage } from "@/lib/image";
import { drawPFP, drawCard, ensureFonts } from "@/lib/draw";
import { builderTitle } from "@/lib/titles";

type Format = "pfp" | "card";

const CAPTION =
  "Just got my HH Goa 2026 builder pass 🌴☀️ See you on the beach. #FrameInGoa";

export default function Generator() {
  const [img, setImg] = useState<LoadedImage | null>(null);
  const [format, setFormat] = useState<Format>("pfp");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [titleSeed, setTitleSeed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // The canvas is deliberately kept OUT of the DOM: some Chrome states
  // composite a stale texture for displayed canvases (showing the unmasked
  // photo) even though the pixel buffer is correct. Export paths
  // (toDataURL/toBlob) always read the real buffer, so we render on a
  // detached canvas and preview through a plain <img>.
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const title = builderTitle(name || "goa builder", titleSeed);

  useEffect(() => {
    try {
      const f = new File([new Blob(["x"])], "x.png", { type: "image/png" });
      setCanNativeShare(!!navigator.canShare?.({ files: [f] }));
    } catch {
      setCanNativeShare(false);
    }
  }, []);

  // redraw whenever inputs change
  useEffect(() => {
    if (!img) return;
    let cancelled = false;
    (async () => {
      await ensureFonts();
      if (cancelled) return;
      if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
      const canvas = canvasRef.current;
      if (format === "pfp") await drawPFP(canvas, img);
      else await drawCard(canvas, img, { name, role, title });
      if (!cancelled) setPreviewUrl(canvas.toDataURL("image/png"));
    })();
    return () => {
      cancelled = true;
    };
  }, [img, format, name, role, title]);

  const onFile = useCallback(async (file: File | undefined | null) => {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const loaded = await loadPhoto(file);
      setImg(loaded);
    } catch {
      setError("Couldn't read that photo — try a JPG, PNG, WebP or HEIC.");
    } finally {
      setLoading(false);
    }
  }, []);

  const toBlob = useCallback(
    () =>
      new Promise<Blob>((resolve, reject) => {
        canvasRef.current?.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("export failed"))),
          "image/png"
        );
      }),
    []
  );

  const download = useCallback(async () => {
    try {
      const blob = await toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "pfp" ? "hh-goa-2026-pfp.png" : "hh-goa-2026-id.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setError("Download failed — try again.");
    }
  }, [toBlob, format]);

  const shareToX = useCallback(async () => {
    setError(null);
    setSharing(true);
    // open a window synchronously so popup blockers allow it
    const popup = window.open("about:blank", "_blank");
    try {
      const blob = await toBlob();
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "content-type": "image/png", "x-format": format },
        body: blob,
      });
      if (!res.ok) throw new Error(await res.text());
      const { shareUrl } = (await res.json()) as { shareUrl: string };
      const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        CAPTION
      )}&url=${encodeURIComponent(shareUrl)}`;
      if (popup) popup.location.href = intent;
      else window.location.href = intent;
    } catch {
      popup?.close();
      // fallback: still open a pre-filled tweet, user attaches the downloaded image
      setError(
        "Couldn't create a share link — downloaded the image instead. Attach it to your tweet!"
      );
      await download();
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(CAPTION)}`,
        "_blank"
      );
    } finally {
      setSharing(false);
    }
  }, [toBlob, format, download]);

  const nativeShare = useCallback(async () => {
    try {
      const blob = await toBlob();
      const file = new File([blob], "hh-goa-2026.png", { type: "image/png" });
      await navigator.share({ files: [file], text: CAPTION });
    } catch {
      /* user cancelled — ignore */
    }
  }, [toBlob]);

  const pick = () => fileRef.current?.click();

  return (
    <section id="generator" className="mx-auto w-full max-w-5xl px-4 pb-24">
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      {/* format tabs */}
      <div className="mb-5 flex justify-center gap-2">
        {(
          [
            ["pfp", "PFP FRAME"],
            ["card", "BUILDER ID"],
          ] as const
        ).map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`font-display rounded-full px-5 py-2.5 text-xs tracking-wider transition-all sm:text-sm ${
              format === f
                ? "bg-gold text-night shadow-[0_0_24px_rgba(255,184,48,0.45)]"
                : "border border-[rgba(255,243,224,0.25)] text-cream/80 hover:border-gold/60"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
        {/* controls */}
        <div className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            onClick={pick}
            onKeyDown={(e) => e.key === "Enter" && pick()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              onFile(e.dataTransfer.files?.[0]);
            }}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
              dragOver
                ? "border-teal bg-teal/10"
                : "border-[rgba(255,243,224,0.3)] hover:border-gold/70 hover:bg-white/5"
            }`}
          >
            <div className="font-display text-sm tracking-wide text-cream">
              {loading ? "READING PHOTO…" : img ? "SWAP PHOTO" : "UPLOAD YOUR PHOTO"}
            </div>
            <div className="mt-2 font-mono text-xs text-sand/70">
              jpg · png · webp · heic — any crop, we handle it
            </div>
          </div>

          {format === "card" && (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <label className="block">
                <span className="font-mono text-xs tracking-widest text-gold">
                  NAME
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={30}
                  placeholder="Ada Lovelace"
                  className="mt-1 w-full rounded-lg border border-white/15 bg-night/60 px-3 py-2.5 font-mono text-sm text-cream outline-none placeholder:text-cream/30 focus:border-teal"
                />
              </label>
              <label className="block">
                <span className="font-mono text-xs tracking-widest text-gold">
                  STACK / ROLE
                </span>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  maxLength={40}
                  placeholder="rust · solidity · vibes"
                  className="mt-1 w-full rounded-lg border border-white/15 bg-night/60 px-3 py-2.5 font-mono text-sm text-cream outline-none placeholder:text-cream/30 focus:border-teal"
                />
              </label>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2.5">
                <div>
                  <div className="font-mono text-[10px] tracking-widest text-gold">
                    BUILDER TITLE
                  </div>
                  <div className="font-display text-sm text-cream">☼ {title}</div>
                </div>
                <button
                  onClick={() => setTitleSeed((s) => s + 1)}
                  className="shrink-0 rounded-full border border-gold/50 px-3 py-1.5 font-mono text-xs text-gold transition-colors hover:bg-gold hover:text-night"
                  title="Reroll title"
                >
                  ↻ reroll
                </button>
              </div>
            </div>
          )}

          {img && (
            <div className="flex flex-col gap-2.5">
              <button
                onClick={download}
                className="font-display w-full rounded-xl bg-gold px-5 py-3.5 text-sm tracking-wider text-night shadow-[0_0_32px_rgba(255,184,48,0.35)] transition-transform active:scale-[0.98]"
              >
                ⬇ DOWNLOAD PNG
              </button>
              <button
                onClick={shareToX}
                disabled={sharing}
                className="font-display w-full rounded-xl bg-cream px-5 py-3.5 text-sm tracking-wider text-night transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {sharing ? "PREPPING TWEET…" : "𝕏 SHARE ON X"}
              </button>
              {canNativeShare && (
                <button
                  onClick={nativeShare}
                  className="w-full rounded-xl border border-white/20 px-5 py-3 font-mono text-xs tracking-wider text-cream/90 transition-colors hover:border-teal"
                >
                  ⇪ share image directly (attaches the PNG)
                </button>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-pink/40 bg-pink/10 px-3 py-2 font-mono text-xs text-cream">
              {error}
            </p>
          )}
        </div>

        {/* preview */}
        <div
          className={`relative flex min-h-[280px] items-center justify-center rounded-2xl border border-white/10 bg-night/50 p-3 sm:p-5 ${
            img ? "" : "border-dashed"
          }`}
        >
          {img && previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Your HH Goa 2026 graphic"
              className="h-auto w-full max-w-full rounded-lg shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
              style={format === "pfp" ? { maxWidth: 520 } : undefined}
            />
          ) : img ? (
            <div className="py-16 text-center font-mono text-sm text-cream/60">
              rendering…
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="text-5xl">🌴</div>
              <p className="mt-3 font-mono text-sm text-cream/50">
                your {format === "pfp" ? "framed PFP" : "builder ID"} shows up here
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
