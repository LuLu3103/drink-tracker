export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="饮品日记">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#logoGrad)" />
      <path d="M20 26h24l-2.6 20.5c-.2 1.4-1.3 2.5-2.8 2.5H25.4c-1.5 0-2.6-1.1-2.8-2.5L20 26Z" fill="#FFFFFF" opacity="0.95" />
      <path d="M18 21h28v5H18z" rx="2" fill="#FFFFFF" />
      <path d="M27 15c0-2 3-2.4 3-4.4M34 15c0-2 3-2.4 3-4.4" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.9" />
      <path d="M25 33h14l-1.6 12H26.6L25 33Z" fill="#3B82F6" opacity="0.35" />
    </svg>
  )
}

export default Logo
