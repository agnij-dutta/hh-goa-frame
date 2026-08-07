import { LoadedImage, imgSize } from "./image";
import { badgeId } from "./titles";

/* ── HH Goa 2026 palette ─────────────────────────────────── */
export const C = {
  night: "#160b33",
  indigo: "#2a1458",
  violet: "#6c2bd9",
  pink: "#ff2e63",
  tangerine: "#ff6b35",
  gold: "#ffb830",
  cream: "#fff3e0",
  sand: "#ffd9a0",
  teal: "#19e3c2",
};

const DISPLAY = "Unbounded";
const MONO = "'Space Mono', monospace";

export async function ensureFonts(): Promise<void> {
  if (typeof document === "undefined") return;
  const wanted = [
    `900 90px ${DISPLAY}`,
    `800 60px ${DISPLAY}`,
    `700 30px ${DISPLAY}`,
    `400 24px 'Space Mono'`,
    `700 24px 'Space Mono'`,
  ];
  await Promise.all(wanted.map((f) => document.fonts.load(f))).catch(() => {});
  await document.fonts.ready;
}

/* ── primitives ──────────────────────────────────────────── */

function skyGradient(ctx: CanvasRenderingContext2D, w: number, h: number, horizon = 1) {
  const g = ctx.createLinearGradient(0, 0, 0, h * horizon);
  g.addColorStop(0, C.night);
  g.addColorStop(0.35, C.indigo);
  g.addColorStop(0.6, C.violet);
  g.addColorStop(0.78, C.pink);
  g.addColorStop(0.92, C.tangerine);
  g.addColorStop(1, C.gold);
  return g;
}

/**
 * Retro striped sun. No clip()/composite ops — some Chrome builds silently
 * ignore them on canvas (see maskedPhoto) — so the disc is a filled arc path
 * and the stripe gaps are chords painted in the background's own fill.
 */
function drawSun(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  gapFill: string | CanvasGradient,
  glow = true
) {
  ctx.save();
  if (glow) {
    const gl = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 2.1);
    gl.addColorStop(0, "rgba(255,184,48,0.55)");
    gl.addColorStop(1, "rgba(255,184,48,0)");
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2.1, 0, Math.PI * 2);
    ctx.fill();
  }
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, "#ffe27a");
  g.addColorStop(0.55, C.gold);
  g.addColorStop(1, C.pink);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // stripe gaps, thicker toward the bottom, drawn as background-filled chords
  ctx.fillStyle = gapFill;
  let y = cy + r * 0.05;
  let gap = r * 0.035;
  while (y < cy + r) {
    const rel = Math.min(Math.abs(y - cy), r) / r;
    const half = Math.sqrt(Math.max(0, 1 - rel * rel)) * r + 2;
    ctx.fillRect(cx - half, y, half * 2, Math.min(gap, cy + r - y));
    y += gap * 3.1;
    gap *= 1.35;
  }
  ctx.restore();
}

