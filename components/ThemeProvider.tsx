'use client'

import { createContext, useContext, useState } from 'react'

type Theme = 'dark' | 'light'
type FontSize = 'normal' | 'large' | 'xlarge'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  fontSize: FontSize
  setFontSize: (s: FontSize) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Read from the DOM attribute — the inline flash-prevention script has already
  // set it before React hydrates, so this keeps state in sync with what's painted.
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    return (document.documentElement.getAttribute('data-theme') as Theme) || 'dark'
  })

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    if (typeof window === 'undefined') return 'normal'
    return (document.documentElement.getAttribute('data-fontsize') as FontSize) || 'normal'
  })

  function setTheme(t: Theme) {
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('wolfman-theme', t)
    setThemeState(t)
  }

  function setFontSize(s: FontSize) {
    document.documentElement.setAttribute('data-fontsize', s)
    localStorage.setItem('wolfman-fontsize', s)
    setFontSizeState(s)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontSize, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  )
}
