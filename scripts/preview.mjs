// Renders one still per scene (at the given fraction of each scene) into out/preview/.
//   node scripts/preview.mjs [fraction=0.6] [scene numbers...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const [fracArg, ...only] = process.argv.slice(2);
const frac = fracArg ? Number(fracArg) : 0.6;
const outDir = path.join(root, "out", "preview");
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.join(root, "src", "index.ts") });
const comp = await selectComposition({ serveUrl, id: "Launch" });

// scene durations, read from the bundled content via a tiny parse of content.ts is fragile,
// so the composition exposes nothing; recompute from the source instead
const src = fs.readFileSync(path.join(root, "src", "content.ts"), "utf8");
const body = src.slice(src.indexOf("export const scenes"));
const durs = [...body.matchAll(/dur: (\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
const T = 18;
let start = 0;
for (let i = 0; i < durs.length; i++) {
  const len = Math.round(durs[i] * 30);
  const frame = Math.min(comp.durationInFrames - 1, start + Math.round(len * frac));
  if (only.length === 0 || only.includes(String(i + 1))) {
    await renderStill({
      composition: comp,
      serveUrl,
      frame,
      output: path.join(outDir, `s${String(i + 1).padStart(2, "0")}.jpg`),
      imageFormat: "jpeg",
      scale: 0.5,
    });
    console.log("scene", i + 1, "frame", frame);
  }
  start += len - T;
}
console.log("total frames", comp.durationInFrames, (comp.durationInFrames / 30 / 60).toFixed(2), "min");
