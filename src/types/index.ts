export type DrinkCategory = 'coffee' | 'milk_tea' | 'tea' | 'other'

export type BaseType = 'espresso' | 'tea_base' | 'matcha' | 'cocoa' | 'none'

/** 插画风格：决定杯里液体的样子 */
export type ArtStyle =
  | 'americano'
  | 'latte'
  | 'milk_tea'
  | 'fruit_tea'
  | 'matcha'
  | 'cocoa'
  | 'tea'
  | 'soda'
  | 'smoothie'
  | 'juice'

/** 杯型 */
export type CupType = 'cold' | 'hot'

export type Topping = 'none' | 'pearl' | 'fruit' | 'cream' | 'ice' | 'bubbles'

export interface DrinkArt {
  style: ArtStyle
  cup: CupType
  /** 杯中配料，决定插画细节 */
  topping?: Topping
  /** 自定义主色，覆盖风格默认色 */
  tint?: string
}

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
  art: DrinkArt
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
  art?: DrinkArt
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
