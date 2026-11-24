import { create } from 'zustand'
import type { DrinkTemplate, DrinkLog, Settings, CaffeinePoint, DailyStats, RiskLevel, CutoffInfo } from '@/types'
import { db, initDB, DEFAULT_SETTINGS, BRAND_ORDER } from '@/db'
import { newId } from '@/utils/id'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration: number
}

interface DrinkState {
  templates: DrinkTemplate[]
  logs: DrinkLog[]
  settings: Settings
  currentResidual: number
  bedtimeResidual: number
  riskLevel: RiskLevel
  cutoffInfo: CutoffInfo
  caffeineCurve: CaffeinePoint[]
  todayStats: DailyStats
  weeklyStats: DailyStats[]
  monthlyStats: DailyStats[]
  loadAll: () => Promise<void>
  addTemplate: (template: Omit<DrinkTemplate, 'id' | 'createdAt'>) => Promise<void>
  updateTemplate: (id: string, template: Partial<DrinkTemplate>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  addLog: (log: Omit<DrinkLog, 'id' | 'createdAt'>) => Promise<void>
  updateLog: (id: string, log: Partial<DrinkLog>) => Promise<void>
  deleteLog: (id: string) => Promise<void>
  updateSettings: (settings: Partial<Settings>) => Promise<void>
  recalculate: () => void
  exportData: () => Promise<string>
  importData: (json: string) => Promise<void>
  clearAllData: () => Promise<void>
  getTemplatesByCategory: (category: DrinkTemplate['category']) => DrinkTemplate[]
  searchTemplates: (query: string) => DrinkTemplate[]
  getFavoriteTemplates: () => DrinkTemplate[]
  getRecentTemplates: (limit?: number) => DrinkTemplate[]
  toasts: ToastItem[]
  showToast: (message: string, type?: ToastType, duration?: number) => void
  hideToast: (id: string) => void
}

function calculateResidual(logs: DrinkLog[], atTime: number, halfLifeHours: number): number {
  return logs.reduce((sum, log) => {
    const hoursDiff = (atTime - log.consumedAt) / (1000 * 60 * 60)
    if (hoursDiff < 0) return sum
    return sum + log.caffeineMg * Math.pow(0.5, hoursDiff / halfLifeHours)
  }, 0)
}

function calculateRiskLevel(residual: number, threshold: number): RiskLevel {
  if (residual < threshold) {
    return { level: 'low', label: '低风险', color: '#10B981' }
  } else if (residual < threshold * 2) {
    return { level: 'medium', label: '中等风险', color: '#F59E0B' }
  } else {
    return { level: 'high', label: '较高风险', color: '#EF4444' }
  }
}

function calculateCutoffTime(
  logs: DrinkLog[],
  bedtime: number,
  halfLifeHours: number,
  threshold: number,
  standardDose: number = 150
): CutoffInfo {
  const bedResidual = calculateResidual(logs, bedtime, halfLifeHours)
  const remainingAllowance = threshold - bedResidual
  
  if (remainingAllowance <= 0) {
    return {
      cutoffTime: '--:--',
      isPast: true,
      message: '今天不建议再摄入含咖啡因饮品'
    }
  }
  
  const hoursUntilBed = (bedtime - Date.now()) / (1000 * 60 * 60)
  if (hoursUntilBed <= 0) {
    return {
      cutoffTime: '--:--',
      isPast: true,
      message: '已过就寝时间'
    }
  }
  
  const cutoffHoursBeforeBed = halfLifeHours * Math.log2(standardDose / remainingAllowance)
  const cutoffTimeMs = bedtime - cutoffHoursBeforeBed * 60 * 60 * 1000
  const isPast = cutoffTimeMs <= Date.now()
  const cutoffDate = new Date(cutoffTimeMs)
  const cutoffTimeStr = cutoffDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
  
  return {
    cutoffTime: cutoffTimeStr,
    isPast,
    message: isPast
      ? `已过咖啡因截止时间（${cutoffTimeStr}）· 现在再喝会影响睡眠`
      : `今天的咖啡因截止时间约 ${cutoffTimeStr}`
  }
}

function generateCaffeineCurve(logs: DrinkLog[], bedtime: number, halfLifeHours: number): CaffeinePoint[] {
  const now = Date.now()
  const startTime = now - 12 * 60 * 60 * 1000
  const endTime = bedtime + 2 * 60 * 60 * 1000
  const points: CaffeinePoint[] = []
  
  for (let t = startTime; t <= endTime; t += 15 * 60 * 1000) {
    points.push({
      time: t,
      residual: calculateResidual(logs, t, halfLifeHours)
    })
  }
  return points
}

function calculateDailyStats(logs: DrinkLog[], date: Date): DailyStats {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(startOfDay)
  endOfDay.setDate(endOfDay.getDate() + 1)
  
  const dayLogs = logs.filter(log => 
    log.consumedAt >= startOfDay.getTime() && log.consumedAt < endOfDay.getTime()
  )
  
  return {
    date: toDateKey(startOfDay),
    count: dayLogs.length,
    totalCaffeine: dayLogs.reduce((sum, log) => sum + log.caffeineMg, 0),
    totalSugar: dayLogs.reduce((sum, log) => sum + log.sugarG, 0),
    totalCalories: dayLogs.reduce((sum, log) => sum + log.caloriesKcal, 0)
  }
}

function getWeeklyStats(logs: DrinkLog[]): DailyStats[] {
  const stats: DailyStats[] = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    stats.push(calculateDailyStats(logs, date))
  }
  return stats
}

