/**
 * 生成唯一 ID。
 * crypto.randomUUID() 只在安全上下文（HTTPS / localhost）可用，
 * 局域网 HTTP 访问时用 getRandomValues 兜底，保证手机通过 IP 访问也能正常记录。
 */
export function newId(): string {
  const c = globalThis.crypto as Crypto | undefined

  if (c && typeof c.randomUUID === 'function') {
    try {
      return c.randomUUID()
    } catch {
      // fall through
    }
  }

  if (c && typeof c.getRandomValues === 'function') {
    const bytes = c.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
    return (
      hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' +
      hex.slice(16, 20) + '-' + hex.slice(20)
    )
  }

  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}
