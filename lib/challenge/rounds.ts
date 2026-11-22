export type ChallengeTargetType = "GHOST_VESSEL" | "OIL_SLICK";

export interface ChallengeRound {
  id: string;
  number: number;
  title: string;
  location: string;
  targetType: ChallengeTargetType;
  sensor: string;
  target: {
    x: number;
    y: number;
    radius: number;
  };
  briefing: string;
  scientificNote: string;
}

const vesselNote =
  "A metallic hull returns a bright radar point and may leave a faint V-shaped Kelvin wake; oil damps capillary waves and appears as a smooth, dark low-backscatter patch.";

const oilNote =
  "Oil suppresses capillary waves, creating a smooth dark patch against the brighter sea; a vessel instead produces a bright metallic return and can trail a faint V-shaped Kelvin wake.";

export const CHALLENGE_ROUNDS: ChallengeRound[] = [
  {
    id: "mumbai-high-dark-trawler",
    number: 1,
    title: "Mumbai High Dark Trawler",
    location: "Mumbai High · Arabian Sea",
    targetType: "GHOST_VESSEL",
    sensor: "ISRO EOS-04 C-Band",
    target: { x: 68, y: 42, radius: 10 },
    briefing:
      "Find the unlit trawler's bright metallic return and faint wake inside the Mumbai High patrol box.",
    scientificNote: vesselNote,
  },
  {
    id: "konkan-coast-bilge-discharge",
    number: 2,
    title: "Konkan Coast Bilge Discharge",
    location: "Konkan Coast · Arabian Sea",
    targetType: "OIL_SLICK",
    sensor: "ISRO EOS-04 C-Band",
    target: { x: 34, y: 60, radius: 12 },
    briefing:
      "Locate the quiet, elongated low-backscatter slick spreading off the Konkan coast.",
    scientificNote: oilNote,
  },
  {
    id: "visakhapatnam-ais-blackout",
    number: 3,
    title: "Visakhapatnam AIS Blackout",
    location: "Visakhapatnam · Bay of Bengal",
    targetType: "GHOST_VESSEL",
    sensor: "ISRO-NASA NISAR L/S-Band",
    target: { x: 75, y: 72, radius: 10 },
    briefing:
      "Track the vessel that went silent on AIS by spotting its bright radar core and directional wake.",
    scientificNote: vesselNote,
  },
  {
    id: "andaman-corridor-tanker-slick",
    number: 4,
    title: "Andaman Corridor Tanker Slick",
    location: "Andaman Sea · Bay of Bengal",
    targetType: "OIL_SLICK",
    sensor: "ISRO EOS-04 C-Band",
    target: { x: 52, y: 30, radius: 12 },
    briefing:
      "Identify the tanker slick as a dark, smooth patch crossing the Andaman shipping corridor.",
    scientificNote: oilNote,
  },
  {
    id: "gulf-of-kutch-night-smuggler",
    number: 5,
    title: "Gulf of Kutch Night Smuggler",
    location: "Gulf of Kutch · Arabian Sea",
    targetType: "GHOST_VESSEL",
    sensor: "ISRO-NASA NISAR L/S-Band",
    target: { x: 26, y: 48, radius: 10 },
    briefing:
      "Pinpoint the night smuggler's metallic radar return despite its missing AIS signal.",
    scientificNote: vesselNote,
  },
];
