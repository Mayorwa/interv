import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import type { AthleteState, Sport } from "@/lib/types";

/**
 * A deliberately lo-fi body. Fewer parts renders eight of these instantly, and at
 * the size they appear on a track the detail would be lost anyway.
 */
const SKIN = "#3b5bdb";
const SKIN_DARK = "#2f49b2";
const CAP = "#dbe4ff";

/** Metres covered per full gait cycle, which is two steps. */
const GAIT_DISTANCE = 4.2;
/** Metres covered per full stroke cycle. Fly and breaststroke move both arms at once. */
const STROKE_DISTANCE: Record<string, number> = {
  free: 3.0,
  back: 2.9,
  breast: 2.05,
  fly: 2.1,
};
/**
 * The animation cycle is capped. A 1,500 m freestyle played back eleven times
 * faster than it was swum would otherwise turn the arms into propellers, so the
 * body translates at the true rate while the limbs settle at a legible one.
 */
const MAX_CYCLES_PER_SECOND = 2.0;

const HIP_HEIGHT = 0.9;
const WATER_LINE = 0.14;

export interface FigureHandle {
  update(state: AthleteState, ctx: FigureContext): void;
}

export interface FigureContext {
  /** Video seconds elapsed, for cycle phase accumulation. */
  videoTime: number;
  /** Race seconds per video second. */
  playbackSpeed: number;
  /** Distance at which the race ends. */
  raceDistance: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const smoothstep = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

export const Figure = forwardRef<FigureHandle, { sport: Sport }>(function Figure({ sport }, ref) {
  const root = useRef<THREE.Group>(null!);
  const lift = useRef<THREE.Group>(null!);
  const yaw = useRef<THREE.Group>(null!);
  const pitch = useRef<THREE.Group>(null!);
  const roll = useRef<THREE.Group>(null!);
  const torso = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const foreL = useRef<THREE.Group>(null!);
  const foreR = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);
  const shinL = useRef<THREE.Group>(null!);
  const shinR = useRef<THREE.Group>(null!);
  const shadow = useRef<THREE.Mesh>(null!);

  const materials = useMemo(
    () => ({
      skin: new THREE.MeshLambertMaterial({ color: SKIN }),
      dark: new THREE.MeshLambertMaterial({ color: SKIN_DARK }),
      cap: new THREE.MeshLambertMaterial({ color: CAP }),
      shadow: new THREE.MeshBasicMaterial({ color: "#3d3a5c", transparent: true, opacity: 0.16 }),
    }),
    [],
  );

  // Cycle phase is integrated rather than derived from distance, so that the rate
  // cap above cannot make the feet slide against the ground.
  const phase = useRef(0);
  const lastVideoTime = useRef(0);

  function advancePhase(dt: number, metresPerVideoSecond: number, metresPerCycle: number) {
    const rate = Math.min(metresPerVideoSecond / metresPerCycle, MAX_CYCLES_PER_SECOND);
    phase.current = (phase.current + rate * dt) % 1;
    return phase.current;
  }

  function resetLateral() {
    armL.current.rotation.z = 0;
    armR.current.rotation.z = 0;
    legL.current.rotation.z = 0;
    legR.current.rotation.z = 0;
  }

  function updateRunner(state: AthleteState, ctx: FigureContext, dt: number) {
    yaw.current.rotation.y = state.heading;
    resetLateral();

    if (!state.moving) {
      // Set in the blocks: folded over the line, hands down, back leg extended.
      lift.current.position.y = 0.6;
      pitch.current.rotation.x = 0.95;
      roll.current.rotation.z = 0;
      torso.current.rotation.x = 0.1;
      armL.current.rotation.x = -1.5;
      armR.current.rotation.x = -1.4;
      foreL.current.rotation.x = -0.9;
      foreR.current.rotation.x = -1.0;
      legL.current.rotation.x = 1.15;
      shinL.current.rotation.x = -1.5;
      legR.current.rotation.x = -0.15;
      shinR.current.rotation.x = -1.2;
      shadow.current.scale.setScalar(1.15);
      return;
    }

    const p = advancePhase(dt, state.speed * ctx.playbackSpeed, GAIT_DISTANCE);
    const a = p * Math.PI * 2;

    // Drive phase out of the blocks, then upright, then a lean at the line.
    const drive = 1 - smoothstep(state.distance / 22);
    const lean = smoothstep((state.distance - (ctx.raceDistance - 6)) / 6);
    const bob = Math.abs(Math.sin(a)) * 0.035;

    lift.current.position.y = HIP_HEIGHT - drive * 0.22 + bob;
    pitch.current.rotation.x = 0.08 + drive * 0.6 + lean * 0.3;
    torso.current.rotation.x = Math.sin(a * 2) * 0.03;
    roll.current.rotation.z = Math.sin(a) * 0.06;

    const swing = 1.15 - drive * 0.15;
    legL.current.rotation.x = Math.sin(a) * swing - 0.15;
    legR.current.rotation.x = Math.sin(a + Math.PI) * swing - 0.15;
    // Knees only flex on recovery, which is what makes a run read as a run.
    shinL.current.rotation.x = -Math.max(0, Math.sin(a + 0.9)) * 1.9 - 0.15;
    shinR.current.rotation.x = -Math.max(0, Math.sin(a + Math.PI + 0.9)) * 1.9 - 0.15;

    armL.current.rotation.x = Math.sin(a + Math.PI) * 0.85;
    armR.current.rotation.x = Math.sin(a) * 0.85;
    foreL.current.rotation.x = -1.2 - Math.max(0, Math.sin(a + Math.PI)) * 0.5;
    foreR.current.rotation.x = -1.2 - Math.max(0, Math.sin(a)) * 0.5;
    shadow.current.scale.setScalar(1);
  }

  function updateSwimmer(state: AthleteState, ctx: FigureContext, dt: number) {
    lift.current.position.y = WATER_LINE;
    yaw.current.rotation.y = state.heading;
    roll.current.rotation.z = 0;
    resetLateral();

    if (state.turnPhase >= 0) {
      // A flip turn is a somersault plus a half twist. Composing those two takes
      // the body from prone one way to prone the other without ever spinning it
      // about the vertical axis, which is why the yaw is held through the window.
      const s = smoothstep(state.turnPhase);
      pitch.current.rotation.x = Math.PI / 2 + Math.PI * s;
      roll.current.rotation.y = Math.PI * s;
      const tuck = Math.sin(Math.PI * state.turnPhase);
      legL.current.rotation.x = 1.7 * tuck;
      legR.current.rotation.x = 1.7 * tuck;
      shinL.current.rotation.x = -2.2 * tuck;
      shinR.current.rotation.x = -2.2 * tuck;
      armL.current.rotation.x = -2.7 + 0.7 * tuck;
      armR.current.rotation.x = -2.7 + 0.7 * tuck;
      foreL.current.rotation.x = -0.3;
      foreR.current.rotation.x = -0.3;
      torso.current.rotation.x = 0.25 * tuck;
      return;
    }

    const supine = state.stroke === "back";
    pitch.current.rotation.x = Math.PI / 2;
    roll.current.rotation.y = supine ? Math.PI : 0;

    if (state.divePhase > 0.4) {
      // Streamlined off the blocks: arms locked overhead, no stroke yet.
      const glide = smoothstep(state.divePhase);
      armL.current.rotation.x = -Math.PI * 0.98 * glide;
      armR.current.rotation.x = -Math.PI * 0.98 * glide;
      foreL.current.rotation.x = 0;
      foreR.current.rotation.x = 0;
      legL.current.rotation.x = 0;
      legR.current.rotation.x = 0;
      shinL.current.rotation.x = -0.1;
      shinR.current.rotation.x = -0.1;
      torso.current.rotation.x = 0;
      return;
    }

    const perCycle = STROKE_DISTANCE[state.stroke] ?? 2.5;
    const p = advancePhase(dt, state.speed * ctx.playbackSpeed, perCycle);
    const a = p * Math.PI * 2;

    switch (state.stroke) {
      case "free":
      case "back": {
        const dir = supine ? -1 : 1;
        armR.current.rotation.x = -a * dir;
        armL.current.rotation.x = -(a + Math.PI) * dir;
        foreR.current.rotation.x = -0.5 - Math.max(0, Math.sin(a)) * 0.7;
        foreL.current.rotation.x = -0.5 - Math.max(0, Math.sin(a + Math.PI)) * 0.7;
        roll.current.rotation.y += Math.sin(a) * 0.34 * dir;
        // Flutter kick runs at twice the arm rate.
        legL.current.rotation.x = Math.sin(a * 2) * 0.22;
        legR.current.rotation.x = Math.sin(a * 2 + Math.PI) * 0.22;
        shinL.current.rotation.x = -0.25 - Math.max(0, Math.sin(a * 2)) * 0.35;
        shinR.current.rotation.x = -0.25 - Math.max(0, Math.sin(a * 2 + Math.PI)) * 0.35;
        torso.current.rotation.x = 0;
        break;
      }
      case "fly": {
        armL.current.rotation.x = -a;
        armR.current.rotation.x = -a;
        foreL.current.rotation.x = -0.4 - Math.max(0, Math.sin(a)) * 0.6;
        foreR.current.rotation.x = foreL.current.rotation.x;
        const kick = Math.sin(a * 2);
        legL.current.rotation.x = kick * 0.45;
        legR.current.rotation.x = kick * 0.45;
        shinL.current.rotation.x = -0.3 - Math.max(0, kick) * 0.6;
        shinR.current.rotation.x = shinL.current.rotation.x;
        torso.current.rotation.x = Math.sin(a) * 0.22;
        pitch.current.rotation.x = Math.PI / 2 + Math.sin(a) * 0.18;
        break;
      }
      case "breast": {
        // Arms sweep out and recover; the legs snap through a frog kick half a beat
        // later, which is what gives breaststroke its stop-start rhythm.
        const pull = (1 - Math.cos(a)) / 2;
        armL.current.rotation.x = -2.9 + pull * 1.9;
        armR.current.rotation.x = armL.current.rotation.x;
        armL.current.rotation.z = 0.5 + pull * 0.7;
        armR.current.rotation.z = -(0.5 + pull * 0.7);
        foreL.current.rotation.x = -0.4 - pull * 1.1;
        foreR.current.rotation.x = foreL.current.rotation.x;
        const kick = (1 - Math.cos(a + Math.PI * 0.7)) / 2;
        legL.current.rotation.x = kick * 0.2;
        legR.current.rotation.x = kick * 0.2;
        legL.current.rotation.z = kick * 0.5;
        legR.current.rotation.z = -kick * 0.5;
        shinL.current.rotation.x = -kick * 2.1;
        shinR.current.rotation.x = -kick * 2.1;
        torso.current.rotation.x = Math.sin(a) * 0.14;
        pitch.current.rotation.x = Math.PI / 2 + Math.sin(a) * 0.14;
        break;
      }
    }
  }

  useImperativeHandle(ref, () => ({
    update(state, ctx) {
      const dt = clamp(ctx.videoTime - lastVideoTime.current, 0, 0.25);
      lastVideoTime.current = ctx.videoTime;
      root.current.position.set(state.position[0], 0, state.position[2]);
      if (sport === "track") updateRunner(state, ctx, dt);
      else updateSwimmer(state, ctx, dt);
    },
  }));

  const limb = (length: number, thickness: number, material: THREE.Material) => (
    <mesh position={[0, -length / 2, 0]} material={material}>
      <boxGeometry args={[thickness, length, thickness]} />
    </mesh>
  );

  const swimmer = sport === "pool";

  return (
    <group ref={root}>
      {!swimmer && (
        <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} material={materials.shadow}>
          <circleGeometry args={[0.3, 16]} />
        </mesh>
      )}
      <group ref={lift}>
        <group ref={yaw}>
          <group ref={pitch}>
            <group ref={roll}>
              {/* Hips at the origin of this group; the body's long axis is +y. */}
              <group ref={torso}>
                <mesh position={[0, 0.3, 0]} material={materials.skin}>
                  <boxGeometry args={[0.36, 0.6, 0.24]} />
                </mesh>
                <mesh position={[0, 0.73, 0]} material={swimmer ? materials.cap : materials.skin}>
                  <sphereGeometry args={[0.135, 12, 10]} />
                </mesh>
                <group ref={armL} position={[0.23, 0.55, 0]}>
                  {limb(0.3, 0.1, materials.dark)}
                  <group ref={foreL} position={[0, -0.3, 0]}>
                    {limb(0.3, 0.09, materials.dark)}
                  </group>
                </group>
                <group ref={armR} position={[-0.23, 0.55, 0]}>
                  {limb(0.3, 0.1, materials.dark)}
                  <group ref={foreR} position={[0, -0.3, 0]}>
                    {limb(0.3, 0.09, materials.dark)}
                  </group>
                </group>
              </group>
              <group ref={legL} position={[0.11, 0, 0]}>
                {limb(0.44, 0.13, materials.skin)}
                <group ref={shinL} position={[0, -0.44, 0]}>
                  {limb(0.44, 0.11, materials.dark)}
                </group>
              </group>
              <group ref={legR} position={[-0.11, 0, 0]}>
                {limb(0.44, 0.13, materials.skin)}
                <group ref={shinR} position={[0, -0.44, 0]}>
                  {limb(0.44, 0.11, materials.dark)}
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
});
