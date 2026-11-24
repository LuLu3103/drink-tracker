import { indexedDB, IDBKeyRange } from 'fake-indexeddb'

;(globalThis as any).indexedDB = indexedDB
;(globalThis as any).IDBKeyRange = IDBKeyRange

async function main() {
  // fake-indexeddb starts empty in a fresh process, no cleanup needed
  const { useDrinkStore } = await import('../src/store')
  const st = () => useDrinkStore.getState()

  await st().loadAll()
  console.log('1) seeded templates:', st().templates.length)
  console.log('2) settings:', JSON.stringify(st().settings))

  const t = st().templates.find(x => x.caffeineMg > 0)!
  console.log('3) picked template:', t.brand, t.name, t.caffeineMg + 'mg')

  await st().addLog({
    templateId: t.id,
    brand: t.brand,
    name: t.name,
    category: t.category,
    baseType: t.baseType,
    size: t.size,
    caffeineMg: 150,
    sugarG: 12,
    caloriesKcal: 220,
    consumedAt: Date.now(),
  })
  await new Promise(r => setTimeout(r, 50))

  console.log('4) logs:', st().logs.length)
  console.log('5) today:', JSON.stringify(st().todayStats))
  console.log('6) currentResidual:', Math.round(st().currentResidual), 'mg')
  console.log('7) bedtimeResidual:', Math.round(st().bedtimeResidual), 'mg')
  console.log('8) risk:', st().riskLevel.level, '| cutoff:', st().cutoffInfo.cutoffTime, '|', st().cutoffInfo.message)
  console.log('9) curve points:', st().caffeineCurve.length)
  console.log('10) week/month:', st().weeklyStats.length, '/', st().monthlyStats.length)

  // decay sanity: residual must be <= dose
  if (!(st().currentResidual <= 150.5)) throw new Error('residual exceeds dose')

  // edit + delete flow
  const log = st().logs[0]
  await st().updateLog(log.id, { caffeineMg: 60 })
  await new Promise(r => setTimeout(r, 50))
  console.log('11) after edit, today caffeine:', st().todayStats.totalCaffeine)

  await st().deleteLog(log.id)
  await new Promise(r => setTimeout(r, 50))
  console.log('12) after delete, logs:', st().logs.length, 'residual:', Math.round(st().currentResidual))

  // export / import round trip
  const json = await st().exportData()
  console.log('13) export bytes:', json.length)
  await st().importData(json)
  console.log('14) after import, templates:', st().templates.length, 'logs:', st().logs.length)

  // settings update recalculates
  await st().updateSettings({ halfLifeHours: 6 })
  await new Promise(r => setTimeout(r, 50))
  console.log('15) after settings change, halfLife:', st().settings.halfLifeHours)

  console.log('SMOKE_OK')
}

main().catch(e => {
  console.error('SMOKE_FAIL:', e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : e)
  process.exitCode = 1
})
