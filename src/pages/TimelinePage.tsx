import { useMemo, useState } from 'react'
import { useDrinkStore } from '@/store'
import type { DrinkLog } from '@/types'
import { DrinkArtwork, fallbackArt } from '@/components/DrinkArtwork'
import { DrinkRecordModal } from '@/components/DrinkRecordModal'
import { formatTime, formatRelativeTime } from '@/utils/format'
import { Trash2, Pencil, Copy, Plus, Check, X, CalendarDays } from 'lucide-react'

type Filter = '48h' | 'week' | 'all'

function toLocalInput(ts: number): string {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes())
}

function dayKey(ts: number): string {
  const d = new Date(ts)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

function dayLabel(ts: number): string {
  const target = dayKey(ts)
  const today = dayKey(Date.now())
  const y = new Date()
  y.setDate(y.getDate() - 1)
  if (target === today) return '今天'
  if (target === dayKey(y.getTime())) return '昨天'
  return new Date(ts).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

export default function TimelinePage() {
  const logs = useDrinkStore(s => s.logs)
  const updateLog = useDrinkStore(s => s.updateLog)
  const addLog = useDrinkStore(s => s.addLog)
  const deleteLog = useDrinkStore(s => s.deleteLog)
  const showToast = useDrinkStore(s => s.showToast)

  const [filter, setFilter] = useState<Filter>('48h')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ caffeineMg: 0, sugarG: 0, caloriesKcal: 0, consumedAt: 0 })
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)

  const filtered = useMemo(() => {
    const now = Date.now()
    if (filter === '48h') return logs.filter(l => l.consumedAt >= now - 48 * 3600 * 1000)
    if (filter === 'week') return logs.filter(l => l.consumedAt >= now - 7 * 24 * 3600 * 1000)
    return logs
  }, [logs, filter])

  const groups = useMemo(() => {
    const map = new Map<string, DrinkLog[]>()
    for (const log of filtered) {
      const k = dayKey(log.consumedAt)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(log)
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [filtered])

  const startEdit = (log: DrinkLog) => {
    setEditingId(log.id)
    setForm({ caffeineMg: log.caffeineMg, sugarG: log.sugarG, caloriesKcal: log.caloriesKcal, consumedAt: log.consumedAt })
  }

  const save = async (log: DrinkLog) => {
    await updateLog(log.id, {
      caffeineMg: Number(form.caffeineMg),
      sugarG: Number(form.sugarG),
      caloriesKcal: Number(form.caloriesKcal),
      consumedAt: Number(form.consumedAt),
    })
    setEditingId(null)
    showToast('已保存', 'success')
  }

  const duplicate = async (log: DrinkLog) => {
    await addLog({
      templateId: log.templateId,
      brand: log.brand,
      name: log.name,
      category: log.category,
      baseType: log.baseType,
      size: log.size,
      caffeineMg: log.caffeineMg,
      sugarG: log.sugarG,
      caloriesKcal: log.caloriesKcal,
      art: log.art,
      consumedAt: Date.now(),
    })
    showToast('已复制一杯', 'success')
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-5 pt-6 pb-28 space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-[22px] font-semibold tracking-tight">时间线</h1>
          <button onClick={() => setComposeOpen(true)} className="btn-secondary py-2 px-3.5 text-[13px]">
            <Plus className="w-4 h-4 mr-1" /> 补记
          </button>
        </header>

        <div className="inline-flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          {(['48h', 'week', 'all'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                'px-4 py-1.5 rounded-xl text-[12.5px] font-medium transition-colors ' +
                (filter === f ? 'bg-white text-ink-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-ink-400')
              }
            >
              {f === '48h' ? '48 小时' : f === 'week' ? '一周内' : '全部'}
            </button>
          ))}
        </div>

        {groups.length === 0 && (
          <div className="flex flex-col items-center py-20 text-ink-400">
            <CalendarDays className="w-9 h-9 mb-3 opacity-40" />
            <p className="text-[13.5px]">还没有记录</p>
            <p className="text-[12px] mt-1 opacity-70">点右上角「补记」添加一杯</p>
          </div>
        )}

        {groups.map(([key, list]) => {
          const caf = list.reduce((s, l) => s + l.caffeineMg, 0)
          const sug = list.reduce((s, l) => s + l.sugarG, 0)
          return (
            <section key={key} className="space-y-2.5">
              <div className="flex items-baseline justify-between px-1 pt-1">
                <h2 className="text-[13px] font-medium text-ink-500 dark:text-slate-400">{dayLabel(list[0].consumedAt)}</h2>
                <p className="text-[11px] text-ink-400">{list.length} 杯 · {Math.round(caf)}mg · {sug.toFixed(1)}g</p>
              </div>

              {list.map(log =>
                editingId === log.id ? (
                  <div key={log.id} className="card p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <DrinkArtwork art={log.art ?? fallbackArt(log.category, log.baseType)} size={38} />
                      <p className="text-[14px] font-medium truncate">{log.name}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {([['caffeineMg', '咖啡因 mg'], ['sugarG', '糖 g'], ['caloriesKcal', '热量 kcal']] as const).map(([k, label]) => (
                        <div key={k}>
                          <label className="block text-[11px] text-ink-400 mb-1">{label}</label>
                          <input
                            type="number"
                            className="input py-2 text-[13px]"
                            value={form[k]}
                            onChange={e => setForm({ ...form, [k]: Number(e.target.value) })}
                          />
                        </div>
                      ))}
                    </div>
                    <input
                      type="datetime-local"
                      className="input py-2 text-[13px]"
                      value={toLocalInput(form.consumedAt)}
                      onChange={e => setForm({ ...form, consumedAt: new Date(e.target.value).getTime() })}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => save(log)} className="btn-primary flex-1 py-2.5 text-[13.5px]">
                        <Check className="w-4 h-4 mr-1" /> 保存
                      </button>
                      <button onClick={() => setEditingId(null)} className="btn-ghost flex-1 py-2.5 text-[13.5px]">
                        <X className="w-4 h-4 mr-1" /> 取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={log.id} className="card px-3.5 py-3">
                    <div className="flex items-center gap-3">
                      <DrinkArtwork art={log.art ?? fallbackArt(log.category, log.baseType)} size={42} className="shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium truncate">{log.name}</p>
                        <p className="text-[11.5px] leading-snug text-ink-400">
                          {log.brand} · {Math.round(log.caffeineMg)}mg · {log.sugarG.toFixed(1)}g · {Math.round(log.caloriesKcal)}kcal
                        </p>
                        <p className="text-[11px] text-ink-400/80 mt-0.5">{formatTime(log.consumedAt)} · {formatRelativeTime(log.consumedAt)}</p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => startEdit(log)} aria-label="编辑" className="p-1.5 rounded-lg text-ink-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => duplicate(log)} aria-label="复制" className="p-1.5 rounded-lg text-ink-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmId(log.id)} aria-label="删除" className="p-1.5 rounded-lg text-ink-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </section>
          )
        })}
      </div>

      <DrinkRecordModal isOpen={composeOpen} onClose={() => setComposeOpen(false)} template={null} />

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="modal-backdrop" onClick={() => setConfirmId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-5 animate-slide-up dark:bg-slate-900">
            <h3 className="text-[15px] font-semibold mb-1.5">删除这条记录？</h3>
            <p className="text-[12.5px] text-ink-400 mb-5">统计数字会同步更新，无法恢复。</p>
            <div className="flex gap-2.5">
              <button
                onClick={async () => { await deleteLog(confirmId); setConfirmId(null); showToast('已删除', 'success') }}
                className="btn-danger flex-1"
              >
                删除
              </button>
              <button onClick={() => setConfirmId(null)} className="btn-ghost flex-1">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
