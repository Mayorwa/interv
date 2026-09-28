import type { Athlete, Race } from "./types";

/**
 * A monotone piecewise-cubic interpolant. Monotone matters here: an athlete may
 * never move backwards, which an ordinary spline through noisy splits can do.
 * Fritsch-Carlson, 1980.
 */
interface MonotoneSpline {
  xs: number[];
  ys: number[];
  ms: number[];
}

function buildSpline(xs: number[], ys: number[]): MonotoneSpline {
  const n = xs.length;
  if (n < 2) return { xs, ys, ms: [0] };

  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = xs[i + 1] - xs[i];
    slopes.push(dx <= 0 ? 0 : (ys[i + 1] - ys[i]) / dx);
  }

  const ms: number[] = new Array(n);
  ms[0] = slopes[0];
  ms[n - 1] = slopes[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (slopes[i - 1] * slopes[i] <= 0) ms[i] = 0;
    else ms[i] = (slopes[i - 1] + slopes[i]) / 2;
  }

  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      ms[i] = 0;
      ms[i + 1] = 0;
      continue;
    }
    const a = ms[i] / slopes[i];
    const b = ms[i + 1] / slopes[i];
    const s = a * a + b * b;
    if (s > 9) {
      const scale = 3 / Math.sqrt(s);
      ms[i] = scale * a * slopes[i];
      ms[i + 1] = scale * b * slopes[i];
    }
  }

  return { xs, ys, ms };
}

function segmentFor(spline: MonotoneSpline, x: number): number {
  const { xs } = spline;
  let lo = 0;
  let hi = xs.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (xs[mid] <= x) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

function evalSpline(spline: MonotoneSpline, x: number): number {
  const { xs, ys, ms } = spline;
  if (xs.length < 2) return ys[0] ?? 0;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];

  const i = segmentFor(spline, x);
  const h = xs[i + 1] - xs[i];
  const t = (x - xs[i]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    ys[i] * (2 * t3 - 3 * t2 + 1) +
    ms[i] * h * (t3 - 2 * t2 + t) +
    ys[i + 1] * (-2 * t3 + 3 * t2) +
    ms[i + 1] * h * (t3 - t2)
  );
}

function evalSlope(spline: MonotoneSpline, x: number): number {
  const { xs, ys, ms } = spline;
  if (xs.length < 2) return 0;
  if (x <= xs[0] || x >= xs[xs.length - 1]) return 0;

  const i = segmentFor(spline, x);
  const h = xs[i + 1] - xs[i];
  const t = (x - xs[i]) / h;
  const t2 = t * t;
  return (
    (ys[i] * (6 * t2 - 6 * t)) / h +
    ms[i] * (3 * t2 - 4 * t + 1) +
    (ys[i + 1] * (-6 * t2 + 6 * t)) / h +
    ms[i + 1] * (3 * t2 - 2 * t)
  );
}

/**
 * Distance covered from rest under an exponential approach to top speed,
 * calibrated so the athlete covers exactly `distance` in exactly `duration`.
 * Keller's sprint model, which is what makes a 100 m read as a 100 m rather
 * than eight markers gliding at a constant rate.
 */
function riseFromRest(distance: number, duration: number, tau: number) {
  const shape = duration - tau * (1 - Math.exp(-duration / tau));
  const vMax = shape > 1e-6 ? distance / shape : distance / Math.max(duration, 1e-6);
  return (t: number) => {
    const clamped = Math.max(0, Math.min(duration, t));
    return vMax * (clamped - tau * (1 - Math.exp(-clamped / tau)));
  };
}

export interface DistanceCurve {
  /** Race clock at which the athlete starts moving. */
  startTime: number;
  /** Race clock at which the athlete stops, whether finishing or not. */
  endTime: number;
  totalDistance: number;
  finished: boolean;
  distanceAt(raceClock: number): number;
  speedAt(raceClock: number): number;
  /** Race clock at which the athlete reached a distance. */
  timeAtDistance(meters: number): number;
  /** The timing marks the curve was built from, after nudges. */
  knots: { meters: number; seconds: number }[];
}

const SYNTHETIC_STEP_METERS = 10;

type Knot = { meters: number; seconds: number };

