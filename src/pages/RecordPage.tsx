import { useMemo } from 'react'
import { useDrinkStore } from '@/store'
import type { DrinkTemplate } from '@/types'
import { DrinkArtwork } from '@/components/DrinkArtwork'
import { DrinkCalendar } from '@/components/DrinkCalendar'
import { Logo } from '@/components/Logo'
import { Plus, ChevronRight, Coffee, Moon } from 'lucide-react'

interface RecordPageProps {
  onQuickRecord: (template: DrinkTemplate) => void
  onOpenPicker: () => void
  onOpenCustomDrink: () => void
}

export default function RecordPage({ onQuickRecord, onOpenPicker, onOpenCustomDrink }: RecordPageProps) {
  const templates = useDrinkStore(s => s.templates)
  const logs = useDrinkStore(s => s.logs)
  const settings = useDrinkStore(s => s.settings)
  const currentResidual = useDrinkStore(s => s.currentResidual)
  const bedtimeResidual = useDrinkStore(s => s.bedtimeResidual)
  const riskLevel = useDrinkStore(s => s.riskLevel)
  const cutoffInfo = useDrinkStore(s => s.cutoffInfo)
  const todayStats = useDrinkStore(s => s.todayStats)

  const shortcuts = useMemo(() => {
    const visible = templates.filter(t => !t.isHidden)
    const recentIds: string[] = []
    for (const log of logs) {
      if (log.templateId && !recentIds.includes(log.templateId)) recentIds.push(log.templateId)
      if (recentIds.length >= 6) break
    }
    const recent = recentIds
      .map(id => visible.find(t => t.id === id))
      .filter((t): t is DrinkTemplate => Boolean(t))
    if (recent.length >= 4) return recent.slice(0, 6)
    const favs = visible.filter(t => t.isFavorite && !recentIds.includes(t.id))
    return [...recent, ...favs].slice(0, 6)
  }, [templates, logs])

  const pct = (v: number, target: number) => Math.min(100, Math.round((v / target) * 100))

  const rows = [
    { label: '咖啡因', value: Math.round(todayStats.totalCaffeine), unit: 'mg', target: settings.dailyCaffeineTargetMg, color: 'bg-brand-500' },
    { label: '糖', value: Number(todayStats.totalSugar.toFixed(1)), unit: 'g', target: settings.dailySugarTargetG, color: 'bg-amber-400' },
    { label: '热量', value: Math.round(todayStats.totalCalories), unit: 'kcal', target: settings.dailyCalorieTargetKcal, color: 'bg-rose-400' },
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-5 pt-6 pb-32 space-y-5">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={42} />
            <div>
              <p className="text-[16px] font-semibold tracking-tight leading-tight">
                {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
              </p>
              <p className="mt-0.5 text-[11.5px] text-ink-400">
                {new Date().toLocaleDateString('zh-CN', { weekday: 'long' })}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenPicker}
            aria-label="新增记录"
            className="mt-1 w-11 h-11 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lift active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>
        </header>

        <section className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[12px] text-ink-400">
                <Moon className="w-3.5 h-3.5" />
                睡前预计残留
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-[34px] leading-none font-semibold tracking-tight" style={{ color: riskLevel.color }}>
                  {Math.round(bedtimeResidual)}
                </span>
                <span className="text-sm text-ink-400">mg</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-400">
                <Coffee className="w-3.5 h-3.5" />
                当前体内 {Math.round(currentResidual)}mg · 今日 {todayStats.count} 杯
              </div>
            </div>
            <span
              className="chip text-[11px]"
              style={{ backgroundColor: riskLevel.color + '14', color: riskLevel.color }}
            >
              {riskLevel.label}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-3.5 py-3">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: riskLevel.color }} />
            <span className="text-[12.5px] text-ink-500 dark:text-slate-300 leading-relaxed">
              {cutoffInfo.message}
            </span>
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-[15px] font-medium">今日摄入</h2>
            <span className="text-[12px] text-ink-400">就寝 {settings.bedtime}</span>
          </div>
          <div className="space-y-3.5">
            {rows.map(r => (
              <div key={r.label}>
                <div className="flex items-baseline justify-between text-[12.5px] mb-1.5">
                  <span className="text-ink-500 dark:text-slate-400">{r.label}</span>
                  <span className="font-medium">
                    {r.value}
                    <span className="text-ink-400 font-normal"> / {r.target}{r.unit}</span>
                  </span>
                </div>
                <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={'h-full rounded-full transition-all duration-500 ' + r.color}
                    style={{ width: pct(r.value, r.target) + '%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <DrinkCalendar logs={logs} />

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-medium">常用饮品</h2>
            <button onClick={onOpenPicker} className="text-[12.5px] text-brand-600 font-medium flex items-center gap-0.5">
              全部 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {shortcuts.length === 0 ? (
            <button onClick={onOpenPicker} className="card w-full py-12 flex flex-col items-center text-ink-400">
              <Coffee className="w-8 h-8 mb-2 opacity-40" />
              <span className="text-[13px]">还没有饮品，点这里记录第一杯</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {shortcuts.map(t => (
                <button
                  key={t.id}
                  onClick={() => onQuickRecord(t)}
                  className="card p-3.5 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-2.5">
                    <DrinkArtwork art={t.art} size={40} className="shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-medium truncate">{t.name}</p>
                      <p className="text-[11.5px] text-ink-400 truncate">{t.brand}</p>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[11px] text-ink-400">
                    {t.caffeineMg}mg · {t.sugarG}g · {t.caloriesKcal}kcal
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <button onClick={onOpenCustomDrink} className="btn-secondary w-full">
          <Plus className="w-4 h-4 mr-1.5" /> 创建自定义饮品
        </button>

        <p className="text-center text-[11px] leading-relaxed text-ink-400 pb-2">
          基于一阶消除模型估算，仅供参考，不构成医疗建议
        </p>
      </div>
    </div>
  )
}
