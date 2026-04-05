// Reference scores for each scale value (1–8) — non-linear, reflects emotional weight
// Used for scatter chart axes and AI context
export const SCALE_REFERENCE_SCORES: Record<number, number> = {
  1: -10,
  2:  -5,
  3:  -3,
  4:  -1,
  5:   1,
  6:   3,
  7:   5,
  8:  10,
}

export const BRAIN_LABELS  = ['Completely Silent', 'Very Peaceful', 'Quite Quiet', 'Chill', 'Active', 'Busy', 'Hyper Focused', 'Totally Manic'] as const
export const BODY_LABELS   = ['Nothing to Give',  'Running Empty',  'Sluggish',    'Slow',  'Steady', 'Energised', 'Firing Hard', 'Absolutely Buzzing'] as const
export const HAPPY_LABELS  = ['Completely Lost',  'Struggling',     'Bit Low',     'Flat',  'Okay',   'Happy',     'Bike Smiles', 'Absolutely Joyful'] as const
export const STRESS_LABELS = ['Completely Overwhelmed', 'Anxious', 'Stressed', 'Unsettled', 'Peaceful', 'Focused', 'Primed', 'Hunt Mode'] as const
