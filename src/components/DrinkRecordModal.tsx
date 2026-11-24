import { useEffect, useMemo, useState } from 'react'
import type { DrinkTemplate } from '@/types'
import { useDrinkStore } from '@/store'
import { BRAND_ORDER } from '@/db'
import { DrinkArtwork } from '@/components/DrinkArtwork'
import { X, Search, Plus, Minus, Loader2, Check, ChevronDown } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  template?: DrinkTemplate | null
  initialTime?: number
}

const COLLAPSED_COUNT = 8

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
  const [brand, setBrand] = useState<string>('all')
  const [expanded, setExpanded] = useState(false)
  const [picked, setPicked] = useState<DrinkTemplate | null>(template ?? null)
  const [variantIndex, setVariantIndex] = useState(0)
  const [amount, setAmount] = useState(1)
  const [consumedAt, setConsumedAt] = useState(initialTime ?? Date.now())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setPicked(template ?? null)
    setVariantIndex(0)
    setAmount(1)
    setConsumedAt(initialTime ?? Date.now())
    setQuery('')
    setExpanded(false)
  }, [isOpen, template, initialTime])

  const brands = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of templates) {
      if (t.isHidden) continue
      map.set(t.brand, (map.get(t.brand) || 0) + 1)
    }
    return Array.from(map.entries()).sort((a, b) => {
      const ra = BRAND_ORDER.indexOf(a[0])
      const rb = BRAND_ORDER.indexOf(b[0])
      return (ra === -1 ? 999 : ra) - (rb === -1 ? 999 : rb)
    })
  }, [templates])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return templates.filter(t => {
      if (t.isHidden) return false
      if (brand !== 'all' && t.brand !== brand) return false
      if (!q) return true
      return (t.brand + t.name).toLowerCase().includes(q)
    })
  }, [templates, brand, query])

  const collapsed = brand === 'all' && !expanded
  const shown = collapsed ? filtered.slice(0, COLLAPSED_COUNT) : filtered

  const variants = useMemo(() => {
    if (!picked) return []
    if (picked.sizes && picked.sizes.length > 0) return picked.sizes
    return [{
      label: picked.size,
      caffeineMg: picked.caffeineMg,
      sugarG: picked.sugarG,
      caloriesKcal: picked.caloriesKcal,
    }]
  }, [picked])

  const variant = variants[Math.min(variantIndex, Math.max(0, variants.length - 1))]

  // 模板值只是默认标准，实际记录时可以增减
  const defaults = useMemo(
    () =>
      variant
        ? {
            caffeineMg: Math.round(variant.caffeineMg * amount),
            sugarG: Math.round(variant.sugarG * amount * 10) / 10,
            caloriesKcal: Math.round(variant.caloriesKcal * amount),
          }
        : { caffeineMg: 0, sugarG: 0, caloriesKcal: 0 },
    [variant, amount],
  )

  const [values, setValues] = useState(defaults)
  useEffect(() => {
    setValues(defaults)
  }, [defaults])

  const estimatedBed = useMemo(() => {
    if (!picked || !variant) return bedtimeResidual
    const [h, m] = settings.bedtime.split(':').map(Number)
    const bed = new Date()
    bed.setHours(h, m, 0, 0)
    if (bed.getTime() <= consumedAt) bed.setDate(bed.getDate() + 1)
    const hours = (bed.getTime() - consumedAt) / 3600000
    const decay = hours > 0 ? Math.pow(0.5, hours / settings.halfLifeHours) : 1
    return bedtimeResidual + values.caffeineMg * decay
  }, [picked, variant, consumedAt, bedtimeResidual, values.caffeineMg, settings.bedtime, settings.halfLifeHours])

  const threshold = settings.sleepResidualThresholdMg
  const level = estimatedBed < threshold ? 'low' : estimatedBed < threshold * 2 ? 'medium' : 'high'
  const color = level === 'low' ? '#10B981' : level === 'medium' ? '#F59E0B' : '#EF4444'
  const levelText = level === 'low' ? '低风险' : level === 'medium' ? '中等风险' : '较高风险'

  const handleRecord = async () => {
    if (!picked || !variant) return
    setSaving(true)
    try {
      await addLog({
        templateId: picked.id,
        brand: picked.brand,
        name: picked.name,
        category: picked.category,
        baseType: picked.baseType,
        size: variant.label,
        caffeineMg: Math.round(values.caffeineMg),
        sugarG: Math.round(values.sugarG * 10) / 10,
        caloriesKcal: Math.round(values.caloriesKcal),
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

        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3.5">
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

          <div className="relative">
            <select
              value={brand}
              onChange={e => {
                setBrand(e.target.value)
                setExpanded(false)
              }}
              aria-label="按品牌筛选"
              className="input appearance-none bg-slate-50 pr-10 dark:bg-slate-900"
            >
              <option value="all">全部品牌（{brands.reduce((s, b) => s + b[1], 0)}）</option>
              {brands.map(([b, n]) => (
                <option key={b} value={b}>{b}（{n}）</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          </div>

          <div className="space-y-2">
            {shown.length === 0 && (
              <p className="py-10 text-center text-[13px] text-ink-400">没有找到，换个关键词试试</p>
            )}
            {shown.map(t => {
              const active = picked?.id === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setPicked(t)
                    setVariantIndex(0)
                  }}
                  className={
                    'flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors ' +
                    (active
                      ? 'border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20'
                      : 'border-transparent bg-slate-50 dark:bg-slate-900')
                  }
                >
                  <DrinkArtwork art={t.art} size={38} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{t.name}</p>
                    <p className="truncate text-[11.5px] text-ink-400">
                      {t.brand} · {t.sizes && t.sizes.length > 1 ? t.sizes.map(s => s.label).join('/') : t.size} · {t.caffeineMg}mg
                    </p>
                  </div>
                  {active && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
                </button>
              )
            })}

            {brand === 'all' && filtered.length > COLLAPSED_COUNT && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="w-full rounded-2xl border border-dashed border-slate-200 py-2.5 text-[12.5px] font-medium text-ink-500 dark:border-slate-700 dark:text-slate-400"
              >
                {expanded ? '收起' : '展开全部 ' + filtered.length + ' 个'}
              </button>
            )}
          </div>

          {picked && variant && (
            <div className="space-y-4 rounded-3xl border border-brand-100 bg-brand-50/60 p-4 dark:border-brand-900/40 dark:bg-brand-900/10">
              <div className="flex items-center gap-3">
                <DrinkArtwork art={picked.art} size={52} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">{picked.name}</p>
                  <p className="text-[12px] text-ink-400">{picked.brand} · {variant.label}</p>
                </div>
                <span className="text-[12px] font-medium text-brand-600">×{amount}</span>
              </div>

              {variants.length > 1 && (
                <div>
                  <p className="mb-1.5 text-[12px] text-ink-400">杯型</p>
                  <div className="flex gap-2">
                    {variants.map((v, i) => (
                      <button
                        key={v.label + i}
                        onClick={() => setVariantIndex(i)}
                        className={i === variantIndex ? 'chip-active' : 'chip-idle'}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAmount(Math.max(0.5, amount - 0.5))}
                  disabled={amount <= 0.5}
                  aria-label="减少份量"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center text-[15px] font-medium">{amount} 份</div>
                <button
                  onClick={() => setAmount(amount + 0.5)}
                  aria-label="增加份量"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] text-ink-400">饮用时间</label>
                <input
                  type="datetime-local"
                  value={toLocalInput(consumedAt)}
                  onChange={e => setConsumedAt(new Date(e.target.value).getTime())}
                  max={toLocalInput(Date.now())}
                  className="input bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <p className="text-[12px] text-ink-400">本次实际摄入（可修改）</p>
                  <button
                    onClick={() => setValues(defaults)}
                    className="text-[11.5px] font-medium text-brand-600"
                  >
                    恢复默认
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl bg-white py-2 dark:bg-slate-900">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      aria-label="本次咖啡因"
                      value={values.caffeineMg}
                      onChange={e => setValues({ ...values, caffeineMg: Number(e.target.value) })}
                      className="w-full bg-transparent text-center text-[17px] font-semibold text-brand-600 outline-none"
                    />
                    <p className="text-[10.5px] text-ink-400">mg 咖啡因</p>
                  </div>
                  <div className="rounded-2xl bg-white py-2 dark:bg-slate-900">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.1"
                      aria-label="本次糖"
                      value={values.sugarG}
                      onChange={e => setValues({ ...values, sugarG: Number(e.target.value) })}
                      className="w-full bg-transparent text-center text-[17px] font-semibold text-amber-500 outline-none"
                    />
                    <p className="text-[10.5px] text-ink-400">g 糖</p>
                  </div>
                  <div className="rounded-2xl bg-white py-2 dark:bg-slate-900">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      aria-label="本次热量"
                      value={values.caloriesKcal}
                      onChange={e => setValues({ ...values, caloriesKcal: Number(e.target.value) })}
                      className="w-full bg-transparent text-center text-[17px] font-semibold text-rose-500 outline-none"
                    />
                    <p className="text-[10.5px] text-ink-400">kcal</p>
                  </div>
                </div>
                <p className="mt-1.5 text-center text-[10.5px] text-ink-400">
                  默认按「{variant.label}」估算，改杯型或份量会重新计算
                </p>
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
