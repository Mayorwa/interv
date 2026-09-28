import { Plus, RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { buildCurve } from "@/lib/curve";
import { formatClock } from "@/lib/format";
import type { Athlete, Nudge, Race } from "@/lib/types";
import { firstValue } from "@/lib/utils";

const RANGE = 1.2;

interface Props {
  race: Race;
  athlete: Athlete | null;
  onChange: (next: Race) => void;
}

/**
 * The review pass. The curve through an athlete's published marks is a reasonable
 * guess at the race, not a recording of it, so an editor who watched the race needs
 * to be able to pull someone earlier or later at a given point without hand
 * animating anything. Nudges are stored with the race and survive export.
 */
export function NudgePanel({ race, athlete, onChange }: Props) {
  const [newMark, setNewMark] = useState("");

  const marks = useMemo(() => {
    if (!athlete) return [];
    const published = new Set(athlete.splits.map((s) => s.meters));
    const extra = (athlete.nudges ?? [])
      .map((n) => n.meters)
      .filter((m) => !published.has(m));
    return [...published, ...new Set(extra)].sort((a, b) => a - b).map((meters) => ({
      meters,
      published: published.has(meters),
      delta: athlete.nudges?.find((n) => n.meters === meters)?.deltaSeconds ?? 0,
    }));
  }, [athlete]);

  const curve = useMemo(
    () => (athlete ? buildCurve(athlete, race) : null),
    [athlete, race],
  );

  if (!athlete) {
    return (
      <p className="px-1 py-6 text-sm text-muted-foreground">
        Pick an athlete in the Field tab to adjust where they were during the race.
      </p>
    );
  }

  const longForm = race.distance >= 800;

  const setNudges = (nudges: Nudge[]) => {
    onChange({
      ...race,
      athletes: race.athletes.map((a) =>
        a.lane === athlete.lane && a.name === athlete.name
          ? { ...a, nudges: nudges.length ? nudges : undefined }
          : a,
      ),
    });
  };

  const update = (meters: number, deltaSeconds: number) => {
    const rest = (athlete.nudges ?? []).filter((n) => n.meters !== meters);
    setNudges(Math.abs(deltaSeconds) < 0.005 ? rest : [...rest, { meters, deltaSeconds }]);
  };

  const removeMark = (meters: number) => {
    setNudges((athlete.nudges ?? []).filter((n) => n.meters !== meters));
  };

  const addMark = () => {
    const meters = Number(newMark);
    if (!Number.isFinite(meters) || meters <= 0 || meters >= race.distance) return;
    if (marks.some((m) => m.meters === meters)) return;
    setNudges([...(athlete.nudges ?? []), { meters, deltaSeconds: 0 }]);
    setNewMark("");
  };

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{athlete.name}</p>
          <p className="text-xs text-muted-foreground">
            Lane {athlete.lane}
            {athlete.reaction !== undefined && ` · reaction ${athlete.reaction.toFixed(3)}s`}
          </p>
        </div>
        {athlete.nudges?.length ? (
          <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => setNudges([])}>
            <RotateCcw className="size-3" />
            Reset
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        {marks.map((mark) => (
          <div key={mark.meters} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-medium">
                {mark.meters} m
                {mark.published ? (
                  <span className="ml-1.5 text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
                    published
                  </span>
                ) : (
                  <span className="ml-1.5 text-[10px] font-normal uppercase tracking-wide text-amber-600">
                    editorial
                  </span>
                )}
              </Label>
              <div className="flex items-center gap-1">
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {curve ? formatClock(curve.timeAtDistance(mark.meters), longForm) : "—"}
                  {mark.delta !== 0 && (
                    <span className="ml-1 text-amber-600">
                      {mark.delta > 0 ? "+" : ""}
                      {mark.delta.toFixed(2)}
                    </span>
                  )}
                </span>
                {!mark.published && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-5"
                    onClick={() => removeMark(mark.meters)}
                    aria-label={`Remove the mark at ${mark.meters} metres`}
                  >
                    <X className="size-3" />
                  </Button>
                )}
              </div>
            </div>
            <Slider
              value={[mark.delta]}
              min={-RANGE}
              max={RANGE}
              step={0.01}
              onValueChange={(value) => update(mark.meters, firstValue(value))}
              aria-label={`Timing at ${mark.meters} metres`}
            />
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2 border-t border-border pt-3">
        <div className="flex-1">
          <Label htmlFor="new-mark" className="mb-1.5 text-xs">
            Add a mark
          </Label>
          <input
            id="new-mark"
            value={newMark}
            onChange={(event) => setNewMark(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && addMark()}
            placeholder={`e.g. ${Math.round(race.distance / 2)}`}
            inputMode="numeric"
            className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>
        <Button size="sm" variant="outline" className="h-8 gap-1" onClick={addMark}>
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>
    </div>
  );
}
