import type { Race } from "@/lib/types";

/**
 * Three finals from Paris 2024, entered from published results.
 *
 * Playback speeds are set so each clip lands close to the length a social recap
 * of that race actually runs: a 100 m is too fast to read in real time and is
 * slowed down, while a 1,500 m is far too long and is sped up about ten times.
 */

/** Women's 100 m final, 3 August 2024. */
const womens100: Race = {
  id: "paris-2024-w-100m",
  sport: "track",
  meet: "Paris 2024",
  round: "FINAL",
  event: "Women's 100m",
  distance: 100,
  playbackSpeed: 0.65,
  leadIn: 2.5,
  leadOut: 4,
  source:
    "World Athletics official results: lanes, reaction times and finishing times. No public intermediate splits exist for this final, so the run between the blocks and the line is modelled.",
  note: "Alfred led from the gun. Richardson reacted 0.077s slower than Alfred and was still seventh at 40 m before coming through for silver, which the nudges below put back into the animation.",
  athletes: [
    {
      name: "Mujinga Kambundji",
      country: "SUI",
      lane: 2,
      reaction: 0.136,
      splits: [{ meters: 100, seconds: 10.99 }],
    },
    {
      name: "Marie-Josée Ta Lou-Smith",
      country: "CIV",
      lane: 3,
      reaction: 0.143,
      splits: [{ meters: 100, seconds: 13.84 }],
      nudges: [{ meters: 55, deltaSeconds: 0.35 }],
    },
    {
      name: "Tia Clayton",
      country: "JAM",
      lane: 4,
      reaction: 0.16,
      splits: [{ meters: 100, seconds: 11.04 }],
      nudges: [
        { meters: 20, deltaSeconds: -0.08 },
        { meters: 80, deltaSeconds: 0.06 },
      ],
    },
    {
      name: "Melissa Jefferson",
      country: "USA",
      lane: 5,
      reaction: 0.144,
      splits: [{ meters: 100, seconds: 10.92 }],
      nudges: [{ meters: 70, deltaSeconds: 0.04 }],
    },
    {
      name: "Julien Alfred",
      country: "LCA",
      lane: 6,
      reaction: 0.144,
      splits: [{ meters: 100, seconds: 10.72 }],
      nudges: [{ meters: 30, deltaSeconds: -0.05 }],
    },
    {
      name: "Sha'Carri Richardson",
      country: "USA",
      lane: 7,
      reaction: 0.221,
      splits: [{ meters: 100, seconds: 10.87 }],
      nudges: [
        { meters: 40, deltaSeconds: 0.13 },
        { meters: 80, deltaSeconds: -0.04 },
      ],
    },
    {
      name: "Daryll Neita",
      country: "GBR",
      lane: 8,
      reaction: 0.135,
      splits: [{ meters: 100, seconds: 10.96 }],
    },
    {
      name: "Twanisha Terry",
      country: "USA",
      lane: 9,
      reaction: 0.167,
      splits: [{ meters: 100, seconds: 10.97 }],
    },
  ],
};

