import Dexie, { Table } from 'dexie'
import type { DrinkTemplate, DrinkLog, Settings } from '@/types'

export class DrinkTrackerDB extends Dexie {
  templates!: Table<DrinkTemplate>
  logs!: Table<DrinkLog>
  settings!: Table<Settings>

  constructor() {
    super('DrinkTrackerDB')
    this.version(1).stores({
      templates: '++id, brand, name, category, isCustom, isFavorite, createdAt',
      logs: '++id, templateId, consumedAt, createdAt',
      settings: '++id'
    })
  }
}

export const db = new DrinkTrackerDB()

export const DEFAULT_SETTINGS: Settings = {
  bedtime: '23:30',
  halfLifeHours: 4.5,
  sleepResidualThresholdMg: 30,
  dailyCaffeineTargetMg: 300,
  dailySugarTargetG: 25,
  dailyCalorieTargetKcal: 2000
}

export const INITIAL_TEMPLATES: Omit<DrinkTemplate, 'id' | 'createdAt'>[] = [
  {
    brand: '瑞幸',
    name: '生椰拿铁',
    category: 'coffee',
    baseType: 'espresso',
    size: '标准',
    caffeineMg: 150,
    caffeineMin: 120,
    caffeineMax: 180,
    sugarG: 12,
    caloriesKcal: 220,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: true
  },
  {
    brand: '瑞幸',
    name: '厚乳拿铁',
    category: 'coffee',
    baseType: 'espresso',
    size: '标准',
    caffeineMg: 140,
    caffeineMin: 110,
    caffeineMax: 170,
    sugarG: 15,
    caloriesKcal: 250,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: true
  },
  {
    brand: '瑞幸',
    name: '美式',
    category: 'coffee',
    baseType: 'espresso',
    size: '标准',
    caffeineMg: 180,
    caffeineMin: 150,
    caffeineMax: 210,
    sugarG: 0,
    caloriesKcal: 15,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: true
  },
  {
    brand: '库迪',
    name: '澳白',
    category: 'coffee',
    baseType: 'espresso',
    size: '标准',
    caffeineMg: 160,
    caffeineMin: 130,
    caffeineMax: 190,
    sugarG: 8,
    caloriesKcal: 180,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: false
  },
  {
    brand: '库迪',
    name: '美式',
    category: 'coffee',
    baseType: 'espresso',
    size: '标准',
    caffeineMg: 190,
    caffeineMin: 160,
    caffeineMax: 220,
    sugarG: 0,
    caloriesKcal: 10,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: false
  },
  {
    brand: '星巴克',
    name: '拿铁',
    category: 'coffee',
    baseType: 'espresso',
    size: '中杯',
    caffeineMg: 150,
    caffeineMin: 120,
    caffeineMax: 180,
    sugarG: 10,
    caloriesKcal: 210,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: false
  },
  {
    brand: '星巴克',
    name: '美式',
    category: 'coffee',
    baseType: 'espresso',
    size: '中杯',
    caffeineMg: 225,
    caffeineMin: 180,
    caffeineMax: 270,
    sugarG: 0,
    caloriesKcal: 15,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: false
  },
  {
    brand: 'Manner',
    name: '标准美式',
    category: 'coffee',
    baseType: 'espresso',
    size: '标准',
    caffeineMg: 160,
    caffeineMin: 130,
    caffeineMax: 190,
    sugarG: 0,
    caloriesKcal: 10,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: true
  },
  {
    brand: 'Manner',
    name: '标准拿铁',
    category: 'coffee',
    baseType: 'espresso',
    size: '标准',
    caffeineMg: 140,
    caffeineMin: 110,
    caffeineMax: 170,
    sugarG: 9,
    caloriesKcal: 170,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: false
  },
  {
    brand: '蜜雪冰城',
    name: '柠檬水',
    category: 'other',
    baseType: 'none',
    size: '大杯',
    caffeineMg: 0,
    caffeineMin: 0,
    caffeineMax: 0,
    sugarG: 25,
    caloriesKcal: 100,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: false
  },
  {
    brand: '蜜雪冰城',
    name: '珍珠奶茶',
    category: 'milk_tea',
    baseType: 'tea_base',
    size: '大杯',
    caffeineMg: 40,
    caffeineMin: 30,
    caffeineMax: 50,
    sugarG: 35,
    caloriesKcal: 280,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: false
  },
  {
    brand: '喜茶',
    name: '多肉葡萄',
    category: 'milk_tea',
    baseType: 'tea_base',
    size: '中杯',
    caffeineMg: 30,
    caffeineMin: 20,
    caffeineMax: 40,
    sugarG: 28,
    caloriesKcal: 250,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: false
  },
  {
    brand: '奈雪的茶',
    name: '霸气鲜肉葡萄',
    category: 'milk_tea',
    baseType: 'tea_base',
    size: '中杯',
    caffeineMg: 35,
    caffeineMin: 25,
    caffeineMax: 45,
    sugarG: 30,
    caloriesKcal: 260,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: false
  },
  {
    brand: '茶百道',
    name: '雅妃',
    category: 'milk_tea',
    baseType: 'tea_base',
    size: '中杯',
    caffeineMg: 45,
    caffeineMin: 35,
    caffeineMax: 55,
    sugarG: 25,
    caloriesKcal: 220,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: false
  },
  {
    brand: '书亦烧仙草',
    name: '烧仙草奶茶',
    category: 'milk_tea',
    baseType: 'tea_base',
    size: '中杯',
    caffeineMg: 25,
    caffeineMin: 15,
    caffeineMax: 35,
    sugarG: 32,
    caloriesKcal: 240,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: false
  },
  {
    brand: '沪上阿姨',
    name: '芝士奶盖茶',
    category: 'milk_tea',
    baseType: 'tea_base',
    size: '中杯',
    caffeineMg: 40,
    caffeineMin: 30,
    caffeineMax: 50,
    sugarG: 28,
    caloriesKcal: 230,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: false
  },
  {
    brand: 'COCO',
    name: '珍珠奶茶',
    category: 'milk_tea',
    baseType: 'tea_base',
    size: '中杯',
    caffeineMg: 45,
    caffeineMin: 35,
    caffeineMax: 55,
    sugarG: 38,
    caloriesKcal: 300,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: false
  },
  {
    brand: '一点点',
    name: '四季春奶茶',
    category: 'milk_tea',
    baseType: 'tea_base',
    size: '中杯',
    caffeineMg: 40,
    caffeineMin: 30,
    caffeineMax: 50,
    sugarG: 30,
    caloriesKcal: 250,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: false
  },
  {
    brand: '大禹',
    name: '美式',
    category: 'coffee',
    baseType: 'espresso',
    size: '标准',
    caffeineMg: 170,
    caffeineMin: 140,
    caffeineMax: 200,
    sugarG: 0,
    caloriesKcal: 10,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: false
  },
  {
    brand: 'Tims天好',
    name: '标准美式',
    category: 'coffee',
    baseType: 'espresso',
    size: '中杯',
    caffeineMg: 165,
    caffeineMin: 135,
    caffeineMax: 195,
    sugarG: 0,
    caloriesKcal: 15,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: false
  },
  {
    brand: 'Tims天好',
    name: '标准拿铁',
    category: 'coffee',
    baseType: 'espresso',
    size: '中杯',
    caffeineMg: 145,
    caffeineMin: 115,
    caffeineMax: 175,
    sugarG: 10,
    caloriesKcal: 190,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: false
  },
  {
    brand: "Peet's",
    name: '美式',
    category: 'coffee',
    baseType: 'espresso',
    size: '中杯',
    caffeineMg: 200,
    caffeineMin: 160,
    caffeineMax: 240,
    sugarG: 0,
    caloriesKcal: 10,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: false
  },
  {
    brand: 'Blue Bottle',
    name: '拿铁',
    category: 'coffee',
    baseType: 'espresso',
    size: '中杯',
    caffeineMg: 130,
    caffeineMin: 100,
    caffeineMax: 160,
    sugarG: 8,
    caloriesKcal: 180,
    source: '品牌公开信息 / 常见检测汇总，估算值',
    isCustom: false,
    isFavorite: false
  }
]

export async function initDB() {
  const settingsCount = await db.settings.count()
  if (settingsCount === 0) {
    await db.settings.add(DEFAULT_SETTINGS)
  }

  const templatesCount = await db.templates.count()
  if (templatesCount === 0) {
    const now = Date.now()
    for (const template of INITIAL_TEMPLATES) {
      await db.templates.add({
        ...template,
        id: crypto.randomUUID(),
        createdAt: now
      })
    }
  }
}