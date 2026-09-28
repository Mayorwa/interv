import * as THREE from "three";
import { flagCanvas } from "./flags";

const cache = new Map<string, { texture: THREE.Texture; aspect: number }>();

/**
 * A name plate baked to a texture: one small canvas per athlete rather than a
 * text mesh, so nothing has to load and the plate costs a single quad.
 */
export function namePlate(name: string, country: string): { texture: THREE.Texture; aspect: number } {
  const key = `${name}|${country}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const last = name.split(" ").slice(-1)[0].toUpperCase();
  const scale = 4;
  const fontSize = 34 * scale;
  const padding = 6 * scale;
  const flagW = 52 * scale;
  const flagH = (flagW * 2) / 3;
  const gap = 10 * scale;

  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = `700 ${fontSize}px Inter, system-ui, sans-serif`;
  const textW = measure.measureText(last).width;

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(textW + gap + flagW + padding * 2);
  canvas.height = Math.ceil(Math.max(fontSize, flagH) + padding * 2);
  const ctx = canvas.getContext("2d")!;

  ctx.font = `700 ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = "#1c2030";
  ctx.fillText(last, padding, canvas.height / 2 + 2 * scale);

  ctx.drawImage(
    flagCanvas(country),
    padding + textW + gap,
    (canvas.height - flagH) / 2,
    flagW,
    flagH,
  );

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearFilter;

  const result = { texture, aspect: canvas.width / canvas.height };
  cache.set(key, result);
  return result;
}

/** Text baked flat for painting onto a surface, such as a lane number. */
export function textPlate(
  text: string,
  options: { color?: string; weight?: number; size?: number } = {},
): { texture: THREE.Texture; aspect: number } {
  const key = `text|${text}|${JSON.stringify(options)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const scale = 4;
  const fontSize = (options.size ?? 32) * scale;
  const padding = 4 * scale;
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = `${options.weight ?? 700} ${fontSize}px Inter, system-ui, sans-serif`;
  const width = measure.measureText(text).width;

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width + padding * 2);
  canvas.height = Math.ceil(fontSize * 1.3);
  const ctx = canvas.getContext("2d")!;
  ctx.font = `${options.weight ?? 700} ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = options.color ?? "#ffffff";
  ctx.fillText(text, padding, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearFilter;

  const result = { texture, aspect: canvas.width / canvas.height };
  cache.set(key, result);
  return result;
}
