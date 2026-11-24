import { useEffect, useMemo, useState } from 'react'
import type { DrinkTemplate, DrinkCategory } from '@/types'
import { useDrinkStore } from '@/store'
import { getCategoryColor, getCategoryLabel } from '@/utils/format'
import { X, Search, Heart, Plus, Loader2, Minus } from 'lucide-react'

interface DrinkRecordModalProps {
  isOpen: boolean
  onClose: () => void
  template?: DrinkTemplate | null
  initialTime?: number
}

const CATEGORIES: Array<{ key: 'all' | DrinkCategory; label: string; emoji: string }> = [
  { key: 'all', label: '全部', emoji: '🍽️' },
  { key: 'coffee', label: '咖啡', emoji: '☕' },
  { key: 'milk_tea', label: '奶茶', emoji: '🧋' },
  { key: 'tea', label: '纯茶', emoji: '🍵' },
  { key: 'other', label: '其他', emoji: '🥤' },
]

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

export function DrinkRecordModal({ isOpen, onClose, template, initialTime }: DrinkRecordModalProps) {
  const templates = useDrinkStore(s => s.templates)
  const settings = useDrinkStore(s => s.settings)
  const currentResidual = useDrinkStore(s => s.currentResidual)
  const bedtimeResidual = useDrinkStore(s => s.bedtimeResidual)
  const riskLevel = useDrinkStore(s => s.riskLevel)
  const addLog = useDrinkStore(s => s.addLog)
  const showToast = useDrinkStore(s => s.showToast)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'all' | DrinkCategory>('all')
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
    setCategory('all')
  }, [isOpen, template, initialTime])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return templates.filter(t => {
      if (category !== 'all' && t.category !== category) return false
      if (!q) return true
      return t.brand.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
    })
  }, [templates, query, category])

  const previewCaffeine = picked ? picked.caffeineMg * amount : 0
  const previewSugar = picked ? picked.sugarG * amount : 0
  const previewCalories = picked ? picked.caloriesKcal * amount : 0

  const estimatedBedResidual = useMemo(() => {
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
  const estLevel = estimatedBedResidual < threshold ? 'low' : estimatedBedResidual < threshold * 2 ? 'medium' : 'high'
  const estColor = estLevel === 'low' ? '#10B981' : estLevel === 'medium' ? '#F59E0B' : '#EF4444'
  const estLabel = estLevel === 'low' ? '低风险' : estLevel === 'medium' ? '中等风险' : '较高风险'

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
        consumedAt,
      })
      showToast('已记录：' + picked.brand + ' ' + picked.name, 'success')
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
      <div className="w-full bg-white dark:bg-gray-950 rounded-t-3xl shadow-xl max-h-[92vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">记录饮品</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="关闭">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索品牌或饮品名…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ' +
                  (category === c.key ? 'bg-coffee text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300')
                }
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[38vh] overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-center text-gray-500 py-8">没有匹配的饮品，可先在设置页添加自定义饮品</p>
            )}
            {filtered.map(t => {
              const active = picked?.id === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setPicked(t)}
                  className={
                    'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ' +
                    (active
                      ? 'border-coffee bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800')
                  }
                >
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: getCategoryColor(t.category) + '20' }}
                  >
                    {CATEGORY_EMOJI[t.category]}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="font-medium truncate">{t.brand} {t.name}</span>
                      {t.isFavorite && <Heart className="w-3.5 h-3.5 text-red-500 fill-current shrink-0" />}
                    </span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                      {t.size} · {t.caffeineMg}mg 咖啡因 · {t.sugarG}g 糖 · {t.caloriesKcal}kcal
                    </span>
                  </span>
                  {active && <span className="text-coffee text-xs font-medium shrink-0">已选</span>}
                </button>
              )
            })}
          </div>

          {picked && (
            <div className="rounded-2xl border-2 border-coffee/30 p-4 space-y-4 bg-primary-50/50 dark:bg-primary-900/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{picked.brand} {picked.name}</p>
                  <p className="text-xs text-gray-500">{picked.size} · {getCategoryLabel(picked.category)}</p>
                </div>
                <span className="text-sm font-medium text-coffee">×{amount}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAmount(Math.max(0.5, amount - 0.5))}
                  disabled={amount <= 0.5}
                  className="w-11 h-11 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center disabled:opacity-40"
                  aria-label="减少份量"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-xl font-semibold">{amount}</span>
                  <span className="text-sm text-gray-500"> 份</span>
                </div>
                <button
                  onClick={() => setAmount(amount + 0.5)}
                  className="w-11 h-11 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center"
                  aria-label="增加份量"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">饮用时间</label>
                <input
                  type="datetime-local"
                  value={toLocalInput(consumedAt)}
                  onChange={e => setConsumedAt(new Date(e.target.value).getTime())}
                  max={toLocalInput(Date.now())}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white dark:bg-gray-800 py-2">
                  <p className="text-lg font-bold text-coffee">{Math.round(previewCaffeine)}</p>
                  <p className="text-[11px] text-gray-500">mg 咖啡因</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-gray-800 py-2">
                  <p className="text-lg font-bold text-amber-600">{previewSugar.toFixed(1)}</p>
                  <p className="text-[11px] text-gray-500">g 糖</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-gray-800 py-2">
                  <p className="text-lg font-bold text-red-500">{Math.round(previewCalories)}</p>
                  <p className="text-[11px] text-gray-500">kcal</p>
                </div>
              </div>

              <div className="rounded-xl bg-white dark:bg-gray-800 p-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">当前体内残留</span>
                  <span className="font-medium">{Math.round(currentResidual)}mg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">喝完后睡前预计</span>
                  <span className="font-semibold" style={{ color: estColor }}>{Math.round(estimatedBedResidual)}mg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">风险等级</span>
                  <span className="font-medium" style={{ color: estColor }}>{estLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">当前睡前状态</span>
                  <span className="font-medium" style={{ color: riskLevel.color }}>{riskLevel.label}</span>
                </div>
              </div>

              <button onClick={handleRecord} disabled={saving} className="btn-primary w-full py-3 text-base">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : '记录这杯'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}