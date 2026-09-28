export { cn } from "cn";

/** Sliders hand back either a scalar or a list depending on thumb count. */
export function firstValue(value: number | readonly number[]): number {
  return Array.isArray(value) ? value[0] : (value as number);
}

