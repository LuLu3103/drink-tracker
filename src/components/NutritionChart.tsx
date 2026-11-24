import { useEffect, useRef } from 'react'
import echarts, { type EChartsInstance } from '@/utils/echarts'

interface NutritionChartProps {
  stats: Array<{ date: string; count: number; totalCaffeine: number; totalSugar: number; totalCalories: number }>
  caffeineTarget: number
  sugarTarget: number
  calorieTarget: number
}

export default function NutritionChart({ stats, caffeineTarget, sugarTarget, calorieTarget }: NutritionChartProps) {
  const caffeineChartRef = useRef<HTMLDivElement>(null)
  const sugarChartRef = useRef<HTMLDivElement>(null)
  const calorieChartRef = useRef<HTMLDivElement>(null)
  
  const chartInstances = useRef<Record<string, EChartsInstance>>({})
  
  useEffect(() => {
    if (!caffeineChartRef.current || !sugarChartRef.current || !calorieChartRef.current) return
    
    const charts = ['caffeine', 'sugar', 'calorie'] as const
    const refs = { caffeine: caffeineChartRef, sugar: sugarChartRef, calorie: calorieChartRef }
    const targets = { caffeine: caffeineTarget, sugar: sugarTarget, calorie: calorieTarget }
    const colors = { caffeine: '#8B6914', sugar: '#F59E0B', calorie: '#EF4444' }
    const units = { caffeine: 'mg', sugar: 'g', calorie: 'kcal' }
    const names = { caffeine: '咖啡因', sugar: '糖', calorie: '热量' }
    
    charts.forEach(key => {
      const ref = refs[key].current
      if (!ref) return
      
      if (!chartInstances.current[key]) {
        chartInstances.current[key] = echarts.init(ref)
      }
      const chart = chartInstances.current[key]
      
      const data = stats.map(s => ({
        date: new Date(s.date + 'T00:00:00').toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
        value: key === 'caffeine' ? s.totalCaffeine : key === 'sugar' ? s.totalSugar : s.totalCalories
      }))
      
      const option: any = {
        animation: false,
        grid: {
          left: 40,
          right: 10,
          top: 10,
          bottom: 30
        },
        xAxis: {
          type: 'category',
          data: data.map(d => d.date),
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#9ca3af', fontSize: 10, rotate: 30 },
          axisTick: { show: false },
          boundaryGap: true
        },
        yAxis: {
          type: 'value',
          min: 0,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#9ca3af', fontSize: 10 },
          splitLine: { lineStyle: { color: '#f3f4f6' } }
        },
        series: [
          {
            name: names[key],
            type: 'bar',
            data: data.map(d => d.value),
            barWidth: '60%',
            itemStyle: {
              color: (params: any) => {
                return params.value > targets[key] 
                  ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
                      { offset: 0, color: colors[key] },
                      { offset: 1, color: colors[key] + '80' }
                    ] }
                  : { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
                      { offset: 0, color: colors[key] + '40' },
                      { offset: 1, color: colors[key] + '10' }
                    ] }
              }
            },
            emphasis: { itemStyle: { color: colors[key] } }
          },
          {
            name: '目标线',
            type: 'line',
            data: data.map(() => targets[key]),
            symbol: 'none',
            lineStyle: { color: colors[key], type: 'dashed', width: 1 },
            showSymbol: false,
            markLine: {
              silent: true,
              data: [{ yAxis: targets[key] }],
              label: { show: false }
            }
          }
        ],
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const bar = params.find((p: any) => p.seriesType === 'bar')
            if (!bar) return ''
            return `<strong>${bar.name}</strong><br/>${names[key]}: <strong>${bar.value.toFixed(1)}${units[key]}</strong><br/>目标: ${targets[key]}${units[key]}`
          },
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          borderColor: colors[key],
          textStyle: { color: '#fff' }
        }
      }
      
      chart.setOption(option, true)
    })
    
    const resizeHandler = () => {
      Object.values(chartInstances.current).forEach(c => c.resize())
    }
    window.addEventListener('resize', resizeHandler)
    
    return () => {
      window.removeEventListener('resize', resizeHandler)
    }
  }, [stats, caffeineTarget, sugarTarget, calorieTarget])
  
  return (
    <div className="space-y-6">
      <div className="card p-4">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8B6914' }}></span>
          咖啡因每日总量
        </h3>
        <div ref={caffeineChartRef} className="h-48 w-full" style={{ minHeight: '180px' }} />
      </div>
      
      <div className="card p-4">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B' }}></span>
          糖每日总量
        </h3>
        <div ref={sugarChartRef} className="h-48 w-full" style={{ minHeight: '180px' }} />
      </div>
      
      <div className="card p-4">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444' }}></span>
          热量每日总量
        </h3>
        <div ref={calorieChartRef} className="h-48 w-full" style={{ minHeight: '180px' }} />
      </div>
    </div>
  )
}