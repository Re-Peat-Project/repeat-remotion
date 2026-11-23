// ─────────────────────────────────────────────────────────────────────────────
// THE SCRIPT OF THE VIDEO. Edit text, order and timing here, then re-render.
//   id = Bahasa Indonesia (large), en = English (small)
//   dur = seconds on screen
//   shots refer to files in public/shots/ by name (re-made by `npm run capture`)
//   or to photos in public/photos/ by name (credit them on the logo card)
//   focus = [x, y, width, height] of the screenshot, as fractions (0–1):
//           the camera moves from `from` to `to` during the shot
//   the whole video must stay at or under 5 minutes (checked in Root.tsx)
// Numbers come from public/stats.json, read off the dashboard by the capture.
// ─────────────────────────────────────────────────────────────────────────────
import stats from "../public/stats.json";
import { DIM, TYPE } from "./theme";

export type Bi = { id: string; en: string };
export type Focus = [number, number, number, number];
export type Shot = {
  shot: string;
  from?: Focus;
  to?: Focus;
  chip?: Bi; // label shown on the shot
  frame?: "browser" | "card"; // browser = with a URL bar
  trim?: number; // seconds to skip at the start of a clip
  rate?: number; // playback speed of a clip (1 = normal)
};
export type Item = { tag?: string; color?: string; title: Bi; text?: Bi };
export type Stat = { value: string; label: Bi };

export type Scene =
  | { kind: "title"; dur: number; kicker?: Bi; title: Bi; sub?: Bi; bg?: Shot; photo?: boolean; big?: boolean }
  | { kind: "section"; dur: number; num: string; title: Bi }
  | { kind: "stats"; dur: number; title: Bi; items: Stat[]; bg?: Shot }
  | {
      kind: "feature";
      dur: number;
      layout: "left" | "right" | "wide";
      title: Bi;
      body?: Bi;
      items?: Item[];
      shots: Shot[];
    }
  | { kind: "logos"; dur: number; title: Bi; support: { label: Bi; logo: string }; credits: string[] };

// ── numbers from the dashboard ───────────────────────────────────────────────
const km2 = (s: string) => s.replace(/km2/g, "km²");
const nat = (i: number): Stat => ({
  value: stats.national.id[i].value,
  label: { id: km2(stats.national.id[i].label), en: km2(stats.national.en[i].label) },
});
const asOfId = stats.asOf.id.text;
const asOfEn = stats.asOf.en.text;
export const KHG_TOTAL = asOfId.match(/^([\d.]+) KHG/)?.[1] ?? "865";
export const KHG_KLH = stats.national.id[0].value; // 337
export const DATA_DATE: Bi = {
  id: asOfId.match(/sampai ([^.]+)\./)?.[1] ?? "",
  en: asOfEn.match(/to ([^.]+)\./)?.[1] ?? "",
};

// ── global settings ──────────────────────────────────────────────────────────
export const settings = {
  music: "music/dreams-become-real-norm.mp3", // loudness-normalised; see README for alternatives
  musicVolume: 0.9,
  url: "re-peat-project.github.io/re-peat",
  stamp: { id: `Versi prototipe · data per ${DATA_DATE.id}`, en: `Prototype · data to ${DATA_DATE.en}` },
};

