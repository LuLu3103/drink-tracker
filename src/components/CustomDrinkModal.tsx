import React, { useState } from 'react'
import { useDrinkStore } from '@/store'
import { X } from 'lucide-react'

const CATEGORIES = [
  { value: 'coffee', label: '咖啡', icon: '☕' },
  { value: 'milk_tea', label: '奶茶', icon: '🧋' },
  { value: 'tea', label: '纯茶', icon: '🍵' },
  { value: 'other', label: '其他', icon: '🥤' }
] as const

const BASE_TYPES = [
  { value: 'espresso', label: '浓缩咖啡' },
  { value: 'tea_base', label: '茶底' },
  { value: 'matcha', label: '抹茶' },
  { value: 'cocoa', label: '可可' },
  { value: 'none', label: '无/不含咖啡因' }
] as const

export function CustomDrinkModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addTemplate, showToast } = useDrinkStore()
  const [form, setForm] = useState({
    name: '',
    brand: '自定义',
    category: 'coffee' as typeof CATEGORIES[number]['value'],
    baseType: 'espresso' as typeof BASE_TYPES[number]['value'],
    size: '标准',
    caffeineMg: 100,
    sugarG: 10,
    caloriesKcal: 150,
    isFavorite: false
  })
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      showToast('请输入饮品名称', 'error')
      return
    }
    
    setIsLoading(true)
    try {
      await addTemplate({
        ...form,
        caffeineMg: Number(form.caffeineMg),
        sugarG: Number(form.sugarG),
        caloriesKcal: Number(form.caloriesKcal),
        isCustom: true
      })
      showToast('自定义饮品已添加', 'success')
      onClose()
      resetForm()
    } catch (error) {
      showToast('添加失败，请重试', 'error')
    } finally {
      setIsLoading(false)
    }
  }
  
  const resetForm = () => {
    setForm({
      name: '',
      brand: '自定义',
      category: 'coffee',
      baseType: 'espresso',
      size: '标准',
      caffeineMg: 100,
      sugarG: 10,
      caloriesKcal: 150,
      isFavorite: false
    })
  }
  
  React.useEffect(() => {
    if (isOpen) resetForm()
  }, [isOpen])
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="w-full bg-white dark:bg-gray-950 rounded-t-3xl shadow-xl max-h-[90vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm z-10 rounded-t-3xl">
          <h2 className="text-lg font-semibold">添加自定义饮品</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">饮品名称 *</label>
            <input
              type="text"
              placeholder="例如：我的特调拿铁"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              required
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">品牌</label>
            <input
              type="text"
              placeholder="例如：自制、办公室咖啡机"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">类型</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, category: cat.value })}
                  className={`p-3 rounded-xl border-2 text-center transition-all $
                    {form.category === cat.value 
                      ? 'border-coffee bg-primary-50 dark:bg-primary-900/30' 
                      : 'border-gray-200 dark:border-gray-700'
                    }`}
                >
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="text-xs font-medium">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">基底类型</label>
            <select
              value={form.baseType}
              onChange={(e) => setForm({ ...form, baseType: e.target.value as typeof form.baseType })}
              className="input"
            >
              {BASE_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">杯型/规格</label>
              <input
                type="text"
                placeholder="标准、大杯、中杯..."
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">咖啡因</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="1"
                  value={form.caffeineMg}
                  onChange={(e) => setForm({ ...form, caffeineMg: Number(e.target.value) })}
                  className="input"
                />
                <span className="text-gray-500">mg</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">糖</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.sugarG}
                  onChange={(e) => setForm({ ...form, sugarG: Number(e.target.value) })}
                  className="input"
                />
                <span className="text-gray-500">g</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">热量</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="1"
                  value={form.caloriesKcal}
                  onChange={(e) => setForm({ ...form, caloriesKcal: Number(e.target.value) })}
                  className="input"
                />
                <span className="text-gray-500">kcal</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFavorite}
                onChange={(e) => setForm({ ...form, isFavorite: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-coffee focus:ring-coffee"
              />
              <span className="text-sm">加入常用</span>
            </label>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3"
            >
              {isLoading ? '保存中...' : '保存饮品'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}