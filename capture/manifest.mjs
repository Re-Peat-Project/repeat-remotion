// Writes public/shots/manifest.json with the pixel size of every shot (and clip duration),
// which the video uses to frame pans and zooms. Runs at the end of capture, or alone:
//   node capture/manifest.mjs
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function writeManifest(ffmpegPath = "ffmpeg") {
  const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "shots");
  const ffprobe = ffmpegPath.replace(/ffmpeg(\.exe)?$/i, (m) => m.replace("ffmpeg", "ffprobe"));
  const out = {};
  for (const f of fs.readdirSync(dir).sort()) {
    const id = f.replace(/\.(png|mp4)$/, "");
    if (f.endsWith(".png")) {
      const b = fs.readFileSync(path.join(dir, f));
      out[id] = { file: `shots/${f}`, w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    } else if (f.endsWith(".mp4")) {
      const r = spawnSync(ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries",
        "stream=width,height:format=duration", "-of", "json", path.join(dir, f)], { encoding: "utf8" });
      const j = JSON.parse(r.stdout);
      out[id] = { file: `shots/${f}`, w: j.streams[0].width, h: j.streams[0].height, dur: +(+j.format.duration).toFixed(2) };
    }
  }
  // photos (public/photos/*.jpg|png), addressed by file name without extension
  const photos = path.join(dir, "..", "photos");
  if (fs.existsSync(photos)) {
    for (const f of fs.readdirSync(photos).sort()) {
      if (!/\.(jpe?g|png)$/i.test(f)) continue;
      const r = spawnSync(ffprobe, ["-v", "error", "-show_entries", "stream=width,height", "-of", "json", path.join(photos, f)], { encoding: "utf8" });
      const st = JSON.parse(r.stdout).streams[0];
      out[f.replace(/\.\w+$/, "")] = { file: `photos/${f}`, w: st.width, h: st.height };
    }
  }
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(out, null, 1));
  console.log(`  manifest.json: ${Object.keys(out).length} files`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const base = path.join(process.env.LOCALAPPDATA ?? "", "Microsoft", "WinGet", "Packages");
  let ff = "ffmpeg";
  if (spawnSync("ffprobe", ["-version"]).status !== 0 && fs.existsSync(base)) {
    const pkg = fs.readdirSync(base).find((d) => d.startsWith("Gyan.FFmpeg"));
    const inner = pkg && fs.readdirSync(path.join(base, pkg)).find((d) => d.startsWith("ffmpeg"));
    if (inner) ff = path.join(base, pkg, inner, "bin", "ffmpeg.exe");
  }
  writeManifest(ff);
}
