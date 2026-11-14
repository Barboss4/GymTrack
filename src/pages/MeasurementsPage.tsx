import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { db } from '../db'
import type { BodyMeasurement } from '../types'
import { newId, nowIso } from '../utils/ids'
import { percentageChange } from '../utils/calculations'
import { EmptyState, Field, Modal, PageHeader, numberOrUndefined } from '../components/ui'

const fields: { key: keyof BodyMeasurement; label: string; unit: string }[] = [
  {key:'weightKg',label:'Peso corporal',unit:'kg'},{key:'waistCm',label:'Cintura',unit:'cm'},{key:'abdomenCm',label:'Abdômen (umbigo)',unit:'cm'},{key:'chestCm',label:'Peitoral',unit:'cm'},
  {key:'rightArmCm',label:'Braço direito',unit:'cm'},{key:'leftArmCm',label:'Braço esquerdo',unit:'cm'},{key:'rightForearmCm',label:'Antebraço direito',unit:'cm'},{key:'leftForearmCm',label:'Antebraço esquerdo',unit:'cm'},
  {key:'rightThighCm',label:'Coxa direita',unit:'cm'},{key:'leftThighCm',label:'Coxa esquerda',unit:'cm'},{key:'rightCalfCm',label:'Panturrilha direita',unit:'cm'},{key:'leftCalfCm',label:'Panturrilha esquerda',unit:'cm'},{key:'hipsCm',label:'Quadril',unit:'cm'}
]

export function MeasurementsPage({ onBack }: { onBack:()=>void }) {
  const measurements=useLiveQuery(()=>db.bodyMeasurements.orderBy('date').toArray(),[])
  const profile=useLiveQuery(()=>db.userProfile.get('profile'),[])
  const goalsSetting=useLiveQuery(()=>db.settings.where('key').equals('measurementGoals').first(),[])
  const [form,setForm]=useState(false),[metric,setMetric]=useState<keyof BodyMeasurement>('weightKg')
  const metricInfo=fields.find(f=>f.key===metric)!
  const series=(measurements||[]).filter(m=>typeof m[metric]==='number').map(m=>({date:format(new Date(m.date+'T12:00:00'),'dd/MM/yy'),value:m[metric] as number}))
  const first=series[0]?.value,current=series.at(-1)?.value,change=first!=null&&current!=null?current-first:null,pct=percentageChange(first,current)
  const latest=measurements?.at(-1),ratio=latest?.waistCm&&profile?.heightCm?latest.waistCm/profile.heightCm:null
  const goals=(goalsSetting?.value||{}) as Record<string,number>
  const saveGoal=async(value:string)=>{if(!goalsSetting)return;const next={...goals};if(value==='')delete next[String(metric)];else next[String(metric)]=Number(value);await db.settings.update(goalsSetting.id,{value:next,updatedAt:nowIso()})}
  return <div><PageHeader title="Medidas corporais" subtitle="Registre apenas o que mediu. Todos os campos são opcionais." back={onBack} action={<button className="btn-primary !px-3" onClick={()=>setForm(true)}><Plus/> <span className="hidden sm:inline">Registrar</span></button>} />
    <label className="mb-4 block"><span className="label">Medida no gráfico</span><select value={metric} onChange={e=>setMetric(e.target.value as keyof BodyMeasurement)}>{fields.map(f=><option key={f.key} value={f.key}>{f.label}</option>)}</select></label>
    <div className="card mb-4 flex items-end gap-3"><div className="flex-1"><label className="label">Meta individual para {metricInfo.label.toLowerCase()}</label><input key={String(metric)} type="number" min="0" step="0.1" defaultValue={goals[String(metric)]??''} onBlur={e=>saveGoal(e.target.value)} placeholder="Sem meta definida"/></div><span className="pb-3 text-sm text-muted">{metricInfo.unit}</span></div>
    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><div className="card"><p className="label">Inicial</p><p className="metric">{first!=null?`${first} ${metricInfo.unit}`:'—'}</p></div><div className="card"><p className="label">Atual</p><p className="metric">{current!=null?`${current} ${metricInfo.unit}`:'—'}</p></div><div className="card"><p className="label">Diferença</p><p className="metric">{change!=null?`${change>=0?'+':''}${change.toFixed(1)} ${metricInfo.unit}`:'—'}</p></div><div className="card"><p className="label">Variação</p><p className="metric">{pct!=null?`${pct>=0?'+':''}${pct.toFixed(1)}%`:'—'}</p></div></div>
    <section className="card mb-4"><h2 className="mb-4 font-bold">Histórico de {metricInfo.label.toLowerCase()}</h2>{series.length?<div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={series}><XAxis dataKey="date"/><YAxis domain={['auto','auto']}/><Tooltip contentStyle={{background:'#111816',border:'1px solid #24312d',borderRadius:12}} formatter={v=>[`${v} ${metricInfo.unit}`,metricInfo.label]}/><Line type="monotone" dataKey="value" stroke="#c8ff32" strokeWidth={3}/></LineChart></ResponsiveContainer></div>:<EmptyState/>}</section>
    {ratio!=null&&<div className="card mb-4"><p className="label">Relação cintura / altura</p><p className="metric">{ratio.toFixed(2)}</p><p className="mt-1 text-xs text-muted">Cálculo descritivo; não é um diagnóstico.</p></div>}
    <div className="space-y-2">{measurements?.slice().reverse().map(m=><div className="card flex items-center justify-between" key={m.id}><div><b>{format(new Date(m.date+'T12:00:00'),'dd/MM/yyyy')}</b><p className="mt-1 text-xs text-muted">{fields.filter(f=>m[f.key]!=null).map(f=>`${f.label}: ${m[f.key]} ${f.unit}`).join(' · ')||'Sem valores'}</p>{m.notes&&<p className="mt-1 text-xs">{m.notes}</p>}</div><button className="p-2 text-muted hover:text-red-300" onClick={()=>window.confirm('Excluir este registro?')&&db.bodyMeasurements.delete(m.id)}><Trash2 size={18}/></button></div>)}</div>
    <p className="mt-4 text-xs text-muted">Variações de circunferência não são interpretadas automaticamente como ganho de músculo ou perda de gordura.</p>
    {form&&<MeasurementForm onClose={()=>setForm(false)}/>} 
  </div>
}

function MeasurementForm({onClose}:{onClose:()=>void}) {
  const save=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();const fd=new FormData(e.currentTarget),time=nowIso();const row:BodyMeasurement={id:newId('measure'),date:String(fd.get('date')),notes:String(fd.get('notes')||''),createdAt:time,updatedAt:time};for(const f of fields)(row as unknown as Record<string,unknown>)[f.key]=numberOrUndefined(fd.get(String(f.key)));await db.bodyMeasurements.add(row);onClose()}
  return <Modal title="Nova medição" onClose={onClose}><form onSubmit={save} className="space-y-3"><Field label="Data"><input type="date" name="date" required defaultValue={format(new Date(),'yyyy-MM-dd')}/></Field><div className="grid grid-cols-2 gap-3">{fields.map(f=><Field key={f.key} label={`${f.label} (${f.unit})`}><input type="number" min="0" step="0.1" name={String(f.key)} /></Field>)}</div><Field label="Observações"><textarea name="notes" rows={2}/></Field><button className="btn-primary w-full" type="submit">Salvar medição</button></form></Modal>
}
