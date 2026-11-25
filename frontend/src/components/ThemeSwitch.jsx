import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../theme.js'

const OPTIONS = [
  { value: 'light', label: 'Light theme', Icon: Sun },
  { value: 'dark', label: 'Dark theme', Icon: Moon },
  { value: 'system', label: 'System theme', Icon: Monitor },
]

export default function ThemeSwitch() {
  const [theme, setTheme] = useTheme()
  return (
    <div role="group" aria-label="Theme" className="flex rounded-lg border border-line p-0.5">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button key={value} type="button" title={label} aria-label={label} aria-pressed={theme === value}
          onClick={() => setTheme(value)}
          className={`rounded-md p-1.5 ${theme === value ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink'}`}>
          <Icon size={16} aria-hidden />
        </button>
      ))}
    </div>
  )
}
