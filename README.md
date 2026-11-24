# 饮品记账本

个人咖啡 / 奶茶的**咖啡因 · 糖 · 热量**追踪小工具。手机网页优先，可添加到主屏幕离线使用，数据全部留在本地。

围绕三个问题设计：

1. 我今天喝了什么？咖啡因、糖、热量各多少？
2. 我现在体内还有多少咖啡因？到睡觉时大概还剩多少？
3. 我现在还能不能再喝一杯？最晚大概几点前喝？

> 估算值，非医疗建议。

## 功能

- **记录**：内置 20+ 常见品牌 SKU，支持搜索 / 品类筛选 / 份量调整 / 自定义时间；两步内完成记录
- **自定义饮品**：名称、类型、基底、杯型、咖啡因、糖、热量、收藏
- **时间线**：今天 / 48 小时 / 全部；单条编辑、复制、删除
- **补记**：把记录时间改到过去（48 小时内）
- **咖啡因模型**：一阶消除动力学，实时体内残留、睡前残留、风险分档、咖啡因截止时间
- **代谢曲线**：过去 12 小时 → 就寝后 2 小时，标注就寝线与阈值线
- **统计**：今日 / 本周 / 本月；杯数、咖啡因、糖、热量、日均值、超标天数；品牌 / 品类 / 时段分布
- **营养图表**：咖啡因、糖、热量每日柱状图 + 目标线
- **设置**：就寝时间、半衰期（3 / 4.5 / 6 小时）、睡前残留阈值、三项每日目标
- **数据**：JSON 导出 / 导入、清空
- **PWA**：离线缓存、可添加到主屏幕、暗色模式跟随系统

## 技术栈

| 用途 | 选型 |
| --- | --- |
| 构建 | Vite 5 |
| 框架 | React 18 + TypeScript |
| 样式 | Tailwind CSS 3 |
| 图表 | ECharts 5（按需引入，单独分块） |
| 存储 | Dexie.js + IndexedDB |
| 状态 | Zustand |
| PWA | vite-plugin-pwa (Workbox) |
| 图标 | lucide-react |

## 本地开发

```bash
npm install
npm run dev          # http://localhost:5173
```

## 构建

```bash
npm run typecheck    # 类型检查
npm run build        # 产物输出到 dist/
npm run preview      # 本地预览构建结果
```

构建体积（gzip）：

| chunk | 大小 |
| --- | --- |
| echarts | ~169 KB |
| react | ~43 KB |
| data (dexie + zustand) | ~36 KB |
| app | ~23 KB |
| css | ~5 KB |

## 部署到 GitHub Pages

仓库已包含 `.github/workflows/deploy.yml`：

1. 把本目录推送到 GitHub 仓库的 `main` 分支
2. 仓库 **Settings → Pages → Source** 选择 **GitHub Actions**
3. 推送后自动构建并部署，访问 `https://<用户名>.github.io/<仓库名>/`

`vite.config.ts` 中 `base: './'`，因此项目部署在子路径下也能正常加载资源与 Service Worker。

也可以用 Cloudflare Pages / Vercel：构建命令 `npm run build`，输出目录 `dist`。

## 咖啡因计算模型

一阶消除模型，每杯独立衰减后叠加：

```
R(t)   = Σ [ D_i × 0.5 ^ ((t - t_i) / H) ]
R_bed  = Σ [ D_i × 0.5 ^ ((t_bed - t_i) / H) ]
D_max  = (threshold - R_bed) / 0.5 ^ ((t_bed - t_now) / H)
t_cut  = t_bed - H × log2(D / (threshold - R_bed))
```

- `D_i` 第 i 杯咖啡因，`t_i` 摄入时间，`H` 半衰期（默认 4.5h），`threshold` 睡前残留阈值（默认 30mg）
- 风险分档：睡前残留 < 阈值 → 低；阈值 ~ 2×阈值 → 中；> 2×阈值 → 高
- 糖和热量只做**累计摄入**统计，不做代谢曲线

## 数据模型

```ts
DrinkTemplate  // 品牌库 / 自定义饮品
DrinkLog       // 摄入记录（保存营养快照，历史统计不受模板变更影响）
Settings       // 就寝时间、半衰期、阈值、每日目标
```

每次记录都会把品牌、品名、杯型、咖啡因、糖、热量**快照**写入 `logs`，因此之后修改或删除模板不会影响历史数据。

## 目录结构

```
src/
├── components/     # 弹窗、图表、Toast
├── pages/          # 记录 / 时间线 / 统计 / 设置
├── db/             # Dexie 表结构与内置品牌库
├── store/          # Zustand 状态 + 咖啡因计算
├── utils/          # 格式化、ECharts 按需注册
└── types/          # 数据模型
tools/
├── gen_icons.py    # 用 Pillow 生成 PWA 图标
└── serve.cjs       # 构建产物本地静态预览
```

## 免责声明

咖啡因残留为模型估算，实际代谢受遗传、年龄、体重、用药、肝功能等影响，个体差异很大。本工具不构成医疗建议，请勿用于健康决策。品牌库数据来自公开信息汇总，为估算值。

## License

MIT