/** Men's 400 m final, 7 August 2024. Every 100 m mark is published. */
const mens400: Race = {
  id: "paris-2024-m-400m",
  sport: "track",
  meet: "Paris 2024",
  round: "FINAL",
  event: "Men's 400m",
  distance: 400,
  playbackSpeed: 1.7,
  leadIn: 2.5,
  leadOut: 4,
  source:
    "World Athletics official results for lanes, reaction times and finishing times; 100 m splits from the Track & Field News race report.",
  note: "Hall was fourth at 300 m in 31.81, 0.46 behind Hudson-Smith, and took gold in the last two steps. The comeback is not animated by hand: it falls out of his published splits.",
  athletes: [
    {
      name: "Christopher Bailey",
      country: "USA",
      lane: 2,
      reaction: 0.178,
      splits: [
        { meters: 100, seconds: 11.38 },
        { meters: 200, seconds: 21.89 },
        { meters: 300, seconds: 32.89 },
        { meters: 400, seconds: 44.58 },
      ],
    },
    {
      name: "Samuel Ogazi",
      country: "NGR",
      lane: 3,
      reaction: 0.225,
      splits: [
        { meters: 100, seconds: 11.19 },
        { meters: 200, seconds: 21.46 },
        { meters: 300, seconds: 32.92 },
        { meters: 400, seconds: 44.73 },
      ],
    },
    {
      name: "Michael Norman",
      country: "USA",
      lane: 4,
      reaction: 0.15,
      splits: [
        { meters: 100, seconds: 10.85 },
        { meters: 200, seconds: 21.11 },
        { meters: 300, seconds: 32.59 },
        { meters: 400, seconds: 45.62 },
      ],
    },
    {
      name: "Kirani James",
      country: "GRN",
      lane: 5,
      reaction: 0.147,
      splits: [
        { meters: 100, seconds: 10.75 },
        { meters: 200, seconds: 20.63 },
        { meters: 300, seconds: 31.5 },
        { meters: 400, seconds: 43.87 },
      ],
    },
    {
      name: "Matthew Hudson-Smith",
      country: "GBR",
      lane: 6,
      reaction: 0.149,
      splits: [
        { meters: 100, seconds: 10.81 },
        { meters: 200, seconds: 20.62 },
        { meters: 300, seconds: 31.35 },
        { meters: 400, seconds: 43.44 },
      ],
    },
    {
      name: "Muzala Samukonga",
      country: "ZAM",
      lane: 7,
      reaction: 0.185,
      splits: [
        { meters: 100, seconds: 10.87 },
        { meters: 200, seconds: 20.95 },
        { meters: 300, seconds: 31.91 },
        { meters: 400, seconds: 43.74 },
      ],
    },
    {
      name: "Quincy Hall",
      country: "USA",
      lane: 8,
      reaction: 0.168,
      splits: [
        { meters: 100, seconds: 11.01 },
        { meters: 200, seconds: 21.0 },
        { meters: 300, seconds: 31.81 },
        { meters: 400, seconds: 43.4 },
      ],
    },
    {
      name: "Jereem Richards",
      country: "TTO",
      lane: 9,
      reaction: 0.144,
      splits: [
        { meters: 100, seconds: 10.69 },
        { meters: 200, seconds: 20.46 },
        { meters: 300, seconds: 31.42 },
        { meters: 400, seconds: 43.78 },
      ],
    },
  ],
};

/** Men's 1,500 m freestyle final, 4 August 2024. */
const mens1500free: Race = {
  id: "paris-2024-m-1500-free",
  sport: "pool",
  meet: "Paris 2024",
  round: "FINAL",
  event: "Men's 1,500m Freestyle",
  distance: 1500,
  poolLength: 50,
  playbackSpeed: 11,
  leadIn: 2,
  leadOut: 3.5,
  source:
    "Finke's fifteen 100 m cumulative splits are published in full. For the rest of the field only the opening 100, the closing 100, the mean middle 100 and the finish are public, so their middle 1,300 m is held at their own average pace.",
  note: "Finke led from the first turn and closed in 55.34 to take the world record in 14:30.67. Tunçelli was second through 300 m, which a nudge restores.",
  athletes: [
    {
      name: "Damien Joly",
      country: "FRA",
      lane: 1,
      splits: [
        { meters: 100, seconds: 57.61 },
        { meters: 1400, seconds: 834.23 },
        { meters: 1500, seconds: 892.61 },
      ],
    },
    {
      name: "Kuzey Tunçelli",
      country: "TUR",
      lane: 2,
      splits: [
        { meters: 100, seconds: 56.19 },
        { meters: 1400, seconds: 825.14 },
        { meters: 1500, seconds: 881.22 },
      ],
      nudges: [{ meters: 300, deltaSeconds: -1.7 }],
    },
    {
      name: "Ahmed Jaouadi",
      country: "TUN",
      lane: 3,
      splits: [
        { meters: 100, seconds: 56.88 },
        { meters: 1400, seconds: 828.17 },
        { meters: 1500, seconds: 883.35 },
      ],
    },
    {
      name: "Daniel Wiffen",
      country: "IRL",
      lane: 4,
      splits: [
        { meters: 100, seconds: 56.36 },
        { meters: 1400, seconds: 821.15 },
        { meters: 1500, seconds: 879.63 },
      ],
    },
    {
      name: "Gregorio Paltrinieri",
      country: "ITA",
      lane: 5,
      splits: [
        { meters: 100, seconds: 56.02 },
        { meters: 1400, seconds: 816.52 },
        { meters: 1500, seconds: 874.55 },
      ],
    },
    {
      name: "David Aubry",
      country: "FRA",
      lane: 6,
      splits: [
        { meters: 100, seconds: 57.06 },
        { meters: 1400, seconds: 827.31 },
        { meters: 1500, seconds: 884.66 },
      ],
    },
    {
      name: "Bobby Finke",
      country: "USA",
      lane: 7,
      splits: [
        { meters: 100, seconds: 55.47 },
        { meters: 200, seconds: 113.59 },
        { meters: 300, seconds: 171.69 },
        { meters: 400, seconds: 230.38 },
        { meters: 500, seconds: 289.1 },
        { meters: 600, seconds: 347.86 },
        { meters: 700, seconds: 406.51 },
        { meters: 800, seconds: 465.18 },
        { meters: 900, seconds: 523.37 },
        { meters: 1000, seconds: 581.72 },
        { meters: 1100, seconds: 640.01 },
        { meters: 1200, seconds: 698.41 },
        { meters: 1300, seconds: 756.69 },
        { meters: 1400, seconds: 815.33 },
        { meters: 1500, seconds: 870.67 },
      ],
    },
    {
      name: "Dávid Betlehem",
      country: "HUN",
      lane: 8,
      splits: [
        { meters: 100, seconds: 56.71 },
        { meters: 1400, seconds: 825.4 },
        { meters: 1500, seconds: 880.91 },
      ],
    },
  ],
};

