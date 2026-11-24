/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

// 8 parallel frame extractions from the team video fail with "No frame found at
// position" in Remotion 4.0.545 (a race in the compositor); 4 is reliable.
Config.setConcurrency(4);
