import { useMemo, useState } from 'react'
import type { DrinkTemplate, SizeVariant, ArtStyle, CupType } from '@/types'
import { useDrinkStore } from '@/store'
import { DrinkArtwork, ART_STYLES } from '@/components/DrinkArtwork'
import { ChevronLeft, Search, Plus, EyeOff, RotateCcw, Trash2, Pencil, X, Check } from 'lucide-react'

interface Props {
  onClose: () => void
  onAdd: () => void
}

interface EditForm {
  brand: string
  name: string
  size: string
  caffeineMg: number
  sugarG: number
  caloriesKcal: number
  style: ArtStyle
  cup: CupType
  sizes: SizeVariant[]
}

function toForm(t: DrinkTemplate): EditForm {
  return {
    brand: t.brand,
    name: t.name,
    size: t.size,
    caffeineMg: t.caffeineMg,
    sugarG: t.sugarG,
    caloriesKcal: t.caloriesKcal,
    style: t.art.style,
    cup: t.art.cup,
    sizes: (t.sizes ?? []).map(s => ({ ...s })),
  }
}

export function LibraryPage({ onClose, onAdd }: Props) {
  const templates = useDrinkStore(s => s.templates)
  const hideTemplate = useDrinkStore(s => s.hideTemplate)
  const unhideTemplate = useDrinkStore(s => s.unhideTemplate)
  const deleteTemplate = useDrinkStore(s => s.deleteTemplate)
  const saveTemplateEdit = useDrinkStore(s => s.saveTemplateEdit)
  const showToast = useDrinkStore(s => s.showToast)

  const [query, setQuery] = useState('')
  const [showHidden, setShowHidden] = useState(false)
  const [editing, setEditing] = useState<DrinkTemplate | null>(null)
  const [form, setForm] = useState<EditForm | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return templates.filter(t => {
      if (showHidden ? !t.isHidden : t.isHidden) return false
      if (!q) return true
      return (t.brand + t.name).toLowerCase().includes(q)
    })
  }, [templates, query, showHidden])

  const groups = useMemo(() => {
    const map = new Map<string, DrinkTemplate[]>()
    for (const t of filtered) {
      if (!map.has(t.brand)) map.set(t.brand, [])
      map.get(t.brand)!.push(t)
    }
    return Array.from(map.entries())
  }, [filtered])

  const visibleCount = templates.filter(t => !t.isHidden).length
  const hiddenCount = templates.filter(t => t.isHidden).length
  const customCount = templates.filter(t => t.isCustom && !t.isHidden).length

  const openEdit = (t: DrinkTemplate) => {
    setEditing(t)
    setForm(toForm(t))
  }

  const closeEdit = () => {
    setEditing(null)
    setForm(null)
  }

  const patchSize = (i: number, patch: Partial<SizeVariant>) => {
    if (!form) return
    const next = form.sizes.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
    setForm({ ...form, sizes: next })
  }

  const removeSize = (i: number) => {
    if (!form) return
    setForm({ ...form, sizes: form.sizes.filter((_, idx) => idx !== i) })
  }

  const addSize = () => {
    if (!form) return
    setForm({
      ...form,
      sizes: [...form.sizes, { label: '大杯', caffeineMg: form.caffeineMg, sugarG: form.sugarG, caloriesKcal: form.caloriesKcal }],
    })
  }

  const saveEdit = async () => {
    if (!editing || !form) return
    if (!form.name.trim()) {
      showToast('名称不能为空', 'error')
      return
    }
    const sizes = form.sizes.filter(s => s.label.trim())
    await saveTemplateEdit(editing.id, {
      brand: form.brand.trim() || editing.brand,
      name: form.name.trim(),
      size: form.size.trim() || '标准',
      caffeineMg: Number(form.caffeineMg) || 0,
      sugarG: Number(form.sugarG) || 0,
      caloriesKcal: Number(form.caloriesKcal) || 0,
      art: { ...editing.art, style: form.style, cup: form.cup },
      sizes: sizes.length > 0 ? sizes : undefined,
    })
    showToast('已保存修改', 'success')
    closeEdit()
  }

  const remove = async (t: DrinkTemplate) => {
    if (t.isCustom) {
      if (!window.confirm('删除「' + t.name + '」？此操作不可恢复。')) return
      await deleteTemplate(t.id)
      showToast('已删除', 'success')
    } else {
      await hideTemplate(t.id)
      showToast('已从饮品库移除，可在「已移除」恢复', 'info')
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-canvas dark:bg-slate-950">
      <header className="flex items-center gap-2 px-3 pt-5 pb-3">
        <button onClick={onClose} aria-label="返回" className="p-2 rounded-xl text-ink-500 hover:bg-slate-100 dark:hover:bg-slate-800">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-[17px] font-semibold">饮品库</h1>
          <p className="text-[11px] text-ink-400">
            {visibleCount} 款 · 自定义 {customCount}{hiddenCount > 0 ? ' · 已移除 ' + hiddenCount : ''}
          </p>
        </div>
        <button onClick={onAdd} className="flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-2 text-[12.5px] font-medium text-white">
          <Plus className="w-4 h-4" /> 新增
        </button>
      </header>

      <div className="px-4 space-y-3 pb-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索品牌或饮品"
            className="input pl-10 py-2.5 bg-white"
          />
        </div>
        <div className="inline-flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setShowHidden(false)}
            className={
              'px-4 py-1.5 rounded-xl text-[12px] font-medium transition-colors ' +
              (!showHidden ? 'bg-white text-ink-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-ink-400')
            }
          >
            在库 {visibleCount}
          </button>
          <button
            onClick={() => setShowHidden(true)}
            className={
              'px-4 py-1.5 rounded-xl text-[12px] font-medium transition-colors ' +
              (showHidden ? 'bg-white text-ink-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-ink-400')
            }
          >
            已移除 {hiddenCount}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-5">
        {groups.length === 0 && (
          <p className="py-16 text-center text-[13px] text-ink-400">
            {showHidden ? '没有已移除的饮品' : '没有匹配的饮品'}
          </p>
        )}

        {groups.map(([brand, items]) => (
          <section key={brand}>
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h2 className="text-[12.5px] font-medium text-ink-500 dark:text-slate-400">{brand}</h2>
              <span className="text-[11px] text-ink-400">{items.length}</span>
            </div>
            <div className="card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
              {items.map(t => (
                <div key={t.id} className="flex items-center gap-3 px-3 py-2.5">
                  <DrinkArtwork art={t.art} size={36} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{t.name}</p>
                    <p className="truncate text-[11px] text-ink-400">
                      {t.sizes && t.sizes.length > 1
                        ? t.sizes.map(s => s.label).join(' / ')
                        : t.size}
                      {' · '}{t.caffeineMg}mg · {t.sugarG}g · {t.caloriesKcal}kcal
                      {t.isCustom ? ' · 自定义' : ''}
                    </p>
                  </div>
                  {showHidden ? (
                    <button onClick={() => unhideTemplate(t.id)} aria-label="恢复" className="p-2 rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  ) : (
                    <>
                      <button onClick={() => openEdit(t)} aria-label="编辑" className="p-2 rounded-lg text-ink-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => remove(t)}
                        aria-label={t.isCustom ? '删除' : '移除'}
                        className="p-2 rounded-lg text-ink-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      >
                        {t.isCustom ? <Trash2 className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        <p className="pt-2 text-center text-[11px] leading-relaxed text-ink-400">
          编辑过的内置饮品不会被版本更新覆盖；移除后可在「已移除」恢复
        </p>
      </div>

      {editing && form && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="modal-backdrop" onClick={closeEdit} />
          <div className="sheet max-h-[92vh]">
            <div className="sheet-handle" />
            <div className="flex items-center justify-between px-5 pb-3 pt-1">
              <h2 className="text-[17px] font-semibold">编辑饮品</h2>
              <button onClick={closeEdit} aria-label="关闭" className="p-2 -mr-2 rounded-full text-ink-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
              <div className="flex items-center gap-3 rounded-3xl bg-slate-50 p-3.5 dark:bg-slate-900">
                <DrinkArtwork art={{ ...editing.art, style: form.style, cup: form.cup }} size={56} />
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-medium">{form.name || '未命名'}</p>
                  <p className="text-[11.5px] text-ink-400">{form.brand} · {form.size}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[12px] text-ink-400">名称</label>
                  <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] text-ink-400">品牌</label>
                  <input className="input" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[12px] text-ink-400">默认杯型</label>
                  <input className="input" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] text-ink-400">咖啡因 mg</label>
                  <input type="number" className="input" value={form.caffeineMg} onChange={e => setForm({ ...form, caffeineMg: Number(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[12px] text-ink-400">糖 g</label>
                  <input type="number" step="0.1" className="input" value={form.sugarG} onChange={e => setForm({ ...form, sugarG: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] text-ink-400">热量 kcal</label>
                  <input type="number" className="input" value={form.caloriesKcal} onChange={e => setForm({ ...form, caloriesKcal: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[12px] text-ink-400">可选杯型</p>
                  <button onClick={addSize} className="text-[12px] font-medium text-brand-600">+ 添加杯型</button>
                </div>
                {form.sizes.length === 0 && (
                  <p className="rounded-2xl bg-slate-50 px-3 py-2.5 text-[11.5px] text-ink-400 dark:bg-slate-900">
                    未设置时只有「{form.size}」一个规格
                  </p>
                )}
                <div className="space-y-2">
                  {form.sizes.map((s, i) => (
                    <div key={i} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                      <div className="mb-2 flex items-center gap-2">
                        <input
                          className="input py-1.5 text-[13px]"
                          value={s.label}
                          placeholder="杯型名，如 大杯"
                          onChange={e => patchSize(i, { label: e.target.value })}
                        />
                        <button onClick={() => removeSize(i)} aria-label="删除杯型" className="p-2 rounded-lg text-ink-400 hover:text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input type="number" className="input py-1.5 text-[12.5px]" value={s.caffeineMg} onChange={e => patchSize(i, { caffeineMg: Number(e.target.value) })} />
                        <input type="number" step="0.1" className="input py-1.5 text-[12.5px]" value={s.sugarG} onChange={e => patchSize(i, { sugarG: Number(e.target.value) })} />
                        <input type="number" className="input py-1.5 text-[12.5px]" value={s.caloriesKcal} onChange={e => patchSize(i, { caloriesKcal: Number(e.target.value) })} />
                      </div>
                      <div className="mt-1 grid grid-cols-3 gap-2 text-center text-[10px] text-ink-400">
                        <span>咖啡因 mg</span><span>糖 g</span><span>热量 kcal</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] text-ink-400">贴图样式</label>
                <select className="input" value={form.style} onChange={e => setForm({ ...form, style: e.target.value as ArtStyle })}>
                  {ART_STYLES.map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>

              <button onClick={saveEdit} className="btn-primary w-full">
                <Check className="w-4 h-4 mr-1.5" /> 保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LibraryPage
