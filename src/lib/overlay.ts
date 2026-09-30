import type { CompiledRace } from "./raceState";
import { formatClock, formatGap, formatResult } from "./format";
import type { RaceState } from "./types";

/**
 * The titles, clock and results card, drawn in 2D over the render. Keeping this
 * out of the 3D scene means the exported frame and the screen use exactly the
 * same code, and the type is real text rather than a texture.
 */

const INK = "#000000";
const MUTED = "#8b90a3";
const RULE = "rgba(17,19,28,0.12)";
const MEDALS = ["#c8a227", "#9aa0ad", "#a9713c"];

export interface OverlayOptions {
  credit: string;
  showResults: boolean;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smoothstep = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  size: number,
  compiled: CompiledRace,
  state: RaceState,
  videoTime: number,
  options: OverlayOptions,
) {
  const { race } = compiled;
  // One scale factor keeps the layout identical at preview size and at 1080.
  const s = size / 1080;
  ctx.textBaseline = "alphabetic";

  const left = 52 * s;

  ctx.fillStyle = MUTED;
  ctx.font = `700 ${26 * s}px IBM Plex Sans, system-ui, sans-serif`;
  ctx.letterSpacing = `${1.6 * s}px`;
  ctx.fillText(race.round, left, 76 * s);

  ctx.fillStyle = INK;
  ctx.font = `700 ${52 * s}px IBM Plex Sans, system-ui, sans-serif`;
  ctx.letterSpacing = `${-0.6 * s}px`;
  ctx.fillText(race.event, left, 133 * s);

  ctx.textAlign = "right";
  ctx.fillStyle = MUTED;
  ctx.font = `700 ${40 * s}px IBM Plex Sans, system-ui, sans-serif`;
  ctx.letterSpacing = `${-0.4 * s}px`;
  ctx.fillText(race.meet, size - left, 78 * s);
  ctx.textAlign = "left";
  ctx.letterSpacing = "0px";

  drawClock(ctx, s, left, state, compiled);

  if (state.section) {
    ctx.save();
    ctx.globalAlpha = state.section.alpha;
    ctx.fillStyle = INK;
    ctx.font = `700 ${25 * s}px IBM Plex Sans, system-ui, sans-serif`;
    ctx.letterSpacing = `${2.4 * s}px`;
    const label = state.section.label;
    const width = ctx.measureText(label).width;
    ctx.fillRect(left, 236 * s, width + 34 * s, 46 * s);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, left + 17 * s, 267 * s);
    ctx.restore();
    ctx.letterSpacing = "0px";
  }

  ctx.fillStyle = MUTED;
  ctx.font = `500 ${21 * s}px IBM Plex Sans, system-ui, sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText(options.credit, size - left, size - 46 * s);
  ctx.textAlign = "left";

  if (options.showResults) drawResults(ctx, size, s, compiled, state, videoTime);
}

function drawClock(
  ctx: CanvasRenderingContext2D,
  s: number,
  left: number,
  state: RaceState,
  compiled: CompiledRace,
) {
  const longForm = compiled.race.distance >= 800;
  const shown = Math.max(0, state.raceClock);
  const text = formatClock(shown, longForm);

  ctx.font = `700 ${34 * s}px IBM Plex Sans, system-ui, sans-serif`;
  const width = ctx.measureText(text).width;
  const boxW = width + 36 * s;
  const boxH = 50 * s;
  const y = 166 * s;

  ctx.strokeStyle = INK;
  ctx.lineWidth = 2 * s;
  ctx.strokeRect(left, y, boxW, boxH);
  ctx.fillStyle = INK;
  ctx.fillText(text, left + 18 * s, y + 37 * s);
}

function drawResults(
  ctx: CanvasRenderingContext2D,
  size: number,
  s: number,
  compiled: CompiledRace,
  state: RaceState,
  videoTime: number,
) {
  const finishVideoTime = compiled.race.leadIn + compiled.lastFinish / compiled.race.playbackSpeed;
  const appear = smoothstep((videoTime - finishVideoTime + 0.4) / 0.5);
  if (appear <= 0.001) return;

  const ranked = [...state.athletes].sort((a, b) => a.place - b.place);
  const rows = ranked.length;
  const rowH = 46 * s;
  const padding = 26 * s;
  const cardH = rowH * rows + padding * 2 + 34 * s;
  const left = 52 * s;
  const cardW = size - left * 2;
  const top = size - 96 * s - cardH + (1 - appear) * 22 * s;

  ctx.save();
  ctx.globalAlpha = appear;
  ctx.fillStyle = "rgba(255,255,255,0.93)";
  ctx.fillRect(left, top, cardW, cardH);
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1.5 * s;
  ctx.strokeRect(left, top, cardW, cardH);

  ctx.fillStyle = MUTED;
  ctx.font = `700 ${19 * s}px IBM Plex Sans, system-ui, sans-serif`;
  ctx.letterSpacing = `${1.4 * s}px`;
  ctx.fillText("RESULT", left + padding, top + padding + 16 * s);
  ctx.letterSpacing = "0px";

  ranked.forEach((athlete, i) => {
    const y = top + padding + 34 * s + rowH * (i + 1) - 14 * s;

    if (i > 0) {
      ctx.strokeStyle = RULE;
      ctx.beginPath();
      ctx.moveTo(left + padding, y - rowH + 14 * s);
      ctx.lineTo(left + cardW - padding, y - rowH + 14 * s);
      ctx.stroke();
    }

    ctx.fillStyle = i < 3 ? MEDALS[i] : INK;
    ctx.font = `600 ${18 * s}px IBM Plex Sans, system-ui, sans-serif`;
    ctx.fillText(String(i + 1), left + padding, y);

    ctx.fillStyle = INK;
    ctx.font = `500 ${20 * s}px IBM Plex Sans, system-ui, sans-serif`;
    ctx.fillText(athlete.athlete.name, left + padding + 40 * s, y);

    ctx.fillStyle = MUTED;
    ctx.font = `500 ${18 * s}px IBM Plex Sans, system-ui, sans-serif`;
    ctx.fillText(athlete.athlete.country, left + padding + 300 * s, y);

    ctx.textAlign = "right";
    ctx.fillStyle = INK;
    ctx.font = `700 ${18 * s}px IBM Plex Sans, system-ui, sans-serif`;
    ctx.fillText(
      formatResult(athlete.finishTime, compiled.race.distance >= 800),
      left + cardW - padding,
      y,
    );

    if (i > 0) {
      ctx.fillStyle = MUTED;
      ctx.font = `500 ${18 * s}px IBM Plex Sans, system-ui, sans-serif`;
      ctx.fillText(formatGap(athlete.gap), left + cardW - padding - 128 * s, y);
    }
    ctx.textAlign = "left";
  });

  ctx.restore();
}
