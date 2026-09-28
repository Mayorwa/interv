import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataPanel } from "@/components/DataPanel";
import { ExportPanel } from "@/components/ExportPanel";
import { NudgePanel } from "@/components/NudgePanel";
import { RaceStage, type StageHandles } from "@/components/RaceStage";
import { Standings } from "@/components/Standings";
import { Transport } from "@/components/Transport";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_RACE_ID, RACES } from "@/data/races";
import { createPlayhead, seek } from "@/lib/playhead";
import { compileRace } from "@/lib/raceState";
import type { Race, RaceState } from "@/lib/types";

const CREDIT = "Intervals";

export default function App() {
  const [raceId, setRaceId] = useState(DEFAULT_RACE_ID);
  const original = useMemo(() => RACES.find((r) => r.id === raceId)!, [raceId]);
  const [race, setRace] = useState<Race>(original);
  const [state, setState] = useState<RaceState | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState("field");
  const [busy, setBusy] = useState(false);

  const playhead = useRef(createPlayhead()).current;
  const handles = useRef<StageHandles>({ gl: null, advance: null, renderFrame: null });

  const compiled = useMemo(() => compileRace(race), [race]);

  useEffect(() => {
    setRace(original);
    setSelected(null);
    seek(playhead, 0);
    playhead.playing = false;
  }, [original, playhead]);

  const selectedAthlete = useMemo(() => {
    if (!selected) return null;
    return (
      race.athletes.find((a) => `${a.lane}:${a.name}` === selected) ?? null
    );
  }, [race, selected]);

  const onState = useCallback((next: RaceState) => setState(next), []);

  const togglePlay = () => {
    if (playhead.videoTime >= compiled.videoDuration) seek(playhead, 0);
    playhead.playing = !playhead.playing;
  };

  const overlay = useMemo(() => ({ credit: CREDIT, showResults: true }), []);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Intervals</h1>
            <p className="text-sm text-muted-foreground">
              Animate a race from its results, check it, and write a square clip.
            </p>
          </div>
          <Select
            value={raceId}
            onValueChange={(value) => value && setRaceId(value)}
            disabled={busy}
          >
            <SelectTrigger className="w-full sm:w-[340px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RACES.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.meet} · {option.event}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <RaceStage
              compiled={compiled}
              playhead={playhead}
              overlay={overlay}
              handles={handles}
              onState={onState}
            />
          </div>

          <Transport
            compiled={compiled}
            playhead={playhead}
            disabled={busy}
            onPlayPause={togglePlay}
            onRestart={() => {
              seek(playhead, 0);
              playhead.playing = false;
            }}
            onScrub={(value) => {
              playhead.playing = false;
              seek(playhead, value);
            }}
            onRate={(value) => {
              playhead.rate = value;
            }}
          />

          {race.note && (
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {race.note}
            </p>
          )}
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="field" className="flex-1">
                Field
              </TabsTrigger>
              <TabsTrigger value="timing" className="flex-1">
                Timing
              </TabsTrigger>
              <TabsTrigger value="data" className="flex-1">
                Data
              </TabsTrigger>
              <TabsTrigger value="export" className="flex-1">
                Export
              </TabsTrigger>
            </TabsList>

            <TabsContent value="field">
              <Standings
                compiled={compiled}
                state={state}
                selected={selected}
                onSelect={(key) => {
                  setSelected(key);
                  if (key) setTab("timing");
                }}
              />
            </TabsContent>

            <TabsContent value="timing">
              <NudgePanel race={race} athlete={selectedAthlete} onChange={setRace} />
            </TabsContent>

            <TabsContent value="data">
              <DataPanel race={race} original={original} onChange={setRace} />
            </TabsContent>

            <TabsContent value="export">
              <ExportPanel
                compiled={compiled}
                handles={handles}
                playhead={playhead}
                onBusyChange={setBusy}
              />
            </TabsContent>
          </Tabs>
        </aside>
      </main>
    </div>
  );
}
