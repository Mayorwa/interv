import { buildCurve, type DistanceCurve } from "./curve";
import { lapCount, poolPlace } from "./pool";
import { trackPlace } from "./track";
import type { AthleteState, Race, RaceState, Stroke } from "./types";

export interface CompiledRace {
  race: Race;
  curves: Map<string, DistanceCurve>;
  /** Race clock when the last athlete stops. */
  lastFinish: number;
  /** Race clock when the winner stops. */
  winningTime: number;
  /** Length of the exported clip in video seconds. */
  videoDuration: number;
  laps: number;
}

export function athleteKey(name: string, lane: number): string {
  return `${lane}:${name}`;
}

export function compileRace(race: Race): CompiledRace {
  const curves = new Map<string, DistanceCurve>();
  let lastFinish = 0;
  let winningTime = Number.POSITIVE_INFINITY;

  for (const athlete of race.athletes) {
    const curve = buildCurve(athlete, race);
    curves.set(athleteKey(athlete.name, athlete.lane), curve);
    lastFinish = Math.max(lastFinish, curve.endTime);
    if (curve.finished) winningTime = Math.min(winningTime, curve.endTime);
  }

  const laps = race.sport === "pool" ? lapCount(race.distance, race.poolLength ?? 50) : 1;
  const videoDuration = race.leadIn + lastFinish / race.playbackSpeed + race.leadOut;

  return { race, curves, lastFinish, winningTime, videoDuration, laps };
}

/** Video seconds since the clip started, to seconds since the gun. */
export function videoTimeToRaceClock(compiled: CompiledRace, videoTime: number): number {
  return (videoTime - compiled.race.leadIn) * compiled.race.playbackSpeed;
}

export function raceClockToVideoTime(compiled: CompiledRace, raceClock: number): number {
  return raceClock / compiled.race.playbackSpeed + compiled.race.leadIn;
}

function strokeAt(race: Race, covered: number): Stroke {
  const plan = race.strokePlan;
  if (!plan || plan.length === 0) return "free";
  for (const leg of plan) {
    if (covered < leg.untilMeter) return leg.stroke;
  }
  return plan[plan.length - 1].stroke;
}

export function sampleRace(compiled: CompiledRace, raceClock: number): RaceState {
  const { race, curves } = compiled;
  const poolLen = race.poolLength ?? 50;

  const states: AthleteState[] = race.athletes.map((athlete) => {
    const curve = curves.get(athleteKey(athlete.name, athlete.lane))!;
    const covered = curve.distanceAt(raceClock);
    const speed = curve.speedAt(raceClock);
    const finished = curve.finished && raceClock >= curve.endTime;

    if (race.sport === "pool") {
      const p = poolPlace(athlete.lane, covered, poolLen, race.distance);
      return {
        athlete,
        distance: covered,
        speed,
        position: [p.x, 0, p.z] as [number, number, number],
        heading: p.yaw,
        moving: raceClock > curve.startTime,
        finished,
        finishTime: curve.endTime,
        place: 0,
        gap: 0,
        lap: p.lap,
        stroke: strokeAt(race, covered),
        turnPhase: p.turning ? p.turn : -1,
        divePhase: p.divePhase,
      };
    }

    const p = trackPlace(athlete.lane, race.distance, covered);
    return {
      athlete,
      distance: covered,
      speed,
      position: [p.x, 0, p.z] as [number, number, number],
      heading: p.heading,
      moving: raceClock > curve.startTime,
      finished,
      finishTime: curve.endTime,
      place: 0,
      gap: 0,
      lap: 0,
      stroke: "free",
      turnPhase: -1,
      divePhase: 0,
    };
  });

  const ordered = [...states].sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    return b.distance - a.distance;
  });
  ordered.forEach((state, index) => {
    state.place = index + 1;
  });

  const leader = ordered[0];
  const leadDistance = leader?.distance ?? 0;

  if (leader) {
    const leaderAtLead = leader.finished ? leader.finishTime : raceClock;
    for (const state of states) {
      if (state === leader) continue;
      // Seconds behind is measured at the leader's current distance, which is what
      // a broadcast gap means, rather than a straight subtraction of finish times.
      const curve = curves.get(athleteKey(state.athlete.name, state.athlete.lane))!;
      state.gap = Math.max(0, curve.timeAtDistance(leadDistance) - leaderAtLead);
    }
  }

  return {
    raceClock,
    athletes: states,
    leader,
    leadDistance,
    allFinished: raceClock >= compiled.lastFinish,
    section: sectionFor(race, leadDistance, compiled.laps, poolLen),
  };
}

/** Fades in over the first few metres of the closing section. */
function section(label: string, metresIn: number, over: number) {
  const t = Math.max(0, Math.min(1, metresIn / over));
  return { label, alpha: t * t * (3 - 2 * t) };
}

function sectionFor(race: Race, leadDistance: number, laps: number, poolLen: number) {
  if (race.sport === "pool") {
    const lastWall = (laps - 1) * poolLen;
    if (laps > 1 && leadDistance >= lastWall) {
      return section("FINAL LENGTH", leadDistance - lastWall, 6);
    }
    return null;
  }
  if (race.distance <= 110) {
    const mark = race.distance * 0.8;
    if (leadDistance >= mark) return section("TO THE LINE", leadDistance - mark, 6);
    return null;
  }
  const mark = race.distance - 100;
  if (leadDistance >= mark) return section("FINAL STRETCH", leadDistance - mark, 12);
  return null;
}
