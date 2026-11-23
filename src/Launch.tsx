import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { scenes, settings, type Scene } from "./content";
import { Stamp } from "./components";
import { FeatureScene, LogoScene, SectionScene, StatsScene, TitleScene } from "./scenes";
import { C, FPS, TRANSITION } from "./theme";

export const totalFrames = () =>
  scenes.reduce((sum, s) => sum + Math.round(s.dur * FPS), 0) - TRANSITION * (scenes.length - 1);

const render = (s: Scene) => {
  switch (s.kind) {
    case "title":
      return <TitleScene s={s} />;
    case "section":
      return <SectionScene s={s} />;
    case "stats":
      return <StatsScene s={s} />;
    case "feature":
      return <FeatureScene s={s} />;
    case "logos":
      return <LogoScene s={s} />;
  }
};

const sceneName = (s: Scene, i: number) =>
  `${String(i + 1).padStart(2, "0")} ${s.kind}: ${"title" in s ? s.title.id.slice(0, 40) : ""}`;

export const Launch: React.FC = () => {
  const { durationInFrames, fps } = useVideoConfig();
  const lastStart = durationInFrames - Math.round(scenes[scenes.length - 1].dur * fps);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <TransitionSeries>
        {scenes.map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 ? (
              <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />
            ) : null}
            <TransitionSeries.Sequence name={sceneName(s, i)} durationInFrames={Math.round(s.dur * fps)}>
              {render(s)}
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
      </TransitionSeries>
      <StampLayer from={Math.round(scenes[0].dur * fps)} until={lastStart} />
      <Audio
        src={staticFile(settings.music)}
        volume={(f) =>
          settings.musicVolume *
          interpolate(f, [0, 2 * fps, durationInFrames - 5 * fps, durationInFrames], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
    </AbsoluteFill>
  );
};

// prototype label, shown between the opening and the logo card
const StampLayer: React.FC<{ from: number; until: number }> = ({ from, until }) => (
  <TransitionlessWindow from={from} until={until}>
    <Stamp />
  </TransitionlessWindow>
);

const TransitionlessWindow: React.FC<{ from: number; until: number; children: React.ReactNode }> = ({ from, until, children }) => (
  <Sequence from={from} durationInFrames={until - from} name="Prototype stamp" layout="none">
    {children}
  </Sequence>
);
