import { lazy, Suspense, useEffect, useState } from 'react'
import { Layout, type MainPage } from './components/Layout'
import { initializeDatabase } from './db'
import type { MoreRoute } from './pages/MorePage'

const DashboardPage=lazy(()=>import('./pages/DashboardPage').then(m=>({default:m.DashboardPage})))
const TrainPage=lazy(()=>import('./pages/TrainPage').then(m=>({default:m.TrainPage})))
const HistoryPage=lazy(()=>import('./pages/HistoryPage').then(m=>({default:m.HistoryPage})))
const ProgressPage=lazy(()=>import('./pages/ProgressPage').then(m=>({default:m.ProgressPage})))
const MorePage=lazy(()=>import('./pages/MorePage').then(m=>({default:m.MorePage})))
const MeasurementsPage=lazy(()=>import('./pages/MeasurementsPage').then(m=>({default:m.MeasurementsPage})))
const CardioPage=lazy(()=>import('./pages/CardioPage').then(m=>({default:m.CardioPage})))
const HealthPage=lazy(()=>import('./pages/HealthPage').then(m=>({default:m.HealthPage})))
const ReportPage=lazy(()=>import('./pages/ReportPage').then(m=>({default:m.ReportPage})))
const SettingsPage=lazy(()=>import('./pages/SettingsPage').then(m=>({default:m.SettingsPage})))

export default function App(){
  const [ready,setReady]=useState(false),[error,setError]=useState<string|null>(null),[page,setPage]=useState<MainPage>('home'),[moreRoute,setMoreRoute]=useState<MoreRoute|null>(null),[requestedDay,setRequestedDay]=useState<string>(),[historySession,setHistorySession]=useState<string>()
  useEffect(()=>{initializeDatabase().then(()=>setReady(true)).catch(e=>setError(e instanceof Error?e.message:'Não foi possível abrir o armazenamento local.'))},[])
  const navigate=(next:MainPage)=>{setPage(next);setMoreRoute(null);window.scrollTo({top:0,behavior:'smooth'})}
  const start=(dayId?:string)=>{setRequestedDay(dayId);navigate('train')}
  const finished=(id:string)=>{setHistorySession(id);navigate('history')}
  if(error)return <main className="mx-auto max-w-lg p-6"><div className="card border-red-900"><h1 className="text-xl font-bold text-red-300">Falha no armazenamento</h1><p className="mt-2 text-sm">{error}</p><p className="mt-3 text-sm text-muted">Verifique se o navegador permite IndexedDB e não está em um modo privado restritivo.</p></div></main>
  if(!ready)return <main className="flex min-h-screen items-center justify-center"><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-line border-t-lime"/><p className="mt-3 text-sm text-muted">Preparando seu treino…</p></div></main>
  let content:React.ReactNode
  if(page==='home')content=<DashboardPage onStart={start}/>
  else if(page==='train')content=<TrainPage requestedDayId={requestedDay} onRequestedHandled={()=>setRequestedDay(undefined)} onFinished={finished}/>
  else if(page==='history')content=<HistoryPage initialSessionId={historySession} onInitialHandled={()=>setHistorySession(undefined)}/>
  else if(page==='progress')content=<ProgressPage/>
  else if(moreRoute==='measurements')content=<MeasurementsPage onBack={()=>setMoreRoute(null)}/>
  else if(moreRoute==='cardio')content=<CardioPage onBack={()=>setMoreRoute(null)}/>
  else if(moreRoute==='health')content=<HealthPage onBack={()=>setMoreRoute(null)}/>
  else if(moreRoute==='report')content=<ReportPage onBack={()=>setMoreRoute(null)}/>
  else if(moreRoute==='settings')content=<SettingsPage onBack={()=>setMoreRoute(null)}/>
  else content=<MorePage onOpen={route=>{setMoreRoute(route);window.scrollTo(0,0)}}/>
  return <Layout page={page} onNavigate={navigate}><Suspense fallback={<div className="py-20 text-center text-sm text-muted">Carregando…</div>}>{content}</Suspense></Layout>
}
