import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { useDrinkStore, type ToastItem } from '@/store'

const ICON = { success: CheckCircle2, error: AlertCircle, info: Info }

export function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  if (!toasts || toasts.length === 0) return null
  return (
    <div className="fixed bottom-24 left-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => <ToastView key={t.id} toast={t} />)}
    </div>
  )
}

function ToastView({ toast }: { toast: ToastItem }) {
  const hide = useDrinkStore(s => s.hideToast)
  const Icon = ICON[toast.type] || Info
  const tone =
    toast.type === 'success' ? 'text-emerald-500' :
    toast.type === 'error' ? 'text-rose-500' : 'text-brand-600'

  return (
    <div className="pointer-events-auto flex items-center gap-2.5 rounded-2xl bg-white/95 px-4 py-3 shadow-soft ring-1 ring-slate-100 backdrop-blur dark:bg-slate-900/95 dark:ring-slate-800 animate-slide-up">
      <Icon className={'shrink-0 ' + tone} style={{ width: 18, height: 18 }} />
      <span className="flex-1 text-[13px] text-ink-900 dark:text-slate-100">{toast.message}</span>
      <button onClick={() => hide(toast.id)} aria-label="关闭提示" className="p-1 rounded-lg text-ink-400 hover:bg-slate-100 dark:hover:bg-slate-800">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
