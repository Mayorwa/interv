import * as THREE from "three";
import { POOL_LANES, POOL_LANE_WIDTH } from "./pool";
import { LANE_1_RADIUS, LANE_WIDTH, laneRadius } from "./track";
import type { Race, RaceState } from "./types";

export interface CameraShot {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

const tmp = new THREE.Vector3();

function bandCentre(laneCount: number): number {
  return (LANE_1_RADIUS - LANE_WIDTH / 2 + laneRadius(laneCount) + LANE_WIDTH / 2) / 2;
}

/**
 * Where the camera should be for this race at this moment.
 *
 * A straight sprint reads from a fixed three-quarter view. A lap does not: eight
 * runners strung around a bend need the camera to travel with them and to cut to
 * the home straight for the finish.
 */
export function shotFor(race: Race, state: RaceState, laneCount: number): CameraShot {
  if (race.sport === "pool") return poolShot(race, state);
  if (race.distance <= 110) return straightShot(state, laneCount);
  return lapShot(race, state, laneCount);
}

function straightShot(state: RaceState, laneCount: number): CameraShot {
  const z = bandCentre(laneCount);
  // Track the pack rather than the leader so the field never leaves the frame.
  const packX = -57.8 + state.leadDistance * 0.995;
  const spread = Math.max(6, state.leadDistance - Math.min(...state.athletes.map((a) => a.distance)));

  return {
    position: new THREE.Vector3(packX - 14, 22 + spread * 0.25, z + 30),
    target: new THREE.Vector3(packX + 5, 0.6, z - 1),
    fov: 30,
  };
}

function lapShot(race: Race, state: RaceState, laneCount: number): CameraShot {
  const leader = state.leader;
  const z = bandCentre(laneCount);
  const toGo = race.distance - state.leadDistance;

  // Closing stretch: settle onto the home straight and let them run at the camera.
  const homeStraight: CameraShot = {
    position: new THREE.Vector3(26, 20, z + 34),
    target: new THREE.Vector3(38, 0.6, z - 4),
    fov: 34,
  };

  if (!leader) return homeStraight;
  if (toGo < 85) {
    const blend = 1 - Math.max(0, toGo - 45) / 40;
    const chase = chaseShot(leader.position, z);
    return {
      position: chase.position.lerp(homeStraight.position, blend),
      target: chase.target.lerp(homeStraight.target, blend),
      fov: chase.fov + (homeStraight.fov - chase.fov) * blend,
    };
  }
  return chaseShot(leader.position, z);
}

/** Outside the bend and above, looking back across the lanes at the leader. */
function chaseShot(leaderPos: [number, number, number], bandZ: number): CameraShot {
  const leader = tmp.set(leaderPos[0], 0, leaderPos[2]);
  const outward = new THREE.Vector3(leader.x, 0, leader.z).normalize();
  if (outward.lengthSq() < 1e-6) outward.set(0, 0, 1);

  const position = new THREE.Vector3(leader.x, 0, leader.z)
    .addScaledVector(outward, 26)
    .setY(21 + bandZ * 0.1);
  const target = new THREE.Vector3(leader.x, 0.6, leader.z).addScaledVector(outward, -3);

  return { position, target, fov: 34 };
}

function poolShot(race: Race, state: RaceState): CameraShot {
  const length = race.poolLength ?? 50;
  const halfWidth = ((POOL_LANES + 1) * POOL_LANE_WIDTH) / 2;
  const lead = state.athletes.reduce((best, a) => Math.max(best, a.position[0]), 0);

  const wide: CameraShot = {
    position: new THREE.Vector3(-16, 26, -halfWidth - 24),
    target: new THREE.Vector3(length * 0.52, 0, 0),
    fov: 32,
  };

  if (state.section === null) return wide;

  // Final length: drop lower and follow the swimmers in to the wall.
  const close: CameraShot = {
    position: new THREE.Vector3(lead - 14, 13, -halfWidth - 15),
    target: new THREE.Vector3(lead + 6, 0, 0),
    fov: 34,
  };
  return close;
}

/**
 * Frame-rate independent approach to the shot. Deterministic for a fixed step,
 * which is what the exporter uses.
 */
export function damp(current: THREE.Vector3, target: THREE.Vector3, lambda: number, dt: number) {
  const factor = 1 - Math.exp(-lambda * dt);
  current.lerp(target, factor);
}
