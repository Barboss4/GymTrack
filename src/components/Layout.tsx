import { Activity, BarChart3, Dumbbell, History, Home, MoreHorizontal } from 'lucide-react'
import type { ReactNode } from 'react'

export type MainPage = 'home' | 'train' | 'history' | 'progress' | 'more'

const items: { id: MainPage; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Início', icon: Home },
  { id: 'train', label: 'Treinar', icon: Dumbbell },
  { id: 'history', label: 'Histórico', icon: History },
  { id: 'progress', label: 'Evolução', icon: BarChart3 },
  { id: 'more', label: 'Mais', icon: MoreHorizontal }
]

export function Layout({ page, onNavigate, children }: { page: MainPage; onNavigate: (page: MainPage) => void; children: ReactNode }) {
  return <div className="min-h-screen pb-24">
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-5 sm:px-6 lg:pt-8">
      <div className="mb-7 flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime text-ink"><Activity size={20} strokeWidth={3} /></div><span className="text-lg font-extrabold tracking-tight">GYMTRACK</span><span className="ml-1 rounded-full border border-line px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">offline</span></div>
      {children}
    </div>
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-[#0b110f]/95 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
      <div className="mx-auto flex max-w-xl justify-around px-2">{items.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => onNavigate(id)} className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium ${page === id ? 'text-lime' : 'text-muted'}`} aria-current={page === id ? 'page' : undefined}><Icon size={21} strokeWidth={page === id ? 2.5 : 2} />{label}</button>)}</div>
    </nav>
  </div>
}
