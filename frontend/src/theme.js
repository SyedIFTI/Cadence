import { useEffect, useState } from 'react'

// The inline script in index.html applies the same rules before first paint.
const KEY = 'cadence-theme'
const CHOICES = ['light', 'dark', 'system']
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

const valid = (value) => (CHOICES.includes(value) ? value : 'system')

function saved() {
  try { return valid(localStorage.getItem(KEY)) } catch { return 'system' }
}

export function useTheme() {
  const [theme, setTheme] = useState(saved)

  useEffect(() => {
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && darkQuery.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    }
    apply()
    darkQuery.addEventListener('change', apply)
    return () => darkQuery.removeEventListener('change', apply)
  }, [theme])

  // Keep other open tabs in step.
  useEffect(() => {
    const sync = (e) => { if (e.key === KEY || e.key === null) setTheme(valid(e.newValue)) }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const choose = (next) => {
    setTheme(next)
    try { localStorage.setItem(KEY, next) } catch { /* Storage blocked: lasts until reload. */ }
  }
  return [theme, choose]
}