function getMonthlyStats(logs: DrinkLog[]): DailyStats[] {
  const stats: DailyStats[] = []
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  
  for (let i = 0; i < daysInMonth; i++) {
    const date = new Date(startOfMonth)
    date.setDate(date.getDate() + i)
    if (date > today) break
    stats.push(calculateDailyStats(logs, date))
  }
  return stats
}

function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return y + '-' + m + '-' + day
}

function getTodayDateString(): string {
  return toDateKey(new Date())
}

export const useDrinkStore = create<DrinkState>()((set, get) => ({
      templates: [],
      logs: [],
      settings: DEFAULT_SETTINGS,
      currentResidual: 0,
      bedtimeResidual: 0,
      riskLevel: { level: 'low', label: '低风险', color: '#10B981' },
      cutoffInfo: { cutoffTime: '--:--', isPast: false, message: '' },
      caffeineCurve: [],
      todayStats: { date: getTodayDateString(), count: 0, totalCaffeine: 0, totalSugar: 0, totalCalories: 0 },
      weeklyStats: [],
      monthlyStats: [],
      toasts: [],

      loadAll: async () => {
        await initDB()
        const [rawTemplates, logs, settings] = await Promise.all([
          db.templates.toArray(),
          db.logs.orderBy('consumedAt').reverse().toArray(),
          db.settings.get(1)
        ])

        const rank = (brand: string) => {
          const i = BRAND_ORDER.indexOf(brand)
          return i === -1 ? BRAND_ORDER.length : i
        }
        const templates = rawTemplates.sort((a, b) => {
          if (Boolean(a.isFavorite) !== Boolean(b.isFavorite)) return a.isFavorite ? -1 : 1
          const ra = rank(a.brand)
          const rb = rank(b.brand)
          if (ra !== rb) return ra - rb
          return a.name.localeCompare(b.name, 'zh')
        })
        
        const finalSettings = settings || DEFAULT_SETTINGS
        
        const [bedHour, bedMinute] = finalSettings.bedtime.split(':').map(Number)
        const bedtime = new Date()
        bedtime.setHours(bedHour, bedMinute, 0, 0)
        if (bedtime <= new Date()) {
          bedtime.setDate(bedtime.getDate() + 1)
        }
        const bedtimeMs = bedtime.getTime()
        
        const currentResidual = calculateResidual(logs, Date.now(), finalSettings.halfLifeHours)
        const bedtimeResidual = calculateResidual(logs, bedtimeMs, finalSettings.halfLifeHours)
        const riskLevel = calculateRiskLevel(bedtimeResidual, finalSettings.sleepResidualThresholdMg)
        const cutoffInfo = calculateCutoffTime(
          logs, bedtimeMs, finalSettings.halfLifeHours, 
          finalSettings.sleepResidualThresholdMg
        )
        const caffeineCurve = generateCaffeineCurve(logs, bedtimeMs, finalSettings.halfLifeHours)
        const todayStats = calculateDailyStats(logs, new Date())
        const weeklyStats = getWeeklyStats(logs)
        const monthlyStats = getMonthlyStats(logs)
        
        set({
          templates,
          logs,
          settings: finalSettings,
          currentResidual,
          bedtimeResidual,
          riskLevel,
          cutoffInfo,
          caffeineCurve,
          todayStats,
          weeklyStats,
          monthlyStats
        })
      },
      
      addTemplate: async (template) => {
        const newTemplate: DrinkTemplate = {
          ...template,
          id: newId(),
          createdAt: Date.now()
        }
        await db.templates.add(newTemplate)
        set(state => ({ templates: [...state.templates, newTemplate] }))
      },
      
      updateTemplate: async (id, updates) => {
        await db.templates.update(id, updates)
        set(state => ({
          templates: state.templates.map(t => t.id === id ? { ...t, ...updates } : t)
        }))
      },
      
      deleteTemplate: async (id) => {
        await db.templates.delete(id)
        set(state => ({ templates: state.templates.filter(t => t.id !== id) }))
      },
      
      toggleFavorite: async (id) => {
        const template = get().templates.find(t => t.id === id)
        if (template) {
          await db.templates.update(id, { isFavorite: !template.isFavorite })
          set(state => ({
            templates: state.templates.map(t => 
              t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
            )
          }))
        }
      },
      
      addLog: async (log) => {
        const newLog: DrinkLog = {
          ...log,
          id: newId(),
          createdAt: Date.now()
        }
        await db.logs.add(newLog)
        set(state => ({
          logs: [newLog, ...state.logs].sort((a, b) => b.consumedAt - a.consumedAt)
        }))
        get().recalculate()
      },
      
      updateLog: async (id, updates) => {
        await db.logs.update(id, updates)
        set(state => ({
          logs: state.logs
            .map(l => (l.id === id ? { ...l, ...updates } : l))
            .sort((a, b) => b.consumedAt - a.consumedAt)
        }))
        get().recalculate()
      },
      
      deleteLog: async (id) => {
        await db.logs.delete(id)
        set(state => ({ logs: state.logs.filter(l => l.id !== id) }))
        get().recalculate()
      },
      
      updateSettings: async (newSettings) => {
        const updatedSettings = { ...get().settings, ...newSettings }
        await db.settings.put(updatedSettings, 1)
        set({ settings: updatedSettings })
        get().recalculate()
      },
      
      recalculate: () => {
        const { logs, settings } = get()
        
        const [bedHour, bedMinute] = settings.bedtime.split(':').map(Number)
        const bedtime = new Date()
        bedtime.setHours(bedHour, bedMinute, 0, 0)
        if (bedtime <= new Date()) {
          bedtime.setDate(bedtime.getDate() + 1)
        }
        const bedtimeMs = bedtime.getTime()
        
        const currentResidual = calculateResidual(logs, Date.now(), settings.halfLifeHours)
        const bedtimeResidual = calculateResidual(logs, bedtimeMs, settings.halfLifeHours)
        const riskLevel = calculateRiskLevel(bedtimeResidual, settings.sleepResidualThresholdMg)
        const cutoffInfo = calculateCutoffTime(
          logs, bedtimeMs, settings.halfLifeHours, 
          settings.sleepResidualThresholdMg
        )
        const caffeineCurve = generateCaffeineCurve(logs, bedtimeMs, settings.halfLifeHours)
        const todayStats = calculateDailyStats(logs, new Date())
        const weeklyStats = getWeeklyStats(logs)
        const monthlyStats = getMonthlyStats(logs)
        
        set({
          currentResidual,
          bedtimeResidual,
          riskLevel,
          cutoffInfo,
          caffeineCurve,
          todayStats,
          weeklyStats,
          monthlyStats
        })
      },
      
      exportData: async () => {
        const { templates, logs, settings } = get()
        const data = { templates, logs, settings, exportedAt: Date.now() }
        return JSON.stringify(data, null, 2)
      },
      
      importData: async (json) => {
        try {
          const data = JSON.parse(json)
          if (data.templates) {
            await db.templates.clear()
            await db.templates.bulkAdd(data.templates)
          }
          if (data.logs) {
            await db.logs.clear()
            await db.logs.bulkAdd(data.logs)
          }
          if (data.settings) {
            await db.settings.put(data.settings, 1)
          }
          await get().loadAll()
        } catch (error) {
          throw new Error('导入失败：数据格式错误')
        }
      },
      
      clearAllData: async () => {
        await db.templates.clear()
        await db.logs.clear()
        await db.settings.clear()
        await db.settings.add(DEFAULT_SETTINGS)
        await get().loadAll()
      },

      showToast: (message, type = 'info', duration = 3000) => {
        const id = Math.random().toString(36).slice(2, 11)
        set(state => ({ toasts: [...state.toasts, { id, message, type, duration }] }))
        if (duration > 0) {
          setTimeout(() => {
            set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
          }, duration)
        }
      },

      hideToast: (id) => {
        set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
      },
      
      getTemplatesByCategory: (category) => {
        return get().templates.filter(t => t.category === category)
      },
      
      searchTemplates: (query) => {
        const q = query.toLowerCase().trim()
        if (!q) return get().templates
        return get().templates.filter(t => 
          t.brand.toLowerCase().includes(q) || 
          t.name.toLowerCase().includes(q)
        )
      },
      
      getFavoriteTemplates: () => {
        return get().templates.filter(t => t.isFavorite)
      },
      
      getRecentTemplates: (limit = 5) => {
        const recentTemplateIds = [...new Set(get().logs.slice(0, 20).map(l => l.templateId).filter(Boolean))]
        const recent = recentTemplateIds
          .map(id => get().templates.find(t => t.id === id))
          .filter(Boolean) as DrinkTemplate[]
        const favorites = get().templates.filter(t => t.isFavorite && !recentTemplateIds.includes(t.id))
        return [...recent, ...favorites].slice(0, limit)
      }
}))