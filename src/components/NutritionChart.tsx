import { useEffect, useRef } from 'react'
import echarts, { type EChartsInstance } from '@/utils/echarts'

interface Props {
  stats: Array<{ date: string; count: number; totalCaffeine: number; totalSugar: number; totalCalories: number }>
  caffeineTarget: number
  sugarTarget: number
  calorieTarget: number
}

const SERIES = [
  { key: 'caffeine', name: '咖啡因', unit: 'mg', color: '#2563EB' },
  { key: 'sugar', name: '糖', unit: 'g', color: '#F59E0B' },
  { key: 'calorie', name: '热量', unit: 'kcal', color: '#FB7185' },
] as const

export default function NutritionChart({ stats, caffeineTarget, sugarTarget, calorieTarget }: Props) {
  const refs = {
    caffeine: useRef<HTMLDivElement>(null),
    sugar: useRef<HTMLDivElement>(null),
    calorie: useRef<HTMLDivElement>(null),
  }
  const instances = useRef<Record<string, EChartsInstance>>({})
  const targets = { caffeine: caffeineTarget, sugar: sugarTarget, calorie: calorieTarget }

  useEffect(() => {
    SERIES.forEach(s => {
      const el = refs[s.key].current
      if (!el) return
      if (!instances.current[s.key]) instances.current[s.key] = echarts.init(el)
      const chart = instances.current[s.key]
      const target = targets[s.key]

      const data = stats.map(d => ({
        label: new Date(d.date + 'T00:00:00').toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
        value: s.key === 'caffeine' ? d.totalCaffeine : s.key === 'sugar' ? d.totalSugar : d.totalCalories,
      }))

      const option: any = {
        animation: false,
        grid: { left: 38, right: 8, top: 10, bottom: 28 },
        xAxis: {
          type: 'category',
          data: data.map(d => d.label),
          axisLine: { lineStyle: { color: '#E2E8F0' } },
          axisTick: { show: false },
          axisLabel: { color: '#94A3B8', fontSize: 9.5, rotate: 30 },
        },
        yAxis: {
          type: 'value',
          min: 0,
          minInterval: 1,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#94A3B8', fontSize: 9.5, formatter: (v: number) => String(Math.round(v)) },
          splitLine: { lineStyle: { color: '#F1F5F9' } },
        },
        series: [
          {
            type: 'bar',
            data: data.map(d => d.value),
            barWidth: '52%',
            itemStyle: {
              borderRadius: [6, 6, 0, 0],
              color: (params: any) =>
                params.value > target
                  ? s.color
                  : {
                      type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                      colorStops: [
                        { offset: 0, color: s.color + 'CC' },
                        { offset: 1, color: s.color + '4D' },
                      ],
                    },
            },
            markLine: {
              silent: true,
              symbol: 'none',
              data: [{ yAxis: target }],
              lineStyle: { color: s.color, type: 'dashed', width: 1, opacity: 0.7 },
              label: { show: false },
            },
          },
        ],
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const p = Array.isArray(params) ? params[0] : params
            if (!p) return ''
            return '<b>' + p.name + '</b><br/>' + s.name + ' <b>' + Number(p.value).toFixed(1) + s.unit + '</b><br/>目标 ' + target + s.unit
          },
          backgroundColor: 'rgba(15,23,42,0.92)',
          borderColor: 'transparent',
          textStyle: { color: '#fff', fontSize: 12 },
        },
      }
      chart.setOption(option, true)
    })

    const onResize = () => Object.values(instances.current).forEach(c => c.resize())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, caffeineTarget, sugarTarget, calorieTarget])

  return (
    <div className="space-y-3">
      {SERIES.map(s => (
        <div key={s.key} className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            <h3 className="text-[13.5px] font-medium">{s.name}每日总量</h3>
            <span className="ml-auto text-[11px] text-ink-400">目标 {targets[s.key]}{s.unit}</span>
          </div>
          <div ref={refs[s.key]} className="w-full" style={{ height: 140 }} />
        </div>
      ))}
    </div>
  )
}
