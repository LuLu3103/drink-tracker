import type { ReactNode } from 'react'
import { useDrinkStore } from '@/store'
import { Coffee, Database, Download, Upload, Trash2, Bell, Moon, Info, Shield } from 'lucide-react'

interface SettingsPageProps {
  onOpenSettings: (open: boolean) => void
}

const DISCLAIMER = `免责声明：

1. 本工具仅供个人参考，提供的咖啡因残留估算基于一阶消除动力学模型。
2. 实际代谢因人而异，受遗传、年龄、体重、药物、肝功能等多种因素影响。
3. 不构成医疗建议，请勿用于健康决策。
4. 品牌库数据来源于公开信息汇总，仅为估算值，实际含量可能有差异。
5. 所有数据仅保存在本地浏览器，不会上传至任何服务器。`

const PRIVACY = `隐私说明：

• 所有饮品记录、自定义饮品、设置数据均存储在浏览器 IndexedDB 中
• 数据不会上传至任何云端服务器
• 导出/导入功能仅在本地操作
• 可随时通过「清空所有数据」完全删除本地数据
• PWA 离线缓存仅包含应用静态资源，不包含用户数据`

const MODEL_INFO = `咖啡因计算模型：

采用一阶消除模型：
R(t) = Σ [ D_i × 0.5 ^ ((t - t_i) / H) ]

• D_i：第 i 杯咖啡因剂量
• t_i：第 i 杯摄入时间
• H：半衰期（默认 4.5 小时）
• R(t)：时刻 t 的体内残留估算

睡前残留：
R_bed = Σ [ D_i × 0.5 ^ ((t_bed - t_i) / H) ]

咖啡因截止时间：
t_cut = t_bed - H × log2(D / (threshold - R_bed))`

export default function SettingsPage({ onOpenSettings }: SettingsPageProps) {
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
      a.download = 'drink-tracker-backup-' + new Date().toISOString().split('T')[0] + '.json'
      a.click()
      URL.revokeObjectURL(url)
      showToast('数据已导出', 'success')
    } catch {
      showToast('导出失败', 'error')
    }
  }

  const handleClear = async () => {
    if (!window.confirm('确定要清空所有数据吗？此操作不可恢复。')) return
    try {
      await clearAllData()
      showToast('数据已清空', 'success')
    } catch {
      showToast('清空失败', 'error')
    }
  }

  return (
    <div className="h-full overflow-y-auto pb-24">
      <div className="p-4 space-y-6">
        <div className="card p-4 text-center">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FF9500, #8B6914)' }}
          >
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold mb-1">饮品记账本</h2>
          <p className="text-sm text-gray-500">v0.1.0</p>
          <p className="text-xs text-gray-400 mt-2">个人咖啡 / 奶茶咖啡因与营养追踪工具</p>
        </div>

        <div className="card divide-y divide-gray-100 dark:divide-gray-700">
          <SettingsItem
            icon={<Bell className="w-5 h-5" />}
            title="就寝时间"
            subtitle={settings.bedtime}
            onClick={() => onOpenSettings(true)}
          />
          <SettingsItem
            icon={<Coffee className="w-5 h-5" />}
            title="咖啡因半衰期"
            subtitle={settings.halfLifeHours + ' 小时'}
            onClick={() => onOpenSettings(true)}
          />
          <SettingsItem
            icon={<Shield className="w-5 h-5" />}
            title="睡前残留阈值"
            subtitle={settings.sleepResidualThresholdMg + ' mg'}
            onClick={() => onOpenSettings(true)}
          />
          <SettingsItem
            icon={<Database className="w-5 h-5" />}
            title="每日目标设置"
            subtitle="咖啡因、糖、热量目标"
            onClick={() => onOpenSettings(true)}
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">数据管理</h3>
          <div className="card divide-y divide-gray-100 dark:divide-gray-700">
            <SettingsItem
              icon={<Download className="w-5 h-5" />}
              title="导出数据"
              subtitle="下载 JSON 备份文件"
              onClick={handleExport}
            />
            <SettingsItem
              icon={<Upload className="w-5 h-5" />}
              title="导入数据"
              subtitle="从 JSON 文件恢复数据"
              onClick={() => onOpenSettings(true)}
            />
            <SettingsItem
              icon={<Trash2 className="w-5 h-5 text-red-500" />}
              title="清空所有数据"
              subtitle="删除所有记录和设置（不可恢复）"
              textColor="text-red-600 dark:text-red-400"
              onClick={handleClear}
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">外观</h3>
          <div className="card">
            <SettingsItem
              icon={<Moon className="w-5 h-5" />}
              title="深色模式"
              subtitle="跟随系统设置"
              trailing={
                <select
                  defaultValue="system"
                  className="input w-auto py-1.5 px-3 text-sm"
                  onChange={(e) => {
                    const root = document.documentElement
                    const mode = e.target.value
                    if (mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                      root.classList.add('dark')
                    } else {
                      root.classList.remove('dark')
                    }
                    localStorage.setItem('theme', mode)
                  }}
                >
                  <option value="system">跟随系统</option>
                  <option value="light">浅色</option>
                  <option value="dark">深色</option>
                </select>
              }
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">关于</h3>
          <div className="card divide-y divide-gray-100 dark:divide-gray-700">
            <SettingsItem
              icon={<Info className="w-5 h-5" />}
              title="免责声明"
              subtitle="查看使用须知和隐私说明"
              onClick={() => window.alert(DISCLAIMER)}
            />
            <SettingsItem
              icon={<Shield className="w-5 h-5" />}
              title="隐私说明"
              subtitle="数据本地存储，无需联网"
              onClick={() => window.alert(PRIVACY)}
            />
            <SettingsItem
              icon={<Coffee className="w-5 h-5" />}
              title="咖啡因计算模型"
              subtitle="一阶消除动力学"
              onClick={() => window.alert(MODEL_INFO)}
            />
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 space-y-1 pb-4">
          <p>数据本地优先 · 无账号 · 无追踪</p>
          <p>可部署于 GitHub Pages / Cloudflare Pages</p>
        </div>
      </div>
    </div>
  )
}

function SettingsItem({
  icon,
  title,
  subtitle,
  onClick,
  trailing,
  textColor = 'text-gray-900 dark:text-white',
}: {
  icon: ReactNode
  title: string
  subtitle: string
  onClick?: () => void
  trailing?: ReactNode
  textColor?: string
}) {
  return (
    <button
      onClick={onClick}
      className={
        'w-full flex items-center justify-between p-4 text-left ' +
        textColor +
        (onClick ? ' hover:bg-gray-50 dark:hover:bg-gray-800' : '')
      }
      disabled={!onClick && !trailing}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-coffee" style={{ backgroundColor: '#FFF8E7' }}>
          {icon}
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {trailing}
        {onClick && <span className="text-gray-400">›</span>}
      </div>
    </button>
  )
}