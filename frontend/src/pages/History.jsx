import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { deleteReport, listReports } from '../api.js'
import { clock, levelOf } from '../format.js'
import { ErrorBox, Loading, Section } from '../components/ui.jsx'

const day = (iso) => new Date(iso).toLocaleDateString([], { dateStyle: 'medium' })

export default function History() {
  const [reports, setReports] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { listReports().then(setReports).catch((e) => setError(e.message)) }, [])

  async function remove(report) {
    if (!window.confirm(`Delete “${report.title}”? This cannot be undone.`)) return
    try {
      await deleteReport(report.id)
      setReports((old) => old.filter((x) => x.id !== report.id))
      setError('')
    } catch (e) { setError(e.message) }
  }

  // Samples are always the same speech, so they are left out of the trend.
  const trend = (reports ?? []).filter((r) => r.source !== 'sample').reverse().map((r, i) => ({ ...r, number: i + 1 }))

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold tracking-tight">History</h1>
      {error && <ErrorBox>{error}</ErrorBox>}
      {!reports && !error && <Loading />}
      {reports?.length === 0 && (
        <div className="card py-14 text-center">
          <p className="text-lg font-medium">No speeches yet</p>
          <Link to="/" className="btn-primary mt-4">Analyze your first speech</Link>
        </div>
      )}
      {trend.length > 1 && (
        <Section title="Your progress" subtitle="Overall score for each speech, oldest first">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--color-line)" />
                <XAxis dataKey="number" tick={{ fontSize: 12, fill: 'var(--color-muted)' }} tickLine={false} stroke="var(--color-line)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--color-surface)', borderColor: 'var(--color-line)', color: 'var(--color-ink)', borderRadius: 8 }} cursor={{ stroke: 'var(--color-muted)' }}
                  formatter={(v) => [v, 'Score']} labelFormatter={(_, p) => p?.[0]?.payload.title ?? ''} />
                <Line dataKey="score" stroke="var(--color-speech)" strokeWidth={2} dot={{ r: 4, fill: 'var(--color-speech)' }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}
      {reports?.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[40rem] text-left">
            <thead className="border-b border-line text-sm text-muted">
              <tr>{['Speech', 'Score', 'Pace', 'Fillers', 'Length', ''].map((h) => <th key={h} className="px-5 py-3 font-medium">{h || <span className="sr-only">Delete</span>}</th>)}</tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-page">
                  <td className="px-5 py-3"><Link to={`/report/${r.id}`} className="font-medium hover:text-brand hover:underline">{r.title}</Link><p className="text-sm text-muted">{day(r.created_at)}</p></td>
                  <td className="px-5 py-3"><span className="font-display text-xl font-semibold">{r.score}</span> <span className="text-sm text-muted">{levelOf(r.score)}</span></td>
                  <td className="px-5 py-3 tabular-nums">{r.wpm} WPM</td>
                  <td className="px-5 py-3 tabular-nums">{r.fillers}</td>
                  <td className="px-5 py-3 tabular-nums">{clock(r.duration)}</td>
                  <td className="px-5 py-3 text-right"><button className="rounded p-2 text-muted hover:text-red-700 dark:hover:text-red-400" aria-label={`Delete ${r.title}`} onClick={() => remove(r)}><Trash2 size={17} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
