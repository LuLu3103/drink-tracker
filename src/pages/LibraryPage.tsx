import { useMemo, useState } from 'react'
import type { DrinkTemplate } from '@/types'
import { useDrinkStore } from '@/store'
import { DrinkArtwork } from '@/components/DrinkArtwork'
import { ChevronLeft, Search, Plus, EyeOff, RotateCcw, Trash2 } from 'lucide-react'

interface Props {
  onClose: () => void
  onAdd: () => void
}

export function LibraryPage({ onClose, onAdd }: Props) {
  const templates = useDrinkStore(s => s.templates)
  const hideTemplate = useDrinkStore(s => s.hideTemplate)
  const unhideTemplate = useDrinkStore(s => s.unhideTemplate)
  const deleteTemplate = useDrinkStore(s => s.deleteTemplate)
  const showToast = useDrinkStore(s => s.showToast)

  const [query, setQuery] = useState('')
  const [showHidden, setShowHidden] = useState(false)

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

  const remove = async (t: DrinkTemplate) => {
    if (t.isCustom) {
      if (!window.confirm('删除「' + t.name + '」？此操作不可恢复。')) return
      await deleteTemplate(t.id)
      showToast('已删除', 'success')
    } else {
      await hideTemplate(t.id)
      showToast('已从饮品库移除，可在「已移除」中恢复', 'info')
    }
  }

  const restore = async (t: DrinkTemplate) => {
    await unhideTemplate(t.id)
    showToast('已恢复到饮品库', 'success')
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
            {visibleCount} 款饮品 · 自定义 {customCount} 款{hiddenCount > 0 ? ' · 已移除 ' + hiddenCount : ''}
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
                      {t.size} · {t.caffeineMg}mg · {t.sugarG}g · {t.caloriesKcal}kcal
                      {t.isCustom ? ' · 自定义' : ''}
                    </p>
                  </div>
                  {showHidden ? (
                    <button onClick={() => restore(t)} aria-label="恢复" className="p-2 rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => remove(t)}
                      aria-label={t.isCustom ? '删除' : '移除'}
                      className="p-2 rounded-lg text-ink-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    >
                      {t.isCustom ? <Trash2 className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        <p className="pt-2 text-center text-[11px] leading-relaxed text-ink-400">
          内置饮品移除后可在「已移除」恢复；自定义饮品删除后不可恢复
        </p>
      </div>
    </div>
  )
}

export default LibraryPage
