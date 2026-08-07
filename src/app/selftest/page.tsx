"use client";

/**
 * Automated rendering self-test: builds a synthetic portrait photo,
 * runs it through the real draw pipeline for both formats, then probes
 * pixels to confirm the photo stays inside its mask. Result is written
 * to the DOM (#result) for headless verification.
 */
import { useEffect, useState } from "react";
import { drawPFP, drawCard, ensureFonts } from "@/lib/draw";
import { loadPhoto } from "@/lib/image";

async function makeTestFile(): Promise<File> {
  const c = document.createElement("canvas");
  c.width = 600;
  c.height = 800;
  const x = c.getContext("2d")!;
  x.fillStyle = "#ffffff";
  x.fillRect(0, 0, 600, 800);
  x.fillStyle = "#0a7";
  x.font = "bold 40px sans-serif";
  for (let y = 60; y < 800; y += 90) x.fillText("PHOTO CONTENT", 30, y);
  const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), "image/jpeg", 0.9));
  return new File([blob], "test.jpg", { type: "image/jpeg" });
}

export default function SelfTest() {
  const [result, setResult] = useState("running");
  useEffect(() => {
    (async () => {
      try {
        await ensureFonts();
        const img = await loadPhoto(await makeTestFile());
        const checks: string[] = [];

        const pfp = document.createElement("canvas");
        await drawPFP(pfp, img);
        const pctx = pfp.getContext("2d")!;
        // corners of the photo cover-box that lie outside the circle AND all
        // ring decorations — must not contain the (white) photo
        const isWhite = (c: CanvasRenderingContext2D, x: number, y: number) => {
          const d = c.getImageData(x, y, 1, 1).data;
          return d[0] > 200 && d[1] > 200 && d[2] > 200;
        };
        const spill = [
          [250, 250],
          [950, 250],
          [250, 950],
          [950, 950],
        ].filter(([x, y]) => isWhite(pctx, x, y));
        const centerOk = isWhite(pctx, 600, 560);
        checks.push(spill.length ? `PFP-FAIL(spill@${JSON.stringify(spill)})` : "PFP-OK");
        checks.push(centerOk ? "PFP-PHOTO-OK" : "PFP-PHOTO-FAIL");

        const card = document.createElement("canvas");
        await drawCard(card, img, { name: "Test Builder", role: "ts", title: "Sunburnt Shipper" });
        const cctx = card.getContext("2d")!;
        // photo window x=92..512, y=320..840; corner (94,322) is outside r=26 => must not be white
        const corner = cctx.getImageData(94, 322, 1, 1).data;
        const inside = cctx.getImageData(300, 500, 1, 1).data;
        const cornerWhite = corner[0] > 220 && corner[1] > 220 && corner[2] > 220;
        const insideWhite = inside[0] > 200 && inside[1] > 200 && inside[2] > 200;
        checks.push(cornerWhite ? "CARD-FAIL(corner-white)" : "CARD-OK");
        checks.push(insideWhite ? "CARD-PHOTO-OK" : "CARD-PHOTO-FAIL");

        const pass = checks.every((c) => !c.includes("FAIL"));
        setResult(`${pass ? "PASS" : "FAIL"}: ${checks.join(" ")}`);
        // also show the renders for eyeballing — as <img>, matching how the
        // app previews (displayed canvases can composite stale textures)
        for (const [c, w] of [
          [pfp, 360],
          [card, 576],
        ] as const) {
          const im = document.createElement("img");
          im.src = c.toDataURL("image/png");
          im.style.cssText = `width:${w}px;display:block`;
          document.body.appendChild(im);
        }
      } catch (e) {
        setResult(`ERROR: ${(e as Error).message}`);
      }
    })();
  }, []);
  return (
    <main style={{ background: "#fff", color: "#000", padding: 16, minHeight: "100vh" }}>
      <div id="result">{result}</div>
    </main>
  );
}
