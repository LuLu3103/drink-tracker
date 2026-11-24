import { useEffect, useMemo, useState } from 'react'
import type { DrinkTemplate, DrinkCategory } from '@/types'
import { useDrinkStore } from '@/store'
import { DrinkArtwork } from '@/components/DrinkArtwork'
import { X, Search, Plus, Minus, Loader2, Check } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  template?: DrinkTemplate | null
  initialTime?: number
}

const TABS: Array<{ key: 'all' | DrinkCategory; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'coffee', label: '咖啡' },
  { key: 'milk_tea', label: '奶茶' },
  { key: 'tea', label: '纯茶' },
  { key: 'other', label: '其他' },
]

function toLocalInput(ts: number): string {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes())
}

export function DrinkRecordModal({ isOpen, onClose, template, initialTime }: Props) {
  const templates = useDrinkStore(s => s.templates)
  const settings = useDrinkStore(s => s.settings)
  const currentResidual = useDrinkStore(s => s.currentResidual)
  const bedtimeResidual = useDrinkStore(s => s.bedtimeResidual)
  const addLog = useDrinkStore(s => s.addLog)
  const showToast = useDrinkStore(s => s.showToast)

  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'all' | DrinkCategory>('all')
  const [picked, setPicked] = useState<DrinkTemplate | null>(template ?? null)
  const [amount, setAmount] = useState(1)
  const [consumedAt, setConsumedAt] = useState(initialTime ?? Date.now())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setPicked(template ?? null)
    setAmount(1)
    setConsumedAt(initialTime ?? Date.now())
    setQuery('')
    setTab('all')
  }, [isOpen, template, initialTime])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return templates.filter(t => {
      if (t.isHidden) return false
      if (tab !== 'all' && t.category !== tab) return false
      if (!q) return true
      return (t.brand + t.name).toLowerCase().includes(q)
    })
  }, [templates, query, tab])

  const previewCaffeine = picked ? picked.caffeineMg * amount : 0
  const estimatedBed = useMemo(() => {
    if (!picked) return bedtimeResidual
    const [h, m] = settings.bedtime.split(':').map(Number)
    const bed = new Date()
    bed.setHours(h, m, 0, 0)
    if (bed.getTime() <= consumedAt) bed.setDate(bed.getDate() + 1)
    const hours = (bed.getTime() - consumedAt) / 3600000
    const decay = hours > 0 ? Math.pow(0.5, hours / settings.halfLifeHours) : 1
    return bedtimeResidual + previewCaffeine * decay
  }, [picked, consumedAt, bedtimeResidual, previewCaffeine, settings.bedtime, settings.halfLifeHours])

  const threshold = settings.sleepResidualThresholdMg
  const level = estimatedBed < threshold ? 'low' : estimatedBed < threshold * 2 ? 'medium' : 'high'
  const color = level === 'low' ? '#10B981' : level === 'medium' ? '#F59E0B' : '#EF4444'
  const levelText = level === 'low' ? '低风险' : level === 'medium' ? '中等风险' : '较高风险'

  const handleRecord = async () => {
    if (!picked) return
    setSaving(true)
    try {
      await addLog({
        templateId: picked.id,
        brand: picked.brand,
        name: picked.name,
        category: picked.category,
        baseType: picked.baseType,
        size: picked.size,
        caffeineMg: Math.round(picked.caffeineMg * amount),
        sugarG: Math.round(picked.sugarG * amount * 10) / 10,
        caloriesKcal: Math.round(picked.caloriesKcal * amount),
        art: picked.art,
        consumedAt,
      })
      showToast('已记录 ' + picked.name, 'success')
      onClose()
    } catch {
      showToast('记录失败，请重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="sheet max-h-[92vh]">
        <div className="sheet-handle" />
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <h2 className="text-[17px] font-semibold">记录饮品</h2>
          <button onClick={onClose} aria-label="关闭" className="p-2 -mr-2 rounded-full text-ink-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              placeholder="搜索品牌或饮品"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="input pl-11 bg-slate-50 dark:bg-slate-900"
            />
          </div>

          <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={tab === t.key ? 'chip-active' : 'chip-idle'}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className={'gap-2 ' + (picked ? 'grid grid-cols-1' : 'grid grid-cols-1')}>
            {filtered.length === 0 && (
              <p className="py-10 text-center text-[13px] text-ink-400">没有找到，试试其他关键词</p>
            )}
            {filtered.map(t => {
              const active = picked?.id === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setPicked(t)}
                  className={
                    'flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors ' +
                    (active
                      ? 'border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20'
                      : 'border-transparent bg-slate-50 dark:bg-slate-900')
                  }
                >
                  <DrinkArtwork art={t.art} size={38} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium truncate">{t.name}</p>
                    <p className="text-[11.5px] text-ink-400 truncate">
                      {t.brand} · {t.size} · {t.caffeineMg}mg
                    </p>
                  </div>
                  {active && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
                </button>
              )
            })}
          </div>

          {picked && (
            <div className="rounded-3xl border border-brand-100 bg-brand-50/60 p-4 space-y-4 dark:border-brand-900/40 dark:bg-brand-900/10">
              <div className="flex items-center gap-3">
                <DrinkArtwork art={picked.art} size={52} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold truncate">{picked.name}</p>
                  <p className="text-[12px] text-ink-400">{picked.brand} · {picked.size}</p>
                </div>
                <span className="text-[12px] font-medium text-brand-600">×{amount}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAmount(Math.max(0.5, amount - 0.5))}
                  disabled={amount <= 0.5}
                  aria-label="减少份量"
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center disabled:opacity-40 dark:bg-slate-900 dark:border-slate-700"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center text-[15px] font-medium">{amount} 份</div>
                <button
                  onClick={() => setAmount(amount + 0.5)}
                  aria-label="增加份量"
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center dark:bg-slate-900 dark:border-slate-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[12px] text-ink-400 mb-1.5">饮用时间</label>
                <input
                  type="datetime-local"
                  value={toLocalInput(consumedAt)}
                  onChange={e => setConsumedAt(new Date(e.target.value).getTime())}
                  max={toLocalInput(Date.now())}
                  className="input bg-white dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-white py-2.5 dark:bg-slate-900">
                  <p className="text-[17px] font-semibold text-brand-600">{Math.round(previewCaffeine)}</p>
                  <p className="text-[10.5px] text-ink-400">mg 咖啡因</p>
                </div>
                <div className="rounded-2xl bg-white py-2.5 dark:bg-slate-900">
                  <p className="text-[17px] font-semibold text-amber-500">{(picked.sugarG * amount).toFixed(1)}</p>
                  <p className="text-[10.5px] text-ink-400">g 糖</p>
                </div>
                <div className="rounded-2xl bg-white py-2.5 dark:bg-slate-900">
                  <p className="text-[17px] font-semibold text-rose-500">{Math.round(picked.caloriesKcal * amount)}</p>
                  <p className="text-[10.5px] text-ink-400">kcal</p>
                </div>
              </div>

              <div className="space-y-1.5 rounded-2xl bg-white p-3.5 text-[12.5px] dark:bg-slate-900">
                <div className="flex justify-between">
                  <span className="text-ink-400">当前体内</span>
                  <span className="font-medium">{Math.round(currentResidual)}mg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">喝完睡前预计</span>
                  <span className="font-semibold" style={{ color }}>{Math.round(estimatedBed)}mg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">风险</span>
                  <span className="font-medium" style={{ color }}>{levelText}</span>
                </div>
              </div>

              <button onClick={handleRecord} disabled={saving} className="btn-primary w-full">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : '记录这杯'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
