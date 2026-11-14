import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { endOfWeek, format, startOfWeek } from 'date-fns'
import { Activity, CalendarDays, TrendingUp, Trophy } from 'lucide-react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { db } from '../db'
import { calculateSessionVolume, estimateOneRepMax, formatVolume } from '../utils/calculations'
import { EmptyState, PageHeader, Stat } from '../components/ui'

export function ProgressPage() {
  const exercises = useLiveQuery(() => db.exercises.filter(e=>!e.archived).sortBy('name'), [])
  const [exerciseId, setExerciseId] = useState<string>('')
  const selectedId = exerciseId || exercises?.[0]?.id || ''
  const data = useLiveQuery(async () => {
    if (!selectedId) return []
    const [sets,sessions] = await Promise.all([db.performedSets.where('exerciseId').equals(selectedId).toArray(),db.workoutSessions.where('status').equals('completed').toArray()])
    const sessionMap=new Map(sessions.map(s=>[s.id,s]))
    return [...new Set(sets.filter(s=>s.completed&&!s.warmup&&sessionMap.has(s.sessionId)).map(s=>s.sessionId))].map(id=>{
      const current=sets.filter(s=>s.sessionId===id&&s.completed&&!s.warmup), session=sessionMap.get(id)!
      return { date:format(new Date(session.startedAt),'dd/MM/yy'), timestamp:session.startedAt, load:Math.max(...current.map(s=>s.weight),0), reps:Math.max(...current.map(s=>s.reps),0), volume:calculateSessionVolume(current), oneRm:Math.max(...current.map(s=>estimateOneRepMax(s.weight,s.reps)),0), sets:current.length }
    }).sort((a,b)=>a.timestamp.localeCompare(b.timestamp))
  }, [selectedId])
  const muscleData = useLiveQuery(async()=>{
    const [sets,exercises,sessions]=await Promise.all([db.performedSets.toArray(),db.exercises.toArray(),db.workoutSessions.where('status').equals('completed').toArray()])
    const eMap=new Map(exercises.map(e=>[e.id,e])), sMap=new Map(sessions.map(s=>[s.id,s])); const map=new Map<string,Record<string,number|string>>()
    for(const set of sets.filter(s=>s.completed&&!s.warmup&&sMap.has(s.sessionId))){ const session=sMap.get(set.sessionId)!, weekStart=startOfWeek(new Date(session.startedAt),{weekStartsOn:1}), key=weekStart.toISOString(), muscle=eMap.get(set.exerciseId)?.muscleGroup||'Outro'; const row=map.get(key)||{week:format(weekStart,'dd/MM'),timestamp:key}; row[muscle]=Number(row[muscle]||0)+1; map.set(key,row) }
    return [...map.values()].sort((a,b)=>String(a.timestamp).localeCompare(String(b.timestamp))).slice(-8)
  },[])
  const latest=data?.at(-1), first=data?.[0]
  const trend=useMemo(()=>data&&data.length>=2?data.at(-1)!.volume-data.at(-2)!.volume:null,[data])
  const muscles=muscleData ? [...new Set(muscleData.flatMap(r=>Object.keys(r).filter(k=>!['week','timestamp'].includes(k))))] : []
  const colors=['#c8ff32','#7df0bd','#6ea8fe','#f7b267','#d78cff','#ff7477']
  return <div><PageHeader title="Evolução" subtitle="Carga, repetições, volume e força estimada — sem atalhos enganosos." />
    <label className="mb-4 block"><span className="label">Exercício</span><select value={selectedId} onChange={e=>setExerciseId(e.target.value)}>{exercises?.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
    {data?.length ? <>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><div className="card"><Stat label="Maior carga" value={`${Math.max(...data.map(d=>d.load))} kg`} /></div><div className="card"><Stat label="1RM estimado" value={`${Math.max(...data.map(d=>d.oneRm)).toFixed(1)} kg`} hint="Fórmula de Epley" /></div><div className="card"><Stat label="Frequência" value={`${data.length} sessões`} /></div><div className="card"><Stat label="Tendência recente" value={trend==null?'—':`${trend>=0?'+':''}${formatVolume(trend)}`} hint="volume vs. sessão anterior" /></div></div>
      <section className="card mb-4"><div className="mb-4 flex items-center gap-2"><TrendingUp className="text-lime" size={19}/><h2 className="font-bold">Desempenho por sessão</h2></div><div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid stroke="#24312d" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date"/><YAxis yAxisId="left"/><YAxis yAxisId="right" orientation="right"/><Tooltip contentStyle={{background:'#111816',border:'1px solid #24312d',borderRadius:12}}/><Legend/><Line yAxisId="left" type="monotone" dataKey="load" name="Carga máx. (kg)" stroke="#c8ff32" strokeWidth={2}/><Line yAxisId="left" type="monotone" dataKey="oneRm" name="1RM estimado" stroke="#7df0bd" strokeWidth={2}/><Line yAxisId="right" type="monotone" dataKey="reps" name="Repetições" stroke="#6ea8fe" strokeWidth={2}/></LineChart></ResponsiveContainer></div><p className="mt-3 text-xs text-muted">1RM é apenas uma estimativa e perde precisão em séries com muitas repetições.</p></section>
      <section className="card mb-4"><div className="mb-4 flex items-center gap-2"><Activity className="text-mint" size={19}/><h2 className="font-bold">Volume por sessão</h2></div><div className="h-52"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid stroke="#24312d" vertical={false}/><XAxis dataKey="date"/><YAxis/><Tooltip contentStyle={{background:'#111816',border:'1px solid #24312d',borderRadius:12}} formatter={v=>[formatVolume(Number(v)),'Volume']}/><Line type="monotone" dataKey="volume" stroke="#c8ff32" strokeWidth={3}/></LineChart></ResponsiveContainer></div></section>
      <section className="card mb-4"><div className="flex items-center gap-3"><Trophy className="text-lime"/><div><p className="text-sm text-muted">Progresso desde a primeira sessão</p><p className="font-bold">{first&&latest?`${first.load} kg → ${latest.load} kg · ${formatVolume(first.volume)} → ${formatVolume(latest.volume)}`:'—'}</p></div></div></section>
    </>:<EmptyState>Conclua sessões deste exercício para gerar os gráficos.</EmptyState>}
    <section className="card mt-4"><div className="mb-4 flex items-center gap-2"><CalendarDays className="text-lime" size={19}/><div><h2 className="font-bold">Séries diretas por grupo muscular</h2><p className="text-xs text-muted">Últimas semanas · séries indiretas não são somadas para evitar dupla contagem.</p></div></div>{muscleData?.length?<div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={muscleData}><CartesianGrid stroke="#24312d" vertical={false}/><XAxis dataKey="week"/><YAxis allowDecimals={false}/><Tooltip contentStyle={{background:'#111816',border:'1px solid #24312d',borderRadius:12}}/><Legend/>{muscles.map((m,i)=><Line key={m} type="monotone" dataKey={m} stroke={colors[i%colors.length]} strokeWidth={2}/>)}</LineChart></ResponsiveContainer></div>:<EmptyState/>}</section>
  </div>
}
