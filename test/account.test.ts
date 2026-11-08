/**
 * Account wallet reader: Platform's per-currency wallet lists projected onto the
 * pill's single wallet, and the failure mapping the route depends on. Every case
 * injects the service, so no credential store or network is touched.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  accountWallet,
  createAccountReader,
  type AccountBalanceLike,
  type AccountClientMetadata,
  type AccountResultLike,
  type AccountServiceLike,
  type AccountWalletLike,
} from '../src/host/account.ts'

const CLIENT: AccountClientMetadata = {
  version: '1.1.0',
  locale: 'zh-CN',
  timezoneOffsetSeconds: 28_800,
}

function balance(
  recharge: readonly AccountWalletLike[],
  granted: readonly AccountWalletLike[] = [],
): AccountBalanceLike {
  return { status: 'ready', value: recharge, bonusWallets: granted }
}

function service(
  result: AccountResultLike | null | (() => Promise<AccountResultLike | null>),
  status: 'signed-out' | 'credential-stored' = 'credential-stored',
): AccountServiceLike {
  return {
    getState: async () => ({ status }),
    getBalance: async () => (typeof result === 'function' ? result() : result),
  }
}

test('a funded CNY wallet wins over another currency', () => {
  const wallet = accountWallet(
    balance([
      { currency: 'USD', balance: '3.50' },
      { currency: 'CNY', balance: '6.19' },
    ]),
  )
  assert.deepEqual(wallet, { currency: 'CNY', total: '6.19', granted: '0', toppedUp: '6.19' })
})

test('granted wallets add to the total and stay a separate line', () => {
  const wallet = accountWallet(
    balance([{ currency: 'CNY', balance: '5.19' }], [{ currency: 'CNY', balance: '1.00' }]),
  )
  assert.deepEqual(wallet, { currency: 'CNY', total: '6.19', granted: '1', toppedUp: '5.19' })
})

test('a granted-only account still counts as funded', () => {
  const wallet = accountWallet(balance([], [{ currency: 'CNY', balance: '2.00' }]))
  assert.deepEqual(wallet, { currency: 'CNY', total: '2', granted: '2', toppedUp: '0' })
})

test('several wallets in one currency are summed', () => {
  const wallet = accountWallet(
    balance(
      [
        { currency: 'CNY', balance: '1.10' },
        { currency: 'CNY', balance: '2.20' },
      ],
      [{ currency: 'CNY', balance: '0.30' }],
    ),
  )
  assert.equal(wallet?.total, '3.6')
  assert.equal(wallet?.toppedUp, '3.3')
  assert.equal(wallet?.granted, '0.3')
})

test('a zero-balance wallet is valid and renders zero', () => {
  const wallet = accountWallet(balance([{ currency: 'CNY', balance: '0.00' }]))
  assert.deepEqual(wallet, { currency: 'CNY', total: '0', granted: '0', toppedUp: '0' })
})

test('scientific notation and trailing zeros survive projection', () => {
  const wallet = accountWallet(
    balance([
      { currency: 'CNY', balance: '5.0000000000000000' },
      { currency: 'CNY', balance: '0E-16' },
    ]),
  )
  assert.equal(wallet?.total, '5')
  assert.equal(wallet?.toppedUp, '5')
  assert.equal(wallet?.granted, '0')
})

test('a funded foreign wallet beats an empty CNY wallet', () => {
  const wallet = accountWallet(
    balance([
      { currency: 'CNY', balance: '0.00' },
      { currency: 'USD', balance: '3.50' },
    ]),
  )
  assert.equal(wallet?.currency, 'USD')
})

test('wallets with unparseable amounts are skipped', () => {
  const wallet = accountWallet(
    balance([
      { currency: 'CNY', balance: '' },
      { currency: 'usd', balance: '1.00' },
    ]),
  )
  assert.deepEqual(wallet, { currency: 'USD', total: '1', granted: '0', toppedUp: '1' })
})

test('a payload without any valid wallet is malformed, not zero', () => {
  assert.equal(accountWallet(balance([{ currency: 'CNY', balance: 'n/a' }])), undefined)
})

test('a composition without the account service reports the route unavailable', async () => {
  const reader = createAccountReader({ service: () => undefined })
  assert.deepEqual(await reader.read(CLIENT), { kind: 'unavailable' })
})

test('a signed-out account reports the route unavailable', async () => {
  let calls = 0
  const reader = createAccountReader({
    service: () => ({
      getState: async () => ({ status: 'signed-out' }),
      getBalance: async () => {
        calls += 1
        return balance([{ currency: 'CNY', balance: '1.00' }])
      },
    }),
  })
  assert.deepEqual(await reader.read(CLIENT), { kind: 'unavailable' })
  assert.equal(calls, 0, 'a signed-out account never reaches Platform')
})

test('a credential-store failure is an account error', async () => {
  const reader = createAccountReader({
    service: () => ({
      getState: async () => {
        throw new Error('store offline')
      },
      getBalance: async () => null,
    }),
  })
  assert.deepEqual(await reader.read(CLIENT), { kind: 'error', code: 'account-storage' })
})

test('a grant that disappears mid-flight is unavailable, not an error', async () => {
  const reader = createAccountReader({ service: () => service(null) })
  assert.deepEqual(await reader.read(CLIENT), { kind: 'unavailable' })
})

test('a failed Platform query is an account error', async () => {
  const reader = createAccountReader({ service: () => service({ status: 'failed' }) })
  assert.deepEqual(await reader.read(CLIENT), { kind: 'error', code: 'account-unavailable' })
})

test('a provider error carries its safe code', async () => {
  const reader = createAccountReader({
    service: () =>
      service(async () => {
        throw Object.assign(new Error('account: network'), { code: 'network' })
      }),
  })
  assert.deepEqual(await reader.read(CLIENT), { kind: 'error', code: 'account-network' })
})

test('an uncoded provider error falls back to a generic account code', async () => {
  const reader = createAccountReader({
    service: () =>
      service(async () => {
        throw new Error('boom')
      }),
  })
  assert.deepEqual(await reader.read(CLIENT), { kind: 'error', code: 'account-failed' })
})

test('a ready read returns the projected wallet and forwards the caller identity', async () => {
  const seen: AccountClientMetadata[] = []
  const reader = createAccountReader({
    now: () => 1_000,
    service: () => ({
      getState: async () => ({ status: 'credential-stored' }),
      getBalance: async (client) => {
        seen.push(client)
        return balance(
          [{ currency: 'CNY', balance: '12.34' }],
          [{ currency: 'CNY', balance: '1.00' }],
        )
      },
    }),
  })
  assert.deepEqual(await reader.read(CLIENT), {
    kind: 'ready',
    wallet: { currency: 'CNY', total: '13.34', granted: '1', toppedUp: '12.34' },
    at: 1_000,
  })
  assert.deepEqual(seen, [CLIENT])
})

test('a ready payload without wallets is malformed', async () => {
  const reader = createAccountReader({ service: () => service(balance([])) })
  assert.deepEqual(await reader.read(CLIENT), { kind: 'error', code: 'account-malformed' })
})
