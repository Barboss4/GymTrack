import { useLiveQuery } from 'dexie-react-hooks'
import { eachWeekOfInterval, endOfWeek, format, isWithinInterval, startOfWeek, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowRight, Bike, Dumbbell, Ruler, Scale, Sparkles, Trophy } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { db } from '../db'
import { calculateSessionVolume, formatVolume } from '../utils/calculations'
import { EmptyState, PageHeader, Stat } from '../components/ui'

export function DashboardPage({ onStart }: { onStart: (dayId?: string) => void }) {
  const data = useLiveQuery(async () => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const [days, sessions, sets, measurements, cardio, records] = await Promise.all([
      db.workoutDays.orderBy('order').toArray(), db.workoutSessions.toArray(), db.performedSets.toArray(),
      db.bodyMeasurements.orderBy('date').toArray(), db.cardioSessions.orderBy('date').toArray(), db.personalRecords.orderBy('achievedAt').reverse().limit(3).toArray()
    ])
    const completed = sessions.filter(s => s.status === 'completed')
    const inWeek = completed.filter(s => isWithinInterval(new Date(s.finishedAt || s.startedAt), { start: weekStart, end: weekEnd }))
    const weekSetIds = new Set(inWeek.map(s => s.id))
    const weekVolume = calculateSessionVolume(sets.filter(s => weekSetIds.has(s.sessionId)))
    const cardioMinutes = cardio.filter(c => isWithinInterval(new Date(c.date + 'T12:00:00'), { start: weekStart, end: weekEnd })).reduce((sum, c) => sum + c.durationMinutes, 0)
    const chartWeeks = eachWeekOfInterval({ start: subWeeks(weekStart, 5), end: weekStart }, { weekStartsOn: 1 }).map(start => {
      const end = endOfWeek(start, { weekStartsOn: 1 })
      const ids = new Set(completed.filter(s => isWithinInterval(new Date(s.finishedAt || s.startedAt), { start, end })).map(s => s.id))
      return { week: format(start, 'dd/MM'), volume: calculateSessionVolume(sets.filter(s => ids.has(s.sessionId))) }
    })
    return { days, today: days.find(d => d.weekday === now.getDay()), weekSessions: inWeek.length, weekVolume, cardioMinutes, measurements, records, chartWeeks }
  }, [])

  const latestMeasurement = data?.measurements.at(-1)
  return <div>
    <PageHeader title="Seu painel" subtitle={format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })} />
    <section className="card mb-4 overflow-hidden bg-gradient-to-br from-[#17251f] to-panel">
      <p className="eyebrow">Treino de hoje</p>
      <div className="mt-2 flex items-end justify-between gap-3"><div><h2 className="text-3xl font-black">{data?.today?.name || 'Dia livre'}</h2><p className="mt-1 text-sm text-muted">{data?.today?.focus || 'Escolha qualquer treino para começar.'}</p></div><Dumbbell className="hidden text-lime/30 sm:block" size={72} /></div>
      <button className="btn-primary mt-5 w-full py-4 text-base" onClick={() => onStart(data?.today?.id)}>INICIAR TREINO <ArrowRight size={19} /></button>
    </section>

    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="card"><Stat label="Treinos na semana" value={data?.weekSessions ?? '—'} hint="concluídos" /></div>
      <div className="card"><Stat label="Volume semanal" value={data ? formatVolume(data.weekVolume) : '—'} /></div>
      <div className="card"><div className="mb-2 text-mint"><Scale size={18} /></div><Stat label="Último peso" value={latestMeasurement?.weightKg != null ? `${latestMeasurement.weightKg} kg` : 'Sem dados'} /></div>
      <div className="card"><div className="mb-2 text-mint"><Ruler size={18} /></div><Stat label="Último abdômen" value={latestMeasurement?.abdomenCm != null ? `${latestMeasurement.abdomenCm} cm` : 'Sem dados'} /></div>
    </div>

    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <section className="card"><div className="mb-4 flex items-center justify-between"><div><p className="eyebrow">Consistência</p><h2 className="mt-1 font-bold">Volume nas últimas 6 semanas</h2></div><Sparkles className="text-lime" size={20} /></div>
        {data?.chartWeeks.some(w => w.volume > 0) ? <div className="h-52"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.chartWeeks}><defs><linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c8ff32" stopOpacity={.35}/><stop offset="100%" stopColor="#c8ff32" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="week" axisLine={false} tickLine={false}/><Tooltip contentStyle={{ background: '#111816', border: '1px solid #24312d', borderRadius: 12 }} formatter={(v) => [formatVolume(Number(v)), 'Volume']} /><Area type="monotone" dataKey="volume" stroke="#c8ff32" strokeWidth={2} fill="url(#volumeFill)" /></AreaChart></ResponsiveContainer></div> : <EmptyState />}
      </section>
      <div className="space-y-4">
        <section className="card flex items-center justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-mint/10 p-3 text-mint"><Bike /></div><div><p className="text-sm text-muted">Cardio na semana</p><p className="metric">{data?.cardioMinutes ?? 0} min</p></div></div></section>
        <section className="card"><div className="mb-3 flex items-center gap-2"><Trophy size={18} className="text-lime" /><h2 className="font-bold">Últimos recordes</h2></div>{data?.records.length ? <div className="space-y-2">{data.records.map(r => <div key={r.id} className="flex justify-between border-t border-line pt-2 text-sm"><span>{r.type === 'estimated1rm' ? '1RM estimado' : r.type === 'weight' ? 'Maior carga' : 'Volume'}</span><b>{r.value.toFixed(1)}</b></div>)}</div> : <p className="text-sm text-muted">Sem dados registrados</p>}</section>
      </div>
    </div>
  </div>
}
