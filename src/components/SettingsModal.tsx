import { useEffect, useState } from 'react'
import type { Settings } from '@/types'
import { useDrinkStore } from '@/store'
import { X } from 'lucide-react'

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-[12px] text-ink-400 mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-ink-400">{hint}</p>}
    </div>
  )
}

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const settings = useDrinkStore(s => s.settings)
  const updateSettings = useDrinkStore(s => s.updateSettings)
  const exportData = useDrinkStore(s => s.exportData)
  const importData = useDrinkStore(s => s.importData)
  const showToast = useDrinkStore(s => s.showToast)

  const [form, setForm] = useState<Settings>(settings)
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [exportText, setExportText] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) setForm(settings)
  }, [isOpen, settings])

  if (!isOpen) return null

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    await updateSettings(form)
    showToast('设置已保存', 'success')
    onClose()
  }

  const doExport = async () => {
    const json = await exportData()
    setExportText(json)
  }

  const download = () => {
    if (!exportText) return
    const blob = new Blob([exportText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'drink-tracker-' + new Date().toISOString().slice(0, 10) + '.json'
    a.click()
    URL.revokeObjectURL(url)
    setExportText(null)
    showToast('已下载备份', 'success')
  }

  const doImport = async () => {
    try {
      await importData(importText)
      showToast('导入成功', 'success')
      setImportOpen(false)
      setImportText('')
      onClose()
    } catch {
      showToast('导入失败：数据格式不正确', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="sheet max-h-[92vh]">
        <div className="sheet-handle" />
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <h2 className="text-[17px] font-semibold">设置</h2>
          <button onClick={onClose} aria-label="关闭" className="p-2 -mr-2 rounded-full text-ink-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5">
          <Field label="就寝目标时间" hint="用于计算睡前残留与截止时间">
            <input type="time" className="input" value={form.bedtime} onChange={e => set('bedtime', e.target.value)} />
          </Field>

          <Field label="咖啡因半衰期" hint="3h 代谢快 / 4.5h 平均 / 6h 敏感">
            <select className="input" value={form.halfLifeHours} onChange={e => set('halfLifeHours', Number(e.target.value))}>
              <option value={3}>3 小时</option>
              <option value={4.5}>4.5 小时</option>
              <option value={6}>6 小时</option>
            </select>
          </Field>

          <Field label="睡前残留阈值" hint="低于此值视为低风险">
            <select className="input" value={form.sleepResidualThresholdMg} onChange={e => set('sleepResidualThresholdMg', Number(e.target.value))}>
              <option value={20}>20 mg（严格）</option>
              <option value={30}>30 mg（推荐）</option>
              <option value={50}>50 mg（宽松）</option>
            </select>
          </Field>

          <div>
            <p className="text-[12px] text-ink-400 mb-2">每日目标</p>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <input type="number" min="50" step="10" className="input px-3 py-2.5 text-[13px]" value={form.dailyCaffeineTargetMg} onChange={e => set('dailyCaffeineTargetMg', Number(e.target.value))} />
                <p className="mt-1 text-[10.5px] text-ink-400">咖啡因 mg</p>
              </div>
              <div>
                <input type="number" min="5" step="1" className="input px-3 py-2.5 text-[13px]" value={form.dailySugarTargetG} onChange={e => set('dailySugarTargetG', Number(e.target.value))} />
                <p className="mt-1 text-[10.5px] text-ink-400">添加糖 g</p>
              </div>
              <div>
                <input type="number" min="500" step="50" className="input px-3 py-2.5 text-[13px]" value={form.dailyCalorieTargetKcal} onChange={e => set('dailyCalorieTargetKcal', Number(e.target.value))} />
                <p className="mt-1 text-[10.5px] text-ink-400">热量 kcal</p>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-ink-400">参考：WHO 建议添加糖 &lt; 25g/天，咖啡因 &lt; 400mg/天</p>
          </div>

          <div className="space-y-2">
            <button onClick={doExport} className="btn-secondary w-full justify-start">导出数据（JSON）</button>
            <button onClick={() => setImportOpen(true)} className="btn-secondary w-full justify-start">导入数据（JSON）</button>
          </div>

          <button onClick={save} className="btn-primary w-full">保存设置</button>
        </div>

        {exportText !== null && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
            <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-[2px]" onClick={() => setExportText(null)} />
            <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 dark:bg-slate-900 animate-slide-up">
              <h3 className="text-[15px] font-semibold mb-1">导出备份</h3>
              <p className="text-[12px] text-ink-400 mb-3">保存到手机，换设备时用「导入数据」恢复。</p>
              <div className="flex gap-2.5">
                <button onClick={download} className="btn-primary flex-1">下载文件</button>
                <button onClick={() => setExportText(null)} className="btn-ghost flex-1">取消</button>
              </div>
            </div>
          </div>
        )}

        {importOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
            <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-[2px]" onClick={() => setImportOpen(false)} />
            <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 dark:bg-slate-900 animate-slide-up">
              <h3 className="text-[15px] font-semibold mb-1">导入数据</h3>
              <p className="text-[12px] text-ink-400 mb-3">粘贴之前导出的 JSON（会覆盖现有数据）</p>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder='{"templates":[],"logs":[],"settings":{...}}'
                className="input h-32 font-mono text-[11px]"
              />
              <div className="mt-3 flex gap-2.5">
                <button onClick={doImport} className="btn-primary flex-1">导入</button>
                <button onClick={() => setImportOpen(false)} className="btn-ghost flex-1">取消</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
