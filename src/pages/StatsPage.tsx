import { useMemo, useState } from 'react'
import { useDrinkStore } from '@/store'
import type { DailyStats } from '@/types'
import CaffeineChart from '@/components/CaffeineChart'
import NutritionChart from '@/components/NutritionChart'
import { getCategoryLabel } from '@/utils/format'

const CAT_COLOR: Record<string, string> = {
  coffee: '#2563EB',
  milk_tea: '#8B5CF6',
  tea: '#10B981',
  other: '#F59E0B',
}

export default function StatsPage() {
  const weeklyStats = useDrinkStore(s => s.weeklyStats)
  const monthlyStats = useDrinkStore(s => s.monthlyStats)
  const todayStats = useDrinkStore(s => s.todayStats)
  const settings = useDrinkStore(s => s.settings)
  const bedtimeResidual = useDrinkStore(s => s.bedtimeResidual)
  const riskLevel = useDrinkStore(s => s.riskLevel)
  const curve = useDrinkStore(s => s.caffeineCurve)
  const logs = useDrinkStore(s => s.logs)

  const [range, setRange] = useState<'week' | 'month'>('week')
  const series: DailyStats[] = range === 'week' ? weeklyStats : monthlyStats
  const days = series.length || 1

  const sum = (pick: (d: DailyStats) => number) => series.reduce((a, d) => a + pick(d), 0)
  const avgCaffeine = sum(d => d.totalCaffeine) / days
  const avgSugar = sum(d => d.totalSugar) / days
  const avgCalories = sum(d => d.totalCalories) / days
  const overCaf = series.filter(d => d.totalCaffeine > settings.dailyCaffeineTargetMg).length
  const overSug = series.filter(d => d.totalSugar > settings.dailySugarTargetG).length
  const overCal = series.filter(d => d.totalCalories > settings.dailyCalorieTargetKcal).length

  const brands = useMemo(() => {
    const m = new Map<string, number>()
    logs.forEach(l => m.set(l.brand, (m.get(l.brand) || 0) + 1))
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [logs])

  const cats = useMemo(() => {
    const m = new Map<string, number>()
    logs.forEach(l => m.set(l.category, (m.get(l.category) || 0) + 1))
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [logs])

  const times = useMemo(() => {
    const b = { morning: 0, afternoon: 0, evening: 0 }
    logs.forEach(l => {
      const h = new Date(l.consumedAt).getHours()
      if (h < 12) b.morning++
      else if (h < 18) b.afternoon++
      else b.evening++
    })
    return b
  }, [logs])

  const maxBrand = brands.length ? brands[0][1] : 1
  const maxCat = cats.length ? cats[0][1] : 1

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-5 pt-6 pb-28 space-y-4">
        <h1 className="text-[22px] font-semibold tracking-tight">统计</h1>

        <section className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12px] text-ink-400">睡前预计残留</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-[30px] leading-none font-semibold tracking-tight" style={{ color: riskLevel.color }}>
                  {Math.round(bedtimeResidual)}
                </span>
                <span className="text-[13px] text-ink-400">mg</span>
              </div>
            </div>
            <span className="chip text-[11px]" style={{ backgroundColor: riskLevel.color + '14', color: riskLevel.color }}>
              {riskLevel.label}
            </span>
          </div>
          <div className="mt-3">
            <CaffeineChart curve={curve} bedtime={settings.bedtime} threshold={settings.sleepResidualThresholdMg} />
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <Metric label="今日咖啡因" value={Math.round(todayStats.totalCaffeine)} unit="mg" target={settings.dailyCaffeineTargetMg} color="#2563EB" />
          <Metric label="今日糖" value={Number(todayStats.totalSugar.toFixed(1))} unit="g" target={settings.dailySugarTargetG} color="#F59E0B" />
          <Metric label="今日热量" value={Math.round(todayStats.totalCalories)} unit="kcal" target={settings.dailyCalorieTargetKcal} color="#FB7185" />
          <Metric label="今日杯数" value={todayStats.count} unit="杯" target={0} color="#64748B" />
        </div>

        <div className="inline-flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          {(['week', 'month'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={
                'px-5 py-1.5 rounded-xl text-[12.5px] font-medium transition-colors ' +
                (range === r ? 'bg-white text-ink-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-ink-400')
              }
            >
              {r === 'week' ? '本周' : '本月'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <Mini label="日均咖啡因" value={Math.round(avgCaffeine)} unit="mg" color="#2563EB" />
          <Mini label="日均糖" value={Number(avgSugar.toFixed(1))} unit="g" color="#F59E0B" />
          <Mini label="日均热量" value={Math.round(avgCalories)} unit="kcal" color="#FB7185" />
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <Over label="咖啡因超标" count={overCaf} total={series.length} color="#2563EB" />
          <Over label="糖超标" count={overSug} total={series.length} color="#F59E0B" />
          <Over label="热量超标" count={overCal} total={series.length} color="#FB7185" />
        </div>

        <NutritionChart
          stats={series}
          caffeineTarget={settings.dailyCaffeineTargetMg}
          sugarTarget={settings.dailySugarTargetG}
          calorieTarget={settings.dailyCalorieTargetKcal}
        />

        {brands.length > 0 && (
          <section className="card p-5">
            <h3 className="text-[13.5px] font-medium mb-3.5">品牌分布</h3>
            <div className="space-y-3">
              {brands.map(([brand, count], i) => (
                <div key={brand} className="flex items-center gap-2.5">
                  <span className="w-3 text-[11px] text-ink-400">{i + 1}</span>
                  <span className="w-20 text-[12px] truncate">{brand}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: (count / maxBrand) * 100 + '%' }} />
                  </div>
                  <span className="text-[11px] text-ink-400 w-9 text-right">{count} 杯</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-3">
          <section className="card p-4">
            <h3 className="text-[13px] font-medium mb-3">品类</h3>
            {cats.length === 0 && <p className="text-[11.5px] text-ink-400">暂无数据</p>}
            <div className="space-y-2.5">
              {cats.map(([c, n]) => (
                <div key={c} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CAT_COLOR[c] || '#94A3B8' }} />
                  <span className="flex-1 text-[11.5px]">{getCategoryLabel(c)}</span>
                  <div className="w-10 h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: (n / maxCat) * 100 + '%', backgroundColor: CAT_COLOR[c] || '#94A3B8' }} />
                  </div>
                  <span className="text-[10.5px] text-ink-400 w-6 text-right">{n}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-4">
            <h3 className="text-[13px] font-medium mb-3">时段</h3>
            <div className="space-y-2.5 text-[11.5px]">
              <TimeRow label="上午" sub="6-12" value={times.morning} />
              <TimeRow label="下午" sub="12-18" value={times.afternoon} />
              <TimeRow label="晚上" sub="18-24" value={times.evening} />
            </div>
          </section>
        </div>

        <p className="text-center text-[11px] text-ink-400 pb-2">摄入估算，非代谢曲线</p>
      </div>
    </div>
  )
}

function Metric({ label, value, unit, target, color }: { label: string; value: number; unit: string; target: number; color: string }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0
  return (
    <div className="card p-4">
      <p className="text-[11.5px] text-ink-400">{label}</p>
      <p className="mt-1 text-[20px] font-semibold leading-none">
        {value}
        <span className="text-[11px] font-normal text-ink-400 ml-0.5">{unit}</span>
      </p>
      {target > 0 && (
        <div className="mt-2.5 h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: pct + '%', backgroundColor: color }} />
        </div>
      )}
    </div>
  )
}

function Mini({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="card-flat p-3">
      <p className="text-[10.5px] text-ink-400">{label}</p>
      <p className="mt-0.5 text-[15px] font-semibold" style={{ color }}>
        {value}
        <span className="text-[10px] font-normal text-ink-400 ml-0.5">{unit}</span>
      </p>
    </div>
  )
}

function Over({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  return (
    <div className="card-flat p-3 text-center">
      <p className="text-[17px] font-semibold" style={{ color }}>{count}</p>
      <p className="text-[10px] text-ink-400">/ {total} 天</p>
      <p className="text-[10.5px] text-ink-500 mt-0.5">{label}</p>
    </div>
  )
}

function TimeRow({ label, sub, value }: { label: string; sub: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex-1">
        {label}
        <span className="text-[10px] text-ink-400 ml-1">{sub}</span>
      </span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
