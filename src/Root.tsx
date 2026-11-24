import { Composition } from "remotion";
import { Final, finalFrames } from "./Final";
import { FPS, H, W } from "./theme";

// Project rule (AGENTS.md): the video is at most 4 minutes.
const MAX_FRAMES = 4 * 60 * FPS;
const frames = finalFrames(FPS);
if (frames > MAX_FRAMES) {
  throw new Error(`The video is ${(frames / FPS).toFixed(1)} s, over the 4-minute limit.`);
}

// "Final" is the video shown at the launch: countdown, the team's video, logos.
// The earlier self-built edit (src/Launch.tsx, src/content.ts) is kept as a source
// of scenes but is no longer registered: it runs over the 4-minute limit.
export const RemotionRoot: React.FC = () => (
  <Composition id="Final" component={Final} durationInFrames={frames} fps={FPS} width={W} height={H} />
);
