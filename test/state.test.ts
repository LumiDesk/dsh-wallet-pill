/**
 * Route contract and payload assembly. The balance reader and the clock are
 * pure inputs here, so no network or filesystem is touched.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  CREDENTIAL_KEY,
  ROUTE_PATH,
  buildState,
  endpointOf,
  name,
  wantsRefresh,
} from '../src/host/index.ts'

const ready = {
  status: 'ready' as const,
  wallet: { currency: 'CNY', total: '6.19', granted: '0.00', toppedUp: '6.19' },
  at: 1_000,
}

/** 2026-10-26 (Monday) 10:00 Beijing. */
const PEAK_NOW = Date.UTC(2026, 9, 26, 2, 0, 0)
/** Same Monday, 12:30 Beijing. */
const OFF_PEAK_NOW = Date.UTC(2026, 9, 26, 4, 30, 0)

test('route prefix, loader name and credential key are stable', () => {
  assert.equal(name, 'wallet-pill')
  assert.equal(ROUTE_PATH, '/wallet-pill')
  assert.equal(CREDENTIAL_KEY, 'DEEPSEEK_API_KEY')
})

test('endpointOf resolves one flat endpoint under the prefix', () => {
  assert.equal(endpointOf('/wallet-pill/status'), 'status')
  assert.equal(endpointOf('/wallet-pill/state'), 'state')
  assert.equal(endpointOf('/wallet-pill/state?refresh=1'), 'state')
})

test('endpointOf rejects everything that is not one flat endpoint', () => {
  assert.equal(endpointOf(undefined), undefined)
  assert.equal(endpointOf('/'), undefined)
  assert.equal(endpointOf('/wallet-pill'), undefined)
  assert.equal(endpointOf('/wallet-pill/'), undefined)
  assert.equal(endpointOf('/wallet-pill/a/b'), undefined)
  assert.equal(endpointOf('/other/status'), undefined)
})

test('only refresh=1 bypasses the cache', () => {
  assert.equal(wantsRefresh('/wallet-pill/state?refresh=1'), true)
  assert.equal(wantsRefresh('/wallet-pill/state?refresh=0'), false)
  assert.equal(wantsRefresh('/wallet-pill/state'), false)
  assert.equal(wantsRefresh(undefined), false)
})

test('a peak reading reports the peak zone and the next edge', () => {
  const payload = buildState(ready, PEAK_NOW)
  assert.equal(payload.ok, true)
  assert.equal(payload.value.pricing.zone, 'peak')
  assert.equal(payload.value.pricing.nextChangeAt, Date.UTC(2026, 9, 26, 4, 0, 0)) // 12:00 Beijing
  assert.equal(payload.value.balance, ready)
  assert.equal(payload.value.now, PEAK_NOW)
})

test('an off-peak reading reports the off-peak zone', () => {
  const payload = buildState(ready, OFF_PEAK_NOW)
  assert.equal(payload.value.pricing.zone, 'off-peak')
  assert.equal(payload.value.pricing.nextChangeAt, Date.UTC(2026, 9, 26, 6, 0, 0)) // 14:00 Beijing
})

test('pricing is served even when the balance cannot be read', () => {
  const payload = buildState({ status: 'no-key' }, PEAK_NOW)
  assert.deepEqual(payload.value.balance, { status: 'no-key' })
  assert.equal(payload.value.pricing.zone, 'peak')
  assert.equal(payload.value.pricing.models.length, 2)
  assert.equal(payload.value.pricing.currency, 'CNY')
})
