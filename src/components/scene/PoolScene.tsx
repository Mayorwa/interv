import { useMemo } from "react";
import * as THREE from "three";
import { textPlate } from "@/lib/labelTexture";
import { POOL_LANES, POOL_LANE_WIDTH, poolLaneZ } from "@/lib/pool";

const WATER = "#b6e2f4";
const BASIN = "#7cc0dd";
const DECK = "#eef0f6";
const LANE_MARK = "#6fadcd";

export const WATER_LEVEL = 0;
export const DECK_LEVEL = 0.4;

const DECK_MARGIN = 9;

/** One striped texture stands in for the floats along a lane rope. */
function ropeTexture(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 8;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f4f6fa";
  ctx.fillRect(0, 0, 64, 8);
  ctx.fillStyle = "#ff8a8a";
  ctx.fillRect(0, 0, 32, 8);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function PoolScene({ length }: { length: number }) {
  const halfWidth = ((POOL_LANES + 1) * POOL_LANE_WIDTH) / 2;

  const deck = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-DECK_MARGIN, -halfWidth - DECK_MARGIN);
    shape.lineTo(length + DECK_MARGIN, -halfWidth - DECK_MARGIN);
    shape.lineTo(length + DECK_MARGIN, halfWidth + DECK_MARGIN);
    shape.lineTo(-DECK_MARGIN, halfWidth + DECK_MARGIN);
    shape.closePath();

    const hole = new THREE.Path();
    hole.moveTo(0, -halfWidth);
    hole.lineTo(length, -halfWidth);
    hole.lineTo(length, halfWidth);
    hole.lineTo(0, halfWidth);
    hole.closePath();
    shape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(shape, { depth: DECK_LEVEL + 1.4, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, DECK_LEVEL - (DECK_LEVEL + 1.4), 0);
    return geo;
  }, [halfWidth, length]);

  const rope = useMemo(ropeTexture, []);
  const ropeMaterial = useMemo(() => {
    const map = rope.clone();
    map.needsUpdate = true;
    map.repeat.set(25, 1);
    return new THREE.MeshLambertMaterial({ map });
  }, [rope]);

  const ropeZs = useMemo(() => {
    const zs: number[] = [];
    for (let i = 0; i <= POOL_LANES; i++) {
      zs.push(poolLaneZ(1) - POOL_LANE_WIDTH / 2 + i * POOL_LANE_WIDTH);
    }
    return zs;
  }, []);

  const lanes = Array.from({ length: POOL_LANES }, (_, i) => i + 1);

  return (
    <group>
      <mesh geometry={deck}>
        <meshLambertMaterial color={DECK} />
      </mesh>

      {/* Basin, seen through the water surface. */}
      <mesh position={[length / 2, -0.7, 0]}>
        <boxGeometry args={[length, 1.4, halfWidth * 2]} />
        <meshLambertMaterial color={BASIN} />
      </mesh>

      {lanes.map((lane) => (
        <group key={`lane-${lane}`}>
          <mesh position={[length / 2, -0.04, poolLaneZ(lane)]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[length - 4, 0.28]} />
            <meshBasicMaterial color={LANE_MARK} />
          </mesh>
          {[2.2, length - 2.2].map((x) => (
            <mesh
              key={`t-${lane}-${x}`}
              position={[x, -0.04, poolLaneZ(lane)]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[0.28, 1.2]} />
              <meshBasicMaterial color={LANE_MARK} />
            </mesh>
          ))}
        </group>
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[length / 2, WATER_LEVEL, 0]}>
        <planeGeometry args={[length, halfWidth * 2]} />
        <meshBasicMaterial color={WATER} transparent opacity={0.72} />
      </mesh>

      {ropeZs.map((z) => (
        <mesh key={`rope-${z}`} position={[length / 2, WATER_LEVEL + 0.05, z]} material={ropeMaterial}>
          <boxGeometry args={[length, 0.1, 0.1]} />
        </mesh>
      ))}

      {lanes.map((lane) => (
        <mesh key={`block-${lane}`} position={[-0.45, DECK_LEVEL + 0.14, poolLaneZ(lane)]}>
          <boxGeometry args={[0.72, 0.28, 0.68]} />
          <meshLambertMaterial color="#ffffff" />
        </mesh>
      ))}

      {[25].map((mark) => {
        const plate = textPlate(`${mark}m`, { color: "#a7b0c6", size: 26 });
        const h = 1.5;
        return (
          <group key={`mark-${mark}`} position={[mark, DECK_LEVEL + 0.01, halfWidth + 3.2]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[h * plate.aspect, h]} />
              <meshBasicMaterial map={plate.texture} transparent depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
