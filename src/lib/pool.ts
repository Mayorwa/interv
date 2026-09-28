/** Geometry of a long-course pool. Lanes are 2.5 m wide, walls at 0 and 50 m. */
export const POOL_LANE_WIDTH = 2.5;
export const POOL_LANES = 8;

/** Metres either side of a wall spent in the turn animation. */
const TURN_WINDOW = 2.4;
/** Metres of dive and glide off the blocks before the first stroke. */
const DIVE_DISTANCE = 6;

export function poolLaneZ(lane: number): number {
  return (lane - (POOL_LANES + 1) / 2) * POOL_LANE_WIDTH;
}

export function lapCount(totalDistance: number, length: number): number {
  return Math.max(1, Math.round(totalDistance / length));
}

export interface PoolPoint {
  x: number;
  z: number;
  /**
   * Yaw to draw the swimmer at. Through a turn this holds the heading the swimmer
   * arrived on, because the reversal is carried by the somersault rather than by
   * spinning the body about the vertical axis.
   */
  yaw: number;
  /** Completed lengths, 0-indexed. */
  lap: number;
  /** Progress through a wall turn: 0 entering the window, 0.5 at the wall, 1 leaving. */
  turn: number;
  turning: boolean;
  /** 1 at entry, falling to 0 once the first stroke starts. */
  divePhase: number;
}

function headingOfLap(lap: number): number {
  return lap % 2 === 0 ? Math.PI / 2 : -Math.PI / 2;
}

export function poolPlace(
  lane: number,
  covered: number,
  length: number,
  totalDistance: number,
): PoolPoint {
  const laps = lapCount(totalDistance, length);
  const lap = Math.min(Math.floor(covered / length), laps - 1);
  const within = covered - lap * length;
  const outbound = lap % 2 === 0;

  const nearestWall = Math.round(covered / length);
  const isInteriorWall = nearestWall >= 1 && nearestWall <= laps - 1;
  const offset = covered - nearestWall * length;
  const turning = isInteriorWall && Math.abs(offset) < TURN_WINDOW;

  return {
    x: outbound ? within : length - within,
    z: poolLaneZ(lane),
    yaw: turning ? headingOfLap(nearestWall - 1) : headingOfLap(lap),
    lap,
    turn: turning ? (offset + TURN_WINDOW) / (2 * TURN_WINDOW) : 0,
    turning,
    divePhase: covered < DIVE_DISTANCE ? 1 - covered / DIVE_DISTANCE : 0,
  };
}