/** Silhouette palm tree. lean: -1..1 tilts the crown; flip mirrors fronds. */
function drawPalm(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  h: number,
  lean = 0,
  color = C.night
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  const topX = x + lean * h * 0.35;
  const topY = baseY - h;
  // trunk: tapered curve
  ctx.beginPath();
  ctx.moveTo(x - h * 0.045, baseY);
  ctx.quadraticCurveTo(x + lean * h * 0.1, baseY - h * 0.55, topX - h * 0.016, topY);
  ctx.lineTo(topX + h * 0.016, topY);
  ctx.quadraticCurveTo(x + lean * h * 0.16, baseY - h * 0.5, x + h * 0.045, baseY);
  ctx.closePath();
  ctx.fill();
  // trunk notches
  ctx.lineWidth = h * 0.012;
  for (let i = 1; i <= 4; i++) {
    const t = i / 5.5;
    const nx = x + (topX - x) * t + lean * h * 0.06 * Math.sin(t * 3);
    const ny = baseY + (topY - baseY) * t;
    ctx.beginPath();
    ctx.moveTo(nx - h * 0.035, ny);
    ctx.lineTo(nx + h * 0.035, ny - h * 0.012);
    ctx.stroke();
  }
  // fronds: pointed leaves fanned around the crown
  const fronds = 7;
  for (let i = 0; i < fronds; i++) {
    const ang = -Math.PI * 0.95 + (i / (fronds - 1)) * Math.PI * 0.9 + lean * 0.3;
    const len = h * (0.42 + 0.1 * Math.sin(i * 2.7));
    const ex = topX + Math.cos(ang) * len;
    const ey = topY + Math.sin(ang) * len + len * 0.28; // droop
    const midx = topX + Math.cos(ang) * len * 0.5;
    const midy = topY + Math.sin(ang) * len * 0.5 - len * 0.16; // arch up
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(midx, midy, ex, ey);
    ctx.quadraticCurveTo(midx + h * 0.02, midy + len * 0.22, topX, topY + h * 0.02);
    ctx.closePath();
    ctx.fill();
  }
  // coconuts
  ctx.beginPath();
  ctx.arc(topX - h * 0.035, topY + h * 0.045, h * 0.028, 0, Math.PI * 2);
  ctx.arc(topX + h * 0.04, topY + h * 0.055, h * 0.024, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

let noisePattern: CanvasPattern | null = null;
function grain(ctx: CanvasRenderingContext2D, w: number, h: number, alpha = 0.06) {
  if (!noisePattern) {
    const n = document.createElement("canvas");
    n.width = n.height = 128;
    const nc = n.getContext("2d")!;
    const d = nc.createImageData(128, 128);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.random() * 255;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 255;
    }
    nc.putImageData(d, 0, 0);
    noisePattern = ctx.createPattern(n, "repeat");
  }
  ctx.save();
  ctx.globalAlpha = alpha * 0.7;
  ctx.fillStyle = noisePattern!;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Debug stage dumper: collects toDataURL snapshots when window.__dbgstages is set. */
function dbgStage(label: string, source: HTMLCanvasElement | ImageData) {
  const g = globalThis as unknown as { __dbgstages?: Record<string, string> };
  if (!g.__dbgstages) return;
  let c: HTMLCanvasElement;
  if (source instanceof ImageData) {
    c = document.createElement("canvas");
    c.width = source.width;
    c.height = source.height;
    c.getContext("2d")!.putImageData(source, 0, 0);
  } else {
    c = source;
  }
  g.__dbgstages[label] = c.toDataURL("image/png");
}

function scanlines(ctx: CanvasRenderingContext2D, w: number, h: number, alpha = 0.05) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#000";
  for (let y = 0; y < h; y += 6) ctx.fillRect(0, y, w, 2);
  ctx.restore();
}

/**
 * Cover-crop the photo into an offscreen canvas and mask it to a circle or
 * rounded rect by writing alpha directly into the pixel buffer.
 *
 * We deliberately avoid ctx.clip() and globalCompositeOperation for this:
 * some Chrome GPU-rasterization states silently ignore both (observed live —
 * a clipped drawImage painted the full square), which spills the photo over
 * the frame. Masking in the pixel buffer (SDF coverage for antialiased
 * edges) is deterministic, and the result is returned as a *fresh*
 * ImageBitmap: drawing the scratch canvas itself can sample a stale GPU
 * texture from before putImageData (also observed live), while
 * createImageBitmap(imageData) always uploads the CPU pixels.
 */
function maskedPhotoData(
  img: LoadedImage,
  w: number,
  h: number,
  radius: number | "circle",
  vignette = false
): ImageData {
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const octx = off.getContext("2d", { willReadFrequently: true })!;
  const { w: iw, h: ih } = imgSize(img);
  const s = Math.max(w / iw, h / ih);
  const dw = iw * s;
  const dh = ih * s;
  octx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  dbgStage(`off-after-cover-${w}x${h}`, off);

  const id = octx.getImageData(0, 0, w, h);
  const d = id.data;
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2;
  // night tint components for the vignette
  const nr = 22, ng = 11, nb = 51;
  const rr = radius === "circle" ? r : Math.max(0, Math.min(radius, r));
  const hw = w / 2, hh = h / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let sd: number; // signed distance outside the shape (>0 = outside)
      let dist = 0;
      if (radius === "circle") {
        dist = Math.hypot(px - cx, py - cy);
        sd = dist - r;
      } else {
        const qx = Math.abs(px - cx) - (hw - rr);
        const qy = Math.abs(py - cy) - (hh - rr);
        sd =
          Math.min(Math.max(qx, qy), 0) +
          Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) -
          rr;
      }
      const cov = Math.max(0, Math.min(1, 0.5 - sd)); // 1px antialiased edge
      const i = (y * w + x) * 4;
      if (cov <= 0) {
        d[i + 3] = 0;
        continue;
      }
      if (cov < 1) d[i + 3] = Math.round(d[i + 3] * cov);
      if (vignette && radius === "circle") {
        const t = Math.max(0, Math.min(1, (dist - r * 0.72) / (r * 0.28)));
        if (t > 0) {
          const k = 0.35 * t;
          d[i] = d[i] * (1 - k) + nr * k;
          d[i + 1] = d[i + 1] * (1 - k) + ng * k;
          d[i + 2] = d[i + 2] * (1 - k) + nb * k;
        }
      }
    }
  }
  dbgStage(`masked-${w}x${h}`, id);
  return id;
}

