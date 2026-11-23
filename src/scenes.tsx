import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Item, Scene, Stat } from "./content";
import { Backdrop, BiText, Enter, FullBleed, ShotFrame, ShotSequence, useEnter } from "./components";
import { C, fontFamily } from "./theme";

type Of<K extends Scene["kind"]> = Extract<Scene, { kind: K }>;
const PAD = 110;

// ── Title ────────────────────────────────────────────────────────────────────
export const TitleScene: React.FC<{ s: Of<"title"> }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = s.dur * fps;
  return (
    <AbsoluteFill>
      <Backdrop />
      {s.bg && s.photo ? <FullBleed s={s.bg} progress={frame / total} /> : null}
      {s.bg && !s.photo ? (
        <AbsoluteFill style={{ opacity: 0.22, filter: "blur(2px) saturate(0.9)" }}>
          <ShotFrameFull s={s.bg} progress={frame / total} />
        </AbsoluteFill>
      ) : null}
      {s.bg && !s.photo ? (
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(15,20,17,0.35), rgba(15,20,17,0.9) 75%)" }} />
      ) : null}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${PAD + 80}px` }}>
        {s.kicker ? (
          <Enter delay={4}>
            <div
              style={{
                fontFamily,
                color: C.teal,
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: 4,
                textTransform: "uppercase",
                textAlign: "center",
                marginBottom: 30,
              }}
            >
              {s.kicker.id}
              <span style={{ color: C.faint, fontWeight: 500 }}> · {s.kicker.en}</span>
            </div>
          </Enter>
        ) : null}
        <Enter delay={10}>
          <BiText t={s.title} size={s.big ? 104 : 80} enSize={s.big ? 46 : 40} align="center" maxWidth={1500} gap={28} />
        </Enter>
        {s.sub ? (
          <Enter delay={24} style={{ marginTop: 50 }}>
            <BiText t={s.sub} size={34} enSize={24} weight={500} color={C.teal} align="center" />
          </Enter>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// full-frame shot used as a moving background
const ShotFrameFull: React.FC<{ s: Of<"title">["bg"] & {}; progress: number }> = ({ s, progress }) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: "scale(1.15)" }}>
    <ShotFrame s={{ ...s, frame: undefined }} aw={1920} ah={1080} progress={progress} />
  </AbsoluteFill>
);

// ── Section divider ──────────────────────────────────────────────────────────
export const SectionScene: React.FC<{ s: Of<"section"> }> = ({ s }) => {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [6, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: PAD + 90 }}>
        <Enter delay={0}>
          <div style={{ fontFamily, fontSize: 200, fontWeight: 800, color: "transparent", WebkitTextStroke: `3px ${C.teal}`, lineHeight: 1 }}>
            {s.num}
          </div>
        </Enter>
        <div style={{ height: 6, width: 260 * line, background: C.orange, borderRadius: 3, margin: "34px 0 40px" }} />
        <Enter delay={10}>
          <BiText t={s.title} size={100} enSize={44} gap={18} />
        </Enter>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── Numbers ──────────────────────────────────────────────────────────────────
const CountUp: React.FC<{ value: string; delay: number }> = ({ value, delay }) => {
  const frame = useCurrentFrame();
  const digits = value.replace(/[^\d]/g, "");
  const target = Number(digits);
  if (!digits) return <>{value}</>;
  const p = interpolate(frame, [delay, delay + 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const eased = 1 - Math.pow(1 - p, 3);
  const n = Math.round(target * eased);
  const suffix = value.match(/[^\d.,]+$/)?.[0] ?? "";
  return <>{n.toLocaleString("de-DE") + suffix}</>;
};

export const StatsScene: React.FC<{ s: Of<"stats"> }> = ({ s }) => {
  const cols = s.items.length === 4 ? 2 : s.items.length;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Backdrop />
      {s.bg ? <FullBleed s={s.bg} progress={frame / (s.dur * fps)} opacity={0.75} /> : null}
      <AbsoluteFill style={{ padding: `120px ${PAD + 40}px`, justifyContent: "center" }}>
        <Enter delay={4}>
          <BiText t={s.title} size={64} enSize={34} />
        </Enter>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: s.items.length === 4 ? "44px 80px" : 60,
            marginTop: 70,
          }}
        >
          {s.items.map((it, i) => (
            <StatCard key={i} it={it} delay={18 + i * 10} />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const StatCard: React.FC<{ it: Stat; delay: number }> = ({ it, delay }) => (
  <Enter delay={delay} style={{ borderLeft: `5px solid ${C.orange}`, paddingLeft: 30 }}>
    <div style={{ fontFamily, fontSize: 96, fontWeight: 800, color: C.text, lineHeight: 1, letterSpacing: -2 }}>
      <CountUp value={it.value} delay={delay} />
    </div>
    <div style={{ marginTop: 16 }}>
      <BiText t={it.label} size={30} enSize={22} weight={500} gap={6} />
    </div>
  </Enter>
);

// ── Feature: text + screenshots ──────────────────────────────────────────────
export const FeatureScene: React.FC<{ s: Of<"feature"> }> = ({ s }) => {
  const { fps } = useVideoConfig();
  const total = s.dur * fps;
  if (s.layout === "wide") {
    const top = s.body ? 290 : 230;
    return (
      <AbsoluteFill>
        <Backdrop />
        <div style={{ position: "absolute", left: PAD, top: 70, right: 520 }}>
          <Enter delay={2}>
            <BiText t={s.title} size={60} enSize={30} />
          </Enter>
          {s.body ? (
            <Enter delay={10} style={{ marginTop: 16 }}>
              <BiText t={s.body} size={30} enSize={22} weight={500} color={C.muted} enColor={C.faint} gap={4} />
            </Enter>
          ) : null}
        </div>
        <div style={{ position: "absolute", left: PAD, top, width: 1920 - 2 * PAD, height: 1080 - top - 60 }}>
          <ShotSequence shots={s.shots} total={total} aw={1920 - 2 * PAD} ah={1080 - top - 60} />
        </div>
      </AbsoluteFill>
    );
  }
  const textW = 610;
  const gap = 70;
  const mediaW = 1920 - 2 * PAD - textW - gap;
  const mediaH = 800;
  const textLeft = s.layout === "left" ? PAD : PAD + mediaW + gap;
  const mediaLeft = s.layout === "left" ? PAD + textW + gap : PAD;
  return (
    <AbsoluteFill>
      <Backdrop />
      <div
        style={{
          position: "absolute",
          left: textLeft,
          width: textW,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Enter delay={2}>
          <BiText t={s.title} size={58} enSize={30} />
        </Enter>
        {s.body ? (
          <Enter delay={10} style={{ marginTop: 26 }}>
            <BiText t={s.body} size={30} enSize={22} weight={500} color={C.muted} enColor={C.faint} gap={8} />
          </Enter>
        ) : null}
        {s.items ? (
          <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: s.items.length > 3 ? 20 : 28 }}>
            {s.items.map((it, i) => (
              <ItemRow key={i} it={it} delay={16 + i * 9} compact={s.items!.length > 3} />
            ))}
          </div>
        ) : null}
      </div>
      <div style={{ position: "absolute", left: mediaLeft, top: (1080 - mediaH) / 2, width: mediaW, height: mediaH }}>
        <ShotSequence shots={s.shots} total={total} aw={mediaW} ah={mediaH} />
      </div>
    </AbsoluteFill>
  );
};

const ItemRow: React.FC<{ it: Item; delay: number; compact: boolean }> = ({ it, delay, compact }) => {
  const style = useEnter(delay, 18);
  const size = compact ? 29 : 32;
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-start", ...style }}>
      <div
        style={{
          flex: "none",
          width: compact ? 40 : 46,
          height: compact ? 40 : 46,
          borderRadius: 10,
          background: it.color ?? C.teal,
          color: "#fff",
          fontFamily,
          fontWeight: 800,
          fontSize: compact ? 24 : 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        {it.tag ?? ""}
      </div>
      <div style={{ fontFamily }}>
        <div style={{ fontSize: size, fontWeight: 700, color: C.text, lineHeight: 1.15 }}>
          {it.title.id}
          <span style={{ fontSize: size * 0.68, fontWeight: 400, color: C.muted }}> · {it.title.en}</span>
        </div>
        {it.text ? (
          <div style={{ marginTop: 4, lineHeight: 1.3 }}>
            <span style={{ fontSize: compact ? 22 : 24, color: C.muted }}>{it.text.id}</span>
            <br />
            <span style={{ fontSize: compact ? 17 : 19, color: C.faint }}>{it.text.en}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ── Logos ────────────────────────────────────────────────────────────────────
export const LogoScene: React.FC<{ s: Of<"logos"> }> = ({ s }) => (
  <AbsoluteFill style={{ background: C.paper, alignItems: "center", paddingTop: 110 }}>
    <Enter delay={4}>
      <div style={{ display: "flex", alignItems: "center", gap: 100 }}>
        <Img src={staticFile("logos/klh-bplh.png")} style={{ height: 250 }} />
        <div style={{ width: 2, height: 190, background: "#d6d1c6" }} />
        <Img src={staticFile("logos/ugm-horizontal.png")} style={{ height: 160 }} />
      </div>
    </Enter>
    <Enter delay={14} style={{ marginTop: 60 }}>
      <BiText t={s.title} size={48} enSize={26} color={C.ink} enColor="#6b675e" align="center" gap={8} />
    </Enter>
    <Enter delay={20} style={{ marginTop: 16 }}>
      <div style={{ fontFamily, fontSize: 26, fontWeight: 600, color: C.tealDeep, textAlign: "center" }}>Proyek Re-Peat · The Re-Peat project</div>
    </Enter>
    <Enter delay={28} style={{ marginTop: 56, display: "flex", alignItems: "center", gap: 34 }}>
      <div style={{ fontFamily, textAlign: "right" }}>
        <div style={{ fontSize: 26, fontWeight: 600, color: C.ink }}>{s.support.label.id}</div>
        <div style={{ fontSize: 19, color: "#6b675e" }}>{s.support.label.en}</div>
      </div>
      <div style={{ width: 2, height: 64, background: "#d6d1c6" }} />
      <Img src={staticFile(s.support.logo)} style={{ height: 70 }} />
    </Enter>
    <div style={{ position: "absolute", bottom: 36, fontFamily, fontSize: 16, lineHeight: 1.45, color: "#8b877d", textAlign: "center", maxWidth: 1600 }}>
      {s.credits.map((c) => (
        <div key={c}>{c}</div>
      ))}
    </div>
  </AbsoluteFill>
);
