import type { ReactNode } from 'react'
import { useDrinkStore } from '@/store'
import { Coffee, Database, Download, Upload, Trash2, Bell, Moon, Info, Shield, ChevronRight } from 'lucide-react'

const DISCLAIMER = `免责声明

1. 本工具仅供个人参考，咖啡因残留基于一阶消除动力学模型估算。
2. 实际代谢受遗传、年龄、体重、用药、肝功能等影响，个体差异较大。
3. 不构成医疗建议，请勿用于健康决策。
4. 品牌数据来自公开信息汇总，仅为估算值。
5. 所有数据只保存在本机浏览器，不上传任何服务器。`

const PRIVACY = `隐私说明

· 饮品记录、自定义饮品、设置均存于浏览器 IndexedDB
· 不上传云端，也不含统计埋点
· 导出 / 导入均在本地完成
· 可在设置中随时清空全部本地数据`

const MODEL = `咖啡因模型

R(t) = Σ [ D_i × 0.5 ^ ((t - t_i) / H) ]

· D_i 第 i 杯咖啡因剂量
· t_i 摄入时间
· H 半衰期（默认 4.5 小时）
· R(t) 时刻 t 的体内残留

睡前残留 R_bed 即把 t 换成就寝时间；截止时间 t_cut = t_bed − H × log2(D / (阈值 − R_bed))。`

export default function SettingsPage({ onOpenSettings }: { onOpenSettings: () => void }) {
  const settings = useDrinkStore(s => s.settings)
  const exportData = useDrinkStore(s => s.exportData)
  const clearAllData = useDrinkStore(s => s.clearAllData)
  const showToast = useDrinkStore(s => s.showToast)

  const handleExport = async () => {
    try {
      const json = await exportData()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'drink-tracker-' + new Date().toISOString().slice(0, 10) + '.json'
      a.click()
      URL.revokeObjectURL(url)
      showToast('已导出备份', 'success')
    } catch {
      showToast('导出失败', 'error')
    }
  }

  const handleClear = async () => {
    if (!window.confirm('确定清空所有数据？此操作不可恢复。')) return
    await clearAllData()
    showToast('数据已清空', 'success')
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-5 pt-6 pb-28 space-y-5">
        <h1 className="text-[22px] font-semibold tracking-tight">设置</h1>

        <section className="card p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-brand-600 flex items-center justify-center shrink-0">
            <Coffee className="w-7 h-7 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold">饮品记账本</p>
            <p className="text-[12px] text-ink-400 mt-0.5">v0.2 · 本地存储 · 无账号</p>
          </div>
        </section>

        <Group title="偏好">
          <Row icon={<Bell className="w-4 h-4" />} label="就寝时间" value={settings.bedtime} onClick={onOpenSettings} />
          <Row icon={<Coffee className="w-4 h-4" />} label="咖啡因半衰期" value={settings.halfLifeHours + ' 小时'} onClick={onOpenSettings} />
          <Row icon={<Shield className="w-4 h-4" />} label="睡前残留阈值" value={settings.sleepResidualThresholdMg + ' mg'} onClick={onOpenSettings} />
          <Row icon={<Database className="w-4 h-4" />} label="每日目标" value={settings.dailyCaffeineTargetMg + ' mg / ' + settings.dailySugarTargetG + ' g'} onClick={onOpenSettings} />
        </Group>

        <Group title="数据">
          <Row icon={<Download className="w-4 h-4" />} label="导出数据" hint="下载 JSON 备份" onClick={handleExport} />
          <Row icon={<Upload className="w-4 h-4" />} label="导入数据" hint="从备份恢复" onClick={onOpenSettings} />
          <Row icon={<Trash2 className="w-4 h-4" />} label="清空数据" hint="删除全部记录" danger onClick={handleClear} />
        </Group>

        <Group title="外观">
          <Row
            icon={<Moon className="w-4 h-4" />}
            label="深色模式"
            trailing={
              <select
                defaultValue="system"
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] dark:border-slate-700 dark:bg-slate-900"
                onChange={e => {
                  const mode = e.target.value
                  const dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
                  document.documentElement.classList.toggle('dark', dark)
                  localStorage.setItem('theme', mode)
                }}
              >
                <option value="system">跟随系统</option>
                <option value="light">浅色</option>
                <option value="dark">深色</option>
              </select>
            }
          />
        </Group>

        <Group title="关于">
          <Row icon={<Info className="w-4 h-4" />} label="免责声明" onClick={() => window.alert(DISCLAIMER)} />
          <Row icon={<Shield className="w-4 h-4" />} label="隐私说明" onClick={() => window.alert(PRIVACY)} />
          <Row icon={<Coffee className="w-4 h-4" />} label="咖啡因模型" onClick={() => window.alert(MODEL)} />
        </Group>

        <p className="text-center text-[11px] text-ink-400 pb-2">数据本地优先 · 无账号 · 无追踪</p>
      </div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <p className="px-1 mb-2 text-[12px] text-ink-400">{title}</p>
      <div className="card divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">{children}</div>
    </section>
  )
}

function Row({
  icon, label, value, hint, onClick, trailing, danger,
}: {
  icon: ReactNode
  label: string
  value?: string
  hint?: string
  onClick?: () => void
  trailing?: ReactNode
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
    >
      <span className={(danger ? 'text-rose-500 ' : 'text-brand-600 ') + 'w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0'}>
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className={'block text-[13.5px] ' + (danger ? 'text-rose-500' : 'text-ink-900 dark:text-slate-100')}>{label}</span>
        {hint && <span className="block text-[11px] text-ink-400 mt-0.5">{hint}</span>}
      </span>
      {value && <span className="text-[12px] text-ink-400">{value}</span>}
      {trailing || <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
    </button>
  )
}
