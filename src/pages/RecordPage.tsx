import { useMemo } from 'react'
import { useDrinkStore } from '@/store'
import type { DrinkTemplate } from '@/types'
import { getCategoryColor, getRiskColor } from '@/utils/format'
import { Coffee, Clock, ChevronRight, Plus, AlertTriangle } from 'lucide-react'

interface RecordPageProps {
  onQuickRecord: (template: DrinkTemplate) => void
  onOpenPicker: () => void
  onOpenCustomDrink: () => void
}

const CATEGORY_EMOJI: Record<string, string> = {
  coffee: '☕',
  milk_tea: '🧋',
  tea: '🍵',
  other: '🥤',
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

  const shortcutTemplates = useMemo(() => {
    const recentIds: string[] = []
    for (const log of logs) {
      if (log.templateId && !recentIds.includes(log.templateId)) recentIds.push(log.templateId)
      if (recentIds.length >= 4) break
    }
    const recent = recentIds
      .map(id => templates.find(t => t.id === id))
      .filter((t): t is DrinkTemplate => Boolean(t))
    const favorites = templates.filter(t => t.isFavorite && !recentIds.includes(t.id))
    return [...recent, ...favorites].slice(0, 6)
  }, [templates, logs])

  const caffeinePct = Math.min(100, Math.round((todayStats.totalCaffeine / settings.dailyCaffeineTargetMg) * 100))
  const sugarPct = Math.min(100, Math.round((todayStats.totalSugar / settings.dailySugarTargetG) * 100))
  const caloriePct = Math.min(100, Math.round((todayStats.totalCalories / settings.dailyCalorieTargetKcal) * 100))

  return (
    <div className="h-full overflow-y-auto pb-24">
      <div className="p-4 space-y-4">
        <header className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-2xl font-bold">饮品记账本</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              就寝 {settings.bedtime} · 半衰期 {settings.halfLifeHours}h · 阈值 {settings.sleepResidualThresholdMg}mg
            </p>
          </div>
          <button
            onClick={onOpenPicker}
            className="w-12 h-12 rounded-2xl bg-coffee text-white flex items-center justify-center shadow-lg shadow-coffee/30 active:scale-95 transition-transform"
            aria-label="新增记录"
          >
            <Plus className="w-6 h-6" />
          </button>
        </header>

        <div className="card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-primary-50 dark:bg-primary-900/30 p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1">
                <Coffee className="w-3.5 h-3.5" /> 当前体内残留
              </div>
              <div className="text-2xl font-bold text-coffee leading-tight">
                {Math.round(currentResidual)}
                <span className="text-sm font-medium ml-0.5">mg</span>
              </div>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: getRiskColor(riskLevel.level) + '18' }}>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1">
                <Clock className="w-3.5 h-3.5" /> 睡前预计残留
              </div>
              <div className="text-2xl font-bold leading-tight" style={{ color: getRiskColor(riskLevel.level) }}>
                {Math.round(bedtimeResidual)}
                <span className="text-sm font-medium ml-0.5">mg</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ backgroundColor: getRiskColor(riskLevel.level) + '15' }}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium text-white shrink-0" style={{ backgroundColor: getRiskColor(riskLevel.level) }}>
                {riskLevel.label}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                {cutoffInfo.isPast ? cutoffInfo.message : cutoffInfo.message}
              </span>
            </div>
          </div>

          {cutoffInfo.isPast && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{cutoffInfo.message}</span>
            </div>
          )}
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">今日摄入</h3>
            <span className="text-xs text-gray-400">{todayStats.count} 杯</span>
          </div>

          <div className="space-y-2.5">
            <MetricBar label="咖啡因" value={todayStats.totalCaffeine} unit="mg" target={settings.dailyCaffeineTargetMg} pct={caffeinePct} color="#8B6914" />
            <MetricBar label="糖" value={todayStats.totalSugar} unit="g" target={settings.dailySugarTargetG} pct={sugarPct} color="#F59E0B" decimals={1} />
            <MetricBar label="热量" value={todayStats.totalCalories} unit="kcal" target={settings.dailyCalorieTargetKcal} pct={caloriePct} color="#EF4444" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">常用饮品</h3>
            <button onClick={onOpenPicker} className="text-sm text-coffee font-medium flex items-center gap-0.5">
              全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {shortcutTemplates.length === 0 ? (
            <button onClick={onOpenPicker} className="card w-full py-10 text-center text-gray-500">
              <Coffee className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">还没有饮品模板</p>
              <p className="text-xs text-gray-400 mt-1">点这里开始记录第一杯</p>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {shortcutTemplates.map(t => (
                <button
                  key={t.id}
                  onClick={() => onQuickRecord(t)}
                  className="card p-3 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                      style={{ backgroundColor: getCategoryColor(t.category) + '20' }}
                    >
                      {CATEGORY_EMOJI[t.category]}
                    </span>
                    <span className="text-sm font-medium truncate">{t.name}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">{t.brand} · {t.size}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {t.caffeineMg}mg · {t.sugarG}g · {t.caloriesKcal}kcal
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={onOpenCustomDrink} className="btn-secondary w-full">
          <Plus className="w-4 h-4 mr-1.5" /> 创建自定义饮品
        </button>

        <p className="text-center text-[11px] text-gray-400 leading-relaxed pb-2">
          估算基于一阶消除模型，结果仅供参考，不构成医疗建议
        </p>
      </div>
    </div>
  )
}

function MetricBar({
  label,
  value,
  unit,
  target,
  pct,
  color,
  decimals = 0,
}: {
  label: string
  value: number
  unit: string
  target: number
  pct: number
  color: string
  decimals?: number
}) {
  const over = value > target
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium">
          {value.toFixed(decimals)}
          <span className="text-gray-400"> / {target}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: pct + '%', backgroundColor: over ? '#EF4444' : color }}
        />
      </div>
    </div>
  )
}