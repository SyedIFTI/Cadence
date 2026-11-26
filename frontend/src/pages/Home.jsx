import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, FileAudio, Loader2, Upload, X } from 'lucide-react'
import { analyzeAudio, analyzeSample, getHealth } from '../api.js'
import { ErrorBox } from '../components/ui.jsx'
import Recorder from '../components/Recorder.jsx'

const STEPS = [
  ['Audio', 'ffmpeg converts it to 16 kHz mono'],
  ['Transcript', 'Whisper writes it down with word times'],
  ['NLP analysis', 'spaCy tags, parses and counts'],
  ['Score', 'Six measures become 0–100'],
  ['Report', 'Saved to your history in SQLite'],
]

export default function Home() {
  const navigate = useNavigate()
  const input = useRef(null)
  const [file, setFile] = useState(null)
  const [source, setSource] = useState('upload')
  const [preview, setPreview] = useState(null)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [health, setHealth] = useState(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => { getHealth().then(setHealth).catch((e) => setError(e.message)) }, [])
  useEffect(() => {
    if (!file) return setPreview(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function choose(chosen, from) {
    if (!chosen) return
    if (chosen.size > 50 * 1024 * 1024) return setError('The file is larger than 50 MB.')
    setError('')
    setFile(chosen)
    setSource(from)
  }

  async function run(job, label) {
    setBusy(label)
    setError('')
    try {
      const { id } = await job()
      navigate(`/report/${id}`)
    } catch (e) {
      setError(e.message)
      setBusy('')
    }
  }

  return (
    <>
      <div className="grid items-center gap-8 py-2 sm:py-4 lg:grid-cols-[1fr_28rem] lg:gap-10 lg:py-10">
        <div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">Hear how you really sound.</h1>
          <p className="mt-3 max-w-md text-base text-muted sm:mt-4 sm:text-lg">
            Record a short speech. Cadence finds your fillers, pace, pauses, vocabulary and sentence structure, then scores how clear you are.
          </p>
          <button className="btn-quiet mt-6 w-full sm:w-auto" disabled={!!busy} onClick={() => run(analyzeSample, 'sample')}>
            {busy === 'sample' ? <Loader2 className="animate-spin" size={18} aria-hidden /> : <ArrowRight size={18} aria-hidden />} Try a sample speech
          </button>
        </div>

        <div className="card space-y-4 p-4 sm:p-6"
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (!busy) choose(e.dataTransfer.files[0], 'upload') }}>
          {file ? (
            <>
              <div className="flex items-center gap-3">
                <FileAudio className="shrink-0 text-brand" aria-hidden />
                <p className="min-w-0 flex-1 truncate font-medium">{source === 'mic' ? 'Your recording' : file.name}</p>
                <button className="rounded p-1 text-muted hover:text-ink" aria-label="Remove audio" disabled={!!busy} onClick={() => setFile(null)}><X size={18} /></button>
              </div>
              {preview && <audio controls src={preview} className="w-full" />}
              <label className="block text-sm font-medium">
                Title
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="Class presentation"
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 font-normal" />
              </label>
              <button className="btn-primary w-full" disabled={!!busy}
                onClick={() => run(() => analyzeAudio(file, title, source), 'audio')}>
                {busy === 'audio' ? <><Loader2 className="animate-spin" size={18} aria-hidden /> Transcribing and analyzing…</> : 'Analyze speech'}
              </button>
            </>
          ) : (
            <>
              <Recorder disabled={!!busy} onError={setError} onRecorded={(f) => choose(f, 'mic')} />
              <button onClick={() => input.current.click()} disabled={!!busy}
                className={`flex w-full flex-col items-center rounded-xl border-2 border-dashed p-5 text-center text-sm sm:p-6 ${dragging ? 'border-brand bg-brand-soft' : 'border-line hover:border-brand'}`}>
                <Upload className="mb-2 text-brand" aria-hidden />
                <span className="font-medium">Upload or drop an audio file</span>
                <span className="text-muted">MP3, WAV, M4A or WebM, up to 10 minutes</span>
              </button>
              <input ref={input} type="file" accept="audio/*,video/webm,video/mp4" hidden
                onChange={(e) => { choose(e.target.files[0], 'upload'); e.target.value = '' }} />
            </>
          )}
          {error && <ErrorBox>{error}</ErrorBox>}
          {health && !health.groq_key && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Add <code>GROQ_API_KEY</code> to <code>backend/.env</code> and restart the backend to analyze your own audio. The sample works without it.
            </p>
          )}
        </div>
      </div>

      <section className="mt-8 border-t border-line pt-6 sm:mt-10 sm:pt-8">
        <h2 className="text-lg font-semibold">How it works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-5">
          {STEPS.map(([name, text], i) => (
            <li key={name}>
              <p className="font-semibold"><span className="mr-2 text-brand">{i + 1}</span>{name}</p>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
