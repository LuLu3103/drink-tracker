import { useMemo, useState } from 'react'
import type { DrinkLog } from '@/types'
import { useDrinkStore } from '@/store'
import { DrinkArtwork, fallbackArt } from '@/components/DrinkArtwork'
import { renderCalendarPoster } from '@/utils/poster'
import { ChevronLeft, ChevronRight, Share2, Loader2 } from 'lucide-react'

const WEEK = ['一', '二', '三', '四', '五', '六', '日']

function keyOf(d: Date) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export function DrinkCalendar({ logs }: { logs: DrinkLog[] }) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })
  const [busy, setBusy] = useState(false)
  const showToast = useDrinkStore(s => s.showToast)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = (new Date(year, month, 1).getDay() + 6) % 7

  const byDay = useMemo(() => {
    const map = new Map<number, DrinkLog[]>()
    for (const l of logs) {
      const d = new Date(l.consumedAt)
      if (d.getFullYear() !== year || d.getMonth() !== month) continue
      const day = d.getDate()
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(l)
    }
    return map
  }, [logs, year, month])

  const monthLogs = useMemo(() => {
    const out: DrinkLog[] = []
    byDay.forEach(v => out.push(...v))
    return out
  }, [byDay])

  const totalCaffeine = monthLogs.reduce((s, l) => s + l.caffeineMg, 0)
  const totalSugar = monthLogs.reduce((s, l) => s + l.sugarG, 0)
  const activeDays = byDay.size
  const todayKey = keyOf(new Date())

  const shift = (delta: number) => setCursor(new Date(year, month + delta, 1))

  const share = async () => {
    setBusy(true)
    try {
      const days = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, logs: byDay.get(i + 1) ?? [] }))
      const blob = await renderCalendarPoster({
        month: cursor,
        days,
        totalCups: monthLogs.length,
        totalCaffeine,
        totalSugar,
        activeDays,
      })
      const fileName = 'drink-calendar-' + year + '-' + String(month + 1).padStart(2, '0') + '.png'
      const file = new File([blob], fileName, { type: 'image/png' })

      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }

      if (typeof navigator.share === 'function' && nav.canShare && nav.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: '我的饮品日历' })
          showToast('已分享', 'success')
          setBusy(false)
          return
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            setBusy(false)
            return
          }
        }
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      showToast('海报已保存到下载', 'success')
    } catch {
      showToast('导出海报失败，请重试', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-ink-400">饮品日历</p>
          <p className="mt-0.5 text-[14.5px] font-medium">{year} 年 {month + 1} 月</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => shift(-1)} aria-label="上个月" className="p-1.5 rounded-xl text-ink-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => shift(1)} aria-label="下个月" className="p-1.5 rounded-xl text-ink-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={share}
            disabled={busy}
            className="ml-1 flex items-center gap-1 rounded-xl bg-brand-50 px-2.5 py-1.5 text-[11.5px] font-medium text-brand-600 dark:bg-brand-900/30 dark:text-brand-300"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
            分享
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {WEEK.map(w => (
          <div key={w} className="pb-1 text-center text-[10px] text-ink-400">{w}</div>
        ))}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={'blank' + i} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const dayLogs = byDay.get(day) ?? []
          const isToday = keyOf(new Date(year, month, day)) === todayKey
          const first = dayLogs[0]
          return (
            <div
              key={day}
              className={
                'relative flex aspect-square flex-col items-center justify-center rounded-xl ' +
                (dayLogs.length ? 'bg-slate-50 dark:bg-slate-800/70' : '') +
                (isToday ? ' ring-1 ring-brand-400' : '')
              }
            >
              <span className={'absolute left-1 top-0.5 text-[9px] ' + (dayLogs.length ? 'text-ink-500' : 'text-ink-400/60')}>
                {day}
              </span>
              {first && (
                <DrinkArtwork art={first.art ?? fallbackArt(first.category, first.baseType)} size={22} className="mt-1.5" />
              )}
              {dayLogs.length > 1 && (
                <span className="absolute bottom-0.5 text-[8px] text-ink-400">+{dayLogs.length - 1}</span>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-[11px] text-ink-400">
        本月 {monthLogs.length} 杯 · {activeDays} 天有记录 · {Math.round(totalCaffeine)}mg · {totalSugar.toFixed(1)}g 糖
      </p>
    </section>
  )
}

export default DrinkCalendar
