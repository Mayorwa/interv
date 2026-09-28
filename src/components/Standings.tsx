import { useMemo } from "react";
import { Flag } from "@/components/Flag";
import { formatClock, formatGap, formatSpeed } from "@/lib/format";
import type { CompiledRace } from "@/lib/raceState";
import type { RaceState } from "@/lib/types";
import { cn } from "@/lib/utils";

const MEDAL = ["text-amber-600", "text-slate-500", "text-orange-700"];

interface Props {
  compiled: CompiledRace;
  state: RaceState | null;
  selected: string | null;
  onSelect: (key: string | null) => void;
}

export function Standings({ compiled, state, selected, onSelect }: Props) {
  const longForm = compiled.race.distance >= 800;

  const rows = useMemo(() => {
    if (!state) return [];
    return [...state.athletes].sort((a, b) => a.place - b.place);
  }, [state]);

  if (!state) {
    return (
      <p className="px-1 py-6 text-sm text-muted-foreground">
        Loading the field&hellip;
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {rows.map((row, index) => {
        const key = `${row.athlete.lane}:${row.athlete.name}`;
        const active = selected === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(active ? null : key)}
            className={cn(
              "flex w-full items-center gap-3 px-1 py-2 text-left transition-colors",
              active ? "bg-accent" : "hover:bg-accent/50",
            )}
          >
            <span
              className={cn(
                "w-5 shrink-0 font-mono text-sm font-semibold tabular-nums",
                index < 3 ? MEDAL[index] : "text-muted-foreground",
              )}
            >
              {index + 1}
            </span>
            <Flag country={row.athlete.country} className="h-3.5 w-5 shrink-0" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {row.athlete.name}
            </span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
              {row.finished
                ? formatClock(row.finishTime, longForm)
                : formatSpeed(row.speed)}
            </span>
            <span className="w-14 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
              {index === 0 ? "—" : formatGap(row.gap)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
