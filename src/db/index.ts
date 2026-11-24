import Dexie, { Table } from 'dexie'
import type { DrinkTemplate, DrinkLog, Settings, DrinkCategory, BaseType, ArtStyle, CupType, Topping } from '@/types'

export class DrinkTrackerDB extends Dexie {
  templates!: Table<DrinkTemplate>
  logs!: Table<DrinkLog>
  settings!: Table<Settings>

  constructor() {
    super('DrinkTrackerDB')
    this.version(1).stores({
      templates: '++id, brand, name, category, isCustom, isFavorite, createdAt',
      logs: '++id, templateId, consumedAt, createdAt',
      settings: '++id',
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
  dailyCalorieTargetKcal: 2000,
}

const SOURCE = '品牌公开信息 / 常见检测汇总，估算值'

/** 按名字和风格推断杯中配料，让每杯插画有区分度 */
function toppingFor(name: string, style: ArtStyle): Topping {
  if (/珍珠|波霸|波波|啵啵|芋圆|血糯米|烧仙草|西米/.test(name)) return 'pearl'
  if (/奶盖|玛奇朵|芝士|雪顶|奶芙/.test(name)) return 'cream'
  if (style === 'fruit_tea' || style === 'smoothie' || /葡萄|草莓|莓莓|杨枝甘露|橙|柚|芒果|桃/.test(name)) return 'fruit'
  if (style === 'soda') return 'bubbles'
  if (style === 'cocoa') return 'cream'
  if (style === 'latte' || style === 'americano') return 'ice'
  return 'none'
}

export const BRAND_ORDER = [
  '瑞幸', '库迪', '星巴克', 'Manner', 'M Stand', 'Tims天好', "Peet's",
  '霸王茶姬', '茶颜悦色', '喜茶', '奈雪的茶', '古茗', '茶百道', '沪上阿姨',
  '益禾堂', 'CoCo都可', '一点点', '书亦烧仙草', '甜啦啦', '快乐柠檬', '乐乐茶',
  '七分甜', '蜜雪冰城', '农夫山泉', '三得利', '元气森林', '可口可乐', '脉动', '自制',
]

function T(
  id: string,
  brand: string,
  name: string,
  category: DrinkCategory,
  baseType: BaseType,
  size: string,
  caffeineMg: number,
  caffeineMin: number,
  caffeineMax: number,
  sugarG: number,
  caloriesKcal: number,
  style: ArtStyle,
  cup: CupType,
  tint?: string,
  favorite?: boolean,
): Omit<DrinkTemplate, 'createdAt'> {
  return {
    id,
    brand,
    name,
    category,
    baseType,
    size,
    caffeineMg,
    caffeineMin,
    caffeineMax,
    sugarG,
    caloriesKcal,
    art: { style, cup, tint, topping: toppingFor(name, style) },
    source: SOURCE,
    isCustom: false,
    isFavorite: Boolean(favorite),
  }
}

export const BUILTIN_TEMPLATES: Array<Omit<DrinkTemplate, 'createdAt'>> = [
  // 瑞幸
  T('luckin-shengye', '瑞幸', '生椰拿铁', 'coffee', 'espresso', '标准', 150, 120, 180, 15, 230, 'latte', 'cold', '#E3C6A3', true),
  T('luckin-houru', '瑞幸', '厚乳拿铁', 'coffee', 'espresso', '标准', 140, 110, 170, 18, 262, 'latte', 'cold', '#D9B48D'),
  T('luckin-americano', '瑞幸', '美式', 'coffee', 'espresso', '标准', 180, 150, 210, 0, 12, 'americano', 'cold'),
  T('luckin-silk', '瑞幸', '丝绒拿铁', 'coffee', 'espresso', '标准', 145, 115, 175, 16, 240, 'latte', 'cold', '#CDA37E'),
  T('luckin-orange', '瑞幸', '橙C美式', 'coffee', 'espresso', '标准', 160, 130, 190, 12, 96, 'americano', 'cold', '#C97B3F'),
  T('luckin-mango', '瑞幸', '芒芒生椰', 'coffee', 'espresso', '标准', 120, 100, 145, 24, 268, 'smoothie', 'cold', '#F2B45E'),
  T('luckin-yuzu', '瑞幸', '柚C美式', 'coffee', 'espresso', '标准', 155, 125, 185, 10, 88, 'juice', 'cold', '#E9A25B'),

  // 库迪
  T('cotti-americano', '库迪', '美式', 'coffee', 'espresso', '标准', 190, 160, 220, 0, 10, 'americano', 'cold'),
  T('cotti-auswhite', '库迪', '澳白', 'coffee', 'espresso', '标准', 160, 130, 190, 8, 180, 'latte', 'hot', '#C9A17B'),
  T('cotti-coconut', '库迪', '生椰拿铁', 'coffee', 'espresso', '标准', 150, 120, 180, 16, 235, 'latte', 'cold', '#E3C6A3'),

  // 星巴克
  T('sbux-latte', '星巴克', '拿铁', 'coffee', 'espresso', '中杯', 150, 120, 180, 10, 210, 'latte', 'hot', '#CFA983'),
  T('sbux-americano', '星巴克', '美式', 'coffee', 'espresso', '中杯', 225, 180, 270, 0, 15, 'americano', 'cold'),
  T('sbux-caramel', '星巴克', '焦糖玛奇朵', 'coffee', 'espresso', '中杯', 150, 120, 180, 33, 250, 'latte', 'hot', '#C68A4E'),
  T('sbux-matcha', '星巴克', '抹茶星冰乐', 'milk_tea', 'matcha', '中杯', 70, 55, 85, 42, 300, 'matcha', 'cold'),

  // Manner / M Stand / Tims / Peet's
  T('manner-americano', 'Manner', '标准美式', 'coffee', 'espresso', '标准', 160, 130, 190, 0, 10, 'americano', 'cold', undefined, true),
  T('manner-latte', 'Manner', '标准拿铁', 'coffee', 'espresso', '标准', 140, 110, 170, 9, 172, 'latte', 'cold', '#D3AB84'),
  T('manner-osmanthus', 'Manner', '桂花拿铁', 'coffee', 'espresso', '标准', 140, 110, 170, 14, 196, 'latte', 'cold', '#DDB877'),
  T('mstand-oat', 'M Stand', '燕麦拿铁', 'coffee', 'espresso', '标准', 145, 115, 175, 11, 190, 'latte', 'cold', '#C9A583'),
  T('tims-americano', 'Tims天好', '标准美式', 'coffee', 'espresso', '中杯', 165, 135, 195, 0, 15, 'americano', 'cold'),
  T('tims-latte', 'Tims天好', '标准拿铁', 'coffee', 'espresso', '中杯', 145, 115, 175, 10, 190, 'latte', 'cold', '#D2A97F'),
  T('peets-americano', "Peet's", '美式', 'coffee', 'espresso', '中杯', 200, 160, 240, 0, 10, 'americano', 'cold'),

  // 霸王茶姬
  T('chagee-boya', '霸王茶姬', '伯牙绝弦', 'milk_tea', 'tea_base', '中杯', 120, 95, 145, 22, 235, 'milk_tea', 'cold', '#CBB08A', true),
  T('chagee-guifu', '霸王茶姬', '桂馥兰香', 'milk_tea', 'tea_base', '中杯', 110, 90, 135, 20, 225, 'milk_tea', 'cold', '#D3B98F'),
  T('chagee-huating', '霸王茶姬', '花田乌龙', 'milk_tea', 'tea_base', '中杯', 130, 100, 155, 21, 230, 'milk_tea', 'cold', '#C6A87C'),
  T('chagee-mulan', '霸王茶姬', '万里木兰', 'milk_tea', 'tea_base', '中杯', 125, 100, 150, 19, 220, 'milk_tea', 'cold', '#C2A578'),

  // 茶颜悦色
  T('chayan-youlan', '茶颜悦色', '幽兰拿铁', 'milk_tea', 'tea_base', '中杯', 60, 45, 75, 26, 250, 'milk_tea', 'cold', '#C9A47A', true),
  T('chayan-shengsheng', '茶颜悦色', '声声乌龙', 'milk_tea', 'tea_base', '中杯', 55, 40, 70, 24, 230, 'milk_tea', 'cold', '#B89468'),
  T('chayan-guihua', '茶颜悦色', '桂花弄', 'tea', 'tea_base', '中杯', 45, 35, 60, 12, 90, 'tea', 'cold', '#D7B269'),
  T('chayan-matcha', '茶颜悦色', '抹茶菩提', 'milk_tea', 'matcha', '中杯', 65, 50, 80, 28, 260, 'matcha', 'cold'),

  // 喜茶
  T('heytea-grape', '喜茶', '多肉葡萄', 'milk_tea', 'tea_base', '中杯', 30, 20, 40, 28, 250, 'fruit_tea', 'cold', '#B58BD0'),
  T('heytea-berry', '喜茶', '芝芝莓莓', 'milk_tea', 'tea_base', '中杯', 35, 25, 45, 32, 280, 'smoothie', 'cold', '#F08FA8'),
  T('heytea-grapefruit', '喜茶', '满杯红柚', 'tea', 'tea_base', '中杯', 25, 15, 35, 26, 160, 'fruit_tea', 'cold', '#F58B6C'),
  T('heytea-bobo', '喜茶', '烤黑糖波波', 'milk_tea', 'tea_base', '中杯', 45, 35, 55, 38, 320, 'milk_tea', 'cold', '#B0804F'),

  // 奈雪
  T('nayuki-strawberry', '奈雪的茶', '霸气芝士草莓', 'milk_tea', 'tea_base', '中杯', 35, 25, 45, 30, 270, 'smoothie', 'cold', '#F299B0'),
  T('nayuki-orange', '奈雪的茶', '霸气橙子', 'tea', 'tea_base', '中杯', 25, 15, 35, 24, 150, 'juice', 'cold', '#F6A85B'),
  T('nayuki-yashi', '奈雪的茶', '鸭屎香宝藏茶', 'milk_tea', 'tea_base', '中杯', 90, 70, 110, 22, 240, 'milk_tea', 'cold', '#C8A87C'),

  // 古茗
  T('guming-grape', '古茗', '超A芝士葡萄', 'milk_tea', 'tea_base', '中杯', 30, 20, 40, 29, 260, 'fruit_tea', 'cold', '#B48BCB'),
  T('guming-taro', '古茗', '芋泥波波奶茶', 'milk_tea', 'tea_base', '中杯', 40, 30, 50, 34, 330, 'milk_tea', 'cold', '#B49BC8'),
  T('guming-mango', '古茗', '杨枝甘露', 'milk_tea', 'tea_base', '中杯', 20, 12, 30, 33, 290, 'smoothie', 'cold', '#F5B85F'),

  // 茶百道
  T('cbd-mango', '茶百道', '杨枝甘露', 'milk_tea', 'tea_base', '中杯', 20, 12, 30, 34, 295, 'smoothie', 'cold', '#F3B45C'),
  T('cbd-doufu', '茶百道', '豆乳玉麒麟', 'milk_tea', 'tea_base', '中杯', 45, 35, 55, 30, 275, 'milk_tea', 'cold', '#D9C39C'),
  T('cbd-taro', '茶百道', '招牌芋圆奶茶', 'milk_tea', 'tea_base', '中杯', 40, 30, 50, 36, 310, 'milk_tea', 'cold', '#B8A0C4'),

  // 沪上阿姨
  T('aunt-bloodrice', '沪上阿姨', '血糯米奶茶', 'milk_tea', 'tea_base', '中杯', 40, 30, 50, 35, 320, 'milk_tea', 'cold', '#A98A76'),
  T('aunt-grape', '沪上阿姨', '芝士葡萄', 'milk_tea', 'tea_base', '中杯', 30, 20, 40, 28, 255, 'fruit_tea', 'cold', '#B58BD0'),
  T('aunt-mango', '沪上阿姨', '杨枝甘露', 'milk_tea', 'tea_base', '中杯', 20, 12, 30, 32, 285, 'smoothie', 'cold', '#F4B45E'),

  // 益禾堂
  T('yihotang-grilled', '益禾堂', '烤奶', 'milk_tea', 'tea_base', '中杯', 45, 35, 55, 30, 270, 'milk_tea', 'cold', '#C09468'),
  T('yihotang-icecream', '益禾堂', '冰淇淋红茶', 'milk_tea', 'tea_base', '中杯', 50, 40, 60, 28, 250, 'milk_tea', 'cold', '#D8B892'),

  // CoCo / 一点点
  T('coco-pearl', 'CoCo都可', '珍珠奶茶', 'milk_tea', 'tea_base', '中杯', 45, 35, 55, 38, 300, 'milk_tea', 'cold', '#B0804F'),
  T('coco-passion', 'CoCo都可', '百香双响炮', 'tea', 'tea_base', '中杯', 20, 12, 30, 32, 180, 'fruit_tea', 'cold', '#F2A94E'),
  T('coco-milktea', 'CoCo都可', '奶盖红茶', 'tea', 'tea_base', '中杯', 45, 35, 55, 20, 175, 'tea', 'cold', '#C98B4B'),
  T('yidiandian-four', '一点点', '四季春奶茶', 'milk_tea', 'tea_base', '中杯', 40, 30, 50, 30, 250, 'milk_tea', 'cold', '#C9A87E'),
  T('yidiandian-boba', '一点点', '波霸奶茶', 'milk_tea', 'tea_base', '中杯', 42, 32, 52, 36, 295, 'milk_tea', 'cold', '#AE7F51'),
  T('yidiandian-macchiato', '一点点', '红茶玛奇朵', 'tea', 'tea_base', '中杯', 48, 38, 58, 24, 205, 'tea', 'cold', '#CB8F52'),

  // 书亦 / 甜啦啦 / 快乐柠檬 / 乐乐茶 / 七分甜
  T('shuyi-grassjelly', '书亦烧仙草', '烧仙草奶茶', 'milk_tea', 'tea_base', '中杯', 25, 15, 35, 32, 240, 'milk_tea', 'cold', '#8C7A66'),
  T('shuyi-mango', '书亦烧仙草', '杨枝甘露', 'milk_tea', 'tea_base', '中杯', 20, 12, 30, 33, 288, 'smoothie', 'cold', '#F3B45C'),
  T('tiantian-pearl', '甜啦啦', '珍珠奶茶', 'milk_tea', 'tea_base', '中杯', 40, 30, 50, 34, 285, 'milk_tea', 'cold', '#B0804F'),
  T('happy-lemon-cheese', '快乐柠檬', '岩盐芝士奶茶', 'milk_tea', 'tea_base', '中杯', 35, 25, 45, 30, 265, 'milk_tea', 'cold', '#D3B48A'),
  T('lele-taro', '乐乐茶', '波波芋泥', 'milk_tea', 'tea_base', '中杯', 35, 25, 45, 33, 300, 'milk_tea', 'cold', '#B49BC8'),
  T('qifentian-mango', '七分甜', '杨枝甘露', 'milk_tea', 'tea_base', '中杯', 20, 12, 30, 32, 282, 'smoothie', 'cold', '#F4B45E'),

  // 蜜雪冰城
  T('mixue-lemon', '蜜雪冰城', '柠檬水', 'other', 'none', '大杯', 0, 0, 0, 25, 100, 'juice', 'cold', '#F6D268', true),
  T('mixue-pearl', '蜜雪冰城', '珍珠奶茶', 'milk_tea', 'tea_base', '大杯', 40, 30, 50, 35, 280, 'milk_tea', 'cold', '#B0804F'),
  T('mixue-shake', '蜜雪冰城', '摇摇奶昔', 'milk_tea', 'tea_base', '大杯', 10, 5, 15, 36, 290, 'smoothie', 'cold', '#F0CFA8'),
  T('mixue-orange', '蜜雪冰城', '棒打鲜橙', 'tea', 'tea_base', '大杯', 15, 8, 22, 28, 150, 'juice', 'cold', '#F5A64C'),

  // 便利店 / 瓶装
  T('bottle-oriental-oolong', '农夫山泉', '东方树叶 乌龙茶', 'tea', 'tea_base', '500ml', 30, 25, 35, 0, 0, 'tea', 'cold', '#C9A265'),
  T('bottle-suntory-oolong', '三得利', '乌龙茶', 'tea', 'tea_base', '500ml', 30, 25, 35, 0, 0, 'tea', 'cold', '#B98F52'),
  T('bottle-genki-peach', '元气森林', '白桃气泡水', 'other', 'none', '480ml', 0, 0, 0, 0, 0, 'soda', 'cold', '#F3B7C8'),
  T('bottle-cola', '可口可乐', '可乐', 'other', 'none', '500ml', 34, 30, 38, 53, 215, 'soda', 'cold', '#8B5A2B'),
  T('bottle-mizone', '脉动', '维生素饮料', 'other', 'none', '600ml', 0, 0, 0, 28, 120, 'juice', 'cold', '#9FD3F0'),

  // 自制 / 便利店咖啡
  T('diydrip-coffee', '自制', '挂耳咖啡', 'coffee', 'espresso', '一杯', 120, 90, 150, 0, 8, 'americano', 'hot'),
  T('diypour-over', '自制', '手冲咖啡', 'coffee', 'espresso', '一杯', 140, 110, 170, 0, 10, 'americano', 'hot'),
  T('diycold-brew', '自制', '冷萃咖啡', 'coffee', 'espresso', '一杯', 180, 150, 210, 0, 12, 'americano', 'cold'),
  T('diyinstant', '自制', '速溶三合一', 'coffee', 'espresso', '一杯', 60, 45, 75, 18, 110, 'latte', 'hot', '#C8A07A'),
  T('diy-matcha-latte', '自制', '抹茶拿铁', 'milk_tea', 'matcha', '一杯', 65, 50, 80, 16, 180, 'matcha', 'hot'),
  T('diy-lemonade', '自制', '柠檬水', 'other', 'none', '一杯', 0, 0, 0, 12, 60, 'juice', 'cold', '#F7DC7C'),
  T('diy-milktea', '自制', '红茶奶茶', 'milk_tea', 'tea_base', '一杯', 45, 35, 55, 18, 180, 'milk_tea', 'hot', '#C19571'),
]

export async function initDB(): Promise<void> {
  const settingsCount = await db.settings.count()
  if (settingsCount === 0) {
    await db.settings.add(DEFAULT_SETTINGS)
  }

  const now = Date.now()
  const builtinIds = new Set(BUILTIN_TEMPLATES.map(t => t.id))

  await db.transaction('rw', db.templates, async () => {
    for (const tpl of BUILTIN_TEMPLATES) {
      const existing = await db.templates.get(tpl.id)
      if (!existing) {
        await db.templates.add({ ...tpl, createdAt: now })
      } else if (!existing.isCustom) {
        await db.templates.put({
          ...tpl,
          isFavorite: existing.isFavorite ?? tpl.isFavorite,
          createdAt: existing.createdAt,
        })
      }
    }

    // 清理旧版本用 UUID 生成的过期内置条目
    const all = await db.templates.toArray()
    const stale = all
      .filter(t => !t.isCustom && !builtinIds.has(t.id))
      .map(t => t.id)
    if (stale.length > 0) {
      await db.templates.bulkDelete(stale)
    }
  })
}
