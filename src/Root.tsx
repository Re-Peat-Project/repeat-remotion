import { Composition } from "remotion";
import { Launch, totalFrames } from "./Launch";
import { FPS, H, W } from "./theme";

// Project rule (AGENTS.md): the video is at most 5 minutes.
const MAX_FRAMES = 5 * 60 * FPS;
const frames = totalFrames();
if (frames > MAX_FRAMES) {
  throw new Error(
    `The video is ${(frames / FPS).toFixed(1)} s, over the 5-minute limit. Shorten scenes in src/content.ts.`,
  );
}

export const RemotionRoot: React.FC = () => (
  <Composition id="Launch" component={Launch} durationInFrames={frames} fps={FPS} width={W} height={H} />
);
