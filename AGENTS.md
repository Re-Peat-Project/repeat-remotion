# AGENTS.md

Instructions for AI coding agents, and for the people working with them, on this repository: the soft-launch video of the RE-PEAT peat restoration prioritisation dashboard (KLH/BPLH × UGM), built with Remotion.

## Rules that always apply

1. **Commit and push only when the user asks.** Otherwise leave changes in the working tree for the owner to review.
2. **No attribution.** Do not add `Co-Authored-By` lines, "Generated with ..." footers, or an AI name as author or contributor, in commit messages, pull request text, docs, code comments or anything shown in the video. Do not change git author settings.
3. **Numbers come from the dashboard, never from memory.** Every figure on screen is read from `public/stats.json`, which `npm run capture` reads off the live dashboard. Do not type numbers into `src/content.ts`. Build them from `stats` as the existing `nat()` helper does.
4. **Sensitive content.** The video is shown at a ministerial event that private companies also attend. Keep out of the video: named permit or concession holders, the permits map layer, and concession-share figures. The two shots that hold them (`profile-actors`, `profile-map-permits`) are captured but not used and not kept in git. Ask the owner before adding anything of that kind.
5. **Bahasa first.** Every on-screen text is a pair `{ id, en }`: Bahasa Indonesia is the large line, English the smaller one. Take definitions (action types, dimensions, interventions) from the dashboard's own translations in the dashboard source, not from paraphrase.
6. **Ask before anything outward-facing or hard to reverse**, such as publishing a render or overwriting renders or shots you have not looked at.

## Setup on a new machine

- Node.js 20 or newer, then `npm ci`.
- Google Chrome. The capture uses it through Playwright (`channel: "chrome"`). Without Chrome, run `npx playwright install chromium` and the capture falls back to that.
- ffmpeg, used by the capture to assemble clips and read sizes. It is looked up on the PATH, then in the winget folder on Windows (`winget install Gyan.FFmpeg`). On macOS: `brew install ffmpeg`.
- Optional, for agents: `npx remotion skills add` installs Remotion's agent skills (`.agents/skills/`). Read `remotion-best-practices` before writing Remotion code. Do not commit the installed skills.
- The first render downloads Remotion's Chrome Headless Shell (about 130 MB).

## Layout

| Path | What it is |
|---|---|
| `src/content.ts` | The script of the video: scene order, `{ id, en }` texts, shots, durations, camera framing, music. Most edits happen here. |
| `src/scenes.tsx` | Scene templates: `title`, `section`, `stats`, `feature` (layouts `left`, `right`, `wide`), `logos`. |
| `src/components.tsx` | Backdrop, bilingual text, camera framing over shots (`ShotFrame`, `ShotSequence`), browser frame, chips, prototype stamp. |
| `src/Launch.tsx` | Joins the scenes with crossfades (`TransitionSeries`), adds music and the stamp. Total length = sum of `dur` − 18 frames per transition. |
| `src/theme.ts` | Font (Plus Jakarta Sans), colours, the dashboard's dimension and type colours, frame size. |
| `capture/shots.json` | The shot list: what to screenshot or record on the dashboard. |
| `capture/capture.mjs` | Runs the shot list in Chrome; writes `public/shots/`, `public/stats.json` and `public/shots/manifest.json`. |
| `public/logos/`, `public/music/` | KLH/BPLH and UGM logos; the music track. |
| `scripts/preview.mjs` | Renders one still per scene to `out/preview/`. |

The dashboard is live at https://re-peat-project.github.io/re-peat/reports/national_profile/dashboard.html. Its source sits in the RE-PEAT hub repository under `reports/national_profile`.

## Workflow

| Step | Command |
|---|---|
| Re-capture all shots and numbers (about 6 min) | `npm run capture` |
| Re-capture some (ids from `shots.json`; `stats` for the numbers) | `npm run capture -- home clip-weights stats` |
| Capture from another address | `npm run capture -- --url=http://localhost:8000/` |
| Check types | `npx tsc --noEmit` |
| Check framing: one still per scene | `npm run preview` (or `node scripts/preview.mjs 0.3 12 13` for scenes 12 and 13 at 30% of their length) |
| Live preview | `npm run dev` |
| Final render (about 30 min, about 230 MB) | `npm run render` |

