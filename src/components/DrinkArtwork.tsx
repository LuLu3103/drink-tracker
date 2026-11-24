import { useId } from 'react'
import type { ArtStyle, DrinkArt } from '@/types'

interface Palette {
  liquid: string
  liquid2: string
  foam?: string
}

const PALETTES: Record<ArtStyle, Palette> = {
  americano: { liquid: '#4A2C17', liquid2: '#5C3820' },
  latte: { liquid: '#D8B08C', liquid2: '#7A4A2B', foam: '#FBF3E7' },
  milk_tea: { liquid: '#C79B6E', liquid2: '#B0804F' },
  fruit_tea: { liquid: '#F7B267', liquid2: '#F79D65' },
  matcha: { liquid: '#8FB15A', liquid2: '#7A9B48', foam: '#EAF2DA' },
  cocoa: { liquid: '#6B4226', liquid2: '#5A3520', foam: '#F6E7D3' },
  tea: { liquid: '#D2A65F', liquid2: '#C08F45' },
  soda: { liquid: '#A9D3F5', liquid2: '#8FC4EE' },
  smoothie: { liquid: '#F5A9C0', liquid2: '#EE8FAD' },
  juice: { liquid: '#FBC16B', liquid2: '#F9A94D' },
}

export const ART_STYLES: Array<{ key: ArtStyle; label: string }> = [
  { key: 'americano', label: '美式' },
  { key: 'latte', label: '拿铁' },
  { key: 'milk_tea', label: '奶茶' },
  { key: 'fruit_tea', label: '果茶' },
  { key: 'matcha', label: '抹茶' },
  { key: 'cocoa', label: '可可' },
  { key: 'tea', label: '清茶' },
  { key: 'soda', label: '气泡' },
  { key: 'smoothie', label: '奶昔' },
  { key: 'juice', label: '果汁' },
]

export const TINT_SWATCHES = [
  '#3B82F6', '#0EA5E9', '#6366F1', '#8B5CF6',
  '#EC4899', '#F59E0B', '#10B981', '#64748B',
]

/** 取插画主色，用于日历圆点、海报等 */
export function artColor(art?: DrinkArt): string {
  if (!art) return '#94A3B8'
  if (art.tint) return art.tint
  const p = PALETTES[art.style]
  return p ? p.liquid : '#94A3B8'
}

export function fallbackArt(category: string, baseType?: string): DrinkArt {
  if (baseType === 'matcha') return { style: 'matcha', cup: 'cold', topping: 'none' }
  if (baseType === 'cocoa') return { style: 'cocoa', cup: 'hot', topping: 'cream' }
  if (category === 'coffee') return { style: 'latte', cup: 'cold', topping: 'ice' }
  if (category === 'milk_tea') return { style: 'milk_tea', cup: 'cold', topping: 'pearl' }
  if (category === 'tea') return { style: 'tea', cup: 'cold', topping: 'none' }
  return { style: 'juice', cup: 'cold', topping: 'fruit' }
}

function Toppings({ topping }: { topping?: DrinkArt['topping'] }) {
  switch (topping) {
    case 'pearl':
      return (
        <g fill="#3B2A22">
          <circle cx="26" cy="50.5" r="1.8" />
          <circle cx="30" cy="52.4" r="1.8" />
          <circle cx="34" cy="50.2" r="1.8" />
          <circle cx="28" cy="54.4" r="1.6" />
          <circle cx="32.5" cy="54.6" r="1.6" />
          <circle cx="36.5" cy="52.8" r="1.5" />
        </g>
      )
    case 'cream':
      return (
        <g>
          <rect x="19" y="17" width="26" height="6" fill="#FFFFFF" opacity="0.8" />
          <path d="M20 24 Q23 19.5 26 24 Q29 28.5 32 24 Q35 19.5 38 24 Q41 28.5 44 24"
            stroke="#FFFFFF" strokeWidth="2.6" fill="none" opacity="0.95" strokeLinecap="round" />
        </g>
      )
    case 'fruit':
      return (
        <g>
          <circle cx="26.5" cy="25" r="4.6" fill="#FEF3C7" />
          <circle cx="26.5" cy="25" r="3.4" fill="#F59E0B" opacity="0.85" />
          <path d="M26.5 21.6 L26.5 28.4 M23.1 25 L29.9 25" stroke="#FEF3C7" strokeWidth="0.9" />
          <circle cx="35.5" cy="31" r="2.6" fill="#FDE68A" opacity="0.9" />
          <circle cx="30" cy="36" r="1.9" fill="#FDE68A" opacity="0.75" />
        </g>
      )
    case 'ice':
      return (
        <g opacity="0.55">
          <rect x="25" y="27" width="5.4" height="5.4" rx="1.2" fill="#FFFFFF" transform="rotate(-16 27.7 29.7)" />
          <rect x="33" y="33" width="4.8" height="4.8" rx="1.2" fill="#FFFFFF" transform="rotate(14 35.4 35.4)" />
          <rect x="27" y="38" width="4.2" height="4.2" rx="1.1" fill="#FFFFFF" transform="rotate(-8 29.1 40.1)" />
        </g>
      )
    case 'bubbles':
      return (
        <g fill="#FFFFFF" opacity="0.8">
          <circle cx="27" cy="33" r="1.3" />
          <circle cx="34" cy="39" r="1.1" />
          <circle cx="29" cy="45" r="1.5" />
          <circle cx="36" cy="48" r="1.2" />
          <circle cx="26" cy="51" r="1" />
        </g>
      )
    default:
      return null
  }
}