/** Men's 400 m individual medley final, 28 July 2024. Shows the stroke changes. */
const mens400im: Race = {
  id: "paris-2024-m-400-im",
  sport: "pool",
  meet: "Paris 2024",
  round: "FINAL",
  event: "Men's 400m Individual Medley",
  distance: 400,
  poolLength: 50,
  playbackSpeed: 4,
  leadIn: 2,
  leadOut: 3.5,
  strokePlan: [
    { untilMeter: 100, stroke: "fly" },
    { untilMeter: 200, stroke: "back" },
    { untilMeter: 300, stroke: "breast" },
    { untilMeter: 400, stroke: "free" },
  ],
  source:
    "World Aquatics official results for lanes and finishing times, with the cumulative time at each stroke change for all eight finalists.",
  note: "Marchand led from the first wall. The race behind him turned on the freestyle leg: Matsushita came from fifth to silver while Seto went from second at 200 m to seventh.",
  athletes: [
    {
      name: "Lewis Clareburt",
      country: "NZL",
      lane: 1,
      splits: [
        { meters: 100, seconds: 56.03 },
        { meters: 200, seconds: 120.42 },
        { meters: 300, seconds: 192.3 },
        { meters: 400, seconds: 250.44 },
      ],
    },
    {
      name: "Tomoyuki Matsushita",
      country: "JPN",
      lane: 2,
      splits: [
        { meters: 100, seconds: 56.52 },
        { meters: 200, seconds: 121.13 },
        { meters: 300, seconds: 191.56 },
        { meters: 400, seconds: 248.62 },
      ],
    },
    {
      name: "Daiya Seto",
      country: "JPN",
      lane: 3,
      splits: [
        { meters: 100, seconds: 54.88 },
        { meters: 200, seconds: 119.66 },
        { meters: 300, seconds: 190.91 },
        { meters: 400, seconds: 251.78 },
      ],
    },
    {
      name: "Léon Marchand",
      country: "FRA",
      lane: 4,
      splits: [
        { meters: 100, seconds: 54.32 },
        { meters: 200, seconds: 116.76 },
        { meters: 300, seconds: 184.24 },
        { meters: 400, seconds: 242.95 },
      ],
    },
    {
      name: "Max Litchfield",
      country: "GBR",
      lane: 5,
      splits: [
        { meters: 100, seconds: 56.23 },
        { meters: 200, seconds: 120.02 },
        { meters: 300, seconds: 191.35 },
        { meters: 400, seconds: 248.85 },
      ],
    },
    {
      name: "Carson Foster",
      country: "USA",
      lane: 6,
      splits: [
        { meters: 100, seconds: 55.64 },
        { meters: 200, seconds: 119.75 },
        { meters: 300, seconds: 190.7 },
        { meters: 400, seconds: 248.66 },
      ],
    },
    {
      name: "Alberto Razzetti",
      country: "ITA",
      lane: 7,
      splits: [
        { meters: 100, seconds: 56.0 },
        { meters: 200, seconds: 121.21 },
        { meters: 300, seconds: 191.86 },
        { meters: 400, seconds: 249.38 },
      ],
    },
    {
      name: "Cedric Büssing",
      country: "GER",
      lane: 8,
      splits: [
        { meters: 100, seconds: 57.92 },
        { meters: 200, seconds: 123.24 },
        { meters: 300, seconds: 196.29 },
        { meters: 400, seconds: 257.16 },
      ],
    },
  ],
};

export const RACES: Race[] = [womens100, mens400, mens1500free, mens400im];

export const DEFAULT_RACE_ID = womens100.id;
