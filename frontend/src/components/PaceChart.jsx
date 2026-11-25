import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { clock } from '../format.js'

export default function PaceChart({ pace }) {
  const data = pace.timeline.map((p) => ({ ...p, middle: (p.start + p.end) / 2 }))
  const top = Math.max(200, ...data.map((d) => d.wpm + 20))
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <ReferenceArea y1={pace.ideal_low} y2={pace.ideal_high} fill="var(--color-brand-soft)" fillOpacity={1}
            label={{ value: `Ideal ${pace.ideal_low}–${pace.ideal_high}`, position: 'insideTopLeft', fontSize: 12, fill: 'var(--color-muted)' }} />
          <XAxis dataKey="middle" type="number" domain={[0, data.at(-1).end]} tickFormatter={clock} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} tickLine={false} stroke="var(--color-line)" />
          <YAxis domain={[0, Math.ceil(top / 40) * 40]} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: 'var(--color-surface)', borderColor: 'var(--color-line)', color: 'var(--color-ink)', borderRadius: 8 }} cursor={{ stroke: 'var(--color-muted)' }}
            formatter={(v) => [`${v} WPM`, 'Pace']}
            labelFormatter={(_, p) => p?.[0] ? `${clock(p[0].payload.start)} – ${clock(p[0].payload.end)}` : ''} />
          <Line dataKey="wpm" stroke="var(--color-speech)" strokeWidth={2} dot={{ r: 4, fill: 'var(--color-speech)' }} activeDot={{ r: 6 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
