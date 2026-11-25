import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Lightbulb, Printer } from 'lucide-react'
import { audioUrl, getReport } from '../api.js'
import { clock, levelOf, plural } from '../format.js'
import { Bars, ErrorBox, Loading, Section, Stat } from '../components/ui.jsx'
import PaceChart from '../components/PaceChart.jsx'
import Ribbon from '../components/Ribbon.jsx'

export default function Report() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [position, setPosition] = useState(null)
  const player = useRef(null)

  useEffect(() => {
    let current = true
    setData(null); setError(''); setPosition(null)
    getReport(id).then((d) => current && setData(d)).catch((e) => current && setError(e.message))
    return () => { current = false }
  }, [id])

  if (error) return <div className="space-y-4"><ErrorBox>{error}</ErrorBox><Link to="/" className="text-brand underline">Analyze a speech</Link></div>
  if (!data) return <Loading label="Opening report…" />

  const r = data.report
  const seek = data.has_audio ? (time) => {
    player.current.currentTime = time
    player.current.play().catch(() => {})
  } : undefined

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{data.title}</h1>
          <p className="mt-1 text-muted">
            {new Date(data.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}, {clock(r.duration)} long, {plural(r.pace.word_count, 'word')}
            {data.source === 'sample' && '. Built-in sample with simulated timings'}
          </p>
        </div>
        <button className="btn-quiet print:hidden" onClick={() => window.print()}><Printer size={17} aria-hidden /> Print or save PDF</button>
      </div>

      {r.pace.word_count < 60 && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">This speech is short, so the scores are less reliable. Try speaking for a minute.</p>}

      <div className="card grid gap-8 lg:grid-cols-[13rem_1fr_1fr]">
        <div>
          <h2 className="text-lg font-semibold">Overall score</h2>
          <p className="font-display text-8xl font-bold leading-none tracking-tighter">{r.score.overall}</p>
          <p className="mt-2 text-lg font-medium text-brand">{r.score.level}</p>
          <p className="text-sm text-muted">out of 100</p>
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold">What makes up the score</h2>
          <Bars max={100} items={Object.entries(r.score.parts).map(([key, value]) => ({
            label: r.score.names[key], value, hint: `${levelOf(value)}. Counts for ${r.score.weights[key]}% of the score`,
          }))} />
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold">What to work on</h2>
          <ul className="space-y-3 text-sm">
            {r.tips.map((tip) => (
              <li key={tip.text} className="flex gap-2.5">
                {tip.kind === 'good'
                  ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-700" aria-label="Going well" />
                  : <Lightbulb size={18} className="mt-0.5 shrink-0 text-orange-700" aria-label="Improve" />}
                <span>{tip.text}</span>
              </li>
            ))}
            {r.tips.length === 0 && <li className="text-muted">Nothing stands out. Keep practising.</li>}
          </ul>
        </div>
      </div>

      <Section title="Speech timeline" subtitle={seek ? 'Click any word to play from there.' : 'Every bar is one spoken word.'}>
        {data.has_audio && <audio ref={player} controls src={audioUrl(id)} className="mb-4 w-full print:hidden" onTimeUpdate={(e) => setPosition(e.target.currentTime)} />}
        <Ribbon words={r.words} duration={r.duration} onSeek={seek} position={position} />
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Speaking pace" subtitle="Words per minute through the speech"
          how="Words per minute = words ÷ minutes. The speech is cut into equal windows and the pace is worked out for each. Pace without pauses removes every gap of 0.5 seconds or more first.">
          <div className="mb-4 grid grid-cols-3 gap-4">
            <Stat label="Average" value={r.pace.wpm} unit="WPM" />
            <Stat label="Without pauses" value={r.pace.articulation_wpm} unit="WPM" />
            <Stat label="Variation" value={`±${r.pace.variation}`} unit="WPM" />
          </div>
          <PaceChart pace={r.pace} />
        </Section>

        <Section title="Filler words" subtitle="Sounds and phrases that add no meaning"
          how="Sounds such as “um” always count. Words such as “like” only count when the part-of-speech tag and nearby words show a filler, so “I like tea” is ignored.">
          <div className="mb-5 grid grid-cols-2 gap-4">
            <Stat label="Total" value={r.fillers.total} />
            <Stat label="Per 100 words" value={r.fillers.per_100_words} hint="Aim for under 3" />
          </div>
          {r.fillers.counts.length
            ? <Bars color="bg-filler" items={r.fillers.counts.map((f) => ({ label: `“${f.label}”`, value: f.count, hint: f.kind }))} />
            : <p className="text-muted">No filler words were found.</p>}
        </Section>

        <Section title="Pauses" subtitle="Gaps of at least 0.5 seconds between words"
          how="A pause is the next word’s start time minus this word’s end time. Short is under 1 second, medium is 1 to 2, long is 2 or more.">
          <div className="mb-5 grid grid-cols-3 gap-4">
            <Stat label="Pauses" value={r.pauses.count} />
            <Stat label="Longest" value={r.pauses.longest} unit="s" />
            <Stat label="Silence" value={`${r.pauses.silence_percent}%`} />
          </div>
          <Bars items={['short', 'medium', 'long'].map((k) => ({ label: k[0].toUpperCase() + k.slice(1), value: r.pauses[k] }))} />
        </Section>

        <Section title="Clarity" subtitle="How direct and easy to follow you are"
          how="40% reading ease, 20% few hedges, 20% few repeated words, 20% few fillers. Passive voice is shown but not scored.">
          <div className="grid grid-cols-2 gap-5">
            <Stat label="Flesch reading ease" value={r.complexity.flesch_ease} unit="/ 100" hint="Higher is easier" />
            <Stat label="School grade level" value={r.complexity.flesch_grade} />
            <Stat label="Hedging phrases" value={r.extras.hedge_total} hint={r.extras.hedges.map((h) => h.label).join(', ') || 'None found'} />
            <Stat label="Repeated words" value={r.extras.repeat_total} hint={r.extras.repeats.map((x) => `${x.word} ${x.word}`).join(', ') || 'None found'} />
            <Stat label="Passive sentences" value={r.extras.passive_sentences} />
          </div>
        </Section>

        <Section title="Vocabulary" subtitle="How varied your words are, fillers excluded"
          how="Variety is MATTR: unique words ÷ all words, averaged over a sliding 50-word window so long and short talks compare fairly. Lexical density is the share of nouns, verbs, adjectives and adverbs.">
          <div className="mb-5 grid grid-cols-3 gap-4">
            <Stat label="Variety (MATTR)" value={r.vocabulary.mattr} />
            <Stat label="Unique words" value={r.vocabulary.unique} />
            <Stat label="Lexical density" value={`${r.vocabulary.lexical_density}%`} />
          </div>
          <Bars items={r.vocabulary.parts_of_speech.map((p) => ({ label: p.label, value: p.percent, text: `${p.percent}%` }))} />
          <p className="mb-2 mt-5 text-sm text-muted">Keywords</p>
          <ul className="flex flex-wrap gap-2">
            {r.vocabulary.keywords.map((k) => <li key={k.word} className="rounded-md bg-brand-soft px-2 py-1 text-sm">{k.word} <span className="text-muted">{k.count}</span></li>)}
          </ul>
        </Section>

        <Section title="Sentence complexity" subtitle="Length and grammar structure"
          how="spaCy builds a dependency tree for every sentence. Depth is the number of levels in that tree, so more nesting means a harder sentence. Subordinate clauses are clauses inside other clauses.">
          <div className="mb-5 grid grid-cols-3 gap-4">
            <Stat label="Average length" value={r.complexity.average_length} unit="words" />
            <Stat label="Tree depth" value={r.complexity.average_depth} />
            <Stat label="Subordinate" value={r.complexity.subordinate_per_sentence} unit="/ sent." />
          </div>
          <Bars items={Object.entries(r.complexity.levels).map(([k, v]) => ({ label: k[0].toUpperCase() + k.slice(1), value: v }))} />
          <p className="mb-2 mt-5 text-sm text-muted">Hardest sentences</p>
          <ul className="space-y-2 text-sm">
            {[...r.complexity.sentences].sort((a, b) => b.words + b.depth - a.words - a.depth).slice(0, 2).map((s, i) => (
              <li key={i} className="rounded-lg bg-page p-3">{s.text} <span className="whitespace-nowrap text-muted">({s.words} words, depth {s.depth})</span></li>
            ))}
          </ul>
        </Section>
      </div>

      <Section title="Transcript" subtitle="Fillers and repeated words are highlighted, pauses show their length in seconds.">
        <p className="max-w-3xl text-lg leading-9">
          {r.words.map((w, i) => {
            const style = w.tag === 'filler' ? 'rounded bg-orange-100 px-1 underline decoration-filler decoration-2 underline-offset-4'
              : w.tag === 'repeat' ? 'rounded bg-emerald-100 px-1 underline decoration-pause decoration-wavy underline-offset-4' : ''
            return (
              <span key={i}>
                {w.pause && <span className="mx-1 rounded bg-page px-1.5 py-0.5 text-xs tabular-nums text-muted" title="Pause">{w.pause.toFixed(1)}s</span>}
                {seek
                  ? <button className={`${style} hover:text-brand`} onClick={() => seek(w.start)} title={`${w.tag ?? 'word'} at ${clock(w.start)}`}>{w.text}</button>
                  : <span className={style} title={w.tag ?? undefined}>{w.text}</span>}{' '}
              </span>
            )
          })}
        </p>
      </Section>
    </div>
  )
}
