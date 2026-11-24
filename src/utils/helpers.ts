export function generateId(): string {
  return crypto.randomUUID()
}

export function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getEndOfDay(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function parseTimeToMs(timeStr: string, baseDate: Date = new Date()): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const date = new Date(baseDate)
  date.setHours(hours, minutes, 0, 0)
  return date.getTime()
}

export function getBedtimeTimestamp(bedtime: string): number {
  const [hours, minutes] = bedtime.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  if (date <= new Date()) {
    date.setDate(date.getDate() + 1)
  }
  return date.getTime()
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}