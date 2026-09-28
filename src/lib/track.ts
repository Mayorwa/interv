/**
 * Geometry of a standard 400 m outdoor track.
 *
 * Lane 1's running line sits 30 cm outside the curb, giving a 36.80 m bend radius
 * and 84.39 m straights: 2 x 84.39 + 2 x pi x 36.80 = 400.00 m. Each lane out adds
 * 2 x pi x 1.22 = 7.67 m per lap, which is exactly the stagger between blocks.
 */
export const STRAIGHT_LENGTH = 84.39;
export const LANE_1_RADIUS = 36.8;
export const LANE_WIDTH = 1.22;
export const LANE_COUNT = 8;

export function laneRadius(lane: number): number {
  return LANE_1_RADIUS + (lane - 1) * LANE_WIDTH;
}

export function laneLapLength(lane: number): number {
  return 2 * STRAIGHT_LENGTH + 2 * Math.PI * laneRadius(lane);
}

/** Stagger between this lane's start and lane 1's, in metres. */
export function laneStagger(lane: number): number {
  return laneLapLength(lane) - laneLapLength(1);
}

export interface TrackPoint {
  x: number;
  z: number;
  /** Heading in radians for an object whose forward axis is +z. */
  heading: number;
}

/**
 * Position at arc length `u` along a lane, measured forward from the finish line
 * in the running direction. Athletes run counterclockwise seen from above.
 * Negative `u` continues the home straight backwards onto the sprint run-off,
 * which is where a 100 m actually starts.
 */
export function pointOnLane(lane: number, u: number): TrackPoint {
  const r = laneRadius(lane);
  const half = STRAIGHT_LENGTH / 2;
  const bend = Math.PI * r;
  const lap = 2 * bend + 2 * STRAIGHT_LENGTH;

  if (u < 0) {
    return { x: -half + u, z: r, heading: Math.PI / 2 };
  }

  const s = u % lap;

  // First bend, curving away past the finish line.
  if (s < bend) {
    const phi = s / r;
    return {
      x: half + r * Math.sin(phi),
      z: r * Math.cos(phi),
      heading: Math.atan2(Math.cos(phi), -Math.sin(phi)),
    };
  }

  // Back straight, running the other way.
  if (s < bend + STRAIGHT_LENGTH) {
    const v = s - bend;
    return { x: half - v, z: -r, heading: -Math.PI / 2 };
  }

  // Final bend.
  if (s < 2 * bend + STRAIGHT_LENGTH) {
    const phi = (s - bend - STRAIGHT_LENGTH) / r;
    return {
      x: -half - r * Math.sin(phi),
      z: -r * Math.cos(phi),
      heading: Math.atan2(-Math.cos(phi), Math.sin(phi)),
    };
  }

  // Home straight, into the finish.
  const v = s - 2 * bend - STRAIGHT_LENGTH;
  return { x: -half + v, z: r, heading: Math.PI / 2 };
}

/**
 * Arc length of an athlete's blocks. Every race ends on the common finish line,
 * so walking back the race distance along each lane produces the stagger for free.
 */
export function startArc(lane: number, raceDistance: number): number {
  const lap = laneLapLength(lane);
  const laps = Math.ceil(raceDistance / lap);
  return laps * lap - raceDistance;
}

export function trackPlace(lane: number, raceDistance: number, covered: number): TrackPoint {
  return pointOnLane(lane, startArc(lane, raceDistance) + covered);
}

/** How the camera should treat this distance. */
export function trackShape(raceDistance: number): "straight" | "bend" | "lap" {
  if (raceDistance <= 110) return "straight";
  if (raceDistance <= 200) return "bend";
  return "lap";
}
