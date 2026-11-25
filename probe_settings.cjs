const { indexedDB, IDBKeyRange } = require('fake-indexeddb')
globalThis.indexedDB = indexedDB
globalThis.IDBKeyRange = IDBKeyRange
const Dexie = require('dexie')

async function main() {
  const db = new Dexie('probe-settings')
  db.version(1).stores({ settings: '++id' })

  await db.settings.add({ bedtime: '23:30', halfLifeHours: 4.5 })

  const loaded = await db.settings.get(1)
  console.log('after add -> get(1):', JSON.stringify(loaded))

  // 场景 A：对象里带 id，同时又传 out-of-line key（应用里的写法）
  await db.settings.put({ ...loaded, bedtime: '22:00' }, 1)
  console.log('A count:', await db.settings.count(), 'get(1):', JSON.stringify(await db.settings.get(1)))

  // 场景 B：对象不带 id，传 key
  await db.settings.put({ bedtime: '21:00', halfLifeHours: 3 }, 1)
  console.log('B count:', await db.settings.count(), 'get(1):', JSON.stringify(await db.settings.get(1)))

  // 场景 C：纯 inline key
  await db.settings.put({ id: 1, bedtime: '20:00', halfLifeHours: 6 })
  console.log('C count:', await db.settings.count(), 'get(1):', JSON.stringify(await db.settings.get(1)))
  console.log('all rows:', JSON.stringify(await db.settings.toArray()))
}

main().catch(e => console.log('FATAL', e.message))
