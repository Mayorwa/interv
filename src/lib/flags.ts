/**
 * Flags drawn from a compact spec rather than shipped as images. At the size they
 * appear beside an athlete these read as the right flag, and nothing has to load.
 */

type Band = { colors: string[]; axis: "vertical" | "horizontal"; weights?: number[] };

interface FlagSpec {
  band: Band;
  /** Drawn over the bands, in order. */
  marks?: Mark[];
}

type Mark =
  | { kind: "canton"; color: string; w: number; h: number }
  | { kind: "cross"; color: string; thickness: number; inset?: number }
  | { kind: "saltire"; color: string; thickness: number }
  | { kind: "diagonal"; color: string; thickness: number; border?: string }
  | { kind: "disc"; color: string; radius: number; cx?: number; cy?: number }
  | { kind: "crescent"; color: string; radius: number; cx?: number }
  | { kind: "star"; color: string; radius: number; cx?: number; cy?: number }
  | { kind: "triangle"; color: string; from: "left" | "bottom"; extent: number }
  | { kind: "border"; color: string; thickness: number }
  | { kind: "stripes"; color: string; count: number; axis: "horizontal" };

const h = (colors: string[], weights?: number[]): Band => ({
  colors,
  axis: "horizontal",
  weights,
});
const v = (colors: string[], weights?: number[]): Band => ({
  colors,
  axis: "vertical",
  weights,
});

export const FLAGS: Record<string, FlagSpec> = {
  USA: {
    band: h(["#b31942", "#ffffff"], [1, 1]),
    marks: [
      { kind: "stripes", color: "#b31942", count: 13, axis: "horizontal" },
      { kind: "canton", color: "#0a3161", w: 0.42, h: 0.54 },
    ],
  },
  GBR: {
    band: v(["#012169"]),
    marks: [
      { kind: "saltire", color: "#ffffff", thickness: 0.3 },
      { kind: "saltire", color: "#c8102e", thickness: 0.14 },
      { kind: "cross", color: "#ffffff", thickness: 0.34 },
      { kind: "cross", color: "#c8102e", thickness: 0.2 },
    ],
  },
  FRA: { band: v(["#002395", "#ffffff", "#ed2939"]) },
  ITA: { band: v(["#008c45", "#f4f5f0", "#cd212a"]) },
  IRL: { band: v(["#169b62", "#ffffff", "#ff883e"]) },
  NGR: { band: v(["#008751", "#ffffff", "#008751"]) },
  CIV: { band: v(["#f77f00", "#ffffff", "#009e60"]) },
  HUN: { band: h(["#cd2a3e", "#ffffff", "#436f4d"]) },
  SUI: {
    band: v(["#d52b1e"]),
    marks: [{ kind: "cross", color: "#ffffff", thickness: 0.2, inset: 0.2 }],
  },
  TUR: {
    band: v(["#e30a17"]),
    marks: [
      { kind: "crescent", color: "#ffffff", radius: 0.3, cx: 0.4 },
      { kind: "star", color: "#ffffff", radius: 0.14, cx: 0.66 },
    ],
  },
  TUN: {
    band: v(["#e70013"]),
    marks: [
      { kind: "disc", color: "#ffffff", radius: 0.33 },
      { kind: "crescent", color: "#e70013", radius: 0.22, cx: 0.52 },
      { kind: "star", color: "#e70013", radius: 0.1, cx: 0.56 },
    ],
  },
  JAM: {
    band: h(["#007749", "#007749"]),
    marks: [
      { kind: "triangle", color: "#000000", from: "left", extent: 0.5 },
      { kind: "saltire", color: "#fed100", thickness: 0.2 },
    ],
  },
  LCA: {
    band: v(["#6cf"]),
    marks: [
      { kind: "triangle", color: "#ffffff", from: "bottom", extent: 0.82 },
      { kind: "triangle", color: "#000000", from: "bottom", extent: 0.66 },
      { kind: "triangle", color: "#fcd856", from: "bottom", extent: 0.4 },
    ],
  },
  ZAM: {
    band: v(["#198a00"]),
    marks: [
      { kind: "canton", color: "#198a00", w: 1, h: 1 },
      { kind: "stripes", color: "#ef7d00", count: 1, axis: "horizontal" },
    ],
  },
  TTO: {
    band: v(["#da1a35"]),
    marks: [{ kind: "diagonal", color: "#000000", thickness: 0.3, border: "#ffffff" }],
  },
  GRN: {
    band: v(["#ce1126"]),
    marks: [
      { kind: "triangle", color: "#007a5e", from: "left", extent: 0.5 },
      { kind: "disc", color: "#fcd116", radius: 0.16 },
      { kind: "border", color: "#ce1126", thickness: 0.16 },
    ],
  },
  JPN: {
    band: v(["#ffffff"]),
    marks: [{ kind: "disc", color: "#bc002d", radius: 0.3 }],
  },
  NZL: {
    band: v(["#00247d"]),
    marks: [
      { kind: "canton", color: "#00247d", w: 0.5, h: 0.5 },
      { kind: "saltire", color: "#ffffff", thickness: 0.1 },
      { kind: "star", color: "#ffffff", radius: 0.1, cx: 0.74, cy: 0.3 },
      { kind: "star", color: "#ffffff", radius: 0.1, cx: 0.78, cy: 0.66 },
    ],
  },
  GER: { band: h(["#000000", "#dd0000", "#ffce00"]) },
  AUS: {
    band: v(["#00247d"]),
    marks: [
      { kind: "star", color: "#ffffff", radius: 0.12, cx: 0.22, cy: 0.74 },
      { kind: "star", color: "#ffffff", radius: 0.1, cx: 0.72, cy: 0.3 },
      { kind: "star", color: "#ffffff", radius: 0.1, cx: 0.78, cy: 0.68 },
    ],
  },
};

