// ── Shared chart utilities ───────────────────────────────────────────────────

/**
 * Convert a raw 1–8 scale value to bipolar ±4 display.
 * Mapping: 1→-4, 2→-3, 3→-2, 4→-1, 5→+1, 6→+2, 7→+3, 8→+4
 */
export function toBipolar(v: number): number {
  return v <= 4 ? v - 5 : v - 4
}

/** Format a raw 1–8 value as a bipolar string e.g. "+3" or "-2" */
export function formatBipolar(v: number): string {
  const b = toBipolar(v)
  return b > 0 ? `+${b}` : `${b}`
}

/**
 * Convert a fractional raw average (e.g. 4.4) to a continuous bipolar average.
 * Uses a linear shift centred at 4.5 with a +0.5 offset to skip zero.
 * Result range: -4 (at raw 1) to +4 (at raw 8).
 */
export function bipolarAvg(rawAvg: number): string {
  // Linear: map 1→-4, 8→+4 skipping 0: shift = rawAvg - 4.5, then ×(8/7) ≈ scale
  // Simpler continuous: rawAvg - 4.5 gives -3.5..+3.5; scale to -4..+4
  const b = ((rawAvg - 4.5) / 3.5) * 4
  return (b >= 0 ? '+' : '') + b.toFixed(1)
}

/** Format ISO date string as "DD MMM" (e.g. "12 Apr") */
export function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/** Format ISO date string as short month (e.g. "Apr") */
export function fmtMonth(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { month: 'short' })
}

/** Map a value to Y coordinate within a plot area */
export function yForVal(
  value: number,
  min: number,
  max: number,
  padTop: number,
  plotH: number,
): number {
  return padTop + plotH - ((value - min) / (max - min)) * plotH
}

/** Map an index to X coordinate within a plot area */
export function xForIdx(
  index: number,
  count: number,
  padLeft: number,
  plotW: number,
): number {
  if (count <= 1) return padLeft + plotW / 2
  return padLeft + (index / (count - 1)) * plotW
}

/** Compute mean of non-null values */
export function mean(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v !== null)
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

/** Format a number with commas (e.g. 84230 → "84,230") */
export function fmtNumber(n: number): string {
  return n.toLocaleString('en-GB')
}

// ── Scale constants ─────────────────────────────────────────────────────────

export const SCALE_COLORS = {
  brain: '#4A7FA5',
  body: '#A0622A',
  happy: '#3AB87A',
  stress: '#70C0C8',
} as const

export const BRAIN_LABELS  = ['Completely Silent', 'Very Peaceful', 'Quite Quiet', 'Chill', 'Active', 'Busy', 'Hyper Focused', 'Totally Manic']
export const BODY_LABELS   = ['Nothing to Give', 'Running Empty', 'Sluggish', 'Slow', 'Steady', 'Energised', 'Firing Hard', 'Absolutely Buzzing']
export const HAPPY_LABELS  = ['Completely Lost', 'Struggling', 'Bit Low', 'Flat', 'Okay', 'Happy', 'Bike Smiles', 'Absolutely Joyful']
export const STRESS_LABELS = ['Completely Overwhelmed', 'Anxious', 'Stressed', 'Unsettled', 'Peaceful', 'Focused', 'Primed', 'Hunt Mode']

export const SCALE_LABELS: Record<string, string[]> = {
  brain: BRAIN_LABELS,
  body: BODY_LABELS,
  happy: HAPPY_LABELS,
  stress: STRESS_LABELS,
}

export const FEEL_LABELS = ['Want to Forget', 'Rough Day', 'Just OK', 'Pretty Good', 'Great Day', 'Best Day Ever']

export const COPPER = '#A0622A'
