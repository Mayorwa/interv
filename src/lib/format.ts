/** The running clock. Sprints read in plain seconds, distance races in minutes. */
export function formatClock(seconds: number, longForm: boolean): string {
  if (!longForm) return seconds.toFixed(2);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  return `${minutes}:${rest.toFixed(2).padStart(5, "0")}`;
}

/** A finishing time, to the hundredth. */
export function formatResult(seconds: number, longForm: boolean): string {
  return formatClock(seconds, longForm);
}

/** Seconds behind the leader. */
export function formatGap(seconds: number): string {
  if (seconds < 0.005) return "";
  return `+${seconds.toFixed(2)}`;
}

export function formatMeters(meters: number): string {
  return `${meters.toFixed(1)} m`;
}

export function formatSpeed(metresPerSecond: number): string {
  return `${metresPerSecond.toFixed(2)} m/s`;
}