// ── the scenes ───────────────────────────────────────────────────────────────
export const scenes: Scene[] = [
  // OPENING
  {
    kind: "title",
    dur: 9,
    photo: true,
    title: { id: "Gambut Indonesia menyimpan air, karbon, dan kehidupan.", en: "Indonesia's peatlands hold water, carbon and livelihoods." },
    bg: { shot: "nasa-haze-borneo-2019", from: [0.05, 0.4, 0.9, 0.6], to: [0.15, 0.5, 0.65, 0.45] },
  },
  {
    kind: "stats",
    dur: 11,
    title: { id: "Namun gambut terus mengering dan terbakar.", en: "Yet the peat keeps drying out and burning." },
    items: [nat(3), nat(4), nat(2)],
    bg: { shot: "sentinel-jambi-2019", from: [0.0, 0.05, 0.9, 0.85], to: [0.15, 0.12, 0.65, 0.65] },
  },
  {
    kind: "title",
    dur: 7,
    photo: true,
    title: {
      id: "KHG mana yang perlu ditangani lebih dulu, dan dengan cara apa?",
      en: "Which peat units need action first, and what kind of action?",
    },
    bg: { shot: "nasa-haze-2015", from: [0, 0, 1, 1], to: [0.1, 0.1, 0.8, 0.8] },
  },
  {
    kind: "title",
    dur: 10,
    big: true,
    kicker: { id: "Peluncuran awal", en: "Soft launch" },
    title: { id: "Dashboard Prioritas Restorasi Gambut", en: "Peatland Restoration Prioritisation Dashboard" },
    sub: { id: "Proyek Re-Peat · KLH/BPLH × Universitas Gadjah Mada", en: "The Re-Peat project · KLH/BPLH × Universitas Gadjah Mada" },
    bg: { shot: "home", from: [0, 0, 1, 1], to: [0.05, 0.05, 0.9, 0.9] },
  },
  {
    kind: "feature",
    dur: 14,
    layout: "left",
    title: { id: "Satu dashboard, tiga fungsi", en: "One dashboard, three functions" },
    items: [
      { tag: "1", color: "#2bb3a0", title: { id: "Profil nasional gambut dan kebakaran", en: "A national profile of peat and fire" } },
      { tag: "2", color: "#2bb3a0", title: { id: "Peringkat dan tipe tindakan setiap KHG", en: "A ranking and an action type for every KHG" } },
      { tag: "3", color: "#2bb3a0", title: { id: "Profil rinci setiap KHG dengan semua lapisan data", en: "A detailed profile of each KHG with all its data layers" } },
    ],
    body: { id: "KHG: Kesatuan Hidrologis Gambut", en: "KHG: peat hydrological unit" },
    shots: [{ shot: "home", frame: "browser", from: [0, 0, 1, 1], to: [0.04, 0.02, 0.6, 0.6] }],
  },

  // 01 NATIONAL PROFILE
  { kind: "section", dur: 4, num: "01", title: { id: "Profil Nasional", en: "National profile" } },
  {
    kind: "feature",
    dur: 12,
    layout: "left",
    title: { id: `${KHG_TOTAL} KHG di seluruh Indonesia`, en: `${KHG_TOTAL} peat hydrological units across Indonesia` },
    body: {
      id: `${KHG_KLH} di antaranya masuk daftar kerja KLH dan dinilai di dashboard.`,
      en: `${KHG_KLH} of them are on KLH's working list and are scored in the dashboard.`,
    },
    shots: [{ shot: "prio-map-type", from: [0, 0, 1, 1], to: [0.08, 0.22, 0.62, 0.62] }],
  },
  {
    kind: "feature",
    dur: 11,
    layout: "right",
    title: { id: "Telusuri per pulau", en: "Explore island by island" },
    body: { id: "Sumatera, Kalimantan, Papua: peta mengikuti pilihan Anda.", en: "Sumatra, Kalimantan, Papua: the map follows your choice." },
    shots: [
      { shot: "prio-map-sumatera", chip: { id: "Sumatera", en: "Sumatra" }, from: [0, 0, 1, 1], to: [0.1, 0.15, 0.75, 0.75] },
      { shot: "prio-map-kalimantan", chip: { id: "Kalimantan", en: "Kalimantan" }, from: [0, 0, 1, 1], to: [0.15, 0.2, 0.7, 0.7] },
    ],
  },

  // 02 PRIORITISATION
  { kind: "section", dur: 4, num: "02", title: { id: "Prioritas KHG", en: "KHG prioritisation" } },
  {
    kind: "feature",
    dur: 17,
    layout: "left",
    title: { id: "Lima dimensi untuk setiap KHG", en: "Five dimensions for every KHG" },
    items: [
      { color: DIM.urgency, title: { id: "Urgensi", en: "Urgency" }, text: { id: "seberapa sering terbakar, seberapa rusak gambutnya", en: "how often it burns, how damaged the peat is" } },
      { color: DIM.stake, title: { id: "Nilai yang dipertaruhkan", en: "Stake" }, text: { id: "gambut dalam, kubah, fungsi lindung, konservasi", en: "deep peat, domes, protective function, conservation" } },
      { color: DIM.complexity, title: { id: "Kompleksitas", en: "Complexity" }, text: { id: "berapa banyak pihak dan klaim di atas gambut", en: "how many parties and claims sit on the peat" } },
      { color: DIM.feasibility, title: { id: "Kelayakan", en: "Feasibility" }, text: { id: "akses air dan jalan untuk pembasahan", en: "water and road access for rewetting" } },
      { color: DIM.people, title: { id: "Penduduk", en: "People" }, text: { id: "siapa yang terdampak asap dan kebakaran", en: "who is affected by smoke and fire" } },
    ],
    shots: [{ shot: "prio-ranking", from: [0.18, 0.0, 0.8, 0.6], to: [0.5, 0.02, 0.48, 0.36] }],
  },
  {
    kind: "feature",
    dur: 17,
    layout: "left",
    title: { id: "Lima tipe tindakan", en: "Five action types" },
    items: [
      { tag: "A", color: TYPE.A, title: { id: "Aksi cepat", en: "Quick action" }, text: { id: "urgensi tinggi, kompleksitas rendah: bertindak sekarang", en: "high urgency, low complexity: act now" } },
      { tag: "B", color: TYPE.B, title: { id: "Koordinasi multipihak", en: "Multi-party coordination" }, text: { id: "urgensi tinggi, banyak pihak harus bekerja sama", en: "high urgency, many parties must work together" } },
      { tag: "C", color: TYPE.C, title: { id: "Urgensi sedang", en: "Medium urgency" }, text: { id: "ditangani setelah KHG berurgensi tinggi", en: "acted on after the high-urgency KHG" } },
      { tag: "D", color: TYPE.D, title: { id: "Lindungi dan pantau", en: "Protect and monitor" }, text: { id: "urgensi rendah, nilai yang dipertaruhkan tinggi", en: "low urgency, high stake" } },
      { tag: "E", color: TYPE.E, title: { id: "Pantau", en: "Monitor" }, text: { id: "urgensi rendah, nilai rendah atau sedang", en: "low urgency, low or medium stake" } },
    ],
    shots: [{ shot: "prio-types", frame: "card", from: [0, 0, 1, 1], to: [0, 0, 1, 1] }],
  },
  {
    kind: "feature",
    dur: 16,
    layout: "left",
    title: { id: "Intervensi yang sesuai", en: "The matching intervention" },
    body: { id: "Peta bisa diwarnai menurut tipe, urgensi, atau intervensi.", en: "The map can be coloured by type, urgency or intervention." },
    items: [
      { color: "#3b8ff0", title: { id: "Basahi", en: "Rewet" }, text: { id: "gambut dikeringkan kanal: sekat kanal", en: "peat drained by canals: block the canals" } },
      { color: "#2a9d6f", title: { id: "Revegetasi", en: "Revegetate" }, text: { id: "tutupan terbuka atau rusak: tanami kembali", en: "open or damaged cover: replant" } },
      { color: "#7fb7a0", title: { id: "Basahi + revegetasi", en: "Rewet + revegetate" }, text: { id: "keduanya dibutuhkan", en: "both are needed" } },
    ],
    shots: [
      { shot: "prio-map-type", chip: { id: "Tipe tindakan", en: "Action type" }, from: [0, 0, 1, 1], to: [0.05, 0.12, 0.8, 0.8] },
      { shot: "prio-map-urgency", chip: { id: "Urgensi", en: "Urgency" }, from: [0.05, 0.12, 0.8, 0.8], to: [0.1, 0.2, 0.65, 0.65] },
      { shot: "prio-map-intervention", chip: { id: "Intervensi", en: "Intervention" }, from: [0.1, 0.2, 0.65, 0.65], to: [0.12, 0.25, 0.55, 0.55] },
    ],
  },
  {
    kind: "feature",
    dur: 17,
    layout: "wide",
    title: { id: "Geser bobot, peringkat langsung berubah", en: "Move a weight and the ranking updates at once" },
    body: {
      id: "Lihat KHG mana yang naik dan turun: pemangku kepentingan bisa menguji prioritasnya sendiri.",
      en: "See which KHG move up and down: stakeholders can test their own priorities.",
    },
    shots: [{ shot: "clip-weights", frame: "browser", trim: 0.5, rate: 1.3, from: [0, 0.08, 1, 0.92], to: [0.08, 0.1, 0.8, 0.8] }],
  },
  {
    kind: "feature",
    dur: 12,
    layout: "right",
    title: { id: "Transparan dan bisa diuji", en: "Transparent and testable" },
    body: {
      id: "Bobot acuan ditulis sebelum hasil keluar. Setiap perubahan bobot dibandingkan dengan acuan itu.",
      en: "The reference weights were written before any results. Every change is compared against them.",
    },
    shots: [{ shot: "prio-shift", frame: "card", from: [0, 0, 1, 1], to: [0.05, 0.05, 0.75, 0.75] }],
  },

  // 03 KHG PROFILE
  { kind: "section", dur: 4, num: "03", title: { id: "Profil KHG", en: "KHG profile" } },
  {
    kind: "feature",
    dur: 11,
    layout: "wide",
    title: { id: "Setiap KHG punya profil lengkap", en: "Every KHG has a full profile" },
    body: { id: "Contoh: KHG Sungai Kahayan – Sungai Sebangau, Kalimantan Tengah", en: "Example: Sungai Kahayan – Sungai Sebangau, Central Kalimantan" },
    shots: [{ shot: "profile-top", frame: "browser", from: [0, 0, 1, 1], to: [0.05, 0.05, 0.75, 0.75] }],
  },
  {
    kind: "feature",
    dur: 10,
    layout: "wide",
    title: { id: "Tipe, intervensi, dan skor setiap dimensi", en: "Type, intervention and the score on each dimension" },
    shots: [{ shot: "profile-top", frame: "card", from: [0.03, 0.05, 0.94, 0.42], to: [0.03, 0.06, 0.62, 0.28] }],
  },
  {
    kind: "feature",
    dur: 19,
    layout: "wide",
    title: { id: "Semua lapisan data dalam satu peta", en: "All the data layers on one map" },
    shots: [
      { shot: "profile-map-depth", chip: { id: "Kedalaman gambut", en: "Peat thickness" }, from: [0.2, 0, 0.6, 1], to: [0.25, 0.05, 0.5, 0.9] },
      { shot: "profile-map-damage", chip: { id: "Kerusakan gambut (SKEG 2024)", en: "Peat damage (SKEG 2024)" }, from: [0.25, 0.05, 0.5, 0.9], to: [0.27, 0.1, 0.45, 0.8] },
      { shot: "profile-map-canal", chip: { id: "Zona pengaruh kanal", en: "Canal influence zone" }, from: [0.27, 0.1, 0.45, 0.8], to: [0.28, 0.15, 0.4, 0.7] },
      { shot: "profile-map-satellite", chip: { id: "Citra satelit", en: "Satellite imagery" }, from: [0.2, 0, 0.6, 1], to: [0.28, 0.1, 0.42, 0.75] },
    ],
  },
  {
    kind: "feature",
    dur: 11,
    layout: "left",
    title: { id: "Posisi KHG pada setiap indikator", en: "Where the KHG sits on every indicator" },
    body: { id: "Dibandingkan dengan semua KHG lain, dan bisa dibandingkan langsung dengan KHG pilihan.", en: "Against all other KHG, with a side-by-side comparison to any chosen KHG." },
    shots: [{ shot: "profile-indicators", frame: "card", from: [0, 0, 1, 0.55], to: [0, 0.3, 1, 0.55] }],
  },
  {
    kind: "feature",
    dur: 12,
    layout: "wide",
    title: { id: "Riwayat kebakaran, titik panas, dan iklim", en: "Fire history, hotspots and climate" },
    body: { id: "Luas terbakar per tahun, titik panas per bulan, defisit air dan curah hujan musim kemarau.", en: "Burned area per year, hotspots per month, dry-season water deficit and rainfall." },
    shots: [{ shot: "profile-charts", frame: "card", from: [0, 0, 0.62, 0.55], to: [0.38, 0, 0.62, 0.55] }],
  },
  {
    kind: "feature",
    dur: 11,
    layout: "left",
    title: { id: "Status lahan di atas gambut", en: "Land status on the peat" },
    body: {
      id: "Kawasan hutan, fungsi gambut, desa, dan program DMPG: di mana gambut dan kebakarannya berada.",
      en: "Forest area, peat function, villages and the DMPG programme: where the peat and its fires fall.",
    },
    shots: [{ shot: "profile-landstatus", frame: "card", from: [0, 0, 1, 0.6], to: [0, 0.4, 1, 0.6] }],
  },

  // 04 FIRE & METHOD
  { kind: "section", dur: 4, num: "04", title: { id: "Kebakaran & Metode", en: "Fire & method" } },
  {
    kind: "feature",
    dur: 11,
    layout: "wide",
    title: { id: "Kebakaran menurut status lahan", en: "Fire by land status" },
    body: { id: "Tren nasional dan rincian per provinsi.", en: "National trends and a breakdown by province." },
    shots: [{ shot: "fire-full", frame: "card", from: [0, 0.37, 1, 0.27], to: [0.04, 0.39, 0.8, 0.22] }],
  },
  {
    kind: "feature",
    dur: 10,
    layout: "wide",
    title: { id: "Metode terbuka", en: "An open method" },
    body: { id: "Setiap indikator, bobot, dan sumber data dijelaskan, dan semua data dapat diunduh.", en: "Every indicator, weight and data source is documented, and all the data can be downloaded." },
    shots: [{ shot: "method-top", frame: "browser", from: [0, 0, 1, 1], to: [0.05, 0.05, 0.7, 0.7] }],
  },

  // CLOSING
  {
    kind: "title",
    dur: 9,
    kicker: { id: "Versi prototipe", en: "Prototype version" },
    title: { id: "Terus dikembangkan bersama para pemangku kepentingan", en: "Developed further together with stakeholders" },
    sub: { id: settings.url, en: "" },
  },
  {
    kind: "logos",
    dur: 13,
    title: { id: "Dashboard Prioritas Restorasi Gambut", en: "Peatland Restoration Prioritisation Dashboard" },
    support: { label: { id: "Didukung oleh", en: "Supported by" }, logo: "logos/world-bank.svg" },
    credits: [
      "Musik: “Dreams Become Real”, Kevin MacLeod (incompetech.com), CC BY 4.0",
      "Citra pembuka: NASA Earth Observatory (domain publik); Pierre Markuse, data Copernicus Sentinel 2019 (CC BY 2.0)",
    ],
  },
];
