import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Check, Pause, Play, RotateCcw, Volume2 } from 'lucide-react'
import { Modal } from './ui'
import { buildTempoPhases, normalizeTempoConfig, type TempoConfig, type TempoPhase } from '../utils/tempo'

const STORAGE_KEY = 'gymtrack-tempo-config'
const defaults: TempoConfig = { downSeconds: 3, bottomPauseSeconds: 0, upSeconds: 1, topPauseSeconds: 0, reps: 10, startWith: 'down' }

function loadConfig(initialReps: number): TempoConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return normalizeTempoConfig(stored ? { ...defaults, ...JSON.parse(stored), reps: initialReps } : { ...defaults, reps: initialReps })
  } catch { return { ...defaults, reps: initialReps } }
}

export function TempoCoach({ exerciseName, initialReps, onClose }: { exerciseName: string; initialReps: number; onClose: () => void }) {
  const [config, setConfig] = useState<TempoConfig>(() => loadConfig(initialReps))
  const phases = useMemo(() => buildTempoPhases(config), [config])
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [rep, setRep] = useState(1)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [phaseEndAt, setPhaseEndAt] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const pausedRemainingRef = useRef(0)
  const audioRef = useRef<AudioContext | null>(null)
  const normalized = normalizeTempoConfig(config)
  const phase = phases[phaseIndex]

  const cue = (current: TempoPhase, done = false) => {
    try {
      const audio = audioRef.current
      if (audio) {
        const oscillator = audio.createOscillator(), gain = audio.createGain()
        oscillator.frequency.value = done ? 1040 : current.frequency
        gain.gain.setValueAtTime(.08, audio.currentTime)
        gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + (done ? .22 : .11))
        oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + (done ? .22 : .11))
      }
      navigator.vibrate?.(done ? [100, 60, 100] : 35)
    } catch { /* Som e vibração são melhorias opcionais. */ }
  }

  useEffect(() => {
    if (!running || paused || !phase) return
    const tick = () => {
      const remaining = Math.max(0, phaseEndAt - Date.now())
      setRemainingMs(remaining)
      if (remaining > 0) return
      const now = Date.now()
      if (phaseIndex < phases.length - 1) {
        const nextIndex = phaseIndex + 1, next = phases[nextIndex]
        setPhaseIndex(nextIndex); setRemainingMs(next.durationSeconds * 1000); setPhaseEndAt(now + next.durationSeconds * 1000); cue(next)
      } else if (rep < normalized.reps) {
        const next = phases[0]
        setRep(value => value + 1); setPhaseIndex(0); setRemainingMs(next.durationSeconds * 1000); setPhaseEndAt(now + next.durationSeconds * 1000); cue(next)
      } else {
        setRunning(false); setCompleted(true); setRemainingMs(0); cue(phase, true)
      }
    }
    tick(); const interval = window.setInterval(tick, 50); return () => clearInterval(interval)
  }, [running, paused, phaseEndAt, phaseIndex, rep, phases, phase, normalized.reps])

  const start = async () => {
    const nextConfig = normalizeTempoConfig(config), first = buildTempoPhases(nextConfig)[0]
    setConfig(nextConfig); localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConfig))
    try {
      audioRef.current ||= new AudioContext()
      await audioRef.current.resume()
    } catch { /* O guia visual continua funcionando. */ }
    setRep(1); setPhaseIndex(0); setCompleted(false); setPaused(false); setRemainingMs(first.durationSeconds * 1000); setPhaseEndAt(Date.now() + first.durationSeconds * 1000); setRunning(true); cue(first)
  }
  const togglePause = () => {
    if (paused) { const remaining = Math.max(50, pausedRemainingRef.current); setPhaseEndAt(Date.now() + remaining); setRemainingMs(remaining); setPaused(false) }
    else { pausedRemainingRef.current = Math.max(50, phaseEndAt - Date.now()); setRemainingMs(pausedRemainingRef.current); setPaused(true) }
  }
  const reset = () => { setRunning(false); setPaused(false); setCompleted(false); setRep(1); setPhaseIndex(0); setRemainingMs(0) }
  const close = () => { reset(); void audioRef.current?.close(); audioRef.current = null; onClose() }
  const update = <K extends keyof TempoConfig>(key: K, value: TempoConfig[K]) => setConfig(current => ({ ...current, [key]: value }))
  const directionColor = phase?.key === 'down' ? 'text-sky-300' : phase?.key === 'up' ? 'text-lime' : 'text-amber-300'
  const totalMs = (phase?.durationSeconds || 1) * 1000
  const progress = Math.max(0, Math.min(100, 100 - remainingMs / totalMs * 100))

  return <Modal title={`Cadência · ${exerciseName}`} onClose={close}>
    {!running && !completed && <>
      <div className="mb-4 rounded-xl border border-line bg-black/20 p-3 text-sm text-muted"><Volume2 className="mr-2 inline text-lime" size={17}/>O som marca cada mudança. A instrução grande mostra quando subir, descer ou pausar.</div>
      <div className="grid grid-cols-2 gap-3">
        <label><span className="label">Começar por</span><select value={config.startWith} onChange={e => update('startWith', e.target.value as TempoConfig['startWith'])}><option value="down">Descer</option><option value="up">Subir</option></select></label>
        <label><span className="label">Repetições</span><input type="number" min="1" max="50" value={config.reps} onChange={e => update('reps', Number(e.target.value))}/></label>
        <TempoInput label="Descida (s)" value={config.downSeconds} onChange={value => update('downSeconds', value)}/>
        <TempoInput label="Pausa embaixo (s)" value={config.bottomPauseSeconds} onChange={value => update('bottomPauseSeconds', value)} allowZero/>
        <TempoInput label="Subida (s)" value={config.upSeconds} onChange={value => update('upSeconds', value)}/>
        <TempoInput label="Pausa em cima (s)" value={config.topPauseSeconds} onChange={value => update('topPauseSeconds', value)} allowZero/>
      </div>
      <p className="mt-3 text-center text-xs text-muted">Cadência: {normalized.downSeconds}–{normalized.bottomPauseSeconds}–{normalized.upSeconds}–{normalized.topPauseSeconds}</p>
      <button className="btn-primary mt-4 w-full py-4" onClick={start}><Play size={19} fill="currentColor"/> INICIAR GUIA</button>
    </>}
    {running && phase && <>
      <div className="overflow-hidden rounded-2xl border border-line bg-black/25 text-center">
        <div className="h-1 bg-line"><div className="h-full bg-lime transition-[width] duration-75" style={{width:`${progress}%`}}/></div>
        <p className="mt-5 text-sm font-bold uppercase tracking-widest text-muted">Repetição {rep} de {normalized.reps}</p>
        <div className={`mx-auto mt-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/5 ${directionColor}`}>{phase.key === 'down' ? <ArrowDown size={48}/> : phase.key === 'up' ? <ArrowUp size={48}/> : <Pause size={42}/>}</div>
        <p className={`mt-4 text-4xl font-black tracking-tight ${directionColor}`}>{paused ? 'PAUSADO' : phase.label}</p>
        <p className="mb-6 mt-2 text-5xl font-black tabular-nums">{(remainingMs/1000).toFixed(1)}<span className="text-lg text-muted">s</span></p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2"><button className="btn-secondary" onClick={togglePause}>{paused ? <Play/> : <Pause/>}{paused ? 'Continuar' : 'Pausar'}</button><button className="btn-secondary" onClick={reset}><RotateCcw/>Reiniciar</button></div>
    </>}
    {completed && <div className="text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-lime text-ink"><Check size={42}/></div><h3 className="mt-4 text-2xl font-black">SÉRIE CONCLUÍDA</h3><p className="mt-1 text-muted">{normalized.reps} repetições guiadas</p><button className="btn-primary mt-5 w-full" onClick={start}><RotateCcw/> Repetir série</button></div>}
    <p className="mt-4 text-center text-[11px] text-muted">Som e vibração dependem do suporte e das permissões do navegador.</p>
  </Modal>
}

function TempoInput({ label, value, onChange, allowZero = false }: { label: string; value: number; onChange: (value: number) => void; allowZero?: boolean }) {
  return <label><span className="label">{label}</span><input type="number" min={allowZero ? 0 : .5} max="10" step=".5" value={value} onChange={event => onChange(Number(event.target.value))}/></label>
}
