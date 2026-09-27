/** US units and dollars for the screens. The contract itself is metric (m, m/s, cm). */

export const yards = (m: number) => `${Math.round(m * 1.09361)} yd`

export const mph = (mps: number) => `${(mps / 0.44704).toFixed(1)} mph`

/** 376 cm → 12' 4" */
export function feetInches(cm: number): string {
  if (cm <= 0) return `0' 0"`
  let inches = Math.round(cm / 2.54)
  const ft = Math.floor(inches / 12)
  inches -= ft * 12
  return `${ft}' ${inches}"`
}

/** Distance to the pin as a golfer reads it: feet and inches close in, yards once it is 10 yards or more. */
export const toPin = (cm: number) => (cm >= 914 ? `${Math.round(cm / 91.44)} yd` : feetInches(cm))

export const usd = (n: number) => `$${n.toLocaleString('en-US')}`

/** $50,000 → $50K, for tight spots. */
export const usdShort = (n: number) => (n >= 1000 ? `$${n / 1000}K` : `$${n}`)

export const rpm = (n: number) => `${Math.round(n).toLocaleString('en-US')} rpm`

export const deg = (n: number) => `${n.toFixed(1)}°`

export function clock(ms: number): string {
  const d = new Date(ms)
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export const LIE_LABEL: Record<string, string> = {
  cup: 'In the cup',
  green: 'On the green',
  fringe: 'On the fringe',
  approach: 'Short of the green',
  rough: 'In the rough',
  bunker: 'In the bunker',
  water: 'In the water',
}
