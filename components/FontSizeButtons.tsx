'use client'

import { useTheme } from './ThemeProvider'

type FontSize = 'normal' | 'large' | 'xlarge'

const sizes: { value: FontSize; label: string }[] = [
  { value: 'normal', label: 'normal' },
  { value: 'large', label: 'large' },
  { value: 'xlarge', label: 'extra large' },
]

export default function FontSizeButtons() {
  const { fontSize, setFontSize } = useTheme()

  return (
    <div className="settings-group">
      <p className="settings-label">reading size</p>
      <div className="fontsize-toggle">
        {sizes.map(({ value, label }) => (
          <button
            key={value}
            className={`fontsize-btn${fontSize === value ? ' fontsize-btn--active' : ''}`}
            data-size={value}
            onClick={() => setFontSize(value)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
