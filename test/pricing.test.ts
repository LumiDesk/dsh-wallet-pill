/**
 * Peak / off-peak pricing rules. Every case pins an explicit Beijing timestamp
 * so the suite cannot depend on the machine's timezone.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  MODELS,
  PRICE_TABLE_VERSION,
  beijingClock,
  isPeakAt,
  nextZoneChangeAt,
  zoneAt,
} from '../src/host/pricing.ts'

/** 2026-10-26 (Monday) at the given Beijing hour. */
function beijing(hour: number, minute = 0, dayOffset = 0): number {
  return Date.UTC(2026, 9, 26 + dayOffset, hour - 8, minute, 0)
}

test('beijingClock reports calendar fields in UTC+8', () => {
  const clock = beijingClock(beijing(0))
  assert.equal(clock.dayKey, '2026-10-26')
  assert.equal(clock.hour, 0)
  assert.equal(clock.weekday, 1, '2026-10-26 is a Monday')
})

test('weekday peak windows are 09:00–12:00 and 14:00–18:00', () => {
  assert.equal(zoneAt(beijing(8, 59)), 'off-peak')
  assert.equal(zoneAt(beijing(9, 0)), 'peak')
  assert.equal(zoneAt(beijing(11, 59)), 'peak')
  assert.equal(zoneAt(beijing(12, 0)), 'off-peak')
  assert.equal(zoneAt(beijing(13, 59)), 'off-peak')
  assert.equal(zoneAt(beijing(14, 0)), 'peak')
  assert.equal(zoneAt(beijing(17, 59)), 'peak')
  assert.equal(zoneAt(beijing(18, 0)), 'off-peak')
})

test('weekends are off-peak all day', () => {
  // 2026-10-31 is a Saturday, 2026-11-01 a Sunday.
  assert.equal(isPeakAt(beijing(10, 0, 5)), false)
  assert.equal(isPeakAt(beijing(15, 0, 6)), false)
})

test('public holidays are off-peak all day', () => {
  // 2026-10-01 (Thursday) is a National Day holiday.
  const nationalDay = Date.UTC(2026, 9, 1, 2, 0, 0) // 10:00 Beijing
  assert.equal(beijingClock(nationalDay).dayKey, '2026-10-01')
  assert.equal(isPeakAt(nationalDay), false)
  // A normal weekday outside the holiday break is peak again.
  assert.equal(isPeakAt(beijing(10, 0, 3)), true)
})

test('the next change is the following zone edge', () => {
  assert.equal(nextZoneChangeAt(beijing(8, 59)), beijing(9, 0))
  assert.equal(nextZoneChangeAt(beijing(9, 0)), beijing(12, 0))
  assert.equal(nextZoneChangeAt(beijing(12, 30)), beijing(14, 0))
  assert.equal(nextZoneChangeAt(beijing(17, 59)), beijing(18, 0))
  // 18:00 Friday → next edge is Monday 09:00 (weekend is off-peak throughout).
  assert.equal(nextZoneChangeAt(beijing(18, 0, 4)), beijing(9, 0, 7))
})

test('the next change skips a holiday Friday', () => {
  // 2026-10-02 (Friday) is a holiday: after Thursday 18:00 the next peak edge is
  // Monday 2026-10-05 — which is still inside the National Day break — so the
  // first peak instant is Thursday 2026-10-08 09:00.
  const fridayEvening = Date.UTC(2026, 9, 1, 10, 0, 0) // 2026-10-01 18:00 Beijing
  assert.equal(nextZoneChangeAt(fridayEvening), Date.UTC(2026, 9, 8, 1, 0, 0))
})

test('price table stays well formed', () => {
  assert.equal(MODELS.length, 2)
  for (const model of MODELS) {
    assert.ok(model.id.length > 0)
    for (const bucket of [model.hit, model.miss, model.out]) {
      assert.equal(bucket.length, 2)
      assert.ok(bucket[1] >= bucket[0], `${model.id}: peak must not be cheaper than off-peak`)
    }
  }
  assert.equal(PRICE_TABLE_VERSION, '2026-09-19')
})
