import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useDrinkStore } from '@/store'
import type { DailyStats } from '@/types'
import CaffeineChart from '@/components/CaffeineChart'
import NutritionChart from '@/components/NutritionChart'
import { Coffee, Cookie, Flame, CupSoda, PieChart, Clock3 } from 'lucide-react'

const CATEGORY_LABEL: Record<string, string> = {
  coffee: '咖啡',
  milk_tea: '奶茶',
  tea: '纯茶',
  other: '其他',
}
const CATEGORY_EMOJI: Record<string, string> = {
  coffee: '☕',
  milk_tea: '🧋',
  tea: '🍵',
  other: '🥤',
}

export default function StatsPage() {
  const weeklyStats = useDrinkStore(s => s.weeklyStats)
  const monthlyStats = useDrinkStore(s => s.monthlyStats)
  const todayStats = useDrinkStore(s => s.todayStats)
  const settings = useDrinkStore(s => s.settings)
  const bedtimeResidual = useDrinkStore(s => s.bedtimeResidual)
  const riskLevel = useDrinkStore(s => s.riskLevel)
  const caffeineCurve = useDrinkStore(s => s.caffeineCurve)
  const logs = useDrinkStore(s => s.logs)

  const [range, setRange] = useState<'week' | 'month'>('week')

  const series: DailyStats[] = range === 'week' ? weeklyStats : monthlyStats
  const dayCount = series.length || 1

  const sum = (pick: (d: DailyStats) => number) => series.reduce((acc, d) => acc + pick(d), 0)
  const avgCaffeine = sum(d => d.totalCaffeine) / dayCount
  const avgSugar = sum(d => d.totalSugar) / dayCount
  const avgCalories = sum(d => d.totalCalories) / dayCount
  const overCaffeine = series.filter(d => d.totalCaffeine > settings.dailyCaffeineTargetMg).length
  const overSugar = series.filter(d => d.totalSugar > settings.dailySugarTargetG).length
  const overCalorie = series.filter(d => d.totalCalories > settings.dailyCalorieTargetKcal).length

  const brandTop = useMemo(() => {
    const map = new Map<string, number>()
    for (const log of logs) map.set(log.brand, (map.get(log.brand) || 0) + 1)
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [logs])

  const categoryDist = useMemo(() => {
    const map = new Map<string, number>()
    for (const log of logs) map.set(log.category, (map.get(log.category) || 0) + 1)
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [logs])

  const timeDist = useMemo(() => {
    const buckets = { morning: 0, afternoon: 0, evening: 0 }
    for (const log of logs) {
      const h = new Date(log.consumedAt).getHours()
      if (h < 12) buckets.morning++
      else if (h < 18) buckets.afternoon++
      else buckets.evening++
    }
    return buckets
  }, [logs])

  const maxBrand = brandTop.length > 0 ? brandTop[0][1] : 1
  const maxCat = categoryDist.length > 0 ? categoryDist[0][1] : 1

  return (
    <div className="h-full overflow-y-auto pb-24">
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold pt-1">统计</h1>

        <div className="card p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold">咖啡因代谢曲线</h3>
              <p className="text-[11px] text-gray-500">过去 12 小时 → 就寝后 2 小时</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold leading-tight" style={{ color: riskLevel.color }}>
                {Math.round(bedtimeResidual)}
                <span className="text-sm font-medium">mg</span>
              </p>
              <p className="text-[11px] font-medium" style={{ color: riskLevel.color }}>{riskLevel.label} · 睡前</p>
            </div>
          </div>
          <CaffeineChart curve={caffeineCurve} bedtime={settings.bedtime} threshold={settings.sleepResidualThresholdMg} />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <TodayCard icon={<Coffee className="w-4 h-4" />} label="咖啡因" value={Math.round(todayStats.totalCaffeine)} unit="mg" target={settings.dailyCaffeineTargetMg} color="#8B6914" />
          <TodayCard icon={<Cookie className="w-4 h-4" />} label="糖" value={Number(todayStats.totalSugar.toFixed(1))} unit="g" target={settings.dailySugarTargetG} color="#F59E0B" />
          <TodayCard icon={<Flame className="w-4 h-4" />} label="热量" value={Math.round(todayStats.totalCalories)} unit="kcal" target={settings.dailyCalorieTargetKcal} color="#EF4444" />
          <TodayCard icon={<CupSoda className="w-4 h-4" />} label="杯数" value={todayStats.count} unit="杯" target={0} color="#3B82F6" />
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setRange('week')}
            className={'flex-1 py-2 rounded-lg text-sm font-medium transition-colors ' + (range === 'week' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500')}
          >
            本周
          </button>
          <button
            onClick={() => setRange('month')}
            className={'flex-1 py-2 rounded-lg text-sm font-medium transition-colors ' + (range === 'month' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500')}
          >
            本月
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <AvgCard label="日均咖啡因" value={Math.round(avgCaffeine)} unit="mg" target={settings.dailyCaffeineTargetMg} color="#8B6914" />
          <AvgCard label="日均糖" value={Number(avgSugar.toFixed(1))} unit="g" target={settings.dailySugarTargetG} color="#F59E0B" />
          <AvgCard label="日均热量" value={Math.round(avgCalories)} unit="kcal" target={settings.dailyCalorieTargetKcal} color="#EF4444" />
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <OverCard label="咖啡因超标" count={overCaffeine} total={series.length} color="#8B6914" />
          <OverCard label="糖超标" count={overSugar} total={series.length} color="#F59E0B" />
          <OverCard label="热量超标" count={overCalorie} total={series.length} color="#EF4444" />
        </div>

        <NutritionChart
          stats={series}
          caffeineTarget={settings.dailyCaffeineTargetMg}
          sugarTarget={settings.dailySugarTargetG}
          calorieTarget={settings.dailyCalorieTargetKcal}
        />

        {brandTop.length > 0 && (
          <div className="card p-4">
            <h3 className="font-medium mb-3 flex items-center gap-1.5">
              <PieChart className="w-4 h-4" /> 品牌分布 TOP 5
            </h3>
            <div className="space-y-2.5">
              {brandTop.map(([brand, count], i) => (
                <div key={brand} className="flex items-center gap-2">
                  <span className="w-4 text-xs text-gray-400 text-right">{i + 1}</span>
                  <span className="w-20 text-xs truncate">{brand}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full rounded-full bg-coffee" style={{ width: (count / maxBrand) * 100 + '%' }} />
                  </div>
                  <span className="text-xs text-gray-500 w-10 text-right">{count} 杯</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <div className="card p-4">
            <h3 className="font-medium mb-3">品类分布</h3>
            {categoryDist.length === 0 && <p className="text-xs text-gray-400">暂无数据</p>}
            <div className="space-y-2.5">
              {categoryDist.map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-sm">{CATEGORY_EMOJI[cat] || '🥤'}</span>
                  <span className="flex-1 text-xs">{CATEGORY_LABEL[cat] || cat}</span>
                  <div className="w-12 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full rounded-full bg-coffee" style={{ width: (count / maxCat) * 100 + '%' }} />
                  </div>
                  <span className="text-[11px] text-gray-500 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-medium mb-3 flex items-center gap-1.5">
              <Clock3 className="w-4 h-4" /> 时段分布
            </h3>
            <div className="space-y-2.5 text-xs">
              <TimeRow icon="🌅" label="上午" sub="6-12" value={timeDist.morning} />
              <TimeRow icon="☀️" label="下午" sub="12-18" value={timeDist.afternoon} />
              <TimeRow icon="🌙" label="晚上" sub="18-24" value={timeDist.evening} />
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-400 pb-2">摄入估算，非代谢曲线；时间按本地时区自然日聚合</p>
      </div>
    </div>
  )
}

function TodayCard({
  icon,
  label,
  value,
  unit,
  target,
  color,
}: {
  icon: ReactNode
  label: string
  value: number
  unit: string
  target: number
  color: string
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0
  const over = target > 0 && value > target
  return (
    <div className="card p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <p className="text-xl font-bold leading-tight">
        {value}
        <span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span>
      </p>
      {target > 0 && (
        <>
          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 mt-2 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: pct + '%', backgroundColor: over ? '#EF4444' : color }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">目标 {target}{unit}</p>
        </>
      )}
    </div>
  )
}

function AvgCard({ label, value, unit, target, color }: { label: string; value: number; unit: string; target: number; color: string }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0
  return (
    <div className="card p-3">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="text-lg font-bold leading-tight mt-0.5" style={{ color }}>
        {value}
        <span className="text-[10px] font-normal text-gray-400 ml-0.5">{unit}</span>
      </p>
      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 mt-2 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: pct + '%', backgroundColor: color }} />
      </div>
    </div>
  )
}

function OverCard({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  return (
    <div className="card p-3 text-center" style={{ borderLeft: '3px solid ' + color }}>
      <p className="text-xl font-bold leading-tight" style={{ color }}>{count}</p>
      <p className="text-[10px] text-gray-400">/ {total} 天</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function TimeRow({ icon, label, sub, value }: { icon: string; label: string; sub: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span>{icon}</span>
      <span className="flex-1">
        {label}
        <span className="text-[10px] text-gray-400 ml-1">{sub}</span>
      </span>
      <span className="font-medium">{value} 杯</span>
    </div>
  )
}