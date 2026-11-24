import { useEffect, useRef } from 'react'
import echarts, { type EChartsInstance } from '@/utils/echarts'

interface Props {
  curve: Array<{ time: number; residual: number }>
  bedtime: string
  threshold: number
}

export default function CaffeineChart({ curve, bedtime, threshold }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inst = useRef<EChartsInstance | null>(null)

  useEffect(() => {
    if (!ref.current || curve.length === 0) return
    if (!inst.current) inst.current = echarts.init(ref.current)
    const chart = inst.current

    const now = Date.now()
    const labels = curve.map(p =>
      new Date(p.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
    )
    const values = curve.map(p => Math.max(0, Number(p.residual.toFixed(1))))
    const idx = curve.findIndex(p => p.time >= now)

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
        lineStyle: { color: '#CBD5E1', type: 'dashed', width: 1 },
        label: { formatter: '就寝', color: '#94A3B8', fontSize: 10 },
      })
    }

    const option: any = {
      animation: false,
      grid: { left: 42, right: 12, top: 16, bottom: 26 },
      xAxis: {
        type: 'category',
        data: labels,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisTick: { show: false },
        axisLabel: { color: '#94A3B8', fontSize: 10, interval: Math.max(1, Math.floor(labels.length / 7)) },
      },
      yAxis: {
        type: 'value',
        min: 0,
        minInterval: 1,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94A3B8', fontSize: 10, formatter: (v: number) => String(Math.round(v)) },
        splitLine: { lineStyle: { color: '#F1F5F9' } },
      },
      series: [
        {
          type: 'line',
          name: '咖啡因残留',
          data: values,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2.2, color: '#2563EB' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(37,99,235,0.22)' },
                { offset: 1, color: 'rgba(37,99,235,0.01)' },
              ],
            },
          },
          markLine: { silent: true, symbol: 'none', data: markLines },
          markPoint: idx >= 0
            ? {
                silent: true,
                symbol: 'circle',
                symbolSize: 8,
                itemStyle: { color: '#2563EB', borderColor: '#fff', borderWidth: 2 },
                label: {
                  show: true,
                  formatter: values[idx].toFixed(0) + 'mg',
                  color: '#2563EB',
                  fontSize: 10,
                  fontWeight: 'bold',
                  position: 'top',
                },
                data: [{ name: 'now', coord: [idx, values[idx]] }],
              }
            : undefined,
        },
      ],
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params
          if (!p) return ''
          return '<b>' + p.name + '</b><br/>残留 <b>' + Number(p.value).toFixed(1) + 'mg</b>'
        },
        backgroundColor: 'rgba(15,23,42,0.92)',
        borderColor: 'transparent',
        textStyle: { color: '#fff', fontSize: 12 },
      },
    }

    chart.setOption(option, true)
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [curve, bedtime, threshold])

  return <div ref={ref} className="w-full" style={{ height: 172 }} />
}
