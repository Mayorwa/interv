import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/Icon";
import { Slider } from "@/components/ui/slider";
import { formatClock } from "@/lib/format";
import type { Playhead } from "@/lib/playhead";
import type { CompiledRace } from "@/lib/raceState";
import { firstValue } from "@/lib/utils";

interface Props {
  compiled: CompiledRace;
  playhead: Playhead;
  disabled?: boolean;
  onPlayPause: () => void;
  onScrub: (videoTime: number) => void;
  onRestart: () => void;
  onRate: (rate: number) => void;
}

const RATES = [0.25, 0.5, 1];

export function Transport({
  compiled,
  playhead,
  disabled,
  onPlayPause,
  onScrub,
  onRestart,
  onRate,
}: Props) {
  // Only this row needs the clock every frame, so it watches the playhead itself
  // rather than pushing sixty state updates a second through the whole page.
  const [videoTime, setVideoTime] = useState(playhead.videoTime);
  const [playing, setPlaying] = useState(playhead.playing);
  const [rate, setRate] = useState(playhead.rate);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setVideoTime(playhead.videoTime);
      setPlaying(playhead.playing);
      setRate(playhead.rate);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playhead]);

  const raceClock = Math.max(0, (videoTime - compiled.race.leadIn) * compiled.race.playbackSpeed);
  const longForm = compiled.race.distance >= 800;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Button
          size="icon"
          onClick={onPlayPause}
          disabled={disabled}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Icon name="pause" /> : <Icon name="play" />}
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={onRestart}
          disabled={disabled}
          aria-label="Back to the start"
        >
          <Icon name="reset" />
        </Button>

        <Slider
          value={[Math.min(videoTime, compiled.videoDuration)]}
          min={0}
          max={compiled.videoDuration}
          step={1 / 60}
          disabled={disabled}
          onValueChange={(value) => onScrub(firstValue(value))}
          aria-label="Clip position"
        />

        <div className="w-32 shrink-0 text-right text-sm tabular-nums">
          <span className="font-semibold">{formatClock(raceClock, longForm)}</span>
          <span className="text-muted-foreground"> race</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="mr-1">Preview speed</span>
          {RATES.map((value) => (
            <Button
              key={value}
              size="sm"
              variant={rate === value ? "secondary" : "ghost"}
              className="h-7 px-2 text-xs tabular-nums"
              onClick={() => onRate(value)}
              disabled={disabled}
            >
              {value}&times;
            </Button>
          ))}
        </div>
        <span className="tabular-nums">
          {videoTime.toFixed(2)}s of {compiled.videoDuration.toFixed(2)}s · race runs at{" "}
          {compiled.race.playbackSpeed}&times;
        </span>
      </div>
    </div>
  );
}
