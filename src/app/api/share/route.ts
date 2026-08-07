import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const buf = await req.arrayBuffer();
  if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "bad image size" }, { status: 400 });
  }
  // PNG magic bytes check
  const head = new Uint8Array(buf.slice(0, 8));
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!png.every((b, i) => head[i] === b)) {
    return NextResponse.json({ error: "not a png" }, { status: 400 });
  }

  const format = req.headers.get("x-format") === "card" ? "card" : "pfp";
  const id = nanoid(10);

  const blob = await put(`shares/${id}-${format}.png`, buf, {
    access: "public",
    contentType: "image/png",
    addRandomSuffix: false,
  });

  const token = Buffer.from(blob.url, "utf8").toString("base64url");
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `${req.nextUrl.protocol}//${req.headers.get("host")}`;

  return NextResponse.json({
    imageUrl: blob.url,
    shareUrl: `${origin}/s/${token}`,
  });
}
