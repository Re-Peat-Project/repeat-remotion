import { Composition } from "remotion";
import { Launch, totalFrames } from "./Launch";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="Launch" component={Launch} durationInFrames={totalFrames()} fps={FPS} width={W} height={H} />
);