export function DrinkArtwork({ art, size = 44, className }: { art?: DrinkArt; size?: number; className?: string }) {
  const uid = useId().replace(/[:]/g, '')
  const a: DrinkArt = art ?? { style: 'latte', cup: 'cold', topping: 'ice' }
  const p = PALETTES[a.style] ?? PALETTES.latte
  const liquid = a.tint ?? p.liquid
  const liquid2 = a.tint ?? p.liquid2
  const clipId = 'clip' + uid
  const gradId = 'grad' + uid

  const gradient = (
    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={liquid} />
      <stop offset="100%" stopColor={liquid2} />
    </linearGradient>
  )

  if (a.cup === 'hot') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
        <defs>
          {gradient}
          <clipPath id={clipId}>
            <rect x="16" y="22" width="28" height="28" rx="8" />
          </clipPath>
        </defs>
        <path d="M44 28 q9 0 9 8 t-9 8" fill="none" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <rect x="16" y="22" width="28" height="28" rx="8" fill="#FFFFFF" />
        <g clipPath={'url(#' + clipId + ')'}>
          <rect x="16" y="22" width="28" height="28" fill={'url(#' + gradId + ')'} />
          {p.foam && <rect x="16" y="22" width="28" height="6.5" fill={p.foam} opacity="0.92" />}
          {a.topping === 'cream' && (
            <path d="M15 27 Q20 22 25 27 Q30 32 35 27 Q40 22 45 27" stroke="#FFFFFF" strokeWidth="3" fill="none" opacity="0.95" strokeLinecap="round" />
          )}
        </g>
        <rect x="16" y="22" width="28" height="28" rx="8" fill="none" stroke="#E2E8F0" strokeWidth="1.5" />
        <ellipse cx="30" cy="55" rx="17" ry="2.2" fill="#E2E8F0" opacity="0.75" />
      </svg>
    )
  }

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        {gradient}
        <clipPath id={clipId}>
          <path d="M19 17 H45 L41 54 Q40.7 56 38.6 56 H25.4 Q23.3 56 23 54 Z" />
        </clipPath>
      </defs>

      <path d="M38 3 L41.6 3 L38.6 17 L35 17 Z" fill="#94A3B8" />
      <rect x="16.5" y="11" width="31" height="6.5" rx="2.6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.4" />

      <path d="M19 17 H45 L41 54 Q40.7 56 38.6 56 H25.4 Q23.3 56 23 54 Z" fill="#F8FAFC" />

      <g clipPath={'url(#' + clipId + ')'}>
        <rect x="19" y="23" width="26" height="35" fill={'url(#' + gradId + ')'} />
        {p.foam && <rect x="19" y="23" width="26" height="6.5" fill={p.foam} opacity="0.92" />}
        <Toppings topping={a.topping} />
        <rect x="19" y="17" width="26" height="40" fill="#FFFFFF" opacity="0.12" />
      </g>

      <path d="M19 17 H45 L41 54 Q40.7 56 38.6 56 H25.4 Q23.3 56 23 54 Z" fill="none" stroke="#E2E8F0" strokeWidth="1.6" />
    </svg>
  )
}

export default DrinkArtwork
