# FrameIn Goa — HH Goa 2026 frame & builder-ID generator

**Live:** https://hh-goa-frame.vercel.app

Upload a photo → get a branded HH Goa 2026 graphic in seconds. No login, works from your phone.

Two formats:

- **PFP Frame** — your photo in a circular window wrapped in a Goa-sunset frame (striped retro sun, palms, arc text). 1200×1200, ready to set as your X profile picture.
- **Builder ID** — a 1600×1000 event badge with your photo, name, stack/role, a generated "builder title" (reroll until it fits), name-seeded barcode and badge ID.

Download as PNG, or **Share on X**: opens a pre-filled tweet (#FrameInGoa) with a link whose card preview is your actual generated graphic. On mobile you can also attach the PNG directly via the native share sheet.

## How it works

- **Next.js 16** (App Router) on Vercel, Tailwind v4, fonts: Unbounded + Space Mono.
- Every pixel of branding is **drawn programmatically on canvas** — sun, palms, waves, grain, arc text. No image assets.
- Photos: jpg/png/webp/**HEIC** (lazy-loaded `heic2any`, native decode tried first), EXIF orientation respected, any aspect ratio cover-cropped automatically.
- Photo masking is done with **SDF pixel math + manual alpha blending** instead of `clip()`/`globalCompositeOperation`, and the preview is an `<img>` fed from `toDataURL()` — deterministic output regardless of browser GPU/rasterizer state.
- Share flow: generated PNG → `/api/share` → Vercel Blob → `/s/[token]` share page (token = base64url of the blob URL, host-validated) carrying OG/Twitter meta that points at the generated image → X intent URL.
- `/selftest` renders both formats from a synthetic photo and pixel-probes the masks — used with headless Chrome for verification.

## Run locally

```bash
npm install
npm run dev
```

Sharing needs a Vercel Blob store: set `BLOB_READ_WRITE_TOKEN` (and optionally `NEXT_PUBLIC_SITE_URL`). Everything else runs fully client-side.
