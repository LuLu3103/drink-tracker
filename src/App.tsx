import { useEffect, useState } from 'react'
import { useDrinkStore } from '@/store'
import type { DrinkTemplate } from '@/types'
import RecordPage from '@/pages/RecordPage'
import TimelinePage from '@/pages/TimelinePage'
import StatsPage from '@/pages/StatsPage'
import SettingsPage from '@/pages/SettingsPage'
import { DrinkRecordModal } from '@/components/DrinkRecordModal'
import { CustomDrinkModal } from '@/components/CustomDrinkModal'
import { SettingsModal } from '@/components/SettingsModal'
import { ToastContainer } from '@/components/Toast'

const TABS = [
  {
    key: 'record',
    label: '记录',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />,
  },
  {
    key: 'timeline',
    label: '时间线',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  },
  {
    key: 'stats',
    label: '统计',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  },
  {
    key: 'settings',
    label: '设置',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
  },
]

export default function App() {
  const loadAll = useDrinkStore(s => s.loadAll)
  const toasts = useDrinkStore(s => s.toasts)

  const [activeTab, setActiveTab] = useState('record')
  const [recordOpen, setRecordOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<DrinkTemplate | null>(null)
  const [customOpen, setCustomOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  // refresh derived caffeine state every minute so residual decays live
  useEffect(() => {
    const timer = window.setInterval(() => {
      useDrinkStore.getState().recalculate()
    }, 60000)
    return () => window.clearInterval(timer)
  }, [])

  const openPicker = () => {
    setSelectedTemplate(null)
    setRecordOpen(true)
  }

  const quickRecord = (template: DrinkTemplate) => {
    setSelectedTemplate(template)
    setRecordOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-primary-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <main className="flex-1 overflow-hidden">
        {activeTab === 'record' && (
          <RecordPage onQuickRecord={quickRecord} onOpenPicker={openPicker} onOpenCustomDrink={() => setCustomOpen(true)} />
        )}
        {activeTab === 'timeline' && <TimelinePage />}
        {activeTab === 'stats' && <StatsPage />}
        {activeTab === 'settings' && <SettingsPage onOpenSettings={() => setSettingsOpen(true)} />}
      </main>

      <nav className="tab-bar safe-bottom" role="tablist" aria-label="主导航">
        <div className="flex justify-around">
          {TABS.map(tab => {
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={active}
                aria-label={tab.label}
                onClick={() => setActiveTab(tab.key)}
                className={'tab-item ' + (active ? 'active' : '')}
              >
                <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {tab.icon}
                </svg>
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>

      <DrinkRecordModal isOpen={recordOpen} onClose={() => setRecordOpen(false)} template={selectedTemplate} />
      <CustomDrinkModal isOpen={customOpen} onClose={() => setCustomOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ToastContainer toasts={toasts} />
    </div>
  )
}