import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { useDrinkStore, type ToastItem } from '@/store'

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const STYLES = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-coffee',
}

export function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItemView key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

function ToastItemView({ toast }: { toast: ToastItem }) {
  const hideToast = useDrinkStore(s => s.hideToast)
  const Icon = ICONS[toast.type] || Info

  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-xl ${STYLES[toast.type]} text-white shadow-lg pointer-events-auto animate-slide-up`}
      role="alert"
      aria-live="polite"
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="flex-1 text-sm">{toast.message}</span>
      <button
        onClick={() => hideToast(toast.id)}
        className="p-1 rounded-lg hover:bg-white/20 transition-colors"
        aria-label="关闭提示"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}