const FLAG_W = 96;
const FLAG_H = 64;

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function paintFlag(ctx: CanvasRenderingContext2D, spec: FlagSpec) {
  const { band } = spec;
  const weights = band.weights ?? band.colors.map(() => 1);
  const total = weights.reduce((a, b) => a + b, 0);
  let offset = 0;
  band.colors.forEach((color, i) => {
    const size = (weights[i] / total) * (band.axis === "vertical" ? FLAG_W : FLAG_H);
    ctx.fillStyle = color;
    if (band.axis === "vertical") ctx.fillRect(offset, 0, size + 1, FLAG_H);
    else ctx.fillRect(0, offset, FLAG_W, size + 1);
    offset += size;
  });

  for (const mark of spec.marks ?? []) {
    ctx.fillStyle = "color" in mark ? mark.color : "#000";
    switch (mark.kind) {
      case "stripes": {
        const step = FLAG_H / mark.count;
        for (let i = 0; i < mark.count; i += 2) {
          ctx.fillRect(0, i * step, FLAG_W, step);
        }
        break;
      }
      case "canton":
        ctx.fillRect(0, 0, FLAG_W * mark.w, FLAG_H * mark.h);
        break;
      case "cross": {
        const t = mark.thickness;
        ctx.fillRect(0, FLAG_H * (0.5 - t / 2), FLAG_W, FLAG_H * t);
        ctx.fillRect(FLAG_W * (0.5 - (t * FLAG_H) / FLAG_W / 2), 0, FLAG_W * ((t * FLAG_H) / FLAG_W), FLAG_H);
        break;
      }
      case "saltire": {
        ctx.save();
        ctx.lineWidth = FLAG_H * mark.thickness;
        ctx.strokeStyle = mark.color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(FLAG_W, FLAG_H);
        ctx.moveTo(FLAG_W, 0);
        ctx.lineTo(0, FLAG_H);
        ctx.stroke();
        ctx.restore();
        break;
      }
      case "diagonal": {
        ctx.save();
        if (mark.border) {
          ctx.lineWidth = FLAG_H * (mark.thickness + 0.16);
          ctx.strokeStyle = mark.border;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(FLAG_W, FLAG_H);
          ctx.stroke();
        }
        ctx.lineWidth = FLAG_H * mark.thickness;
        ctx.strokeStyle = mark.color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(FLAG_W, FLAG_H);
        ctx.stroke();
        ctx.restore();
        break;
      }
      case "disc":
        ctx.beginPath();
        ctx.arc(FLAG_W * (mark.cx ?? 0.5), FLAG_H * (mark.cy ?? 0.5), FLAG_H * mark.radius, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "crescent": {
        const cx = FLAG_W * (mark.cx ?? 0.5);
        const cy = FLAG_H * 0.5;
        const r = FLAG_H * mark.radius;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(cx + r * 0.42, cy, r * 0.82, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      }
      case "star":
        drawStar(ctx, FLAG_W * (mark.cx ?? 0.5), FLAG_H * (mark.cy ?? 0.5), FLAG_H * mark.radius);
        break;
      case "triangle":
        ctx.beginPath();
        if (mark.from === "left") {
          ctx.moveTo(0, 0);
          ctx.lineTo(FLAG_W * mark.extent, FLAG_H / 2);
          ctx.lineTo(0, FLAG_H);
        } else {
          ctx.moveTo(FLAG_W * (0.5 - mark.extent / 2), FLAG_H);
          ctx.lineTo(FLAG_W * 0.5, FLAG_H * (1 - mark.extent * 1.45));
          ctx.lineTo(FLAG_W * (0.5 + mark.extent / 2), FLAG_H);
        }
        ctx.closePath();
        ctx.fill();
        break;
      case "border":
        ctx.lineWidth = FLAG_H * mark.thickness;
        ctx.strokeStyle = mark.color;
        ctx.strokeRect(
          (FLAG_H * mark.thickness) / 2,
          (FLAG_H * mark.thickness) / 2,
          FLAG_W - FLAG_H * mark.thickness,
          FLAG_H - FLAG_H * mark.thickness,
        );
        break;
    }
  }
}

const cache = new Map<string, HTMLCanvasElement>();

/** A canvas holding the flag, ready to use as a texture. */
export function flagCanvas(country: string): HTMLCanvasElement {
  const cached = cache.get(country);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = FLAG_W;
  canvas.height = FLAG_H;
  const ctx = canvas.getContext("2d")!;

  const spec = FLAGS[country];
  if (spec) {
    paintFlag(ctx, spec);
  } else {
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(0, 0, FLAG_W, FLAG_H);
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 30px IBM Plex Sans, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(country.slice(0, 3), FLAG_W / 2, FLAG_H / 2 + 2);
  }

  ctx.strokeStyle = "rgba(15,23,42,0.28)";
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, FLAG_W - 3, FLAG_H - 3);

  cache.set(country, canvas);
  return canvas;
}
