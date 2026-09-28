import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import { Vector2 } from "three";
import type { StageHandles } from "@/components/RaceStage";
import type { Playhead } from "./playhead";

/**
 * Writes the clip a frame at a time rather than screen-recording it.
 *
 * The clock is set explicitly for each frame, so the output does not depend on how
 * fast the machine renders and two exports of the same race are identical. The
 * alternative, MediaRecorder on a live canvas, timestamps frames by wall clock and
 * drops them under load.
 */

export type ExportFormat = "mp4" | "webm";

export interface ExportRequest {
  handles: StageHandles;
  playhead: Playhead;
  duration: number;
  fps: number;
  size: number;
  /** Bits per second. */
  bitrate: number;
  onProgress?: (fraction: number) => void;
}

export interface ExportResult {
  blob: Blob;
  format: ExportFormat;
  frames: number;
}

export function canExportMp4(): boolean {
  return typeof window !== "undefined" && "VideoEncoder" in window;
}

async function bestAvcCodec(size: number, fps: number, bitrate: number) {
  // Level rises with resolution; probe from the most compatible profile upward.
  const candidates = ["avc1.640028", "avc1.4d0032", "avc1.42002a"];
  for (const codec of candidates) {
    const support = await VideoEncoder.isConfigSupported({
      codec,
      width: size,
      height: size,
      framerate: fps,
      bitrate,
    });
    if (support.supported) return codec;
  }
  return null;
}

export async function exportClip(request: ExportRequest): Promise<ExportResult> {
  const { handles, playhead, duration, fps, size, bitrate } = request;
  if (!handles.gl || !handles.renderFrame) throw new Error("The stage is not ready yet.");

  const frames = Math.max(1, Math.round(duration * fps));
  const composite = document.createElement("canvas");
  composite.width = size;
  composite.height = size;
  const ctx = composite.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Could not create the export canvas.");

  const gl = handles.gl;
  const previousSize = gl.getSize(new Vector2());
  const previousPixelRatio = gl.getPixelRatio();

  playhead.exporting = true;
  gl.setPixelRatio(1);
  // `false` leaves the CSS size alone, so the page does not jump during export.
  gl.setSize(size, size, false);

  try {
    if (canExportMp4()) {
      const codec = await bestAvcCodec(size, fps, bitrate);
      if (codec) {
        const blob = await encodeMp4({ ...request, frames, ctx, codec });
        return { blob, format: "mp4", frames };
      }
    }
    const blob = await recordWebm({ ...request, frames, composite, ctx });
    return { blob, format: "webm", frames };
  } finally {
    gl.setPixelRatio(previousPixelRatio);
    gl.setSize(previousSize.x, previousSize.y, false);
    playhead.exporting = false;
  }
}

async function encodeMp4(args: {
  handles: StageHandles;
  frames: number;
  fps: number;
  size: number;
  bitrate: number;
  codec: string;
  ctx: CanvasRenderingContext2D;
  onProgress?: (fraction: number) => void;
}): Promise<Blob> {
  const { handles, frames, fps, size, bitrate, codec, ctx, onProgress } = args;

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: "avc", width: size, height: size, frameRate: fps },
    fastStart: "in-memory",
  });

  let failure: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (error) => {
      failure = error instanceof Error ? error : new Error(String(error));
    },
  });

  encoder.configure({
    codec,
    width: size,
    height: size,
    framerate: fps,
    bitrate,
    latencyMode: "quality",
  });

  for (let i = 0; i < frames; i++) {
    if (failure) throw failure;
    handles.renderFrame?.(i / fps, size, ctx);

    const frame = new VideoFrame(ctx.canvas, {
      timestamp: Math.round((i * 1_000_000) / fps),
      duration: Math.round(1_000_000 / fps),
    });
    // A keyframe every second keeps the file seekable without bloating it.
    encoder.encode(frame, { keyFrame: i % fps === 0 });
    frame.close();

    if (encoder.encodeQueueSize > 8) await encoder.flush();
    if (i % 5 === 0) {
      onProgress?.(i / frames);
      await nextTick();
    }
  }

  await encoder.flush();
  encoder.close();
  if (failure) throw failure;

  muxer.finalize();
  onProgress?.(1);
  return new Blob([muxer.target.buffer as ArrayBuffer], { type: "video/mp4" });
}

/**
 * Fallback for browsers without WebCodecs. MediaRecorder stamps frames by wall
 * clock, so frames have to be pushed in real time for the clip to run at the right
 * speed; export therefore takes about as long as the clip.
 */
async function recordWebm(args: {
  handles: StageHandles;
  frames: number;
  fps: number;
  size: number;
  bitrate: number;
  composite: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  onProgress?: (fraction: number) => void;
}): Promise<Blob> {
  const { handles, frames, fps, size, bitrate, composite, ctx, onProgress } = args;

  const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((type) =>
    MediaRecorder.isTypeSupported(type),
  );
  if (!mimeType) throw new Error("This browser cannot record video.");

  const stream = composite.captureStream(0);
  const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: bitrate });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const done = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start();
  const startedAt = performance.now();
  for (let i = 0; i < frames; i++) {
    const due = startedAt + (i * 1000) / fps;
    const wait = due - performance.now();
    if (wait > 0) await sleep(wait);
    handles.renderFrame?.(i / fps, size, ctx);
    track.requestFrame();
    if (i % 5 === 0) onProgress?.(i / frames);
  }
  await sleep(1000 / fps);
  recorder.stop();
  await done;
  track.stop();
  onProgress?.(1);

  return new Blob(chunks, { type: mimeType });
}

const nextTick = () => new Promise((resolve) => requestAnimationFrame(resolve));
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
