'use client'

import { useTheme } from './ThemeProvider'

export default function ThemeButtons() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="settings-group">
      <p className="settings-label">appearance</p>
      <div className="theme-toggle">
        <button
          className={`theme-btn${theme === 'dark' ? ' theme-btn--active' : ''}`}
          data-theme="dark"
          onClick={() => setTheme('dark')}
        >
          dark
        </button>
        <button
          className={`theme-btn${theme === 'light' ? ' theme-btn--active' : ''}`}
          data-theme="light"
          onClick={() => setTheme('light')}
        >
          light
        </button>
      </div>
    </div>
  )
}