After a change, run `npx tsc --noEmit` and `npm run preview`, and look at the stills before rendering. After a render, check the file: duration with `ffprobe`, a few frames from scenes that play clips, and music loudness, which should be about −17 to −18 LUFS integrated (`ffmpeg -i out.mp4 -af ebur128 -f null -`).

## shots.json

Each still or clip opens `baseUrl + page`, with the dashboard state set in the URL hash (`l=id` for Bahasa; `k=<KHG code>` when `"khg": true`, using `profileKhg`).

- `target`: `"viewport"`, `"fullpage"`, or a CSS selector for an element screenshot.
- `scrollTo`: selector to scroll to before shooting.
- `actions`, run in order: `{ "wait": ms }`, `{ "click": selector }`, `{ "clickText": [selector, text] }`, `{ "select": [selector, value] }`, `{ "scroll": selector }`, `{ "slide": [rangeSelector, from, to, steps] }`.
- Clips also take `crop` (selector), which crops the recording to that element.
- Useful selectors: `#lang`, `#fin-colour` (map colour-by buttons), `#zoom-btns`, `#final-presets`, `#fw-<indicator>` (weight sliders), `#fw-reset`, `#mapcard`, `#final-types`, `#fshift`, `#final-table`, `#p-maps`, `#p-tools` (layer buttons, clicked by their Bahasa label), `#p-strips`, `#p-charts`, `.ovgrid` (land status), `#sum .kpi` and `#kpis .kpi` (headline numbers).

When the final dashboard changes a label or id, fix the shot here and re-capture. Do not edit images by hand.

## content.ts

- `dur` is in seconds. Keep the form `dur: <number>`, because `scripts/preview.mjs` reads durations with a regex.
- `from` / `to` are `[x, y, width, height]` fractions of the shot. The card takes the aspect ratio of `from`, and the camera eases from `from` to `to`. If a zoom crops something important, make `to` equal to `from`.
- Several shots in one feature scene share its duration equally and crossfade.
- Clips: `trim` skips seconds at the start, and `rate` changes speed. A clip must last at least `trim + rate × scene share`, or the frame goes blank. Clip lengths are in `public/shots/manifest.json` (`dur`).
- Music: `settings.music` and `settings.musicVolume`. When you change the track, update the credit on the logo card (CC BY 4.0 requires it) and normalise the new track to about −17 LUFS with `ffmpeg -af loudnorm=I=-17:TP=-1.5:LRA=11`.

## Pitfalls already met

- The dashboard uses smooth scrolling. Scroll with `behavior: "instant"`, or a second scroll call cancels the first and the shot stays at the top.
- Clicking a control below the fold makes Playwright scroll the page during a clip (this happened with `#fw-reset`). Keep a clip's controls in view, or crop.
- Chrome's screencast records at 1× (1920 px wide) even at `scale: 2`, so a cropped clip of a small panel is soft. Prefer 2× stills, crossfaded in Remotion, for state changes such as colour-by or map layers. Keep recorded clips for what stills cannot show, such as the weight sliders re-ranking the list.
- Changing weights makes the rank-shift diagram taller and stretches the layout. Clips of the weights look best in their first 20–25 seconds.
- Element screenshots of thin strips (KPIs, summary) look empty on screen. Frame a region of a viewport shot instead.
- Map tiles need time to load. The capture waits for network idle plus 2.5 s; raise that if tiles are missing.
- Each scene renders on its own timeline: use `useCurrentFrame()` in the smallest component, and no CSS animations or transitions, which do not render in Remotion.

## Licences

Music: "Dreams Become Real", Kevin MacLeod (incompetech.com), CC BY 4.0, credited on the closing card. Logos belong to KLH/BPLH and UGM (UGM's from brand.ugm.ac.id). Remotion is free for individuals and small teams; check https://www.remotion.dev/license for larger organisations.
