import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import manifest from "../public/shots/manifest.json";
import type { Bi, Focus, Shot } from "./content";
import { settings } from "./content";
import { C, fontFamily } from "./theme";

type Info = { file: string; w: number; h: number; dur?: number };
const info = (id: string): Info => {
  const m = (manifest as Record<string, Info>)[id];
  if (!m) throw new Error(`Shot "${id}" not found in public/shots. Run npm run capture.`);
  return m;
};

// ── entrance animation ───────────────────────────────────────────────────────
export const useEnter = (delay = 0, distance = 28) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 24 });
  return { opacity: p, transform: `translateY(${(1 - p) * distance}px)` };
};

export const Enter: React.FC<{ delay?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  delay = 0,
  style,
  children,
}) => <div style={{ ...useEnter(delay), ...style }}>{children}</div>;

// ── background ───────────────────────────────────────────────────────────────
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const x1 = 25 + Math.sin(t / 9) * 8;
  const y1 = 30 + Math.cos(t / 11) * 8;
  const x2 = 78 + Math.cos(t / 10) * 7;
  const y2 = 75 + Math.sin(t / 8) * 7;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at ${x1}% ${y1}%, rgba(0,89,79,0.55), transparent 45%),
          radial-gradient(circle at ${x2}% ${y2}%, rgba(244,137,42,0.16), transparent 40%),
          linear-gradient(160deg, ${C.bg2}, ${C.bg})`,
      }}
    />
  );
};

// ── bilingual text ───────────────────────────────────────────────────────────
export const BiText: React.FC<{
  t: Bi;
  size: number;
  enSize?: number;
  weight?: number;
  color?: string;
  enColor?: string;
  align?: "left" | "center";
  gap?: number;
  maxWidth?: number;
}> = ({ t, size, enSize, weight = 700, color = C.text, enColor = C.muted, align = "left", gap, maxWidth }) => (
  <div style={{ textAlign: align, maxWidth, fontFamily }}>
    <div style={{ fontSize: size, fontWeight: weight, color, lineHeight: 1.12, letterSpacing: -0.5 }}>{t.id}</div>
    {t.en ? (
      <div
        style={{
          fontSize: enSize ?? Math.round(size * 0.5),
          fontWeight: 400,
          color: enColor,
          lineHeight: 1.3,
          marginTop: gap ?? Math.round(size * 0.22),
        }}
      >
        {t.en}
      </div>
    ) : null}
  </div>
);

// ── camera framing over a screenshot or clip ─────────────────────────────────
const FULL: Focus = [0, 0, 1, 1];

export const fitCard = (s: Shot, aw: number, ah: number) => {
  const m = info(s.shot);
  const r = s.from ?? FULL;
  const bar = s.frame === "browser" ? 44 : 0;
  const aspect = (r[2] * m.w) / (r[3] * m.h);
  let cw = aw;
  let ch = aw / aspect;
  if (ch > ah - bar) {
    ch = ah - bar;
    cw = ch * aspect;
  }
  return { cw: Math.round(cw), ch: Math.round(ch), bar };
};

const place = (m: Info, r: Focus, cw: number, ch: number) => {
  const rw = r[2] * m.w;
  const rh = r[3] * m.h;
  const s = Math.max(cw / rw, ch / rh);
  const iw = m.w * s;
  const ih = m.h * s;
  let left = cw / 2 - (r[0] + r[2] / 2) * iw;
  let top = ch / 2 - (r[1] + r[3] / 2) * ih;
  if (iw >= cw) left = Math.min(0, Math.max(cw - iw, left));
  if (ih >= ch) top = Math.min(0, Math.max(ch - ih, top));
  return { left, top, width: iw, height: ih };
};

const lerp = (a: Focus, b: Focus, p: number): Focus => a.map((v, i) => v + (b[i] - v) * p) as Focus;

// One shot inside a card or browser frame. `progress` 0..1 drives the camera.
export const ShotFrame: React.FC<{ s: Shot; aw: number; ah: number; progress: number }> = ({ s, aw, ah, progress }) => {
  const m = info(s.shot);
  const { cw, ch, bar } = fitCard(s, aw, ah);
  const p = Easing.bezier(0.45, 0, 0.55, 1)(Math.min(1, Math.max(0, progress)));
  const r = lerp(s.from ?? FULL, s.to ?? s.from ?? FULL, p);
  const box = place(m, r, cw, ch);
  const isVideo = m.file.endsWith(".mp4");
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        width: cw,
        height: ch + bar,
        borderRadius: 16,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 30px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)",
        position: "relative",
      }}
    >
      {bar ? <BrowserBar height={bar} /> : null}
      <div style={{ position: "absolute", top: bar, left: 0, width: cw, height: ch, overflow: "hidden" }}>
        {isVideo ? (
          <OffthreadVideo
            src={staticFile(m.file)}
            muted
            trimBefore={Math.round((s.trim ?? 0) * fps)}
            playbackRate={s.rate ?? 1}
            style={{ position: "absolute", ...box }}
          />
        ) : (
          <Img src={staticFile(m.file)} style={{ position: "absolute", ...box }} />
        )}
      </div>
      {s.chip ? <Chip t={s.chip} top={bar + 18} /> : null}
    </div>
  );
};

const BrowserBar: React.FC<{ height: number }> = ({ height }) => (
  <div
    style={{
      height,
      background: "#ece9e2",
      display: "flex",
      alignItems: "center",
      padding: "0 18px",
      gap: 9,
      borderBottom: "1px solid #d9d5cc",
    }}
  >
    {["#ec6a5e", "#f4bf4f", "#61c554"].map((c) => (
      <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
    ))}
    <div
      style={{
        marginLeft: 18,
        background: "#fff",
        borderRadius: 8,
        padding: "5px 16px",
        fontFamily,
        fontSize: 16,
        color: "#5b5850",
      }}
    >
      {settings.url}
    </div>
  </div>
);

export const Chip: React.FC<{ t: Bi; top: number }> = ({ t, top }) => (
  <div
    style={{
      position: "absolute",
      top,
      left: 18,
      background: "rgba(15,20,17,0.88)",
      borderRadius: 12,
      padding: "10px 18px",
      fontFamily,
      boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
    }}
  >
    <div style={{ color: C.text, fontSize: 28, fontWeight: 700 }}>{t.id}</div>
    {t.en && t.en !== t.id ? <div style={{ color: C.muted, fontSize: 18, marginTop: 2 }}>{t.en}</div> : null}
  </div>
);

// Plays a list of shots one after another with crossfades, within `aw` × `ah`.
export const ShotSequence: React.FC<{ shots: Shot[]; total: number; aw: number; ah: number; delay?: number }> = ({
  shots,
  total,
  aw,
  ah,
  delay = 6,
}) => {
  const frame = useCurrentFrame();
  const fade = 15;
  const each = total / shots.length;
  const enter = useEnter(delay, 40);
  return (
    <div style={{ width: aw, height: ah, position: "relative", ...enter }}>
      {shots.map((s, i) => {
        const start = Math.round(i * each);
        const end = Math.round((i + 1) * each);
        const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
        const fadeIn = i === 0 ? 1 : interpolate(frame, [start - fade / 2, start + fade / 2], [0, 1], clamp);
        const fadeOut = i === shots.length - 1 ? 1 : interpolate(frame, [end - fade / 2, end + fade / 2], [1, 0], clamp);
        const opacity = Math.min(fadeIn, fadeOut);
        const { cw, ch, bar } = fitCard(s, aw, ah);
        return (
          <Sequence key={i} from={i === 0 ? 0 : start - fade} durationInFrames={end - start + fade * 2} layout="none">
            <div
              style={{
                position: "absolute",
                left: (aw - cw) / 2,
                top: (ah - ch - bar) / 2,
                opacity,
              }}
            >
              <ShotFrame s={s} aw={aw} ah={ah} progress={(frame - start) / (end - start + fade)} />
            </div>
          </Sequence>
        );
      })}
    </div>
  );
};

// ── overlays ─────────────────────────────────────────────────────────────────
export const Stamp: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 34,
      right: 44,
      textAlign: "right",
      fontFamily,
      opacity: 0.85,
    }}
  >
    <div style={{ color: C.orange, fontSize: 19, fontWeight: 700, letterSpacing: 0.3 }}>{settings.stamp.id}</div>
    <div style={{ color: C.faint, fontSize: 15, marginTop: 2 }}>{settings.stamp.en}</div>
  </div>
);
