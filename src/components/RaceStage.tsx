import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Athletes, type AthletesHandle } from "@/components/scene/Athletes";
import { PoolScene } from "@/components/scene/PoolScene";
import { TrackScene } from "@/components/scene/TrackScene";
import { damp, shotFor } from "@/lib/camera";
import { drawOverlay, type OverlayOptions } from "@/lib/overlay";
import type { Playhead } from "@/lib/playhead";
import { type CompiledRace, sampleRace, videoTimeToRaceClock } from "@/lib/raceState";
import type { RaceState } from "@/lib/types";

const BACKGROUND = "#ffffff";

export interface StageHandles {
  /** Set by the canvas once mounted; the exporter needs both surfaces. */
  gl: THREE.WebGLRenderer | null;
  advance: ((time: number) => void) | null;
  renderFrame: ((videoTime: number, size: number, target?: CanvasRenderingContext2D) => void) | null;
}

interface Props {
  compiled: CompiledRace;
  playhead: Playhead;
  overlay: OverlayOptions;
  handles: React.RefObject<StageHandles>;
  onState?: (state: RaceState) => void;
}

export function RaceStage({ compiled, playhead, overlay, handles, onState }: Props) {
  const overlayCanvas = useRef<HTMLCanvasElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);

  return (
    <div ref={wrapper} className="relative aspect-square w-full overflow-hidden bg-white">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        camera={{ position: [0, 40, 60], fov: 32, near: 0.5, far: 900 }}
        onCreated={({ gl }) => {
          gl.setClearColor(BACKGROUND);
        }}
      >
        <SceneContents
          compiled={compiled}
          playhead={playhead}
          overlay={overlay}
          overlayCanvas={overlayCanvas}
          handles={handles}
          onState={onState}
        />
      </Canvas>
      <canvas
        ref={overlayCanvas}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
      />
    </div>
  );
}

function SceneContents({
  compiled,
  playhead,
  overlay,
  overlayCanvas,
  handles,
  onState,
}: Props & { overlayCanvas: React.RefObject<HTMLCanvasElement | null> }) {
  const { race } = compiled;
  const athletes = useRef<AthletesHandle>(null);
  const { gl, camera, scene, advance, size } = useThree();

  const laneCount = useMemo(
    () => Math.max(...race.athletes.map((a) => a.lane)),
    [race],
  );

  const target = useRef(new THREE.Vector3());
  const lastSeek = useRef(-1);
  const lastReport = useRef(0);
  const lastVideoTime = useRef(0);

  // The overlay is drawn at the canvas's own pixel size so the two layers line up.
  useEffect(() => {
    const canvas = overlayCanvas.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(size.width * dpr);
    canvas.height = Math.round(size.height * dpr);
  }, [size.width, size.height, overlayCanvas]);

  // Camera smoothing steps in video time, not wall time, so a half-speed preview
  // and an export produce exactly the same camera move.
  const applyFrame = (videoTime: number) => {
    const dt = Math.max(0, Math.min(0.25, videoTime - lastVideoTime.current));
    lastVideoTime.current = videoTime;
    const raceClock = videoTimeToRaceClock(compiled, videoTime);
    const state = sampleRace(compiled, raceClock);

    athletes.current?.update(state, {
      videoTime,
      playbackSpeed: race.playbackSpeed,
      raceDistance: race.distance,
    });

    const shot = shotFor(race, state, laneCount);
    const snap = playhead.seekToken !== lastSeek.current;
    lastSeek.current = playhead.seekToken;
    if (snap) {
      camera.position.copy(shot.position);
      target.current.copy(shot.target);
    } else {
      damp(camera.position, shot.position, 6, dt);
      damp(target.current, shot.target, 6, dt);
    }
    camera.lookAt(target.current);
    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== shot.fov) {
      camera.fov += (shot.fov - camera.fov) * Math.min(1, dt * 5);
      camera.updateProjectionMatrix();
    }

    return state;
  };

  const paintOverlay = (state: RaceState, videoTime: number) => {
    const canvas = overlayCanvas.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawOverlay(ctx, canvas.width, compiled, state, videoTime, overlay);
  };

  useFrame((_, delta) => {
    if (playhead.exporting) return;

    if (playhead.playing) {
      playhead.videoTime += delta * playhead.rate;
      if (playhead.videoTime >= compiled.videoDuration) {
        playhead.videoTime = compiled.videoDuration;
        playhead.playing = false;
      }
    }

    const state = applyFrame(playhead.videoTime);
    paintOverlay(state, playhead.videoTime);

    // The HTML panels do not need sixty updates a second.
    if (onState && performance.now() - lastReport.current > 70) {
      lastReport.current = performance.now();
      onState(state);
    }
  });

  // Exposed so the exporter can step the clock itself and read both layers.
  useEffect(() => {
    handles.current.gl = gl;
    handles.current.advance = advance;
    // One frame, start to finish: place everyone, render, then composite the
    // titles on top. Synchronous, so nothing can interleave before it is captured.
    handles.current.renderFrame = (videoTime, frameSize, exportCtx) => {
      const state = applyFrame(videoTime);
      gl.render(scene, camera);
      if (!exportCtx) return;
      exportCtx.drawImage(gl.domElement, 0, 0, frameSize, frameSize);
      drawOverlay(exportCtx, frameSize, compiled, state, videoTime, overlay);
    };
    return () => {
      handles.current.gl = null;
      handles.current.advance = null;
      handles.current.renderFrame = null;
    };
  });

  const light = useMemo(() => new THREE.DirectionalLight("#ffffff", 1.15), []);

  return (
    <>
      <ambientLight intensity={1.5} />
      <primitive object={light} position={[-60, 90, 70]} />
      <hemisphereLight args={["#ffffff", "#c9ccdd", 0.6]} />
      {race.sport === "track" ? (
        <TrackScene laneCount={laneCount} raceDistance={race.distance} />
      ) : (
        <PoolScene length={race.poolLength ?? 50} />
      )}
      <Athletes ref={athletes} race={race} />
    </>
  );
}
