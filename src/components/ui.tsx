import type { ReactNode } from 'react'
import { ChevronLeft, X } from 'lucide-react'

export function PageHeader({ title, subtitle, back, action }: { title: string; subtitle?: string; back?: () => void; action?: ReactNode }) {
  return <header className="mb-5 flex items-start justify-between gap-3">
    <div className="flex min-w-0 items-start gap-2">
      {back && <button className="-ml-2 mt-0.5 rounded-xl p-2 text-muted hover:bg-white/5 hover:text-white" onClick={back} aria-label="Voltar"><ChevronLeft /></button>}
      <div className="min-w-0"><h1 className="text-2xl font-bold tracking-tight">{title}</h1>{subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}</div>
    </div>
    {action}
  </header>
}

export function EmptyState({ children = 'Sem dados registrados' }: { children?: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">{children}</div>
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true">
    <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-line bg-panel p-5 shadow-2xl sm:rounded-3xl">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button className="rounded-lg p-2 text-muted hover:bg-white/5" onClick={onClose} aria-label="Fechar"><X /></button></div>
      {children}
    </div>
  </div>
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="label">{label}</span>{children}</label>
}

export const numberOrUndefined = (value: FormDataEntryValue | null) => value === null || value === '' ? undefined : Number(value)

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return <div><p className="text-xs uppercase tracking-wider text-muted">{label}</p><div className="mt-1 text-xl font-bold">{value}</div>{hint && <p className="mt-1 text-xs text-muted">{hint}</p>}</div>
}
