export type Sport = "track" | "pool";

export type Stroke = "free" | "back" | "breast" | "fly";

/** Cumulative time at a distance mark. `meters` is distance covered, not position. */
export interface Split {
  meters: number;
  seconds: number;
}

/** An editorial correction to one timing knot, in seconds. */
export interface Nudge {
  meters: number;
  deltaSeconds: number;
}

export interface Athlete {
  name: string;
  country: string;
  lane: number;
  /** Time from gun to first movement. Track only. */
  reaction?: number;
  splits: Split[];
  nudges?: Nudge[];
  /** Set when an athlete did not finish; they freeze at this distance. */
  dnfAtMeters?: number;
}

export interface StrokeLeg {
  untilMeter: number;
  stroke: Stroke;
}

export interface Race {
  id: string;
  sport: Sport;
  meet: string;
  round: string;
  event: string;
  distance: number;
  /** Pool events only. Long course is 50. */
  poolLength?: number;
  /** Pool events only. One leg per stroke change, in order. */
  strokePlan?: StrokeLeg[];
  /** Race seconds per second of video. 1 is real time. */
  playbackSpeed: number;
  /** Seconds of video held on the grid before the gun. */
  leadIn: number;
  /** Seconds of video held after the last finisher. */
  leadOut: number;
  athletes: Athlete[];
  source?: string;
  note?: string;
}

export interface AthleteState {
  athlete: Athlete;
  /** Meters covered at the current race clock. */
  distance: number;
  /** Meters per second at the current race clock. */
  speed: number;
  /** World position of the hips. */
  position: [number, number, number];
  /** Heading in radians about the vertical axis. */
  heading: number;
  /** 0 before the gun, 1 once moving. */
  moving: boolean;
  finished: boolean;
  finishTime: number;
  /** 1-indexed live position in the field. */
  place: number;
  /** Seconds behind the leader, or 0 for the leader. */
  gap: number;
  /** Pool only. Completed lengths. */
  lap: number;
  stroke: Stroke;
  /** Pool only. 0 to 1 through a wall turn. */
  turnPhase: number;
  /** Pool only. 0 to 1 through the dive and glide. */
  divePhase: number;
}

export interface RaceState {
  /** Seconds since the gun. Negative during the lead-in. */
  raceClock: number;
  athletes: AthleteState[];
  leader: AthleteState | undefined;
  /** Meters covered by the leader. */
  leadDistance: number;
  allFinished: boolean;
  /** Set once the leader enters the closing stretch or length. */
  section: { label: string; alpha: number } | null;
}
