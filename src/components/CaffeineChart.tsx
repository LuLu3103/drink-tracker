import { useEffect, useRef } from 'react'
import echarts, { type EChartsInstance } from '@/utils/echarts'

interface CaffeineChartProps {
  curve: Array<{ time: number; residual: number }>
  bedtime: string
  threshold: number
}

export default function CaffeineChart({ curve, bedtime, threshold }: CaffeineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<EChartsInstance | null>(null)

  useEffect(() => {
    if (!chartRef.current || curve.length === 0) return

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }
    const chart = chartInstance.current

    const now = Date.now()
    const labels = curve.map(p =>
      new Date(p.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
    )
    const values = curve.map(p => Math.max(0, Number(p.residual.toFixed(1))))
    const currentIndex = curve.findIndex(p => p.time >= now)

    const [bh, bm] = bedtime.split(':').map(Number)
    const bed = new Date()
    bed.setHours(bh, bm, 0, 0)
    const bedLabel = bed.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })

    const markLines: any[] = [
      {
        silent: true,
        yAxis: threshold,
        lineStyle: { color: '#F59E0B', type: 'dashed', width: 1 },
        label: { formatter: '阈值 ' + threshold + 'mg', color: '#F59E0B', fontSize: 10, position: 'insideEndTop' },
      },
    ]
    if (labels.includes(bedLabel)) {
      markLines.unshift({
        silent: true,
        xAxis: bedLabel,
        lineStyle: { color: '#9CA3AF', type: 'dashed', width: 1 },
        label: { formatter: '就寝', color: '#9CA3AF', fontSize: 10 },
      })
    }

    const option: any = {
      animation: false,
      grid: { left: 44, right: 14, top: 16, bottom: 28 },
      xAxis: {
        type: 'category',
        data: labels,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#9CA3AF',
          fontSize: 10,
          interval: Math.max(1, Math.floor(labels.length / 7)),
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        minInterval: 1,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#9CA3AF', fontSize: 10, formatter: (v: number) => String(Math.round(v)) },
        splitLine: { lineStyle: { color: 'rgba(156,163,175,0.18)' } },
      },
      series: [
        {
          type: 'line',
          name: '咖啡因残留',
          data: values,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: '#8B6914' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(139,105,20,0.32)' },
                { offset: 1, color: 'rgba(139,105,20,0.02)' },
              ],
            },
          },
          markLine: { silent: true, symbol: 'none', data: markLines },
          markPoint:
            currentIndex >= 0
              ? {
                  silent: true,
                  symbol: 'circle',
                  symbolSize: 9,
                  itemStyle: { color: '#8B6914' },
                  label: {
                    show: true,
                    formatter: values[currentIndex].toFixed(0) + 'mg',
                    color: '#8B6914',
                    fontSize: 10,
                    fontWeight: 'bold',
                    position: 'top',
                  },
                  data: [{ name: 'now', coord: [currentIndex, values[currentIndex]] }],
                }
              : undefined,
        },
      ],
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params
          if (!p) return ''
          return '<b>' + p.name + '</b><br/>咖啡因残留 <b>' + Number(p.value).toFixed(1) + 'mg</b>'
        },
        backgroundColor: 'rgba(17,24,39,0.92)',
        borderColor: '#8B6914',
        textStyle: { color: '#fff', fontSize: 12 },
      },
    }

    chart.setOption(option, true)

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [curve, bedtime, threshold])

  return <div ref={chartRef} className="w-full" style={{ height: 180 }} />
}