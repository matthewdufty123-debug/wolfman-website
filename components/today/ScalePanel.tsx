'use client'

const SCALE_CONFIG = [
  { key: 'brainScale' as const, label: 'Brain', labels: ['Completely Silent', 'Very Peaceful', 'Quite Quiet', 'Chill', 'Active', 'Busy', 'Hyper Focused', 'Totally Manic'] },
  { key: 'bodyScale' as const, label: 'Body', labels: ['Nothing to Give', 'Running Empty', 'Sluggish', 'Slow', 'Steady', 'Energised', 'Firing Hard', 'Absolutely Buzzing'] },
  { key: 'happyScale' as const, label: 'Mood', labels: ['Completely Lost', 'Struggling', 'Bit Low', 'Flat', 'Okay', 'Happy', 'Bike Smiles', 'Absolutely Joyful'] },
  { key: 'stressScale' as const, label: 'Stress', labels: ['Completely Overwhelmed', 'Anxious', 'Stressed', 'Unsettled', 'Peaceful', 'Focused', 'Primed', 'Hunt Mode'] },
]

type ScaleMap = {
  brainScale: number | null
  bodyScale: number | null
  happyScale: number | null
  stressScale: number | null
}

interface Props {
  scales: ScaleMap
  onSave: (scales: ScaleMap) => Promise<void>
}

export default function ScalePanel({ scales, onSave }: Props) {
  function handleSelect(key: keyof ScaleMap, value: number) {
    const newScales = { ...scales, [key]: scales[key] === value ? null : value }
    onSave(newScales)
  }

  return (
    <div className="td-scale-panel">
      <h2 className="td-panel-title">How I Showed Up</h2>
      {SCALE_CONFIG.map(({ key, label, labels }) => (
        <div key={key} className="td-scale-row">
          <span className="td-scale-label">{label}</span>
          <div className="td-scale-pills">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <button
                key={n}
                type="button"
                className={`td-scale-pill${scales[key] === n ? ' td-scale-pill--selected' : ''}${scales[key] != null && scales[key] !== n ? ' td-scale-pill--dim' : ''}`}
                onClick={() => handleSelect(key, n)}
              >
                {n}
              </button>
            ))}
          </div>
          {scales[key] != null && (
            <span className="td-scale-word">{labels[scales[key]! - 1]}</span>
          )}
        </div>
      ))}
    </div>
  )
}
