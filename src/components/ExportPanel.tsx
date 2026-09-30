import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/Icon";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { canExportMp4, download, exportClip } from "@/lib/exportVideo";
import type { Playhead } from "@/lib/playhead";
import type { CompiledRace } from "@/lib/raceState";
import type { StageHandles } from "@/components/RaceStage";

const SIZES = [
  { value: "1080", label: "1080 × 1080 — square, for a feed" },
  { value: "720", label: "720 × 720 — smaller file" },
];
const FRAME_RATES = [
  { value: "30", label: "30 fps" },
  { value: "60", label: "60 fps" },
];

interface Props {
  compiled: CompiledRace;
  handles: React.RefObject<StageHandles>;
  playhead: Playhead;
  onBusyChange: (busy: boolean) => void;
}

export function ExportPanel({ compiled, handles, playhead, onBusyChange }: Props) {
  const [size, setSize] = useState("1080");
  const [fps, setFps] = useState("30");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<string | null>(null);

  const busy = progress !== null;
  const pixels = Number(size);
  const frameRate = Number(fps);
  const frames = Math.round(compiled.videoDuration * frameRate);

  const run = async () => {
    setError(null);
    setProgress(0);
    onBusyChange(true);
    playhead.playing = false;
    try {
      const result = await exportClip({
        handles: handles.current,
        playhead,
        duration: compiled.videoDuration,
        fps: frameRate,
        size: pixels,
        bitrate: pixels >= 1080 ? 12_000_000 : 6_000_000,
        onProgress: setProgress,
      });
      const filename = `${compiled.race.id}-${pixels}.${result.format}`;
      download(result.blob, filename);
      setLastFile(`${filename} · ${(result.blob.size / 1_000_000).toFixed(1)} MB`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The export failed.");
    } finally {
      setProgress(null);
      onBusyChange(false);
    }
  };

  const grabStill = () => {
    const gl = handles.current.gl;
    const render = handles.current.renderFrame;
    if (!gl || !render) return;
    const canvas = document.createElement("canvas");
    canvas.width = pixels;
    canvas.height = pixels;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const previousRatio = gl.getPixelRatio();
    const width = gl.domElement.width;
    const height = gl.domElement.height;
    playhead.exporting = true;
    gl.setPixelRatio(1);
    gl.setSize(pixels, pixels, false);
    render(playhead.videoTime, pixels, ctx);
    gl.setPixelRatio(previousRatio);
    gl.setSize(width / previousRatio, height / previousRatio, false);
    playhead.exporting = false;

    canvas.toBlob((blob) => {
      if (blob) download(blob, `${compiled.race.id}-${playhead.videoTime.toFixed(2)}s.png`);
    }, "image/png");
  };

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="mb-1.5 text-xs">Frame size</Label>
          <Select value={size} onValueChange={(value) => value && setSize(value)} disabled={busy}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIZES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label className="mb-1.5 text-xs">Frame rate</Label>
          <Select value={fps} onValueChange={(value) => value && setFps(value)} disabled={busy}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FRAME_RATES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {frames} frames over {compiled.videoDuration.toFixed(2)} seconds. Each frame is
        rendered with the clock set explicitly, so the file does not depend on how fast
        this machine draws and two exports of the same race match exactly.
        {!canExportMp4() &&
          " This browser has no WebCodecs support, so the clip is recorded to WebM in real time instead."}
      </p>

      <div className="flex flex-col gap-2">
        <Button onClick={run} disabled={busy} className="gap-2">
          {busy ? <Icon name="renew" className="animate-spin" /> : <Icon name="download" />}
          {busy ? `Writing frames… ${Math.round((progress ?? 0) * 100)}%` : "Export the clip"}
        </Button>
        <Button variant="outline" onClick={grabStill} disabled={busy} className="gap-2">
          <Icon name="image" />
          Save this frame as PNG
        </Button>
      </div>

      {busy && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-[width] duration-150"
            style={{ width: `${Math.round((progress ?? 0) * 100)}%` }}
          />
        </div>
      )}
      {lastFile && !busy && <p className="text-xs text-muted-foreground">Saved {lastFile}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
