/**
 * 离线单文件构建时替换 dexie。
 * 单文件用 localStorage 存储，不会真正打开 IndexedDB，
 * 但仍要让内置数据模块里的 `new DrinkTrackerDB()` 能正常构造。
 */
export class Dexie {
  name: string
  constructor(name?: string) {
    this.name = name ?? 'offline'
  }
  version(_v: number) {
    return {
      stores: (_schema: Record<string, string>) => undefined,
    }
  }
}

export type Table<T> = {
  toArray: () => Promise<T[]>
}

export default Dexie
