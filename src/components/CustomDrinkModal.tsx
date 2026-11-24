import { useEffect, useState } from 'react'
import type { ArtStyle, CupType, DrinkCategory, BaseType, Topping } from '@/types'
import { useDrinkStore } from '@/store'
import { DrinkArtwork, ART_STYLES, TINT_SWATCHES } from '@/components/DrinkArtwork'
import { X, Check } from 'lucide-react'

const CATEGORIES: Array<{ key: DrinkCategory; label: string }> = [
  { key: 'coffee', label: '咖啡' },
  { key: 'milk_tea', label: '奶茶' },
  { key: 'tea', label: '纯茶' },
  { key: 'other', label: '其他' },
]

const TOPPINGS: Array<{ key: Topping; label: string }> = [
  { key: 'none', label: '无' },
  { key: 'pearl', label: '珍珠' },
  { key: 'fruit', label: '果粒' },
  { key: 'cream', label: '奶盖' },
  { key: 'ice', label: '冰块' },
  { key: 'bubbles', label: '气泡' },
]

const BASES: Array<{ key: BaseType; label: string }> = [
  { key: 'espresso', label: '浓缩咖啡' },
  { key: 'tea_base', label: '茶底' },
  { key: 'matcha', label: '抹茶' },
  { key: 'cocoa', label: '可可' },
  { key: 'none', label: '无咖啡因' },
]

interface FormState {
  name: string
  brand: string
  category: DrinkCategory
  baseType: BaseType
  size: string
  caffeineMg: number
  sugarG: number
  caloriesKcal: number
  style: ArtStyle
  cup: CupType
  topping: Topping
  tint: string
  isFavorite: boolean
}

const EMPTY: FormState = {
  name: '',
  brand: '自制',
  category: 'coffee',
  baseType: 'espresso',
  size: '标准',
  caffeineMg: 100,
  sugarG: 10,
  caloriesKcal: 150,
  style: 'latte',
  cup: 'cold',
  topping: 'ice',
  tint: '',
  isFavorite: false,
}

export function CustomDrinkModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const addTemplate = useDrinkStore(s => s.addTemplate)
  const showToast = useDrinkStore(s => s.showToast)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) setForm(EMPTY)
  }, [isOpen])

  if (!isOpen) return null

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      showToast('请填写饮品名称', 'error')
      return
    }
    setSaving(true)
    try {
      await addTemplate({
        brand: form.brand.trim() || '自制',
        name: form.name.trim(),
        category: form.category,
        baseType: form.baseType,
        size: form.size.trim() || '标准',
        caffeineMg: Number(form.caffeineMg) || 0,
        sugarG: Number(form.sugarG) || 0,
        caloriesKcal: Number(form.caloriesKcal) || 0,
        art: { style: form.style, cup: form.cup, topping: form.topping, tint: form.tint || undefined },
        isCustom: true,
        isFavorite: form.isFavorite,
      })
      showToast('已添加自定义饮品', 'success')
      onClose()
    } catch {
      showToast('添加失败，请重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="modal-backdrop" onClick={onClose} />
      <form onSubmit={submit} className="sheet max-h-[92vh]">
        <div className="sheet-handle" />
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <h2 className="text-[17px] font-semibold">自定义饮品</h2>
          <button type="button" onClick={onClose} aria-label="关闭" className="p-2 -mr-2 rounded-full text-ink-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5">
          <div className="flex items-center gap-4 rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
            <DrinkArtwork art={{ style: form.style, cup: form.cup, topping: form.topping, tint: form.tint || undefined }} size={64} />
            <div className="min-w-0">
              <p className="text-[15px] font-medium truncate">{form.name || '未命名饮品'}</p>
              <p className="text-[12px] text-ink-400">{form.caffeineMg}mg · {form.sugarG}g · {form.caloriesKcal}kcal</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[12px] text-ink-400 mb-1.5">饮品名称</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="例如：我的特调拿铁" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] text-ink-400 mb-1.5">品牌 / 来源</label>
                <input className="input" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="自制" />
              </div>
              <div>
                <label className="block text-[12px] text-ink-400 mb-1.5">杯型</label>
                <input className="input" value={form.size} onChange={e => set('size', e.target.value)} placeholder="标准" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-[12px] text-ink-400 mb-2">类型</p>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => set('category', c.key)}
                  className={
                    'py-2.5 rounded-2xl text-[12.5px] font-medium transition-colors ' +
                    (form.category === c.key
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-ink-500 dark:bg-slate-800 dark:text-slate-400')
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[12px] text-ink-400 mb-2">基底</p>
            <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1">
              {BASES.map(b => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => set('baseType', b.key)}
                  className={form.baseType === b.key ? 'chip-active' : 'chip-idle'}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[12px] text-ink-400 mb-2">贴图样式</p>
            <div className="grid grid-cols-5 gap-2">
              {ART_STYLES.map(s => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => set('style', s.key)}
                  className={
                    'flex flex-col items-center gap-1 rounded-2xl py-2 transition-colors ' +
                    (form.style === s.key ? 'bg-brand-50 ring-2 ring-brand-400 dark:bg-brand-900/20' : 'bg-slate-50 dark:bg-slate-900')
                  }
                >
                  <DrinkArtwork art={{ style: s.key, cup: form.cup, topping: form.topping, tint: form.tint || undefined }} size={32} />
                  <span className="text-[10px] text-ink-500 dark:text-slate-400">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[12px] text-ink-400 mr-1">杯型外观</span>
            {(['cold', 'hot'] as CupType[]).map(c => (
              <button
                key={c}
                type="button"
                onClick={() => set('cup', c)}
                className={form.cup === c ? 'chip-active' : 'chip-idle'}
              >
                {c === 'cold' ? '冷饮杯' : '热饮杯'}
              </button>
            ))}
          </div>

          <div>
            <p className="text-[12px] text-ink-400 mb-2">杯中配料</p>
            <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1">
              {TOPPINGS.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => set('topping', t.key)}
                  className={form.topping === t.key ? 'chip-active' : 'chip-idle'}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[12px] text-ink-400 mb-2">自定义颜色（可选）</p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => set('tint', '')}
                className={
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center ' +
                  (form.tint === '' ? 'border-brand-500' : 'border-slate-200 dark:border-slate-700')
                }
                aria-label="默认颜色"
              >
                <span className="text-[10px] text-ink-400">默认</span>
              </button>
              {TINT_SWATCHES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('tint', c)}
                  aria-label={'颜色 ' + c}
                  className={
                    'w-8 h-8 rounded-full flex items-center justify-center ' +
                    (form.tint === c ? 'ring-2 ring-offset-2 ring-brand-500 dark:ring-offset-slate-950' : '')
                  }
                  style={{ backgroundColor: c }}
                >
                  {form.tint === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] text-ink-400 mb-1.5">咖啡因 mg</label>
              <input type="number" min="0" className="input" value={form.caffeineMg} onChange={e => set('caffeineMg', Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-[12px] text-ink-400 mb-1.5">糖 g</label>
              <input type="number" min="0" step="0.1" className="input" value={form.sugarG} onChange={e => set('sugarG', Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-[12px] text-ink-400 mb-1.5">热量 kcal</label>
              <input type="number" min="0" className="input" value={form.caloriesKcal} onChange={e => set('caloriesKcal', Number(e.target.value))} />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-[13px] text-ink-500 dark:text-slate-400">
            <input
              type="checkbox"
              checked={form.isFavorite}
              onChange={e => set('isFavorite', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            加入常用
          </label>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? '保存中…' : '保存饮品'}
          </button>
        </div>
      </form>
    </div>
  )
}
