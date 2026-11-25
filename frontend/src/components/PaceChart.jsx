import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { clock } from '../format.js'

export default function PaceChart({ pace }) {
  const data = pace.timeline.map((p) => ({ ...p, middle: (p.start + p.end) / 2 }))
  const top = Math.max(200, ...data.map((d) => d.wpm + 20))
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#dfe4ec" />
          <ReferenceArea y1={pace.ideal_low} y2={pace.ideal_high} fill="#e6f0fc" fillOpacity={1}
            label={{ value: `Ideal ${pace.ideal_low}–${pace.ideal_high}`, position: 'insideTopLeft', fontSize: 12, fill: '#56617a' }} />
          <XAxis dataKey="middle" type="number" domain={[0, data.at(-1).end]} tickFormatter={clock} tick={{ fontSize: 12, fill: '#56617a' }} tickLine={false} stroke="#dfe4ec" />
          <YAxis domain={[0, Math.ceil(top / 40) * 40]} tick={{ fontSize: 12, fill: '#56617a' }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(v) => [`${v} WPM`, 'Pace']}
            labelFormatter={(_, p) => p?.[0] ? `${clock(p[0].payload.start)} – ${clock(p[0].payload.end)}` : ''} />
          <Line dataKey="wpm" stroke="#257de0" strokeWidth={2} dot={{ r: 4, fill: '#257de0' }} activeDot={{ r: 6 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
