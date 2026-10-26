/**
 * Presentation helpers. Pure functions only, so the unit tests can cover them
 * without a DOM.
 */

const SYMBOLS: Record<string, string> = {
  CNY: '¥',
  USD: '$',
}

/**
 * @param currency - ISO code reported by the provider.
 * @returns the display symbol, falling back to the code plus a space.
 */
export function currencySymbol(currency: string): string {
  const code = currency.toUpperCase()
  return SYMBOLS[code] ?? `${code} `
}

/**
 * Format a decimal balance string for display.
 *
 * @param value - decimal string exactly as the provider reported it.
 * @param currency - ISO code; unknown codes render in front of the number.
 * @returns two decimals with thousands grouping, `<0.01` for tiny positives,
 *   or a dash when the value is not parseable.
 */
export function formatMoney(value: string, currency: string): string {
  const trimmed = value.trim()
  const amount = trimmed === '' ? Number.NaN : Number(trimmed)
  const symbol = currencySymbol(currency)
  if (!Number.isFinite(amount)) return `${symbol}—`
  if (amount > 0 && amount < 0.01) return `${symbol}<0.01`
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * @param value - a price in CNY per million tokens.
 * @returns the number without trailing zeros, e.g. `0.02`, `1`, `4.5`.
 */
export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export interface DurationParts {
  hours: number
  minutes: number
  seconds: number
}

/**
 * Split a positive duration into whole hours, minutes and seconds.
 *
 * @param ms - milliseconds; negative input clamps to zero.
 */
export function splitDuration(ms: number): DurationParts {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

/**
 * @param epochMs - epoch milliseconds.
 * @returns `HH:MM:SS` in the browser's own timezone.
 */
export function formatClock(epochMs: number): string {
  const date = new Date(epochMs)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
