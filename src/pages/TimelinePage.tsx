import { useMemo, useState } from 'react'
import { useDrinkStore } from '@/store'
import type { DrinkLog } from '@/types'
import { getCategoryColor, getCategoryLabel, formatTime, formatRelativeTime } from '@/utils/format'
import { Trash2, Pencil, Copy, Plus, Calendar, Check, X } from 'lucide-react'
import { DrinkRecordModal } from '@/components/DrinkRecordModal'

type Filter = 'today' | '48h' | 'all'

const CATEGORY_EMOJI: Record<string, string> = {
  coffee: '☕',
  milk_tea: '🧋',
  tea: '🍵',
  other: '🥤',
}

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

  const [filter, setFilter] = useState<Filter>('today')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ caffeineMg: 0, sugarG: 0, caloriesKcal: 0, consumedAt: 0 })
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeTime, setComposeTime] = useState<number>(Date.now())

  const filtered = useMemo(() => {
    const now = Date.now()
    if (filter === 'today') {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      return logs.filter(l => l.consumedAt >= start.getTime())
    }
    if (filter === '48h') return logs.filter(l => l.consumedAt >= now - 48 * 3600 * 1000)
    return logs
  }, [logs, filter])

  const groups = useMemo(() => {
    const map = new Map<string, DrinkLog[]>()
    for (const log of filtered) {
      const key = dayKey(log.consumedAt)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(log)
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [filtered])

  const startEdit = (log: DrinkLog) => {
    setEditingId(log.id)
    setEditForm({
      caffeineMg: log.caffeineMg,
      sugarG: log.sugarG,
      caloriesKcal: log.caloriesKcal,
      consumedAt: log.consumedAt,
    })
  }

  const saveEdit = async (log: DrinkLog) => {
    await updateLog(log.id, {
      caffeineMg: Number(editForm.caffeineMg),
      sugarG: Number(editForm.sugarG),
      caloriesKcal: Number(editForm.caloriesKcal),
      consumedAt: Number(editForm.consumedAt),
    })
    setEditingId(null)
    showToast('已保存修改', 'success')
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
      consumedAt: Date.now(),
    })
    showToast('已复制一条到当前时间', 'success')
  }

  const doDelete = async (id: string) => {
    await deleteLog(id)
    setConfirmId(null)
    showToast('记录已删除', 'success')
  }

  return (
    <div className="h-full overflow-y-auto pb-24">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">时间线</h2>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5">
              {(['today', '48h', 'all'] as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ' +
                    (filter === f ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500')
                  }
                >
                  {f === 'today' ? '今天' : f === '48h' ? '48小时' : '全部'}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setComposeTime(Date.now())
                setComposeOpen(true)
              }}
              className="btn-secondary px-3 py-2 text-sm"
            >
              <Plus className="w-4 h-4 mr-1" /> 补记
            </button>
          </div>
        </div>

        {groups.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Calendar className="w-14 h-14 mx-auto mb-3 opacity-30" />
            <p className="text-base">暂无记录</p>
            <p className="text-sm mt-1 text-gray-400">点右上角「补记」添加一杯</p>
          </div>
        )}

        {groups.map(([key, list]) => {
          const dayCaffeine = list.reduce((s, l) => s + l.caffeineMg, 0)
          const daySugar = list.reduce((s, l) => s + l.sugarG, 0)
          const dayCal = list.reduce((s, l) => s + l.caloriesKcal, 0)
          return (
            <section key={key} className="space-y-2">
              <div className="flex items-baseline justify-between px-1">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">{dayLabel(list[0].consumedAt)}</h3>
                <p className="text-[11px] text-gray-400">
                  {list.length} 杯 · {Math.round(dayCaffeine)}mg · {daySugar.toFixed(1)}g · {Math.round(dayCal)}kcal
                </p>
              </div>

              {list.map(log =>
                editingId === log.id ? (
                  <div key={log.id} className="card p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: getCategoryColor(log.category) + '20' }}
                      >
                        {CATEGORY_EMOJI[log.category]}
                      </span>
                      <p className="font-medium text-sm truncate">{log.brand} {log.name}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] text-gray-500 mb-1">咖啡因 mg</label>
                        <input
                          type="number"
                          value={editForm.caffeineMg}
                          onChange={e => setEditForm({ ...editForm, caffeineMg: Number(e.target.value) })}
                          className="input py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-500 mb-1">糖 g</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.sugarG}
                          onChange={e => setEditForm({ ...editForm, sugarG: Number(e.target.value) })}
                          className="input py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-500 mb-1">热量 kcal</label>
                        <input
                          type="number"
                          value={editForm.caloriesKcal}
                          onChange={e => setEditForm({ ...editForm, caloriesKcal: Number(e.target.value) })}
                          className="input py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">饮用时间</label>
                      <input
                        type="datetime-local"
                        value={toLocalInput(editForm.consumedAt)}
                        onChange={e => setEditForm({ ...editForm, consumedAt: new Date(e.target.value).getTime() })}
                        className="input py-2 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(log)} className="btn-primary flex-1 py-2 text-sm">
                        <Check className="w-4 h-4 mr-1" /> 保存
                      </button>
                      <button onClick={() => setEditingId(null)} className="btn-ghost flex-1 py-2 text-sm">
                        <X className="w-4 h-4 mr-1" /> 取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={log.id} className="card p-3">
                    <div className="flex items-start gap-3">
                      <span
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ backgroundColor: getCategoryColor(log.category) + '20' }}
                      >
                        {CATEGORY_EMOJI[log.category]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{log.brand} {log.name}</span>
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{ backgroundColor: getCategoryColor(log.category) + '20', color: getCategoryColor(log.category) }}
                          >
                            {getCategoryLabel(log.category)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {log.size} · {Math.round(log.caffeineMg)}mg · {log.sugarG.toFixed(1)}g · {Math.round(log.caloriesKcal)}kcal
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {formatTime(log.consumedAt)} · {formatRelativeTime(log.consumedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => startEdit(log)}
                          className="p-2 rounded-lg text-gray-400 hover:text-coffee hover:bg-gray-100 dark:hover:bg-gray-800"
                          aria-label="编辑"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => duplicate(log)}
                          className="p-2 rounded-lg text-gray-400 hover:text-coffee hover:bg-gray-100 dark:hover:bg-gray-800"
                          aria-label="复制"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmId(log.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          aria-label="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </section>
          )
        })}
      </div>

      <DrinkRecordModal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        template={null}
        initialTime={composeTime}
      />

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-sm animate-slide-up">
            <h3 className="text-base font-semibold mb-2">删除这条记录？</h3>
            <p className="text-sm text-gray-500 mb-5">删除后统计数字会同步更新，且无法恢复。</p>
            <div className="flex gap-3">
              <button onClick={() => doDelete(confirmId)} className="btn-danger flex-1">删除</button>
              <button onClick={() => setConfirmId(null)} className="btn-ghost flex-1">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}