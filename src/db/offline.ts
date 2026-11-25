/**
 * 单文件离线版的数据层：用 localStorage 持久化，替代 IndexedDB。
 * 手机用 file:// 打开时 IndexedDB 往往不可用，localStorage 可以。
 */
import type { DrinkTemplate, DrinkLog, Settings, BackupRecord } from '@/types'
import { BUILTIN_TEMPLATES, DEFAULT_SETTINGS, BRAND_ORDER } from './index'

export { DEFAULT_SETTINGS, BRAND_ORDER, BUILTIN_TEMPLATES }

const KEY = 'drink-tracker-offline-v1'

interface Snapshot {
  templates: DrinkTemplate[]
  logs: DrinkLog[]
  settings: Settings | null
  backups: BackupRecord[]
  seq: number
}

function emptySnapshot(): Snapshot {
  return { templates: [], logs: [], settings: null, backups: [], seq: 1 }
}

function readSnapshot(): Snapshot {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...emptySnapshot(), ...(JSON.parse(raw) as Partial<Snapshot>) }
  } catch {
    /* 隐私模式或配额不可用 */
  }
  return emptySnapshot()
}

const state: Snapshot = readSnapshot()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* 写入失败时保持内存态，不阻塞使用 */
  }
}

const settingsTable = {
  count: async () => (state.settings ? 1 : 0),
  add: async (s: Settings) => {
    state.settings = { ...s }
    persist()
  },
  get: async (_id?: number) => state.settings ?? undefined,
  put: async (s: Settings, _id?: number) => {
    state.settings = { ...s }
    persist()
  },
  clear: async () => {
    state.settings = null
    persist()
  },
}

const templatesTable = {
  toArray: async () => state.templates.slice(),
  get: async (id: string) => state.templates.find(t => t.id === id),
  count: async () => state.templates.length,
  add: async (t: DrinkTemplate) => {
    state.templates.push(t)
    persist()
  },
  put: async (t: DrinkTemplate) => {
    const i = state.templates.findIndex(x => x.id === t.id)
    if (i >= 0) state.templates[i] = t
    else state.templates.push(t)
    persist()
  },
  update: async (id: string, patch: Partial<DrinkTemplate>) => {
    const i = state.templates.findIndex(x => x.id === id)
    if (i >= 0) state.templates[i] = { ...state.templates[i], ...patch }
    persist()
  },
  delete: async (id: string) => {
    state.templates = state.templates.filter(t => t.id !== id)
    persist()
  },
  bulkDelete: async (ids: string[]) => {
    const set = new Set(ids)
    state.templates = state.templates.filter(t => !set.has(t.id))
    persist()
  },
  bulkAdd: async (rows: DrinkTemplate[]) => {
    state.templates = rows.slice()
    persist()
  },
  clear: async () => {
    state.templates = []
    persist()
  },
}

const logsTable = {
  add: async (l: DrinkLog) => {
    state.logs.push(l)
    persist()
  },
  update: async (id: string, patch: Partial<DrinkLog>) => {
    const i = state.logs.findIndex(x => x.id === id)
    if (i >= 0) state.logs[i] = { ...state.logs[i], ...patch }
    persist()
  },
  delete: async (id: string) => {
    state.logs = state.logs.filter(l => l.id !== id)
    persist()
  },
  clear: async () => {
    state.logs = []
    persist()
  },
  bulkAdd: async (rows: DrinkLog[]) => {
    state.logs = rows.slice()
    persist()
  },
  orderBy: (_field: string) => {
    const ascending = () => state.logs.slice().sort((a, b) => a.consumedAt - b.consumedAt)
    return {
      toArray: async () => ascending(),
      reverse: () => ({
        toArray: async () => ascending().reverse(),
      }),
    }
  },
}

const backupsTable = {
  add: async (b: BackupRecord) => {
    state.backups.push({ ...b, id: state.seq++ })
    persist()
  },
  clear: async () => {
    state.backups = []
    persist()
  },
  orderBy: (_field: string) => ({
    last: async () => {
      const sorted = state.backups.slice().sort((a, b) => a.createdAt - b.createdAt)
      return sorted.length ? sorted[sorted.length - 1] : undefined
    },
  }),
}

export const db = {
  templates: templatesTable,
  logs: logsTable,
  settings: settingsTable,
  backups: backupsTable,
}

export async function initDB(): Promise<void> {
  if (!state.settings) {
    state.settings = { ...DEFAULT_SETTINGS }
  }

  const now = Date.now()
  const builtinIds = new Set(BUILTIN_TEMPLATES.map(t => t.id))

  for (const tpl of BUILTIN_TEMPLATES) {
    const existing = state.templates.find(t => t.id === tpl.id)
    if (!existing) {
      state.templates.push({ ...tpl, createdAt: now })
    } else if (!existing.isCustom && !existing.isEdited) {
      Object.assign(existing, {
        ...tpl,
        sizes: existing.sizes ?? tpl.sizes,
        isFavorite: existing.isFavorite ?? tpl.isFavorite,
        isHidden: existing.isHidden ?? false,
        createdAt: existing.createdAt,
      })
    }
  }

  const stale = state.templates.filter(t => !t.isCustom && !builtinIds.has(t.id)).map(t => t.id)
  if (stale.length > 0) {
    const set = new Set(stale)
    state.templates = state.templates.filter(t => !set.has(t.id))
  }

  persist()
}
