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
import { Plus, CalendarDays, ChartColumn, Settings2 } from 'lucide-react'

const TABS = [
  { key: 'record', label: '记录', Icon: Plus },
  { key: 'timeline', label: '时间线', Icon: CalendarDays },
  { key: 'stats', label: '统计', Icon: ChartColumn },
  { key: 'settings', label: '设置', Icon: Settings2 },
] as const

export default function App() {
  const loadAll = useDrinkStore(s => s.loadAll)
  const toasts = useDrinkStore(s => s.toasts)

  const [tab, setTab] = useState<'record' | 'timeline' | 'stats' | 'settings'>('record')
  const [recordOpen, setRecordOpen] = useState(false)
  const [selected, setSelected] = useState<DrinkTemplate | null>(null)
  const [customOpen, setCustomOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  useEffect(() => {
    const timer = window.setInterval(() => useDrinkStore.getState().recalculate(), 60000)
    return () => window.clearInterval(timer)
  }, [])

  const openPicker = () => {
    setSelected(null)
    setRecordOpen(true)
  }

  const quickRecord = (t: DrinkTemplate) => {
    setSelected(t)
    setRecordOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas dark:bg-slate-950">
      <main className="flex-1 overflow-hidden">
        {tab === 'record' && (
          <RecordPage onQuickRecord={quickRecord} onOpenPicker={openPicker} onOpenCustomDrink={() => setCustomOpen(true)} />
        )}
        {tab === 'timeline' && <TimelinePage />}
        {tab === 'stats' && <StatsPage />}
        {tab === 'settings' && <SettingsPage onOpenSettings={() => setSettingsOpen(true)} />}
      </main>

      <nav className="tab-bar safe-bottom" role="tablist" aria-label="主导航">
        <div className="mx-auto flex max-w-md justify-around px-3">
          {TABS.map(({ key, label, Icon }) => {
            const active = tab === key
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                aria-label={label}
                onClick={() => setTab(key)}
                className={'tab-item ' + (active ? 'active' : '')}
              >
                <Icon className="w-[21px] h-[21px]" strokeWidth={active ? 2.3 : 1.9} />
                {label}
              </button>
            )
          })}
        </div>
      </nav>

      <DrinkRecordModal isOpen={recordOpen} onClose={() => setRecordOpen(false)} template={selected} />
      <CustomDrinkModal isOpen={customOpen} onClose={() => setCustomOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ToastContainer toasts={toasts} />
    </div>
  )
}
