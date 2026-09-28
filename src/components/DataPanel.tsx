import { Check, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Race } from "@/lib/types";

interface Props {
  race: Race;
  original: Race;
  onChange: (next: Race) => void;
}

/**
 * The race as text. Everything on screen comes from this document, so pasting a new
 * set of results is all it takes to animate a different race.
 */
export function DataPanel({ race, original, onChange }: Props) {
  const [draft, setDraft] = useState(() => JSON.stringify(race, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  // Nudges made in the other tab should show up here rather than go stale.
  useEffect(() => {
    setDraft(JSON.stringify(race, null, 2));
    setError(null);
  }, [race]);

  const apply = () => {
    try {
      const parsed = JSON.parse(draft) as Race;
      const problem = validate(parsed);
      if (problem) {
        setError(problem);
        return;
      }
      setError(null);
      setApplied(true);
      setTimeout(() => setApplied(false), 1400);
      onChange(parsed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That is not valid JSON.");
    }
  };

  return (
    <div className="flex flex-col gap-3 py-2">
      {race.source && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Source. </span>
          {race.source}
        </p>
      )}
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        spellCheck={false}
        className="h-[420px] resize-none font-mono text-[11px] leading-relaxed"
        aria-label="Race data"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={apply} className="gap-1.5">
          {applied ? <Check className="size-3.5" /> : null}
          {applied ? "Applied" : "Apply"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => onChange(original)}
        >
          <RotateCcw className="size-3.5" />
          Revert
        </Button>
      </div>
    </div>
  );
}

function validate(race: Race): string | null {
  if (race.sport !== "track" && race.sport !== "pool") {
    return 'sport must be "track" or "pool".';
  }
  if (!(race.distance > 0)) return "distance must be a positive number of metres.";
  if (!(race.playbackSpeed > 0)) return "playbackSpeed must be greater than zero.";
  if (!Array.isArray(race.athletes) || race.athletes.length === 0) {
    return "athletes must be a non-empty list.";
  }
  for (const athlete of race.athletes) {
    if (!athlete.name) return "Every athlete needs a name.";
    if (!(athlete.lane >= 1)) return `${athlete.name} needs a lane of 1 or more.`;
    if (!Array.isArray(athlete.splits) || athlete.splits.length === 0) {
      return `${athlete.name} needs at least one split, including the finish.`;
    }
    for (const split of athlete.splits) {
      if (!(split.meters > 0) || !(split.seconds > 0)) {
        return `${athlete.name} has a split with a non-positive value.`;
      }
    }
    const finish = Math.max(...athlete.splits.map((s) => s.meters));
    if (finish < race.distance && athlete.dnfAtMeters === undefined) {
      return `${athlete.name} has no split at ${race.distance} m. Add one, or set dnfAtMeters.`;
    }
  }
  return null;
}
