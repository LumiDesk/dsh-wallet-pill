/**
 * Route constants and payload assembly. The wallet reading and the clock are
 * pure inputs here, so no credential store, network or filesystem is touched.
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
import type { BalanceState } from '../src/host/wallet.ts'

const ready: BalanceState = {
  status: 'ready',
  source: 'api-key',
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
  assert.deepEqual(payload.value.balance, ready)
  assert.equal(payload.value.now, PEAK_NOW)
})

test('an off-peak reading reports the off-peak zone', () => {
  const payload = buildState(ready, OFF_PEAK_NOW)
  assert.equal(payload.value.pricing.zone, 'off-peak')
  assert.equal(payload.value.pricing.nextChangeAt, Date.UTC(2026, 9, 26, 6, 0, 0)) // 14:00 Beijing
})

test('pricing is served even when no wallet is configured', () => {
  const payload = buildState({ status: 'unconfigured' }, PEAK_NOW)
  assert.deepEqual(payload.value.balance, { status: 'unconfigured' })
  assert.equal(payload.value.pricing.zone, 'peak')
  assert.equal(payload.value.pricing.models.length, 2)
  assert.equal(payload.value.pricing.currency, 'CNY')
})

test('the account source travels with the reading', () => {
  const account: BalanceState = {
    status: 'ready',
    source: 'account',
    wallet: { currency: 'CNY', total: '12.34', granted: '2', toppedUp: '10.34' },
    at: 2_000,
  }
  assert.equal(buildState(account, PEAK_NOW).value.balance.status, 'ready')
  const payload = buildState(account, PEAK_NOW)
  assert.equal(
    payload.value.balance.status === 'ready' ? payload.value.balance.source : '',
    'account',
  )
})