/**
 * Composite masked photo pixels onto the destination with a manual
 * source-over blend and a single putImageData. drawImage is avoided entirely
 * for the photo: in the broken-Chrome states described above, drawImage was
 * observed sampling the wrong/stale source texture no matter how the masked
 * image was materialized. Pixel writes cannot be misinterpreted.
 */
function blendPhotoOnto(
  ctx: CanvasRenderingContext2D,
  photo: ImageData,
  dx: number,
  dy: number
) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const { width: w, height: h } = photo;
  // Blend into the FULL canvas buffer, not a photo-sized region: when a
  // putImageData region matches the masked photo's dimensions, the broken
  // compositor states upload the wrong (unmasked) buffer to the display
  // texture. A full-canvas putImageData has a unique shape and dodges that.
  const full = ctx.getImageData(0, 0, W, H);
  dbgStage(`scene-pre-blend-${W}x${H}`, full);
  const f = full.data;
  const s = photo.data;
  for (let y = 0; y < h; y++) {
    const row = (y + dy) * W;
    for (let x = 0; x < w; x++) {
      const si = (y * w + x) * 4;
      const a = s[si + 3] / 255;
      if (a === 0) continue;
      const di = (row + (x + dx)) * 4;
      if (a === 1) {
        f[di] = s[si];
        f[di + 1] = s[si + 1];
        f[di + 2] = s[si + 2];
        f[di + 3] = 255;
      } else {
        const ia = 1 - a;
        f[di] = s[si] * a + f[di] * ia;
        f[di + 1] = s[si + 1] * a + f[di + 1] * ia;
        f[di + 2] = s[si + 2] * a + f[di + 2] * ia;
        f[di + 3] = Math.max(f[di + 3], s[si + 3]);
      }
    }
  }
  dbgStage(`blended-${W}x${H}`, full);
  ctx.putImageData(full, 0, 0);
}

/** Text along a circular arc. side="top" reads left→right over the top,
 *  side="bottom" reads left→right under the bottom (glyphs upright). */
function arcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  r: number,
  side: "top" | "bottom",
  font: string,
  fill: string,
  letterSpace = 1.24
) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = fill;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const widths = [...text].map((ch) => ctx.measureText(ch).width * letterSpace);
  const total = widths.reduce((a, b) => a + b, 0);
  const totalAngle = total / r;
  let ang = side === "top" ? -Math.PI / 2 - totalAngle / 2 : Math.PI / 2 + totalAngle / 2;
  for (let i = 0; i < text.length; i++) {
    const half = widths[i] / 2 / r;
    ang += side === "top" ? half : -half;
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang + (side === "top" ? Math.PI / 2 : -Math.PI / 2));
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
    ang += side === "top" ? half : -half;
  }
  ctx.restore();
}

