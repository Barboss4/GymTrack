import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight, Clock, Dumbbell, Scale, Trash2 } from 'lucide-react'
import { db } from '../db'
import type { PerformedSet, WorkoutSession } from '../types'
import { calculateSessionVolume, durationMinutes, formatVolume } from '../utils/calculations'
import { EmptyState, Modal, PageHeader } from '../components/ui'
import { nowIso } from '../utils/ids'

export function HistoryPage({ initialSessionId, onInitialHandled }: { initialSessionId?: string; onInitialHandled: () => void }) {
  const sessions = useLiveQuery(() => db.workoutSessions.where('status').equals('completed').reverse().sortBy('startedAt'), [])
  const [selected, setSelected] = useState<string | null>(initialSessionId || null)
  useEffect(() => { if (initialSessionId) { setSelected(initialSessionId); onInitialHandled() } }, [initialSessionId])
  return <div><PageHeader title="Histórico" subtitle="Seus treinos concluídos, preservados como foram realizados." />
    {!sessions?.length ? <EmptyState>Finalize seu primeiro treino para vê-lo aqui.</EmptyState> : <div className="space-y-3">{sessions.map(session => <SessionRow key={session.id} session={session} onOpen={() => setSelected(session.id)} />)}</div>}
    {selected && <SessionDetails sessionId={selected} onClose={() => setSelected(null)} />}
  </div>
}

function SessionRow({ session, onOpen }: { session: WorkoutSession; onOpen: () => void }) {
  const sets = useLiveQuery(() => db.performedSets.where('sessionId').equals(session.id).toArray(), [session.id])
  return <button onClick={onOpen} className="card flex w-full items-center gap-4 text-left transition hover:border-lime/40"><div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-lime/10 text-lime"><b>{format(new Date(session.startedAt),'dd')}</b><span className="text-[9px] uppercase">{format(new Date(session.startedAt),'MMM',{locale:ptBR})}</span></div><div className="min-w-0 flex-1"><h2 className="font-bold">{session.workoutName}</h2><div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted"><span>{sets?.filter(s=>s.completed).length || 0} séries</span><span>{sets ? formatVolume(calculateSessionVolume(sets)) : '—'}</span><span>{durationMinutes(session.startedAt,session.finishedAt,session.totalPausedMs)} min</span></div></div><ChevronRight className="text-muted" /></button>
}

function SessionDetails({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const session = useLiveQuery(() => db.workoutSessions.get(sessionId), [sessionId])
  const sets = useLiveQuery(() => db.performedSets.where('sessionId').equals(sessionId).toArray(), [sessionId])
  const previous = useLiveQuery(async () => {
    const current = await db.workoutSessions.get(sessionId); if (!current) return null
    const candidates = await db.workoutSessions.where('workoutDayId').equals(current.workoutDayId).toArray()
    const prior = candidates.filter(s=>s.status==='completed'&&s.startedAt<current.startedAt).sort((a,b)=>b.startedAt.localeCompare(a.startedAt))[0]
    if (!prior) return null
    return { session: prior, sets: await db.performedSets.where('sessionId').equals(prior.id).toArray() }
  }, [sessionId])
  if (!session || !sets) return null
  const groups = [...new Map(sets.sort((a,b)=>a.exerciseOrder-b.exerciseOrder||a.setOrder-b.setOrder).map(s=>[s.exerciseId,s.exerciseName])).entries()]
  const remove = async () => {
    if (!window.confirm('Excluir este treino e todas as séries? Esta ação não pode ser desfeita.')) return
    await db.transaction('rw',[db.workoutSessions,db.performedSets,db.personalRecords],async()=>{ await db.performedSets.where('sessionId').equals(sessionId).delete(); await db.personalRecords.where('sessionId').equals(sessionId).delete(); await db.workoutSessions.delete(sessionId) }); onClose()
  }
  const update = (set: PerformedSet, change: Partial<PerformedSet>) => db.performedSets.update(set.id,{...change,updatedAt:nowIso()})
  return <Modal title={session.workoutName} onClose={onClose}>
    <p className="mb-4 text-sm text-muted">{format(new Date(session.startedAt),"d 'de' MMMM 'de' yyyy · HH:mm",{locale:ptBR})}</p>
    <div className="mb-4 grid grid-cols-3 gap-2"><div className="card !p-3 text-center"><Clock className="mx-auto mb-1 text-mint" size={17}/><b>{durationMinutes(session.startedAt,session.finishedAt,session.totalPausedMs)} min</b></div><div className="card !p-3 text-center"><Dumbbell className="mx-auto mb-1 text-mint" size={17}/><b>{sets.filter(s=>s.completed).length} séries</b></div><div className="card !p-3 text-center"><Scale className="mx-auto mb-1 text-mint" size={17}/><b>{formatVolume(calculateSessionVolume(sets))}</b></div></div>
    <div className="space-y-4">{groups.map(([exerciseId,name])=>{ const currentSets=sets.filter(s=>s.exerciseId===exerciseId); const priorSets=previous?.sets.filter(s=>s.exerciseId===exerciseId&&s.completed&&!s.warmup); return <section key={exerciseId}><div className="mb-2 flex items-end justify-between"><h3 className="font-bold">{name}</h3>{priorSets?.length ? <span className="text-[10px] text-muted">anterior: {priorSets.map(s=>`${s.weight}×${s.reps}`).join(' · ')}</span>:null}</div><div className="space-y-2">{currentSets.map(set=><div key={set.id} className="grid grid-cols-[36px_1fr_1fr_64px] items-center gap-2"><span className="text-center text-xs text-muted">{set.warmup?'AQ':set.setOrder}</span><input type="number" value={set.weight||''} onChange={e=>update(set,{weight:Number(e.target.value)})} aria-label="Peso"/><input type="number" value={set.reps||set.durationSeconds||''} onChange={e=>update(set,set.durationSeconds!=null?{durationSeconds:Number(e.target.value)}:{reps:Number(e.target.value)})} aria-label="Repetições"/><input type="number" value={set.rir??''} onChange={e=>update(set,{rir:e.target.value===''?undefined:Number(e.target.value)})} aria-label="RIR"/></div>)}</div></section>})}</div>
    <label className="mt-4 block"><span className="label">Observações</span><textarea defaultValue={session.notes} rows={3} onBlur={e=>db.workoutSessions.update(session.id,{notes:e.target.value,updatedAt:nowIso()})}/></label>
    <p className="mt-3 text-xs text-muted">Os campos podem ser corrigidos. Alterações no plano atual nunca modificam este histórico.</p>
    <button className="btn-danger mt-5 w-full" onClick={remove}><Trash2 size={17}/> Excluir treino</button>
  </Modal>
}
