export type DrinkCategory = 'coffee' | 'milk_tea' | 'tea' | 'other'

export type BaseType = 'espresso' | 'tea_base' | 'matcha' | 'cocoa' | 'none'

export interface DrinkTemplate {
  id: string
  brand: string
  name: string
  category: DrinkCategory
  baseType?: BaseType
  size: string
  caffeineMg: number
  caffeineMin?: number
  caffeineMax?: number
  sugarG: number
  caloriesKcal: number
  source?: string
  isCustom: boolean
  isFavorite?: boolean
  createdAt: number
}

export interface DrinkLog {
  id: string
  templateId?: string
  brand: string
  name: string
  category: DrinkCategory
  baseType?: BaseType
  size: string
  caffeineMg: number
  sugarG: number
  caloriesKcal: number
  consumedAt: number
  createdAt: number
}

export interface Settings {
  bedtime: string
  halfLifeHours: number
  sleepResidualThresholdMg: number
  dailyCaffeineTargetMg: number
  dailySugarTargetG: number
  dailyCalorieTargetKcal: number
}

export interface CaffeinePoint {
  time: number
  residual: number
}

export interface DailyStats {
  date: string
  count: number
  totalCaffeine: number
  totalSugar: number
  totalCalories: number
}

export interface RiskLevel {
  level: 'low' | 'medium' | 'high'
  label: string
  color: string
}

export interface CutoffInfo {
  cutoffTime: string
  isPast: boolean
  message: string
}