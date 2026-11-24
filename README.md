# repeat-remotion

The launch video for the IMPLI closing ceremony (25 November 2026): a 5-second countdown, the team's video *Prioritas KHG* unchanged, and the partner logos (KLH/BPLH, UGM, supported by the World Bank), with a Bahasa Indonesia voiceover. Composition `Final` (`src/Final.tsx`), at most 4 minutes (enforced in `src/Root.tsx`). Details for contributors are in [AGENTS.md](AGENTS.md).

## Requirements

- Node.js 20 or newer, then `npm ci`
- ffmpeg on the PATH (on Windows, `winget install Gyan.FFmpeg` also works)
- For the voiceover: Python 3 with `pip install edge-tts==7.3.1`

The team's video goes in `public/team/prioritas-id.mp4`. It is not in git; get it from the team and convert it with the one-line command in AGENTS.md.

## Commands

| Task | Command |
|---|---|
| Make the voiceover from `src/voiceover.json` | `npm run voice` |
| Preview in the browser | `npm run dev` |
| Render to `out/prioritas-khg-final.mp4` (about 16 min) | `npm run render` |

To change what the voice says or when, edit the text or the `at` / `until` times in `src/voiceover.json`, run `npm run voice` (only changed lines are regenerated; it stops if a line is too long for its slot), then render.

## Earlier edit

`src/Launch.tsx`, `src/content.ts` and `capture/` are the earlier self-built edit and the dashboard capture tool. They are no longer rendered but kept as a source of scenes and screenshots; see AGENTS.md.

## Credits and licences

- Voice: Microsoft Edge neural voice id-ID-GadisNeural, via `edge-tts`.
- Logos: the KLH/BPLH, Universitas Gadjah Mada and World Bank logos belong to their institutions and are used here for the joint launch, with the World Bank credited as supporter. The UGM logo comes from the official brand pack at brand.ugm.ac.id; the World Bank logo from Wikimedia Commons (sourced from worldbank.org).
- Font: Plus Jakarta Sans (SIL Open Font License), loaded through `@remotion/google-fonts`.
- Remotion is free for individuals and small teams; larger organisations may need a company licence. See https://www.remotion.dev/license.
