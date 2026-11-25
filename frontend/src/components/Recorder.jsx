import { useEffect, useRef, useState } from 'react'
import { Mic, Square } from 'lucide-react'
import { clock } from '../format.js'

const BARS = 36
const MAX_SECONDS = 600

/** Records the microphone and shows a live level meter. */
export default function Recorder({ onRecorded, onError, disabled }) {
  const [recording, setRecording] = useState(false)
  const [starting, setStarting] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [levels, setLevels] = useState(Array(BARS).fill(0))
  const recorder = useRef(null)
  const cleanup = useRef(() => {})
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      cleanup.current()
    }
  }, [])

  async function start() {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      onError('Recording is not supported in this browser. Open the app on localhost or upload a file.')
      return
    }
    setStarting(true)
    onError('')
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      if (mounted.current) {
        setStarting(false)
        onError('Microphone access was blocked. Allow it in the browser, or upload a file.')
      }
      return
    }
    if (!mounted.current) {
      stream.getTracks().forEach((t) => t.stop())
      return
    }

    // Level meter
    const context = new AudioContext()
    const analyser = context.createAnalyser()
    analyser.fftSize = 512
    context.createMediaStreamSource(stream).connect(analyser)
    const samples = new Uint8Array(analyser.fftSize)
    const startedAt = Date.now()
    const timer = setInterval(() => {
      analyser.getByteTimeDomainData(samples)
      const peak = samples.reduce((m, v) => Math.max(m, Math.abs(v - 128)), 0) / 128
      setLevels((old) => [...old.slice(1), Math.min(1, peak * 1.8)])
      const elapsed = (Date.now() - startedAt) / 1000
      setSeconds(elapsed)
      if (elapsed >= MAX_SECONDS) stop()
    }, 80)

    const chunks = []
    const media = new MediaRecorder(stream)
    media.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    media.onstop = () => {
      cleanup.current()
      if (!mounted.current) return
      setRecording(false)
      const type = media.mimeType || 'audio/webm'
      const extension = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm'
      onRecorded(new File(chunks, `recording.${extension}`, { type }))
    }
    cleanup.current = () => {
      clearInterval(timer)
      stream.getTracks().forEach((t) => t.stop())
      if (context.state !== 'closed') context.close()
      cleanup.current = () => {}
    }
    recorder.current = media
    media.start()
    setSeconds(0)
    setLevels(Array(BARS).fill(0))
    setStarting(false)
    setRecording(true)
  }

  function stop() {
    if (recorder.current?.state === 'recording') recorder.current.stop()
  }

  return (
    <div className="rounded-xl bg-navy p-5 text-white">
      <div className="flex h-20 items-center justify-between gap-1" aria-hidden>
        {levels.map((level, i) => (
          <span key={i} className={`w-full rounded-full ${recording ? 'bg-[#6aabf1]' : 'bg-white/25'}`}
            style={{ height: `${6 + level * 94}%` }} />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-2xl tabular-nums" aria-label="Recording time">{clock(seconds)}</p>
        {recording ? (
          <button onClick={stop} className="btn bg-white text-navy hover:bg-[#e6f0fc]"><Square size={16} fill="currentColor" aria-hidden /> Stop recording</button>
        ) : (
          <button onClick={start} disabled={disabled || starting} className="btn bg-filler font-semibold text-navy hover:bg-[#f78a52]"><Mic size={18} aria-hidden /> Start recording</button>
        )}
      </div>
    </div>
  )
}
