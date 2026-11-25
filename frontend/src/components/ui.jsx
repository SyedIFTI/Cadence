import { AlertCircle, Loader2 } from 'lucide-react'

export function Loading({ label = 'Loading…' }) {
  return (
    <p className="flex items-center justify-center gap-2 py-20 text-muted" role="status">
      <Loader2 className="animate-spin" size={18} aria-hidden /> {label}
    </p>
  )
}

export function ErrorBox({ children }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden /> <span>{children}</span>
    </p>
  )
}

export function Section({ title, subtitle, how, children, className = '' }) {
  return (
    <section className={`card flex flex-col ${className}`}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      <div className="mt-5 flex-1">{children}</div>
      {how && (
        <details className="mt-5 border-t border-line pt-3 text-sm text-muted">
          <summary className="cursor-pointer font-medium hover:text-ink">How is this measured?</summary>
          <p className="mt-2 leading-relaxed">{how}</p>
        </details>
      )}
    </section>
  )
}

export function Stat({ label, value, unit, hint }) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className="font-display text-2xl font-semibold">
        {value}{unit && <span className="ml-1 text-sm font-normal text-muted">{unit}</span>}
      </p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

/** Simple labelled horizontal bars. */
export function Bars({ items, color = 'bg-speech', max }) {
  const top = max ?? Math.max(...items.map((i) => i.value), 1)
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[6.5rem_1fr_3.5rem] items-center gap-3 text-sm" title={item.hint}>
          <span className="truncate">{item.label}</span>
          <span className="h-2.5 rounded-r bg-page">
            <span className={`block h-full rounded-r ${color}`} style={{ width: `${(item.value / top) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums">{item.text ?? item.value}</span>
        </li>
      ))}
    </ul>
  )
}
