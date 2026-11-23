import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";

export const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const TRANSITION = 18; // frames of crossfade between scenes

export const C = {
  bg: "#0f1411",
  bg2: "#16201b",
  text: "#f4f1ea",
  muted: "#b8b4a6",
  faint: "#7d7a70",
  teal: "#2bb3a0", // from the KLH mark
  tealDeep: "#00594f",
  orange: "#f4892a",
  blue: "#3b8ff0",
  paper: "#f7f4ee",
  ink: "#1c1f1d",
};

// colours used by the dashboard itself
export const DIM = {
  urgency: "#d9485f",
  stake: "#2a9d6f",
  complexity: "#8e4ec6",
  feasibility: "#3a7fc4",
  people: "#d08a2e",
};

export const TYPE = {
  A: "#e0475b",
  B: "#9b59b6",
  C: "#f0a63a",
  D: "#27a06b",
  E: "#8c8c8c",
};
