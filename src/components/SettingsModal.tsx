import { useState, useEffect } from 'react'
import { useDrinkStore } from '@/store'
import { X, Download, Upload, Trash2, AlertTriangle } from 'lucide-react'

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { settings, updateSettings, exportData, importData, clearAllData, showToast } = useDrinkStore()
  const [localSettings, setLocalSettings] = useState(settings)
  const [importJson, setImportJson] = useState('')
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [exportJson, setExportJson] = useState('')
  const [showExportDialog, setShowExportDialog] = useState(false)
  
  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])
  
  const handleSave = async () => {
    try {
      await updateSettings(localSettings)
      showToast('设置已保存', 'success')
      onClose()
    } catch (error) {
      showToast('保存失败', 'error')
    }
  }
  
  const handleExport = async () => {
    try {
      const json = await exportData()
      setExportJson(json)
      setShowExportDialog(true)
    } catch (error) {
      showToast('导出失败', 'error')
    }
  }
  
  const copyExport = () => {
    navigator.clipboard.writeText(exportJson)
    showToast('已复制到剪贴板', 'success')
  }
  
  const downloadExport = () => {
    const blob = new Blob([exportJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `drink-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('文件已下载', 'success')
  }
  
  const handleImport = async () => {
    if (!importJson.trim()) {
      showToast('请粘贴 JSON 数据', 'error')
      return
    }
    try {
      await importData(importJson)
      showToast('导入成功', 'success')
      setImportJson('')
      setShowImportDialog(false)
      onClose()
    } catch (error) {
      showToast('导入失败：数据格式错误', 'error')
    }
  }
  
  const handleClear = async () => {
    try {
      await clearAllData()
      showToast('所有数据已清空', 'success')
      setShowClearConfirm(false)
      onClose()
    } catch (error) {
      showToast('清空失败', 'error')
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="w-full bg-white dark:bg-gray-950 rounded-t-3xl shadow-xl max-h-[90vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm z-10 rounded-t-3xl">
          <h2 className="text-lg font-semibold">设置</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Basic Settings */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wide">基本设置</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">就寝目标时间</label>
                <input
                  type="time"
                  value={localSettings.bedtime}
                  onChange={(e) => setLocalSettings({ ...localSettings, bedtime: e.target.value })}
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">用于计算睡前咖啡因残留和截止时间</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">咖啡因半衰期</label>
                <select
                  value={localSettings.halfLifeHours}
                  onChange={(e) => setLocalSettings({ ...localSettings, halfLifeHours: Number(e.target.value) })}
                  className="input"
                >
                  <option value={3}>3 小时 - 代谢快，下午喝不影响睡眠</option>
                  <option value={4.5}>4.5 小时 - 一般人群平均值</option>
                  <option value={6}>6 小时 - 代谢慢，敏感人群</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">咖啡因在体内减少一半所需时间，因人而异</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">睡前残留阈值</label>
                <select
                  value={localSettings.sleepResidualThresholdMg}
                  onChange={(e) => setLocalSettings({ ...localSettings, sleepResidualThresholdMg: Number(e.target.value) })}
                  className="input"
                >
                  <option value={20}>20 mg - 严格</option>
                  <option value={30}>30 mg - 推荐</option>
                  <option value={50}>50 mg - 宽松</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">睡前体内咖啡因低于此值视为低风险</p>
              </div>
            </div>
          </div>
          
          {/* Daily Targets */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wide">每日目标</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">咖啡因目标</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    step="10"
                    value={localSettings.dailyCaffeineTargetMg}
                    onChange={(e) => setLocalSettings({ ...localSettings, dailyCaffeineTargetMg: Number(e.target.value) })}
                    className="input"
                  />
                  <span className="text-gray-500">mg</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">添加糖目标</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="100"
                    step="1"
                    value={localSettings.dailySugarTargetG}
                    onChange={(e) => setLocalSettings({ ...localSettings, dailySugarTargetG: Number(e.target.value) })}
                    className="input"
                  />
                  <span className="text-gray-500">g</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">热量目标</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1000"
                    max="5000"
                    step="50"
                    value={localSettings.dailyCalorieTargetKcal}
                    onChange={(e) => setLocalSettings({ ...localSettings, dailyCalorieTargetKcal: Number(e.target.value) })}
                    className="input"
                  />
                  <span className="text-gray-500">kcal</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">参考：WHO 建议添加糖 &lt; 25g/天，咖啡因 &lt; 400mg/天</p>
          </div>
          
          {/* Data Management */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wide">数据管理</h3>
            <div className="space-y-3">
              <button
                onClick={handleExport}
                className="btn-secondary w-full justify-start gap-3"
              >
                <Download className="w-5 h-5" />
                <span>导出数据 (JSON)</span>
              </button>
              <button
                onClick={() => setShowImportDialog(true)}
                className="btn-secondary w-full justify-start gap-3"
              >
                <Upload className="w-5 h-5" />
                <span>导入数据 (JSON)</span>
              </button>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="btn-secondary w-full justify-start gap-3 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900"
              >
                <Trash2 className="w-5 h-5" />
                <span>清空所有数据</span>
              </button>
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">免责声明</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 space-y-2">
              本工具仅供个人参考，提供的咖啡因残留估算基于一阶消除动力学模型，<br />
              实际代谢因人而异，受遗传、年龄、体重、药物、肝功能等多种因素影响。<br />
              <span className="font-medium">不构成医疗建议，请勿用于健康决策。</span><br />
              品牌库数据来源于公开信息汇总，仅为估算值，实际含量可能有差异。
            </p>
          </div>
          
          {/* Save Button */}
          <button
            onClick={handleSave}
            className="btn-primary w-full py-3 mt-4"
          >
            保存设置
          </button>
        </div>
        
        {/* Export Dialog */}
        {showExportDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md animate-slide-up">
              <h3 className="text-lg font-semibold mb-4">导出数据</h3>
              <textarea
                value={exportJson}
                readOnly
                className="input h-40 font-mono text-xs"
              />
              <div className="flex gap-3 mt-4">
                <button onClick={copyExport} className="btn-secondary flex-1">复制</button>
                <button onClick={downloadExport} className="btn-primary flex-1">下载文件</button>
              </div>
              <button onClick={() => setShowExportDialog(false)} className="btn-ghost w-full mt-3">关闭</button>
            </div>
          </div>
        )}
        
        {/* Import Dialog */}
        {showImportDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md animate-slide-up">
              <h3 className="text-lg font-semibold mb-4">导入数据</h3>
              <p className="text-sm text-gray-500 mb-3">粘贴之前导出的 JSON 数据（将覆盖现有数据）</p>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='{"templates":[],"logs":[],"settings":{...}}'
                className="input h-40 font-mono text-xs"
              />
              <div className="flex gap-3 mt-4">
                <button onClick={handleImport} className="btn-primary flex-1">导入</button>
                <button onClick={() => setShowImportDialog(false)} className="btn-ghost flex-1">取消</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Clear Confirm Dialog */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md animate-slide-up">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-center mb-2">确定要清空所有数据吗？</h3>
              <p className="text-sm text-gray-500 text-center mb-6">此操作将删除所有饮品记录、自定义饮品和设置，无法恢复。</p>
              <div className="flex gap-3">
                <button onClick={handleClear} className="btn-danger flex-1">清空</button>
                <button onClick={() => setShowClearConfirm(false)} className="btn-ghost flex-1">取消</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}