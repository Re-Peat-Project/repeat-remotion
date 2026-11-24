// The launch video as shown: a 5-second countdown, the team's video unchanged,
// then the partner logos. The team's video is public/team/prioritas-id.mp4
// (not in git: ask the team for the current file).
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Enter } from "./components";
import { fontFamily } from "./theme";
import vo from "./voiceover.json";
import voiceFiles from "../public/voice/voice.json";

export const FINAL = {
  video: "team/prioritas-id.mp4",
  videoSeconds: 180, // length of the team's video
  countdownSeconds: 5,
  logoSeconds: 8,
  fadeFrames: 18, // crossfade from the video into the logo card
  // colours sampled from the team's video
  dark: "#071a16",
  light: "#f3f5f4",
  teal: "#1f8a7a",
  ink: "#0d2621",
};

// ── voiceover: lines from src/voiceover.json, audio made by `npm run voice` ──
type VoiceFile = { file: string; dur: number };
const VOICE = vo.cues
  .map((c) => ({ ...c, ...(voiceFiles as Record<string, VoiceFile>)[c.id] }))
  .filter((c): c is typeof c & VoiceFile => Boolean(c.file));
const DUCK = 0.35; // music level under the voice (about -9 dB)
const RAMP = 0.3; // seconds

// level of the team's music at a frame of the final timeline
const musicLevel = (frame: number, fps: number) => {
  const t = frame / fps;
  let level = 1;
  for (const c of VOICE) {
    const a = c.at - 0.25, b = c.at + c.dur + 0.35;
    if (t < a - RAMP || t > b + RAMP) continue;
    const l = interpolate(t, [a - RAMP, a, b, b + RAMP], [1, DUCK, DUCK, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    level = Math.min(level, l);
  }
  return level;
};

export const finalFrames = (fps: number) =>
  Math.round((FINAL.countdownSeconds + FINAL.videoSeconds + FINAL.logoSeconds) * fps) - FINAL.fadeFrames;

// ── 5-second countdown, plain ────────────────────────────────────────────────
const Countdown: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const second = Math.floor(frame / fps);
  const n = FINAL.countdownSeconds - second;
  const within = (frame % fps) / fps; // 0..1 inside the current second
  const R = 190;
  const C = 2 * Math.PI * R;
  return (
    <AbsoluteFill style={{ background: FINAL.dark, justifyContent: "center", alignItems: "center" }}>
      <svg width={460} height={460} style={{ position: "absolute" }}>
        <circle cx={230} cy={230} r={R} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={10} />
        <circle
          cx={230}
          cy={230}
          r={R}
          fill="none"
          stroke="#2bb3a0"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * within}
          transform="rotate(-90 230 230)"
        />
      </svg>
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 230,
          color: "#ffffff",
          lineHeight: 1,
          opacity: interpolate(within, [0, 0.08], [0.35, 1], { extrapolateRight: "clamp" }),
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {n}
      </div>
    </AbsoluteFill>
  );
};

// ── logo card, in the team's naming ──────────────────────────────────────────
const KhgBadge: React.FC = () => (
  <div
    style={{
      width: 92,
      height: 92,
      borderRadius: 22,
      background: FINAL.teal,
      color: "#fff",
      fontFamily,
      fontWeight: 800,
      fontSize: 30,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      letterSpacing: 0.5,
    }}
  >
    KHG
  </div>
);

const LogoCard: React.FC = () => (
  <AbsoluteFill style={{ background: FINAL.light, alignItems: "center", justifyContent: "center" }}>
    <Enter delay={6}>
      <div style={{ display: "flex", alignItems: "center", gap: 26, justifyContent: "center" }}>
        <KhgBadge />
        <div style={{ fontFamily }}>
          <div style={{ fontSize: 76, fontWeight: 800, color: FINAL.ink, lineHeight: 1, letterSpacing: -1 }}>Prioritas KHG</div>
          <div style={{ fontSize: 28, fontWeight: 500, color: "#4b5e59", marginTop: 10 }}>Pembasahan Gambut · KLH/BPLH</div>
        </div>
      </div>
    </Enter>
    <Enter delay={14} style={{ marginTop: 26 }}>
      <div style={{ fontFamily, fontSize: 32, fontWeight: 600, color: FINAL.teal }}>Mulai dari yang paling penting.</div>
    </Enter>
    <Enter delay={22} style={{ marginTop: 80 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 90 }}>
        <Img src={staticFile("logos/klh-bplh.png")} style={{ height: 200 }} />
        <div style={{ width: 2, height: 150, background: "#d5dbd8" }} />
        <Img src={staticFile("logos/ugm-horizontal.png")} style={{ height: 128 }} />
      </div>
    </Enter>
    <Enter delay={32} style={{ marginTop: 70 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <div style={{ fontFamily, fontSize: 26, fontWeight: 600, color: FINAL.ink }}>Didukung oleh</div>
        <div style={{ width: 2, height: 56, background: "#d5dbd8" }} />
        <Img src={staticFile("logos/world-bank.svg")} style={{ height: 62 }} />
      </div>
    </Enter>
  </AbsoluteFill>
);

// ── the whole video ──────────────────────────────────────────────────────────
export const Final: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: FINAL.dark }}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Countdown" durationInFrames={FINAL.countdownSeconds * fps}>
          <Countdown />
        </TransitionSeries.Sequence>
        <TransitionSeries.Sequence name="Team video" durationInFrames={FINAL.videoSeconds * fps}>
          <OffthreadVideo
            src={staticFile(FINAL.video)}
            volume={(f) => musicLevel(f + FINAL.countdownSeconds * fps, fps)}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: FINAL.fadeFrames })} />
        <TransitionSeries.Sequence name="Logos" durationInFrames={FINAL.logoSeconds * fps}>
          <LogoCard />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      {VOICE.map((c) => (
        <Sequence key={c.id} name={`Voice ${c.id}`} from={Math.round(c.at * fps)} durationInFrames={Math.ceil(c.dur * fps) + 2} layout="none">
          <Audio src={staticFile(c.file)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