function sortAndMonotonise(knots: Knot[]): Knot[] {
  const sorted = [...knots].sort((a, b) => a.meters - b.meters);
  // A nudge can push a mark past its neighbour. Keep time strictly increasing so
  // the spline stays invertible.
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].seconds <= sorted[i - 1].seconds) {
      sorted[i] = { ...sorted[i], seconds: sorted[i - 1].seconds + 1e-3 };
    }
  }
  return sorted;
}

function buildFromKnots(knots: Knot[], race: Race, athlete: Athlete): DistanceCurve {
  const isTrack = race.sport === "track";
  const startTime = isTrack ? (athlete.reaction ?? 0) : 0;
  const ceiling = athlete.dnfAtMeters ?? race.distance;
  const trimmed = knots.filter((knot) => knot.meters > 0 && knot.meters <= ceiling);
  trimmed.unshift({ meters: 0, seconds: startTime });
  if (trimmed.length < 2) trimmed.push({ meters: ceiling, seconds: startTime + 1 });

  // Densify long gaps so the speed profile is plausible between marks. The first
  // segment starts from rest and gets the sprint model; later gaps are filled at
  // the segment's own average pace and smoothed by the spline.
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < trimmed.length - 1; i++) {
    const a = trimmed[i];
    const b = trimmed[i + 1];
    const span = b.meters - a.meters;
    const duration = b.seconds - a.seconds;
    const steps = Math.max(1, Math.min(48, Math.round(span / SYNTHETIC_STEP_METERS)));

    const rise = i === 0 ? riseFromRest(span, duration, isTrack ? 1.1 : 0.5) : null;

    for (let s = 0; s < steps; s++) {
      const localTime = (duration * s) / steps;
      const covered = rise ? rise(localTime) : (span * s) / steps;
      xs.push(a.seconds + localTime);
      ys.push(a.meters + covered);
    }
  }
  const last = trimmed[trimmed.length - 1];
  xs.push(last.seconds);
  ys.push(last.meters);

  for (let i = 1; i < xs.length; i++) {
    if (xs[i] <= xs[i - 1]) xs[i] = xs[i - 1] + 1e-4;
    if (ys[i] < ys[i - 1]) ys[i] = ys[i - 1];
  }

  const spline = buildSpline(xs, ys);
  const endTime = xs[xs.length - 1];
  const totalDistance = ys[ys.length - 1];

  return {
    startTime,
    endTime,
    totalDistance,
    finished: athlete.dnfAtMeters === undefined,
    knots: trimmed,
    distanceAt(raceClock) {
      if (raceClock <= startTime) return 0;
      if (raceClock >= endTime) return totalDistance;
      return Math.max(0, Math.min(totalDistance, evalSpline(spline, raceClock)));
    },
    speedAt(raceClock) {
      if (raceClock <= startTime || raceClock >= endTime) return 0;
      return Math.max(0, evalSlope(spline, raceClock));
    },
    timeAtDistance(meters) {
      if (meters <= 0) return startTime;
      if (meters >= totalDistance) return endTime;
      let lo = startTime;
      let hi = endTime;
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        if (evalSpline(spline, mid) < meters) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    },
  };
}

/**
 * Builds the athlete's distance-over-time curve, then reapplies any editorial
 * nudges. A nudge at a distance with no timing mark is resolved against the
 * unnudged curve first, so the reviewer can pull a runner earlier or later
 * anywhere in the race rather than only at published marks.
 */
export function buildCurve(athlete: Athlete, race: Race): DistanceCurve {
  const published = new Map<number, number>();
  for (const split of athlete.splits) published.set(split.meters, split.seconds);

  const offMark: Athlete["nudges"] = [];
  for (const nudge of athlete.nudges ?? []) {
    if (published.has(nudge.meters)) {
      published.set(nudge.meters, published.get(nudge.meters)! + nudge.deltaSeconds);
    } else {
      offMark.push(nudge);
    }
  }

  const knots = sortAndMonotonise(
    [...published.entries()].map(([meters, seconds]) => ({ meters, seconds })),
  );

  const base = buildFromKnots(knots, race, athlete);
  if (offMark.length === 0) return base;

  const withInserted = sortAndMonotonise([
    ...knots,
    ...offMark.map((nudge) => ({
      meters: nudge.meters,
      seconds: base.timeAtDistance(nudge.meters) + nudge.deltaSeconds,
    })),
  ]);
  return buildFromKnots(withInserted, race, athlete);
}
