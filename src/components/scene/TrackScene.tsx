import { useMemo } from "react";
import * as THREE from "three";
import { textPlate } from "@/lib/labelTexture";
import { LANE_1_RADIUS, LANE_WIDTH, STRAIGHT_LENGTH, laneRadius, pointOnLane, startArc } from "@/lib/track";

const SURFACE = "#b7b3e8";
const INFIELD = "#f4f4fb";
const LINE = "#ffffff";

const SLAB_DEPTH = 0.45;
const TOP = 0;
const PAINT = 0.008;

/** The sprint run-off: a 100 m start sits this far behind the home straight. */
const RUNOFF = 100 - STRAIGHT_LENGTH / 2 - STRAIGHT_LENGTH / 2;

function ovalShape(inner: number, outer: number): THREE.Shape {
  const half = STRAIGHT_LENGTH / 2;
  const shape = new THREE.Shape();
  // Outer boundary, traced in the XY plane and laid flat by the caller.
  shape.moveTo(-half, outer);
  shape.lineTo(half, outer);
  shape.absarc(half, 0, outer, Math.PI / 2, -Math.PI / 2, true);
  shape.lineTo(-half, -outer);
  shape.absarc(-half, 0, outer, -Math.PI / 2, Math.PI / 2, true);

  const hole = new THREE.Path();
  hole.moveTo(-half, inner);
  hole.lineTo(half, inner);
  hole.absarc(half, 0, inner, Math.PI / 2, -Math.PI / 2, true);
  hole.lineTo(-half, -inner);
  hole.absarc(-half, 0, inner, -Math.PI / 2, Math.PI / 2, true);
  shape.holes.push(hole);

  return shape;
}

interface Props {
  laneCount: number;
  raceDistance: number;
}

export function TrackScene({ laneCount, raceDistance }: Props) {
  const inner = LANE_1_RADIUS - LANE_WIDTH / 2;
  const outer = laneRadius(laneCount) + LANE_WIDTH / 2;
  const half = STRAIGHT_LENGTH / 2;
  const showRunoff = raceDistance <= 110;

  const geometry = useMemo(() => {
    const slab = new THREE.ExtrudeGeometry(ovalShape(inner, outer), {
      depth: SLAB_DEPTH,
      bevelEnabled: false,
      curveSegments: 72,
    });
    slab.rotateX(-Math.PI / 2);
    // Extrusion runs upward after the rotation, so drop it to put the top at y=0.
    slab.translate(0, TOP - SLAB_DEPTH, 0);
    return slab;
  }, [inner, outer]);

  const infield = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-half, inner);
    shape.lineTo(half, inner);
    shape.absarc(half, 0, inner, Math.PI / 2, -Math.PI / 2, true);
    shape.lineTo(-half, -inner);
    shape.absarc(-half, 0, inner, -Math.PI / 2, Math.PI / 2, true);
    const geo = new THREE.ShapeGeometry(shape, 64);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [half, inner]);

  const laneEdges = useMemo(() => {
    const radii: number[] = [];
    for (let lane = 1; lane <= laneCount + 1; lane++) {
      radii.push(LANE_1_RADIUS + (lane - 1) * LANE_WIDTH - LANE_WIDTH / 2);
    }
    return radii;
  }, [laneCount]);

  const arcGeometries = useMemo(
    () =>
      laneEdges.map((r) => {
        const a = new THREE.RingGeometry(r - 0.03, r + 0.03, 96, 1, -Math.PI / 2, Math.PI);
        a.rotateX(-Math.PI / 2);
        a.translate(half, TOP + PAINT, 0);
        const b = new THREE.RingGeometry(r - 0.03, r + 0.03, 96, 1, Math.PI / 2, Math.PI);
        b.rotateX(-Math.PI / 2);
        b.translate(-half, TOP + PAINT, 0);
        return [a, b];
      }),
    [laneEdges, half],
  );

  const laneNumbers = useMemo(() => {
    const plates: { lane: number; x: number; z: number; yaw: number }[] = [];
    for (let lane = 1; lane <= laneCount; lane++) {
      const arc = startArc(lane, raceDistance);
      const point = pointOnLane(lane, arc - 2.6);
      plates.push({ lane, x: point.x, z: point.z, yaw: point.heading - Math.PI / 2 });
    }
    return plates;
  }, [laneCount, raceDistance]);

  const finish = pointOnLane(1, 0);

  return (
    <group>
      {/* One slab: the vertical sides catch less light and read as thickness. */}
      <mesh geometry={geometry}>
        <meshLambertMaterial color={SURFACE} />
      </mesh>
      <mesh geometry={infield} position={[0, TOP + 0.002, 0]}>
        <meshBasicMaterial color={INFIELD} />
      </mesh>

      {showRunoff && (
        <group>
          <mesh position={[-half - RUNOFF / 2, TOP - SLAB_DEPTH / 2, (inner + outer) / 2]}>
            <boxGeometry args={[RUNOFF, SLAB_DEPTH, outer - inner]} />
            <meshLambertMaterial color={SURFACE} />
          </mesh>
          {laneEdges.map((r) => (
            <mesh key={`runoff-${r}`} position={[-half - RUNOFF / 2, TOP + PAINT, r]}>
              <boxGeometry args={[RUNOFF, 0.004, 0.06]} />
              <meshBasicMaterial color={LINE} />
            </mesh>
          ))}
        </group>
      )}

      {laneEdges.map((r, i) => (
        <group key={`edge-${r}`}>
          <mesh position={[0, TOP + PAINT, r]}>
            <boxGeometry args={[STRAIGHT_LENGTH, 0.004, 0.06]} />
            <meshBasicMaterial color={LINE} />
          </mesh>
          <mesh position={[0, TOP + PAINT, -r]}>
            <boxGeometry args={[STRAIGHT_LENGTH, 0.004, 0.06]} />
            <meshBasicMaterial color={LINE} />
          </mesh>
          <mesh geometry={arcGeometries[i][0]}>
            <meshBasicMaterial color={LINE} />
          </mesh>
          <mesh geometry={arcGeometries[i][1]}>
            <meshBasicMaterial color={LINE} />
          </mesh>
        </group>
      ))}

      {/* Finish line, common to every distance. */}
      <mesh position={[finish.x, TOP + PAINT + 0.002, (inner + outer) / 2]}>
        <boxGeometry args={[0.16, 0.004, outer - inner]} />
        <meshBasicMaterial color={LINE} />
      </mesh>

      {laneNumbers.map(({ lane, x, z, yaw }) => {
        const plate = textPlate(String(lane), { color: "#ffffff", size: 26 });
        const height = 1.05;
        return (
          <group key={`num-${lane}`} position={[x, TOP + PAINT, z]} rotation={[0, yaw, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[height * plate.aspect, height]} />
              <meshBasicMaterial map={plate.texture} transparent depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
