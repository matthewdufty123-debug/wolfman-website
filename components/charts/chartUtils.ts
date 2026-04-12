// ── Shared chart utilities ───────────────────────────────────────────────────

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
