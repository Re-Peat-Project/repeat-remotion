// Captures dashboard screenshots, interaction clips and headline numbers.
// Usage:  npm run capture                 (everything)
//         npm run capture -- home clip-weights   (only these ids)
//         npm run capture -- --url=http://localhost:8000/   (other dashboard address)
import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeManifest } from "./manifest.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const cfg = JSON.parse(fs.readFileSync(path.join(here, "shots.json"), "utf8"));
const args = process.argv.slice(2);
const urlArg = args.find((a) => a.startsWith("--url="));
if (urlArg) cfg.baseUrl = urlArg.slice(6).replace(/\/?$/, "/");
const only = args.filter((a) => !a.startsWith("--"));
const want = (id) => only.length === 0 || only.includes(id);

const outDir = path.join(root, "public", "shots");
fs.mkdirSync(outDir, { recursive: true });
const ffmpeg = findFfmpeg();

const HIDE_CSS = `::-webkit-scrollbar{display:none!important} html{scrollbar-width:none}
  .maplibregl-ctrl-attrib{opacity:.6} #tip,.tip,[role=tooltip]{display:none!important}`;

function urlFor(shot, lang = cfg.lang) {
  const hash = [`l=${lang}`];
  if (shot.khg) hash.push(`k=${cfg.profileKhg}`);
  return cfg.baseUrl + shot.page + "#" + hash.join("&");
}

async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
  // let map tiles and transitions finish
  await page.waitForTimeout(2500);
}

async function open(ctx, shot, lang) {
  const page = await ctx.newPage();
  await page.goto(urlFor(shot, lang), { waitUntil: "load", timeout: 120000 });
  await page.addStyleTag({ content: HIDE_CSS });
  await settle(page);
  if (shot.scrollTo) await scrollTo(page, shot.scrollTo);
  return page;
}

async function scrollTo(page, sel) {
  await page.locator(sel).first().evaluate((e) =>
    window.scrollTo({ top: e.getBoundingClientRect().top + window.scrollY - 16, behavior: "instant" }));
  await page.waitForTimeout(800);
}

async function run(page, actions = []) {
  for (const a of actions) {
    if (a.wait) await page.waitForTimeout(a.wait);
    if (a.click) await page.locator(a.click).first().click();
    if (a.clickText) await page.locator(a.clickText[0], { hasText: a.clickText[1] }).first().click();
    if (a.select) await page.selectOption(a.select[0], a.select[1]);
    if (a.scroll) await scrollTo(page, a.scroll);
    if (a.slide) await slide(page, ...a.slide);
    if (a.click || a.clickText || a.select) await page.waitForTimeout(400);
  }
  await page.mouse.move(0, 0);
}

// drag a range input from fraction `from` to `to` of its width
async function slide(page, sel, from, to, steps = 20) {
  const box = await page.locator(sel).boundingBox();
  const y = box.y + box.height / 2;
  const x = (f) => box.x + 6 + f * (box.width - 12);
  await page.mouse.move(x(from), y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(x(from + ((to - from) * i) / steps), y);
    await page.waitForTimeout(60);
  }
  await page.mouse.up();
}

async function still(ctx, shot) {
  const page = await open(ctx, shot);
  await run(page, shot.actions);
  await page.waitForTimeout(1500);
  const file = path.join(outDir, `${shot.id}.png`);
  if (shot.target === "viewport") await page.screenshot({ path: file });
  else if (shot.target === "fullpage") await page.screenshot({ path: file, fullPage: true });
  else await page.locator(shot.target).first().screenshot({ path: file });
  await page.close();
}

