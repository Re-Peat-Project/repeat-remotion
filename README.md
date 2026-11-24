# repeat-remotion

The launch video for the IMPLI closing ceremony (25 November 2026): a 5-second countdown, the team's video *Prioritas KHG* unchanged, and the partner logos (KLH/BPLH, UGM, supported by the World Bank), with a Bahasa Indonesia voiceover. Composition `Final`, at most 4 minutes (enforced in `src/Root.tsx`). Details for contributors are in [AGENTS.md](AGENTS.md).

| Task | Command |
|---|---|
| Make the voiceover from `src/voiceover.json` | `npm run voice` |
| Preview in the browser | `npm run dev` |
| Render to `out/prioritas-khg-final.mp4` (about 7 min) | `npm run render` |

The team's video goes in `public/team/prioritas-id.mp4` (not in git; see AGENTS.md for the one-line conversion).

## Requirements

- Node.js 20 or newer
- Google Chrome (used by the capture script)
- ffmpeg on the PATH (on Windows, `winget install Gyan.FFmpeg` also works)

```bash
npm ci
```

## How the parts fit

```
capture/shots.json    what to screenshot or record on the dashboard (page, KHG, clicks, crop)
capture/capture.mjs   opens the dashboard in Chrome, writes public/shots/ and public/stats.json
capture/manifest.mjs  records the size of every shot (public/shots/manifest.json)
public/logos/         KLH/BPLH, UGM and World Bank logos
public/photos/        opening images (public domain / CC BY, credited on the logo card)
public/music/         background music
src/content.ts        the script: scene order, Bahasa and English text, shots, timing
src/                  Remotion scenes that lay it all out
scripts/preview.mjs   one still per scene, for checking the framing
```

Numbers shown in the video are read from `public/stats.json`, which the capture reads off the dashboard, so they always match the screenshots.

## Common tasks

| Task | Command |
|---|---|
| Preview in the browser | `npm run dev` |
| Check framing (one still per scene in `out/preview/`) | `npm run preview` |
| Render the video to `out/repeat-launch.mp4` (about 30 min) | `npm run render` |
| Re-capture everything from the dashboard | `npm run capture` |
| Re-capture only some shots | `npm run capture -- home clip-weights stats` |
| Capture from another dashboard address | `npm run capture -- --url=http://localhost:8000/` |

### Updating the video for the final dashboard

1. If the address changed, edit `baseUrl` in `capture/shots.json` (or pass `--url=`).
2. If a button label or panel id changed, fix that shot in `capture/shots.json`.
3. `npm run capture`, then `npm run preview` to check, then `npm run render`.

To change only text or timing, edit `src/content.ts` and render; no re-capture needed. In `content.ts`, `from` / `to` are the `[x, y, width, height]` of the screenshot, as fractions, that the camera moves between.

### Capture notes

- Stills are taken at 2× (3840 px wide), so pans and zooms stay sharp. Interaction clips are recorded at 1920×1080.
- The dashboard language is set to Bahasa Indonesia (`lang` in `shots.json`), and the featured KHG is `profileKhg`.
- Two shots that name permit holders (`profile-actors`, `profile-map-permits`) are captured but not used in the video and not kept in git.

## Music

The repository holds only the track used in the video: `public/music/dreams-become-real-norm.mp3`, which is "Dreams Become Real" by Kevin MacLeod, loudness-normalised to about −17 LUFS. To try another track, download it into `public/music/` from `https://incompetech.com/music/royalty-free/mp3-royaltyfree/<Title>.mp3` (for example *Healing*, *Wholesome*, *Inspired*), set `settings.music` in `src/content.ts`, and update the credit line on the logo card.

## Credits and licences

- Music: "Dreams Become Real", Kevin MacLeod (incompetech.com), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The credit is shown on the closing card.
- Opening images: NASA Earth Observatory (public domain); Pierre Markuse, contains modified Copernicus Sentinel data 2019 (CC BY 2.0). Both via Wikimedia Commons.
- Logos: the KLH/BPLH, Universitas Gadjah Mada and World Bank logos belong to their institutions and are used here for the joint launch, with the World Bank credited as supporter. The UGM logo comes from the official brand pack at brand.ugm.ac.id; the World Bank logo from Wikimedia Commons (sourced from worldbank.org).
- Font: Plus Jakarta Sans (SIL Open Font License), loaded through `@remotion/google-fonts`.
- Remotion is free for individuals and small teams; larger organisations may need a company licence. See https://www.remotion.dev/license.
