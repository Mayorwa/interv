/**
 * The clip's clock. Deliberately a mutable object rather than React state: it is
 * read and written every frame, and the exporter drives it directly.
 */
export interface Playhead {
  /** Seconds into the clip. */
  videoTime: number;
  playing: boolean;
  /** Preview rate. 1 plays the clip at its authored length. */
  rate: number;
  /** True while frames are being written, when the render loop must not advance. */
  exporting: boolean;
  /** Bumped whenever the clock is set from outside, so smoothing can snap. */
  seekToken: number;
}

export function createPlayhead(): Playhead {
  return { videoTime: 0, playing: false, rate: 1, exporting: false, seekToken: 0 };
}

export function seek(playhead: Playhead, videoTime: number) {
  playhead.videoTime = videoTime;
  playhead.seekToken += 1;
}
