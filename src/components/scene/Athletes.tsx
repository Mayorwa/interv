import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import { namePlate } from "@/lib/labelTexture";
import { POOL_LANE_WIDTH } from "@/lib/pool";
import type { AthleteState, Race, RaceState } from "@/lib/types";
import { Figure, type FigureContext, type FigureHandle } from "./Figure";

const PLATE_HEIGHT = 1.15;

export interface AthletesHandle {
  update(state: RaceState, ctx: FigureContext): void;
}

/**
 * The eight athletes, plus the name and flag that travels with each one. Labels
 * lie flat on the surface rather than floating: they stay legible from the shallow
 * angles the camera uses and never overlap the bodies.
 */
export const Athletes = forwardRef<AthletesHandle, { race: Race }>(function Athletes({ race }, ref) {
  const figures = useRef<(FigureHandle | null)[]>([]);
  const labels = useRef<(THREE.Group | null)[]>([]);

  const plates = useMemo(
    () => race.athletes.map((a) => namePlate(a.name, a.country)),
    [race],
  );

  const pool = race.sport === "pool";

  useImperativeHandle(ref, () => ({
    update(state, ctx) {
      state.athletes.forEach((athlete, i) => {
        figures.current[i]?.update(athlete, ctx);
        const label = labels.current[i];
        if (!label) return;
        label.position.set(athlete.position[0], 0, athlete.position[2]);
        label.rotation.y = pool ? 0 : athlete.heading - Math.PI / 2;
        label.visible = labelVisible(athlete, pool);
      });
    },
  }));

  return (
    <group>
      {race.athletes.map((athlete, i) => (
        <group key={`${athlete.lane}-${athlete.name}`}>
          <Figure ref={(handle) => void (figures.current[i] = handle)} sport={race.sport} />
          <group ref={(group) => void (labels.current[i] = group)}>
            <group rotation={[-Math.PI / 2, 0, 0]}>
              <mesh
                position={
                  pool
                    ? [2.4, -POOL_LANE_WIDTH * 0.34, 0]
                    : [-1.15 - (PLATE_HEIGHT * plates[i].aspect) / 2, 0, 0]
                }
              >
                <planeGeometry args={[PLATE_HEIGHT * plates[i].aspect, PLATE_HEIGHT]} />
                <meshBasicMaterial map={plates[i].texture} transparent depthWrite={false} />
              </mesh>
            </group>
          </group>
        </group>
      ))}
    </group>
  );
});

function labelVisible(athlete: AthleteState, pool: boolean): boolean {
  if (pool) return athlete.turnPhase < 0;
  return true;
}
