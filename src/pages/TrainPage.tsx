import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDown, ArrowUp, Check, CirclePause, CirclePlay, Clock3, Flame, Pause, Play, Plus, RefreshCcw, RotateCcw, SkipForward, Square, Timer, Trash2, Trophy } from 'lucide-react'
import { db } from '../db'
import type { Exercise, PerformedSet, PlannedExercise, WorkoutDay, WorkoutSession } from '../types'
import { calculateNewRecordTypes, calculateSessionVolume, durationMinutes, formatVolume, shouldSuggestLoadIncrease } from '../utils/calculations'
import { newId, nowIso } from '../utils/ids'
import { EmptyState, Modal, PageHeader } from '../components/ui'
import { TempoCoach } from '../components/TempoCoach'

export function TrainPage({ requestedDayId, onRequestedHandled, onFinished }: { requestedDayId?: string; onRequestedHandled: () => void; onFinished: (sessionId: string) => void }) {
  const [starting, setStarting] = useState(false)
  const days = useLiveQuery(() => db.workoutDays.orderBy('order').toArray(), [])
  const active = useLiveQuery(() => db.workoutSessions.where('status').anyOf('active', 'paused').first(), [])

  const startWorkout = async (dayId: string) => {
    if (starting || active) return
    setStarting(true)
    try {
      const day = await db.workoutDays.get(dayId)
      if (!day) return
      const planned = await db.plannedExercises.where('workoutDayId').equals(dayId).sortBy('order')
      const exercises = new Map((await db.exercises.bulkGet(planned.map(p => p.exerciseId))).filter(Boolean).map(e => [e!.id, e!]))
      const previous = (await db.workoutSessions.where('workoutDayId').equals(dayId).reverse().sortBy('startedAt')).find(s => s.status === 'completed')
      const previousSets = previous ? await db.performedSets.where('sessionId').equals(previous.id).toArray() : []
      const sessionId = newId('session')
      const time = nowIso()
      const session: WorkoutSession = { id: sessionId, workoutDayId: day.id, workoutName: day.name, focus: day.focus, startedAt: time, status: 'active', totalPausedMs: 0, createdAt: time, updatedAt: time }
      const sets: PerformedSet[] = planned.flatMap(p => {
        const exercise = exercises.get(p.exerciseId)!
        const prior = previousSets.filter(s => s.exerciseId === p.exerciseId && !s.warmup).sort((a,b) => a.setOrder-b.setOrder)
        return Array.from({ length: p.sets }, (_, index) => {
          const last = prior[index]
          return { id: newId('set'), sessionId, plannedExerciseId: p.id, exerciseId: p.exerciseId, exerciseName: exercise?.name || 'Exercício', exerciseOrder: p.order, setOrder: index + 1, weight: last?.weight ?? 0, reps: last?.reps ?? 0, durationSeconds: last?.durationSeconds, rir: last?.rir, completed: false, warmup: false, createdAt: time, updatedAt: time }
        })
      })
      await db.transaction('rw', [db.workoutSessions, db.performedSets], async () => { await db.workoutSessions.add(session); await db.performedSets.bulkAdd(sets) })
    } finally { setStarting(false); onRequestedHandled() }
  }

  useEffect(() => { if (requestedDayId && days?.some(d => d.id === requestedDayId) && !active) void startWorkout(requestedDayId) }, [requestedDayId, days, active])

  if (active) return <SessionRunner sessionId={active.id} onFinished={onFinished} />

  return <div><PageHeader title="Escolher treino" subtitle="Você pode iniciar qualquer treino, independentemente do dia." />
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{days?.map((day, index) => <WorkoutCard key={day.id} day={day} index={index} onStart={() => startWorkout(day.id)} disabled={starting} />)}</div>
    {!days?.length && <EmptyState>Nenhum treino cadastrado.</EmptyState>}
    <p className="mt-5 rounded-xl border border-line bg-panel/60 p-4 text-sm text-muted">As séries planejadas são efetivas. Registre aquecimentos separadamente. Comece com técnica controlada e 1–3 repetições em reserva (RIR).</p>
  </div>
}

