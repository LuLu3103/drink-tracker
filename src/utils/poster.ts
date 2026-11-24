import type { DrinkLog } from '@/types'
import { artColor, fallbackArt } from '@/components/DrinkArtwork'

interface PosterInput {
  month: Date
  days: Array<{ day: number; logs: DrinkLog[] }>
  totalCups: number
  totalCaffeine: number
  totalSugar: number
  activeDays: number
}

const W = 1080
const PAD = 44
const LEFT = PAD + 44
const GRID_W = W - PAD * 2 - 88
const CELL_W = GRID_W / 7
const CELL_H = 128
const GRID_TOP = 356
const FONT = '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawCup(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  const w = size
  const h = size * 1.15
  const x = cx - w / 2
  const top = cy - h / 2

  const body = () => {
    ctx.beginPath()
    ctx.moveTo(x, top + size * 0.18)
    ctx.lineTo(x + w, top + size * 0.18)
    ctx.lineTo(x + w * 0.84, top + h)
    ctx.lineTo(x + w * 0.16, top + h)
    ctx.closePath()
  }

  body()
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()

  ctx.save()
  body()
  ctx.clip()
  ctx.fillStyle = color
  ctx.fillRect(x, top + size * 0.34, w, h)
  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.fillRect(x, top + size * 0.34, w, size * 0.09)
  ctx.restore()

  body()
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = Math.max(1.2, size * 0.05)
  ctx.stroke()

  ctx.fillStyle = '#F1F5F9'
  roundRect(ctx, x - size * 0.06, top + size * 0.04, w + size * 0.12, size * 0.14, size * 0.06)
  ctx.fill()
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = Math.max(1, size * 0.04)
  ctx.stroke()

  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = Math.max(2, size * 0.07)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx + size * 0.12, top - size * 0.14)
  ctx.lineTo(cx + size * 0.04, top + size * 0.1)
  ctx.stroke()
}

export async function renderCalendarPoster(input: PosterInput): Promise<Blob> {
  const first = new Date(input.month.getFullYear(), input.month.getMonth(), 1)
  const daysInMonth = new Date(input.month.getFullYear(), input.month.getMonth() + 1, 0).getDate()
  const offset = (first.getDay() + 6) % 7
  const rows = Math.ceil((offset + daysInMonth) / 7)
  const gridBottom = GRID_TOP + 26 + rows * CELL_H
  const H = gridBottom + 96

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')

  ctx.fillStyle = '#F7F9FC'
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = '#FFFFFF'
  roundRect(ctx, PAD, PAD, W - PAD * 2, H - PAD * 2, 52)
  ctx.fill()

  const g = ctx.createLinearGradient(LEFT, 88, LEFT + 88, 176)
  g.addColorStop(0, '#3B82F6')
  g.addColorStop(1, '#1D4ED8')
  ctx.fillStyle = g
  roundRect(ctx, LEFT, 88, 88, 88, 26)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  roundRect(ctx, LEFT + 20, 116, 48, 7, 3.5)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(LEFT + 24, 125)
  ctx.lineTo(LEFT + 64, 125)
  ctx.lineTo(LEFT + 58, 156)
  ctx.lineTo(LEFT + 30, 156)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(LEFT + 36, 108)
  ctx.lineTo(LEFT + 40, 100)
  ctx.moveTo(LEFT + 50, 108)
  ctx.lineTo(LEFT + 54, 100)
  ctx.stroke()

  ctx.fillStyle = '#0F172A'
  ctx.font = '600 40px ' + FONT
  ctx.fillText('饮品日历', LEFT + 112, 130)

  ctx.fillStyle = '#94A3B8'
  ctx.font = '400 25px ' + FONT
  ctx.fillText(input.month.getFullYear() + ' 年 ' + (input.month.getMonth() + 1) + ' 月', LEFT + 112, 168)

  const stats = [
    { label: '本月杯数', value: String(input.totalCups) },
    { label: '咖啡因', value: Math.round(input.totalCaffeine) + ' mg' },
    { label: '添加糖', value: input.totalSugar.toFixed(0) + ' g' },
    { label: '饮用天数', value: String(input.activeDays) + ' 天' },
  ]
  const statW = GRID_W / 4
  stats.forEach((s, i) => {
    const x = LEFT + i * statW
    ctx.fillStyle = '#0F172A'
    ctx.font = '600 36px ' + FONT
    ctx.fillText(s.value, x, 256)
    ctx.fillStyle = '#94A3B8'
    ctx.font = '400 21px ' + FONT
    ctx.fillText(s.label, x, 288)
  })

  const week = ['一', '二', '三', '四', '五', '六', '日']
  week.forEach((w, i) => {
    ctx.fillStyle = '#CBD5E1'
    ctx.font = '500 21px ' + FONT
    ctx.textAlign = 'center'
    ctx.fillText(w, LEFT + CELL_W * i + CELL_W / 2, GRID_TOP)
  })

  const byDay = new Map(input.days.map(d => [d.day, d.logs]))
  ctx.textAlign = 'left'

  for (let d = 1; d <= daysInMonth; d++) {
    const idx = offset + d - 1
    const col = idx % 7
    const row = Math.floor(idx / 7)
    const x = LEFT + col * CELL_W
    const y = GRID_TOP + 22 + row * CELL_H
    const logs = byDay.get(d) ?? []

    if (logs.length) {
      ctx.fillStyle = '#F8FAFC'
      roundRect(ctx, x + 4, y, CELL_W - 8, CELL_H - 12, 18)
      ctx.fill()
    }

    ctx.fillStyle = logs.length ? '#334155' : '#CBD5E1'
    ctx.font = (logs.length ? '600 ' : '400 ') + '21px ' + FONT
    ctx.fillText(String(d), x + 12, y + 26)

    if (logs.length) {
      const one = logs[0]
      const color = artColor(one.art ?? fallbackArt(one.category, one.baseType))
      drawCup(ctx, x + CELL_W / 2, y + 78, 40, color)
      if (logs.length > 1) {
        ctx.textAlign = 'center'
        ctx.fillStyle = '#94A3B8'
        ctx.font = '500 17px ' + FONT
        ctx.fillText('+' + (logs.length - 1), x + CELL_W / 2, y + CELL_H - 16)
        ctx.textAlign = 'left'
      }
    }
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = '#CBD5E1'
  ctx.font = '400 21px ' + FONT
  ctx.fillText('饮品日记 · 本地记录', W / 2, H - PAD - 34)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png', 0.95)
  })
}
