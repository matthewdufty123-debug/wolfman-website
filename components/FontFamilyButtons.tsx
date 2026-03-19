'use client'

import { useTheme } from './ThemeProvider'

const fonts = [
  { value: 'serif' as const, label: 'Playfair', sample: 'Aa' },
  { value: 'sans'  as const, label: 'Helvetica', sample: 'Aa' },
]

export default function FontFamilyButtons() {
  const { fontFamily, setFontFamily } = useTheme()

  return (
    <div className="settings-group">
      <p className="settings-label">reading font</p>
      <div className="fontfamily-toggle">
        {fonts.map(({ value, label, sample }) => (
          <button
            key={value}
            className={`fontfamily-btn${fontFamily === value ? ' fontfamily-btn--active' : ''}`}
            onClick={() => setFontFamily(value)}
          >
            <span
              className="fontfamily-btn-sample"
              style={{ fontFamily: value === 'sans' ? "'Helvetica Neue', Helvetica, Arial, sans-serif" : undefined }}
            >
              {sample}
            </span>
            <span className="fontfamily-btn-label">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