function WorkoutCard({ day, index, onStart, disabled }: { day: WorkoutDay; index: number; onStart: () => void; disabled: boolean }) {
  const count = useLiveQuery(() => db.plannedExercises.where('workoutDayId').equals(day.id).count(), [day.id])
  const weekdays = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB']
  return <button onClick={onStart} disabled={disabled} className="card group text-left transition hover:-translate-y-0.5 hover:border-lime/50">
    <div className="flex items-start justify-between"><span className="eyebrow">{weekdays[day.weekday]}</span><span className="text-4xl font-black text-white/5">0{index+1}</span></div>
    <h2 className="mt-2 text-2xl font-black">{day.name}</h2><p className="mt-1 min-h-10 text-sm text-muted">{day.focus}</p>
    <div className="mt-5 flex items-center justify-between border-t border-line pt-3"><span className="text-xs text-muted">{count ?? '—'} exercícios</span><span className="font-bold text-lime">Iniciar →</span></div>
  </button>
}

function SessionRunner({ sessionId, onFinished }: { sessionId: string; onFinished: (id: string) => void }) {
  const session = useLiveQuery(() => db.workoutSessions.get(sessionId), [sessionId])
  const sets = useLiveQuery(() => db.performedSets.where('sessionId').equals(sessionId).toArray(), [sessionId])
  const planned = useLiveQuery(() => db.plannedExercises.toArray(), [])
  const exercises = useLiveQuery(() => db.exercises.toArray(), [])
  const [showFinish, setShowFinish] = useState(false)
  const [showSubstitute, setShowSubstitute] = useState<{ exerciseId: string; name: string } | null>(null)
  const [tempoExercise, setTempoExercise] = useState<{ name: string; reps: number } | null>(null)
  const [timer, setTimer] = useState<{ endAt: number; total: number; pausedRemaining?: number } | null>(() => {
    const stored = localStorage.getItem(`gymtrack-timer-${sessionId}`); return stored ? JSON.parse(stored) : null
  })
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (!timer) { setRemaining(0); localStorage.removeItem(`gymtrack-timer-${sessionId}`); return }
    localStorage.setItem(`gymtrack-timer-${sessionId}`, JSON.stringify(timer))
    const update = () => {
      const value = timer.pausedRemaining ?? Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000))
      setRemaining(value)
      if (value === 0 && !timer.pausedRemaining) {
        navigator.vibrate?.([180, 100, 180])
        setTimer(null)
      }
    }
    update(); const interval = window.setInterval(update, 250); return () => clearInterval(interval)
  }, [timer, sessionId])

  const grouped = useMemo(() => {
    const map = new Map<string, PerformedSet[]>()
    for (const set of sets || []) { const key = set.exerciseId; map.set(key, [...(map.get(key) || []), set]) }
    return [...map.values()].map(group => group.sort((a,b) => a.setOrder-b.setOrder)).sort((a,b) => a[0].exerciseOrder-b[0].exerciseOrder)
  }, [sets])

  const updateSet = async (id: string, change: Partial<PerformedSet>) => db.performedSets.update(id, { ...change, updatedAt: nowIso() })
  const toggleDone = async (set: PerformedSet) => {
    const completed = !set.completed
    await updateSet(set.id, { completed, completedAt: completed ? nowIso() : undefined })
    if (completed) {
      const plan = planned?.find(p => p.id === set.plannedExerciseId)
      if (plan) setTimer({ endAt: Date.now() + plan.restSeconds * 1000, total: plan.restSeconds })
    }
  }
  const addSet = async (group: PerformedSet[], warmup = false) => {
    const base = group[0], last = group.at(-1)!
    const time = nowIso()
    await db.performedSets.add({ ...last, id: newId('set'), setOrder: Math.max(...group.map(s => s.setOrder)) + 1, completed: false, completedAt: undefined, warmup, createdAt: time, updatedAt: time })
  }
  const moveExercise = async (group: PerformedSet[], direction: -1 | 1) => {
    const index = grouped.findIndex(g => g[0].exerciseId === group[0].exerciseId), other = grouped[index + direction]
    if (!other) return
    await db.transaction('rw', db.performedSets, async () => {
      await Promise.all(group.map(s => db.performedSets.update(s.id, { exerciseOrder: other[0].exerciseOrder, updatedAt: nowIso() })))
      await Promise.all(other.map(s => db.performedSets.update(s.id, { exerciseOrder: group[0].exerciseOrder, updatedAt: nowIso() })))
    })
  }
  const substitute = async (replacement: Exercise) => {
    if (!showSubstitute) return
    const group = grouped.find(g => g[0].exerciseId === showSubstitute.exerciseId)
    if (!group) return
    await db.transaction('rw', db.performedSets, async () => Promise.all(group.map(s => db.performedSets.update(s.id, { exerciseId: replacement.id, exerciseName: replacement.name, updatedAt: nowIso() }))))
    setShowSubstitute(null)
  }
  const pauseResume = async () => {
    if (!session) return
    const time = nowIso()
    if (session.status === 'active') await db.workoutSessions.update(session.id, { status: 'paused', pausedAt: time, updatedAt: time })
    else await db.workoutSessions.update(session.id, { status: 'active', pausedAt: undefined, totalPausedMs: session.totalPausedMs + (Date.now() - new Date(session.pausedAt || time).getTime()), updatedAt: time })
  }
  const finish = async () => {
    if (!session || !sets) return
    const time = nowIso(), done = sets.filter(s => s.completed && !s.warmup)
    const priorSets = done.length ? (await db.performedSets.where('exerciseId').anyOf(...new Set(done.map(s => s.exerciseId))).toArray()).filter(s => s.sessionId !== session.id && s.completed && !s.warmup) : []
    const records = done.flatMap(set => {
      const prior = priorSets.filter(p => p.exerciseId === set.exerciseId)
      const result = calculateNewRecordTypes(set, prior)
      return result.map(r => ({ id: newId('record'), exerciseId: set.exerciseId, sessionId: session.id, ...r, achievedAt: time, createdAt: time, updatedAt: time }))
    })
    await db.transaction('rw', [db.workoutSessions, db.personalRecords], async () => { await db.workoutSessions.update(session.id, { status: 'completed', finishedAt: time, pausedAt: undefined, updatedAt: time }); if (records.length) await db.personalRecords.bulkAdd(records) })
    localStorage.removeItem(`gymtrack-timer-${sessionId}`); setTimer(null); setShowFinish(false); onFinished(session.id)
  }

  if (!session || !sets) return <div className="py-20 text-center text-muted">Carregando treino…</div>
  const completedCount = sets.filter(s => s.completed).length
  const volume = calculateSessionVolume(sets)
  return <div className="pb-24">
    <PageHeader title={session.workoutName} subtitle={`${session.focus} · ${durationMinutes(session.startedAt, undefined, session.totalPausedMs)} min`} action={<button className="btn-secondary !px-3" onClick={pauseResume}>{session.status === 'paused' ? <CirclePlay /> : <CirclePause />}</button>} />
    {session.status === 'paused' && <div className="mb-4 rounded-xl border border-amber-700/50 bg-amber-950/30 p-3 text-center font-semibold text-amber-300">Treino pausado</div>}
    <div className="mb-4 grid grid-cols-3 gap-2"><div className="card !p-3"><p className="text-xs text-muted">Séries</p><b>{completedCount}/{sets.length}</b></div><div className="card !p-3"><p className="text-xs text-muted">Volume</p><b>{formatVolume(volume)}</b></div><div className="card !p-3"><p className="text-xs text-muted">Status</p><b className="text-lime">Em curso</b></div></div>

    <div className="space-y-4">{grouped.map((group, groupIndex) => {
      const base = group[0], plan = planned?.find(p => p.id === base.plannedExerciseId), exercise = exercises?.find(e => e.id === base.exerciseId)
      const suggest = plan && shouldSuggestLoadIncrease(group, plan.sets, plan.maxReps)
      return <section className="card !p-0 overflow-hidden" key={base.exerciseId}>
        <div className="flex items-start justify-between gap-2 border-b border-line p-4"><div><p className="eyebrow">Exercício {groupIndex + 1}</p><h2 className="mt-1 text-lg font-bold">{base.exerciseName}</h2><p className="mt-1 text-xs text-muted">{plan ? `${plan.sets} × ${plan.minReps}–${plan.maxReps} · descanso ${plan.restSeconds}s` : exercise?.mode === 'isometric' ? 'Duração em segundos' : 'Exercício substituído'}</p></div><div className="flex"><button className="p-2 text-muted disabled:opacity-20" disabled={groupIndex===0} onClick={() => moveExercise(group,-1)} aria-label="Mover acima"><ArrowUp size={17}/></button><button className="p-2 text-muted disabled:opacity-20" disabled={groupIndex===grouped.length-1} onClick={() => moveExercise(group,1)} aria-label="Mover abaixo"><ArrowDown size={17}/></button></div></div>
        <div className="overflow-x-auto p-3"><div className="min-w-[530px]">
          <div className="grid grid-cols-[54px_1fr_1fr_74px_52px_40px] gap-2 px-1 pb-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted"><span>Série</span><span>Peso kg</span><span>{exercise?.mode === 'isometric' ? 'Segundos' : 'Reps'}</span><span>RIR</span><span>Feito</span><span></span></div>
          <div className="space-y-2">{group.map(set => <div key={set.id} className={`grid grid-cols-[54px_1fr_1fr_74px_52px_40px] items-center gap-2 rounded-xl p-1 ${set.completed ? 'bg-lime/5' : ''}`}><span className={`text-center text-xs font-bold ${set.warmup ? 'text-amber-300' : 'text-muted'}`}>{set.warmup ? 'AQ' : set.setOrder}</span><input type="number" min="0" step="0.5" value={set.weight || ''} onChange={e => updateSet(set.id,{weight:Number(e.target.value)})} aria-label={`Peso série ${set.setOrder}`} /><input type="number" min="0" value={(exercise?.mode === 'isometric' ? set.durationSeconds : set.reps) || ''} onChange={e => updateSet(set.id, exercise?.mode === 'isometric' ? {durationSeconds:Number(e.target.value), reps: 0} : {reps:Number(e.target.value)})} aria-label="Repetições ou duração" /><input type="number" min="0" max="10" value={set.rir ?? ''} onChange={e => updateSet(set.id,{rir:e.target.value === '' ? undefined : Number(e.target.value)})} aria-label="RIR" /><button onClick={() => toggleDone(set)} className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl border ${set.completed ? 'border-lime bg-lime text-ink' : 'border-line text-muted'}`}><Check size={20}/></button><button className="text-muted hover:text-red-300" disabled={group.length <= 1} onClick={() => db.performedSets.delete(set.id)}><Trash2 size={17}/></button></div>)}</div>
        </div></div>
        {suggest && <div className="mx-4 mb-3 flex gap-2 rounded-xl bg-lime/10 p-3 text-sm text-lime"><Trophy className="shrink-0" size={18}/><span>Você completou todas as séries no limite superior. Considere aumentar {exercise?.loadIncrement || 1} kg no próximo treino.</span></div>}
        <div className="flex flex-wrap gap-2 border-t border-line p-3"><button className="btn-secondary !min-h-9 !px-3 !py-1 text-xs" onClick={() => addSet(group)}><Plus size={15}/> Série</button><button className="btn-secondary !min-h-9 !px-3 !py-1 text-xs" onClick={() => addSet(group,true)}><Flame size={15}/> Aquecimento</button>{exercise?.mode !== 'isometric' && <button className="btn-secondary !min-h-9 !px-3 !py-1 text-xs" onClick={() => setTempoExercise({name:base.exerciseName,reps:plan?.minReps||10})}><Timer size={15}/> Cadência</button>}<button className="btn-secondary !min-h-9 !px-3 !py-1 text-xs" onClick={() => setShowSubstitute({exerciseId:base.exerciseId,name:base.exerciseName})}><RefreshCcw size={15}/> Substituir</button></div>
      </section>
    })}</div>

    <label className="mt-4 block"><span className="label">Observações do treino</span><textarea rows={3} defaultValue={session.notes} onBlur={e => db.workoutSessions.update(session.id,{notes:e.target.value,updatedAt:nowIso()})} placeholder="Técnica, desconfortos, ajustes…" /></label>
    <button className="btn-primary mt-4 w-full py-4" onClick={() => setShowFinish(true)}><Square size={18} fill="currentColor"/> FINALIZAR TREINO</button>

    {remaining > 0 && <RestTimer remaining={remaining} timer={timer!} onPause={() => setTimer(t => t ? t.pausedRemaining != null ? {...t, endAt: Date.now()+t.pausedRemaining*1000, pausedRemaining:undefined} : {...t, pausedRemaining:Math.max(1,Math.ceil((t.endAt-Date.now())/1000))} : t)} onReset={() => setTimer(t => t ? {...t,endAt:Date.now()+t.total*1000,pausedRemaining:undefined}:t)} onAdd={() => setTimer(t => t ? t.pausedRemaining != null ? {...t,pausedRemaining:t.pausedRemaining+15}:{...t,endAt:t.endAt+15000}:t)} onSkip={() => setTimer(null)} />}
    {showFinish && <Modal title="Finalizar treino?" onClose={() => setShowFinish(false)}><div className="grid grid-cols-3 gap-2 text-center"><div className="card !p-3"><p className="text-xs text-muted">Duração</p><b>{durationMinutes(session.startedAt, undefined, session.totalPausedMs)} min</b></div><div className="card !p-3"><p className="text-xs text-muted">Séries</p><b>{completedCount}</b></div><div className="card !p-3"><p className="text-xs text-muted">Volume</p><b>{formatVolume(volume)}</b></div></div>{sets.some(s=>!s.completed)&&<p className="mt-3 text-sm text-amber-300">Há séries não concluídas. Elas serão preservadas, mas não entram nos cálculos.</p>}<div className="mt-5 flex gap-2"><button className="btn-secondary flex-1" onClick={()=>setShowFinish(false)}>Continuar</button><button className="btn-primary flex-1" onClick={finish}>Finalizar</button></div></Modal>}
    {showSubstitute && <Modal title={`Substituir ${showSubstitute.name}`} onClose={() => setShowSubstitute(null)}><div className="max-h-80 space-y-2 overflow-y-auto">{exercises?.filter(e=>!e.archived&&e.id!==showSubstitute.exerciseId).map(e=><button key={e.id} onClick={()=>substitute(e)} className="w-full rounded-xl border border-line p-3 text-left hover:border-lime"><b>{e.name}</b><p className="text-xs text-muted">{e.muscleGroup}</p></button>)}</div></Modal>}
    {tempoExercise && <TempoCoach exerciseName={tempoExercise.name} initialReps={tempoExercise.reps} onClose={() => setTempoExercise(null)}/>} 
  </div>
}

function RestTimer({ remaining, timer, onPause, onReset, onAdd, onSkip }: { remaining: number; timer: { total: number; pausedRemaining?: number }; onPause:()=>void; onReset:()=>void; onAdd:()=>void; onSkip:()=>void }) {
  const pct = Math.min(100, Math.max(0, remaining / timer.total * 100))
  return <div className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-xl rounded-2xl border border-lime/40 bg-[#142019] p-4 shadow-2xl shadow-black/60"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-lime/10 text-lime"><Clock3/><span className="absolute inset-0 rounded-full border-2 border-lime" style={{clipPath:`inset(${100-pct}% 0 0 0)`}}/></div><div><p className="text-xs uppercase tracking-wider text-muted">Descanso</p><p className="text-2xl font-black tabular-nums">{Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</p></div></div><div className="flex gap-1"><button className="rounded-lg p-2 text-muted hover:bg-white/5" onClick={onPause}>{timer.pausedRemaining != null ? <Play/> : <Pause/>}</button><button className="rounded-lg p-2 text-muted hover:bg-white/5" onClick={onReset}><RotateCcw/></button><button className="rounded-lg p-2 text-muted hover:bg-white/5" onClick={onSkip}><SkipForward/></button></div></div><button className="mt-3 w-full rounded-lg border border-line py-1 text-xs font-bold text-lime" onClick={onAdd}>+ 15 segundos</button></div>
}
