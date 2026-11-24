export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return formatDate(timestamp)
}

export function formatCaffeine(mg: number): string {
  return `${mg}mg`
}

export function formatSugar(g: number): string {
  return `${g.toFixed(1)}g`
}

export function formatCalories(kcal: number): string {
  return `${kcal}kcal`
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    coffee: '咖啡',
    milk_tea: '奶茶',
    tea: '纯茶',
    other: '其他'
  }
  return labels[category] || category
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    coffee: '#8B6914',
    milk_tea: '#D97706',
    tea: '#059669',
    other: '#6B7280'
  }
  return colors[category] || '#6B7280'
}

export function getRiskColor(level: 'low' | 'medium' | 'high'): string {
  const colors = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444'
  }
  return colors[level]
}

export function getRiskLabel(level: 'low' | 'medium' | 'high'): string {
  const labels = {
    low: '低风险',
    medium: '中等风险',
    high: '较高风险'
  }
  return labels[level]
}