'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

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

function applyPrefs(prefs: { theme?: string; fontSize?: string }) {
  if (prefs.theme) {
    document.documentElement.setAttribute('data-theme', prefs.theme)
    localStorage.setItem('wolfman-theme', prefs.theme)
  }
  if (prefs.fontSize) {
    document.documentElement.setAttribute('data-fontsize', prefs.fontSize)
    localStorage.setItem('wolfman-fontsize', prefs.fontSize)
  }
}

function saveToDb(prefs: { theme?: string; fontSize?: string }) {
  fetch('/api/user/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  }).catch(() => {/* fire-and-forget */})
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialise with server-safe defaults so SSR and client HTML match.
  // useEffect then syncs to whatever the flash-prevention script already painted.
  const [theme, setThemeState] = useState<Theme>('light')
  const [fontSize, setFontSizeState] = useState<FontSize>('normal')
  const { data: session, status } = useSession()

  // On mount: read from DOM (set by flash-prevention script from localStorage)
  useEffect(() => {
    const t = (document.documentElement.getAttribute('data-theme') as Theme) || 'light'
    const f = (document.documentElement.getAttribute('data-fontsize') as FontSize) || 'normal'
    setThemeState(t)
    setFontSizeState(f)
  }, [])

  // After session resolves: pull DB preferences and apply them (overrides localStorage)
  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/user/settings')
      .then(r => r.ok ? r.json() : null)
      .then(prefs => {
        if (!prefs || Object.keys(prefs).length === 0) return
        applyPrefs(prefs)
        if (prefs.theme) setThemeState(prefs.theme as Theme)
        if (prefs.fontSize) setFontSizeState(prefs.fontSize as FontSize)
      })
      .catch(() => {/* non-fatal — keep localStorage values */})
  }, [status])

  function setTheme(t: Theme) {
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('wolfman-theme', t)
    setThemeState(t)
    if (session) saveToDb({ theme: t })
  }

  function setFontSize(s: FontSize) {
    document.documentElement.setAttribute('data-fontsize', s)
    localStorage.setItem('wolfman-fontsize', s)
    setFontSizeState(s)
    if (session) saveToDb({ fontSize: s })
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontSize, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  )
}