function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  weight: number,
  startPx: number,
  family: string,
  minPx = 20
): number {
  let px = startPx;
  while (px > minPx) {
    ctx.font = `${weight} ${px}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    px -= 2;
  }
  return px;
}

/* ── Format A: PFP frame (1200×1200) ─────────────────────── */

export async function drawPFP(canvas: HTMLCanvasElement, img: LoadedImage) {
  const S = 1200;
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const cx = S / 2;
  const cy = S / 2;
  const photoR = 424;

  // scene behind the ring
  ctx.fillStyle = skyGradient(ctx, S, S);
  ctx.fillRect(0, 0, S, S);
  drawSun(ctx, cx, S * 0.4, 430, skyGradient(ctx, S, S));
  // waves across the lower band
  ctx.save();
  ctx.strokeStyle = "rgba(255,243,224,0.5)";
  ctx.lineWidth = 5;
  for (let row = 0; row < 3; row++) {
    const y0 = S * 0.86 + row * 38;
    ctx.beginPath();
    for (let x = -20; x <= S + 20; x += 8) {
      const y = y0 + Math.sin((x / S) * Math.PI * 7 + row * 1.4) * 10;
      x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.globalAlpha = 0.55 - row * 0.15;
    ctx.stroke();
  }
  ctx.restore();
  drawPalm(ctx, S * 0.085, S * 1.02, 400, 0.45);
  drawPalm(ctx, S * 0.92, S * 1.03, 440, -0.45);

  // darken the band a touch so arc text pops
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, S, S);
  ctx.arc(cx, cy, photoR + 32, 0, Math.PI * 2, true);
  ctx.fillStyle = "rgba(22,11,51,0.30)";
  ctx.fill();
  ctx.restore();

  // photo in circle (pre-masked pixels, with edge vignette)
  blendPhotoOnto(
    ctx,
    maskedPhotoData(img, photoR * 2, photoR * 2, "circle", true),
    cx - photoR,
    cy - photoR
  );

  // rings
  ctx.lineWidth = 14;
  ctx.strokeStyle = C.gold;
  ctx.beginPath();
  ctx.arc(cx, cy, photoR + 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = C.cream;
  ctx.beginPath();
  ctx.arc(cx, cy, photoR + 24, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([2, 10]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,243,224,0.7)";
  ctx.beginPath();
  ctx.arc(cx, cy, 578, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // arc text
  ctx.save();
  ctx.shadowColor = "rgba(22,11,51,0.8)";
  ctx.shadowBlur = 14;
  arcText(ctx, "HH GOA 2026", cx, cy, 512, "top", `800 62px ${DISPLAY}`, C.cream);
  arcText(ctx, "#FRAMEINGOA", cx, cy, 508, "bottom", `700 46px ${DISPLAY}`, C.gold);
  ctx.restore();

  // side markers: tiny suns at 3 and 9 o'clock
  for (const side of [-1, 1]) {
    const mx = cx + side * 522;
    ctx.save();
    ctx.translate(mx, cy);
    ctx.fillStyle = C.teal;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const rr = i % 2 === 0 ? 16 : 16;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  scanlines(ctx, S, S, 0.03);
  grain(ctx, S, S, 0.07);
}

/* ── Format B: Builder ID card (1600×1000) ───────────────── */

export interface CardFields {
  name: string;
  role: string;
  title: string;
}

export async function drawCard(
  canvas: HTMLCanvasElement,
  img: LoadedImage,
  fields: CardFields
) {
  const W = 1600;
  const H = 1000;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const name = (fields.name || "Goa Builder").trim() || "Goa Builder";
  const role = (fields.role || "full-stack beach dev").trim();
  const horizon = 715;

  // sky, then the sun; the sea fill afterwards covers the sun below the horizon
  const sky = skyGradient(ctx, W, horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, horizon);
  const sunX = 1215;
  drawSun(ctx, sunX, horizon - 10, 265, sky);
  const sea = ctx.createLinearGradient(0, horizon, 0, H);
  sea.addColorStop(0, "#3d1856");
  sea.addColorStop(1, C.night);
  ctx.fillStyle = sea;
  ctx.fillRect(0, horizon, W, H - horizon);
  // sun reflection
  ctx.save();
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 9; i++) {
    const y = horizon + 14 + i * 26;
    const hw = 190 * (1 - i / 10) * (0.65 + 0.35 * Math.sin(i * 2.2));
    ctx.fillStyle = i % 2 ? C.pink : C.gold;
    ctx.fillRect(sunX - hw / 2, y, hw, 7);
  }
  ctx.restore();
  // wave lines on the sea
  ctx.save();
  ctx.strokeStyle = "rgba(25,227,194,0.35)";
  ctx.lineWidth = 3;
  for (let row = 0; row < 4; row++) {
    const y0 = horizon + 46 + row * 58;
    ctx.beginPath();
    for (let x = -20; x <= W + 20; x += 10) {
      const y = y0 + Math.sin((x / W) * Math.PI * 9 + row) * 7;
      x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();

  // palms, right side
  drawPalm(ctx, 1500, horizon + 14, 460, -0.5);
  drawPalm(ctx, 1345, horizon + 10, 330, -0.25);

  // readability wash over the content zone
  const wash = ctx.createLinearGradient(0, 0, W * 0.78, 0);
  wash.addColorStop(0, "rgba(22,11,51,0.78)");
  wash.addColorStop(0.62, "rgba(22,11,51,0.45)");
  wash.addColorStop(1, "rgba(22,11,51,0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);

  // card borders: outer gold + inner dashed "cut line"
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 8;
  ctx.strokeRect(14, 14, W - 28, H - 28);
  ctx.setLineDash([14, 12]);
  ctx.strokeStyle = "rgba(255,243,224,0.55)";
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, W - 68, H - 68);
  ctx.setLineDash([]);

  // lanyard slot
  ctx.fillStyle = C.night;
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(W / 2 - 80, 52, 160, 26, 13);
  ctx.fill();
  ctx.stroke();

  // header
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = C.teal;
  ctx.font = `700 26px ${MONO}`;
  ctx.fillText("H A C K E R   H O U S E", 92, 130);
  // riso-style double print
  ctx.font = `900 96px ${DISPLAY}`;
  ctx.fillStyle = C.pink;
  ctx.fillText("HH GOA 2026", 97, 232);
  ctx.fillStyle = C.cream;
  ctx.fillText("HH GOA 2026", 92, 226);
  ctx.fillStyle = "rgba(255,216,160,0.85)";
  ctx.font = `400 24px ${MONO}`;
  ctx.fillText("BUILDER CREDENTIAL · GOA, INDIA", 92, 272);

  // photo window
  const px = 92, py = 320, pw = 420, ph = 520, pr = 26;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = C.gold;
  ctx.beginPath();
  ctx.roundRect(px - 8, py - 8, pw + 16, ph + 16, pr + 8);
  ctx.fill();
  ctx.restore();
  blendPhotoOnto(ctx, maskedPhotoData(img, pw, ph, pr), px, py);
  ctx.strokeStyle = "rgba(255,243,224,0.9)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(px + 6, py + 6, pw - 12, ph - 12, pr - 6);
  ctx.stroke();

  // fields
  const fx = 570;
  const maxW = 930;
  ctx.fillStyle = C.gold;
  ctx.font = `700 24px ${MONO}`;
  ctx.fillText("BUILDER", fx, 400);
  const namePx = fitFont(ctx, name.toUpperCase(), maxW, 800, 76, DISPLAY, 30);
  ctx.font = `800 ${namePx}px ${DISPLAY}`;
  ctx.fillStyle = C.cream;
  ctx.fillText(name.toUpperCase(), fx, 400 + namePx + 18);

  ctx.fillStyle = C.gold;
  ctx.font = `700 24px ${MONO}`;
  ctx.fillText("STACK / ROLE", fx, 560);
  const rolePx = fitFont(ctx, role, maxW, 700, 36, "'Space Mono'", 20);
  ctx.font = `700 ${rolePx}px 'Space Mono'`;
  ctx.fillStyle = C.teal;
  ctx.fillText(role, fx, 560 + rolePx + 14);

  // title pill
  ctx.font = `700 24px ${MONO}`;
  ctx.fillStyle = C.gold;
  ctx.fillText("CERTIFIED TITLE", fx, 690);
  const title = `☼ ${fields.title.toUpperCase()}`;
  const titlePx = fitFont(ctx, title, maxW - 80, 700, 34, DISPLAY, 18);
  ctx.font = `700 ${titlePx}px ${DISPLAY}`;
  const tw = ctx.measureText(title).width;
  ctx.save();
  ctx.shadowColor = "rgba(255,184,48,0.45)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = C.gold;
  ctx.beginPath();
  ctx.roundRect(fx, 712, tw + 64, titlePx + 42, (titlePx + 42) / 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = C.night;
  ctx.font = `700 ${titlePx}px ${DISPLAY}`;
  ctx.fillText(title, fx + 32, 712 + titlePx + 12);

  // footer strip
  const fy = 906;
  // barcode seeded by name
  ctx.save();
  ctx.fillStyle = C.cream;
  let bx = 92;
  let seed = 0;
  for (const ch of name) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  for (let i = 0; i < 34 && bx < 400; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const bw = 2 + (seed % 6);
    ctx.fillRect(bx, fy - 34, bw, 48);
    bx += bw + 3 + (seed % 4);
  }
  ctx.restore();
  ctx.fillStyle = C.cream;
  ctx.font = `700 30px ${MONO}`;
  ctx.textAlign = "center";
  ctx.fillText("#FrameInGoa", W / 2, fy + 4);
  ctx.textAlign = "right";
  ctx.fillStyle = C.sand;
  ctx.font = `400 26px ${MONO}`;
  ctx.fillText(`ID ${badgeId(name)} · SUNSET SHIFT`, W - 92, fy + 4);
  ctx.textAlign = "left";

  scanlines(ctx, W, H, 0.035);
  grain(ctx, W, H, 0.07);

  // vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.75);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(22,11,51,0.4)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}
