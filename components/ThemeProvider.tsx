'use client'

import { createContext, useContext, useEffect, useState } from 'react'

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
  // Initialise with server-safe defaults so SSR and client HTML match.
  // useEffect then syncs to whatever the flash-prevention script already painted.
  const [theme, setThemeState] = useState<Theme>('dark')
  const [fontSize, setFontSizeState] = useState<FontSize>('normal')

  useEffect(() => {
    const t = (document.documentElement.getAttribute('data-theme') as Theme) || 'dark'
    const f = (document.documentElement.getAttribute('data-fontsize') as FontSize) || 'normal'
    setThemeState(t)
    setFontSizeState(f)
  }, [])

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