// Records via the DevTools screencast (sharper than Playwright's recordVideo),
// then assembles a constant-30fps mp4 with ffmpeg.
async function clip(ctx, shot) {
  const page = await open(ctx, shot);
  if (shot.scrollTo) { await page.waitForTimeout(1500); await scrollTo(page, shot.scrollTo); }
  let crop = null;
  if (shot.crop) {
    await page.locator(shot.crop).first().evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
    await page.waitForTimeout(800);
    let b = await page.locator(shot.crop).first().boundingBox();
    const { width: W, height: H } = cfg.viewport;
    if (b.height > H) {
      // taller than the screen: align its top and keep what fits
      await page.locator(shot.crop).first().evaluate((e) => e.scrollIntoView({ block: "start", behavior: "instant" }));
      await page.waitForTimeout(600);
      b = await page.locator(shot.crop).first().boundingBox();
    }
    const x0 = Math.max(0, b.x), y0 = Math.max(0, b.y);
    const x1 = Math.min(W, b.x + b.width), y1 = Math.min(H, b.y + b.height);
    // fractions of the frame, since screencast frame size can differ from viewport * scale
    const f = (v) => v.toFixed(5);
    crop = [`iw*${f((x1 - x0) / W)}`, `ih*${f((y1 - y0) / H)}`, `iw*${f(x0 / W)}`, `ih*${f(y0 / H)}`];
  }
  const tmp = fs.mkdtempSync(path.join(root, "capture", ".frames-"));
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", async (f) => {
    const name = `f${String(frames.length).padStart(5, "0")}.jpg`;
    fs.writeFileSync(path.join(tmp, name), Buffer.from(f.data, "base64"));
    frames.push({ name, t: f.metadata.timestamp });
    await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  const { width, height } = cfg.viewport;
  await cdp.send("Page.startScreencast", {
    format: "jpeg", quality: 92, maxWidth: width * cfg.scale, maxHeight: height * cfg.scale, everyNthFrame: 1,
  });
  await page.waitForTimeout(300);
  await run(page, shot.actions);
  await page.waitForTimeout(500);
  await cdp.send("Page.stopScreencast");
  const end = Date.now() / 1000;
  await page.close();

  // concat list with real frame durations (screencast only sends frames on change)
  const lines = frames.map((f, i) => {
    const next = i + 1 < frames.length ? frames[i + 1].t : Math.max(end, f.t + 0.5);
    return `file '${f.name}'\nduration ${(next - f.t).toFixed(3)}`;
  });
  lines.push(`file '${frames.at(-1).name}'`);
  fs.writeFileSync(path.join(tmp, "list.txt"), lines.join("\n"));
  const vf = [crop ? `crop=${crop.join(":")}` : null, "scale=trunc(iw/2)*2:trunc(ih/2)*2", "fps=30", "format=yuv420p"]
    .filter(Boolean).join(",");
  const r = spawnSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0",
    "-i", "list.txt", "-vf", vf, "-c:v", "libx264", "-crf", "16", "-preset", "slow",
    path.join(outDir, `${shot.id}.mp4`)], { cwd: tmp, stdio: "inherit" });
  fs.rmSync(tmp, { recursive: true, force: true });
  if (r.status !== 0) throw new Error("ffmpeg failed");
}

async function stats(ctx) {
  const out = {};
  for (const lang of ["id", "en"]) {
    for (const s of cfg.stats) {
      const page = await open(ctx, s, lang);
      const items = await page.$$eval(s.selector, (els) =>
        els.map((e) => {
          const v = e.querySelector(".v")?.textContent.trim() ?? null;
          const all = e.innerText.replace(/\s+/g, " ").trim();
          return v ? { value: v, label: all.replace(v, "").trim() } : { text: all };
        }));
      (out[s.id] ??= {})[lang] = s.first ? items[0] ?? null : items;
      await page.close();
    }
  }
  out.capturedAt = new Date().toISOString();
  out.source = cfg.baseUrl;
  fs.writeFileSync(path.join(root, "public", "stats.json"), JSON.stringify(out, null, 2));
  console.log("  stats.json written");
}

function findFfmpeg() {
  const r = spawnSync("ffmpeg", ["-version"]);
  if (r.status === 0) return "ffmpeg";
  const base = path.join(process.env.LOCALAPPDATA ?? "", "Microsoft", "WinGet", "Packages");
  const pkg = fs.existsSync(base) && fs.readdirSync(base).find((d) => d.startsWith("Gyan.FFmpeg"));
  if (pkg) {
    const inner = fs.readdirSync(path.join(base, pkg)).find((d) => d.startsWith("ffmpeg"));
    return path.join(base, pkg, inner, "bin", "ffmpeg.exe");
  }
  throw new Error("ffmpeg not found");
}

const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const ctx = await browser.newContext({
  viewport: cfg.viewport, deviceScaleFactor: cfg.scale, colorScheme: cfg.theme, locale: "id-ID",
});
const failed = [];
// stats first, from a clean page state
if (only.length === 0 || only.includes("stats")) await stats(ctx);
for (const s of cfg.stills.filter((s) => want(s.id))) {
  try { await still(ctx, s); console.log("  still", s.id); }
  catch (e) { failed.push(s.id); console.error("  FAILED still", s.id, e.message.split("\n")[0]); }
}
for (const c of cfg.clips.filter((c) => want(c.id))) {
  try { await clip(ctx, c); console.log("  clip ", c.id); }
  catch (e) { failed.push(c.id); console.error("  FAILED clip", c.id, e.message.split("\n")[0]); }
}
await browser.close();
writeManifest(ffmpeg);
if (failed.length) { console.error("Failed:", failed.join(", ")); process.exitCode = 1; }
