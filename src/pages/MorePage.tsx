import { Bike, ChevronRight, ClipboardList, Database, HeartPulse, Ruler } from 'lucide-react'
import { PageHeader } from '../components/ui'

export type MoreRoute='measurements'|'cardio'|'health'|'report'|'settings'
const items=[
  {id:'measurements' as const,title:'Medidas corporais',description:'Peso, circunferências e metas',icon:Ruler},
  {id:'cardio' as const,title:'Cardio',description:'Bicicleta, metas e evolução',icon:Bike},
  {id:'health' as const,title:'Suplementos e Saúde',description:'Suplementos, recuperação e exames',icon:HeartPulse},
  {id:'report' as const,title:'Relatório mensal',description:'Resumo de treino, medidas e cardio',icon:ClipboardList},
  {id:'settings' as const,title:'Configurações e backup',description:'Perfil, programa, exportação e restauração',icon:Database}
]
export function MorePage({onOpen}:{onOpen:(route:MoreRoute)=>void}){return <div><PageHeader title="Mais" subtitle="Acompanhamento corporal, saúde e configurações."/><div className="grid gap-3 sm:grid-cols-2">{items.map(({id,title,description,icon:Icon})=><button key={id} className="card flex items-center gap-4 text-left transition hover:border-lime/40" onClick={()=>onOpen(id)}><div className="rounded-xl bg-lime/10 p-3 text-lime"><Icon/></div><div className="flex-1"><h2 className="font-bold">{title}</h2><p className="text-sm text-muted">{description}</p></div><ChevronRight className="text-muted"/></button>)}</div></div>}
