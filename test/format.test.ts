/**
 * Presentation helpers. `formatClock` is only checked for shape because it
 * renders in the machine's timezone.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  currencySymbol,
  formatClock,
  formatMoney,
  formatPrice,
  splitDuration,
} from '../src/client/format.ts'

test('known currencies use their symbol and unknown ones keep the code', () => {
  assert.equal(currencySymbol('CNY'), '¥')
  assert.equal(currencySymbol('usd'), '$')
  assert.equal(currencySymbol('JPY'), 'JPY ')
})

test('money keeps two decimals and groups thousands', () => {
  assert.equal(formatMoney('1234.5', 'CNY'), '¥1,234.50')
  assert.equal(formatMoney('6.19', 'CNY'), '¥6.19')
  assert.equal(formatMoney('0', 'CNY'), '¥0.00')
})

test('tiny positive amounts stay visible instead of rounding to zero', () => {
  assert.equal(formatMoney('0.001', 'CNY'), '¥<0.01')
  assert.equal(formatMoney('0.01', 'CNY'), '¥0.01')
})

test('an unparseable balance renders a dash, never a zero', () => {
  assert.equal(formatMoney('', 'CNY'), '¥—')
  assert.equal(formatMoney('n/a', 'CNY'), '¥—')
})

test('prices drop trailing zeros but keep cents', () => {
  assert.equal(formatPrice(0.02), '0.02')
  assert.equal(formatPrice(1), '1')
  assert.equal(formatPrice(4.5), '4.5')
  assert.equal(formatPrice(Number.NaN), '—')
})

test('durations split into whole units and clamp negatives', () => {
  assert.deepEqual(splitDuration(0), { hours: 0, minutes: 0, seconds: 0 })
  assert.deepEqual(splitDuration(59_999), { hours: 0, minutes: 0, seconds: 59 })
  assert.deepEqual(splitDuration(90_000), { hours: 0, minutes: 1, seconds: 30 })
  assert.deepEqual(splitDuration(3_723_000), { hours: 1, minutes: 2, seconds: 3 })
  assert.deepEqual(splitDuration(-5), { hours: 0, minutes: 0, seconds: 0 })
})

test('clock rendering is a zero-padded HH:MM:SS', () => {
  assert.match(formatClock(0), /^\d{2}:\d{2}:\d{2}$/)
})
