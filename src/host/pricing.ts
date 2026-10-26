/**
 * Peak / off-peak pricing for the DeepSeek API.
 *
 * Prices are CNY per million tokens, `[off-peak, peak]`. Peak is charged
 * Monday–Friday 09:00–12:00 and 14:00–18:00 Beijing time, excluding Chinese
 * public holidays; every other hour — including weekends and holidays all day —
 * is off-peak. Peak is twice the off-peak rate, but both numbers are written out
 * so a future change to that ratio cannot silently break the table.
 *
 * Source: https://api-docs.deepseek.com/zh-cn/quick_start/pricing
 * Reviewed 2026-09-19. When the official page changes, update the table and
 * `PRICE_TABLE_VERSION` together, then bump the plugin version.
 */

/** Version stamp rendered in the panel so a stale table is visible to the user. */
export const PRICE_TABLE_VERSION = '2026-09-19'

export type PriceZone = 'peak' | 'off-peak'

export interface ModelPrice {
  /** API model id, as reported by the provider. */
  id: string
  /** Short label for the price table. */
  label: string
  /** Cache-hit input price, `[off-peak, peak]`. */
  hit: readonly [number, number]
  /** Cache-miss input price, `[off-peak, peak]`. */
  miss: readonly [number, number]
  /** Output price, `[off-peak, peak]`. */
  out: readonly [number, number]
}

export const MODELS: readonly ModelPrice[] = [
  {
    id: 'deepseek-flash',
    label: 'Flash',
    hit: [0.02, 0.04],
    miss: [1, 2],
    out: [4, 8],
  },
  {
    id: 'deepseek-v4-pro',
    label: 'Pro',
    hit: [0.15, 0.3],
    miss: [4.5, 9],
    out: [13.5, 27],
  },
]

/** Beijing time is a fixed UTC+8 offset: China has no daylight saving time. */
const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/** Peak windows as `[startHour, endHour)` in Beijing time. */
const PEAK_HOURS: readonly (readonly [number, number])[] = [
  [9, 12],
  [14, 18],
]

/**
 * Days that are public holidays in mainland China, i.e. the days the pricing
 * page excludes from peak hours. Only days off are listed: make-up working
 * weekends fall on Saturday/Sunday anyway, which are off-peak by rule.
 *
 * Source: 国办发明电〔2025〕7 号《关于 2026 年部分节假日安排的通知》.
 * A new year's schedule is published every November; add it here before the
 * first holiday of that year.
 */
const HOLIDAYS: ReadonlySet<string> = new Set([
  // 元旦
  '2026-01-01',
  '2026-01-02',
  '2026-01-03',
  // 春节
  '2026-02-15',
  '2026-02-16',
  '2026-02-17',
  '2026-02-18',
  '2026-02-19',
  '2026-02-20',
  '2026-02-21',
  '2026-02-22',
  '2026-02-23',
  // 清明
  '2026-04-04',
  '2026-04-05',
  '2026-04-06',
  // 劳动节
  '2026-05-01',
  '2026-05-02',
  '2026-05-03',
  '2026-05-04',
  '2026-05-05',
  // 端午
  '2026-06-19',
  '2026-06-20',
  '2026-06-21',
  // 中秋
  '2026-09-25',
  '2026-09-26',
  '2026-09-27',
  // 国庆
  '2026-10-01',
  '2026-10-02',
  '2026-10-03',
  '2026-10-04',
  '2026-10-05',
  '2026-10-06',
  '2026-10-07',
])

export interface BeijingClock {
  year: number
  /** 1–12. */
  month: number
  /** 1–31. */
  day: number
  /** 0–23. */
  hour: number
  /** 0 = Sunday. */
  weekday: number
  /** `YYYY-MM-DD` in Beijing time. */
  dayKey: string
}

/**
 * Split one instant into Beijing calendar fields.
 *
 * @param epochMs - milliseconds since the Unix epoch.
 */
export function beijingClock(epochMs: number): BeijingClock {
  const shifted = new Date(epochMs + BEIJING_OFFSET_MS)
  const year = shifted.getUTCFullYear()
  const month = shifted.getUTCMonth() + 1
  const day = shifted.getUTCDate()
  return {
    year,
    month,
    day,
    hour: shifted.getUTCHours(),
    weekday: shifted.getUTCDay(),
    dayKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  }
}

/**
 * Whether one instant is billed at the peak rate.
 *
 * @param epochMs - milliseconds since the Unix epoch.
 */
export function isPeakAt(epochMs: number): boolean {
  const clock = beijingClock(epochMs)
  if (clock.weekday === 0 || clock.weekday === 6) return false
  if (HOLIDAYS.has(clock.dayKey)) return false
  for (const [start, end] of PEAK_HOURS) {
    if (clock.hour >= start && clock.hour < end) return true
  }
  return false
}

/**
 * @param epochMs - milliseconds since the Unix epoch.
 * @returns the zone in effect at that instant.
 */
export function zoneAt(epochMs: number): PriceZone {
  return isPeakAt(epochMs) ? 'peak' : 'off-peak'
}

/**
 * First instant after `epochMs` whose zone differs from the current one.
 *
 * Zone only changes on a Beijing hour edge, so the scan only tests 00:00, 09:00,
 * 12:00, 14:00 and 18:00 over the next two weeks. Two weeks covers the longest
 * holiday, so `null` is only reachable with a broken table.
 *
 * @param epochMs - milliseconds since the Unix epoch.
 * @returns the next change in epoch milliseconds, or `null`.
 */
export function nextZoneChangeAt(epochMs: number): number | null {
  const current = isPeakAt(epochMs)
  // Midnight of the current Beijing day, expressed in epoch milliseconds.
  const dayStart = Math.floor((epochMs + BEIJING_OFFSET_MS) / DAY_MS) * DAY_MS - BEIJING_OFFSET_MS
  for (let day = 0; day <= 14; day += 1) {
    for (const hour of [0, 9, 12, 14, 18]) {
      const candidate = dayStart + day * DAY_MS + hour * 60 * 60 * 1000
      if (candidate <= epochMs) continue
      if (isPeakAt(candidate) !== current) return candidate
    }
  }
  return null
}
