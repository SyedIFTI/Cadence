import { useState } from 'react'
import { clock } from '../format.js'

/** The speech drawn as a timeline: one bar per word, gaps are pauses. */
export default function Ribbon({ words, duration, onSeek, position }) {
  const [hover, setHover] = useState(null)
  const perRow = duration <= 60 ? duration : Math.ceil(duration / Math.ceil(duration / 60))
  const rows = Math.max(1, Math.ceil(duration / perRow))
  const x = (t, row) => ((t - row * perRow) / perRow) * 1000

  return (
    <div>
      <div className="space-y-2">
        {Array.from({ length: rows }, (_, row) => {
          const from = row * perRow
          const inRow = words.map((w, i) => ({ ...w, i })).filter((w) => w.start >= from && w.start < from + perRow)
          return (
            <div key={row} className="flex items-center gap-3">
              <span className="w-9 shrink-0 text-xs tabular-nums text-muted">{clock(from)}</span>
              <svg viewBox="0 0 1000 56" preserveAspectRatio="none" className="h-14 w-full" role="img"
                aria-label={`Speech timeline from ${clock(from)}`} onMouseLeave={() => setHover(null)}>
                <line x1="0" x2={Math.min(1000, x(duration, row))} y1="28" y2="28" stroke="var(--color-line)" strokeWidth="1" />
                {inRow.map((w) => {
                  const left = x(w.start, row)
                  const height = Math.min(50, 14 + w.text.length * 3.5)
                  const color = w.tag === 'filler' ? 'var(--color-filler)' : w.tag === 'repeat' ? 'var(--color-pause)' : 'var(--color-speech)'
                  return (
                    <g key={w.i} onMouseEnter={() => setHover(w)} onClick={() => onSeek?.(w.start)} className={onSeek ? 'cursor-pointer' : ''}>
                      <rect x={left} y="0" width={Math.max(4, x(w.end, row) - left + 2)} height="56" fill="transparent" />
                      <rect x={left} y={28 - height / 2} width={Math.max(2.5, x(w.end, row) - left - 1.5)} height={height} rx="2"
                        fill={color} opacity={hover && hover.i !== w.i ? 0.45 : 1} />
                    </g>
                  )
                })}
                {position != null && position >= from && position < from + perRow && (
                  <line x1={x(position, row)} x2={x(position, row)} y1="0" y2="56" stroke="var(--color-ink)" strokeWidth="2" />
                )}
              </svg>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex min-h-5 flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
        <Key color="bg-speech" label="Word" />
        <Key color="bg-filler" label="Filler" />
        <Key color="bg-pause" label="Repeated word" />
        <span>Gap = pause</span>
        {hover && <span className="ml-auto text-ink">“{hover.text}” at {clock(hover.start)}</span>}
      </div>
    </div>
  )
}

const Key = ({ color, label }) => (
  <span className="flex items-center gap-1.5"><span className={`size-2.5 rounded-sm ${color}`} /> {label}</span>
)
