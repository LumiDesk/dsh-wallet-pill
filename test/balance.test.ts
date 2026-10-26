/**
 * Balance reader: picking, caching and failure mapping. Every case uses an
 * injected fetch and clock, so nothing here can hit the network.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  createBalanceReader,
  pickWallet,
  type BalanceResponseLike,
  type FetchLike,
} from '../src/host/balance.ts'

function response(status: number, body: unknown): BalanceResponseLike {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

function payload(wallets: Array<Record<string, string>>): unknown {
  return { is_available: true, balance_infos: wallets }
}

test('no configured key never calls the endpoint', async () => {
  let calls = 0
  const reader = createBalanceReader({
    resolveKey: async () => undefined,
    fetchImpl: async () => {
      calls += 1
      return response(200, payload([]))
    },
  })
  assert.deepEqual(await reader.read(), { status: 'no-key' })
  assert.equal(calls, 0)
})

test('a throwing credential store counts as no key', async () => {
  const reader = createBalanceReader({
    resolveKey: async () => {
      throw new Error('store offline')
    },
    fetchImpl: async () => response(200, payload([])),
  })
  assert.deepEqual(await reader.read(), { status: 'no-key' })
})

test('the funded CNY wallet wins over another currency', () => {
  const wallet = pickWallet(
    payload([
      { currency: 'USD', total_balance: '3.50', granted_balance: '0', topped_up_balance: '3.50' },
      {
        currency: 'CNY',
        total_balance: '6.19',
        granted_balance: '1.00',
        topped_up_balance: '5.19',
      },
    ]),
  )
  assert.deepEqual(wallet, { currency: 'CNY', total: '6.19', granted: '1.00', toppedUp: '5.19' })
})

test('a funded wallet beats an empty CNY wallet', () => {
  const wallet = pickWallet(
    payload([
      { currency: 'CNY', total_balance: '0.00' },
      { currency: 'USD', total_balance: '3.50' },
    ]),
  )
  assert.equal(wallet?.currency, 'USD')
})

test('wallets with unparseable numbers are skipped', () => {
  const wallet = pickWallet(
    payload([
      { currency: 'CNY', total_balance: 'not-a-number' },
      { currency: 'USD', total_balance: '1.00' },
    ]),
  )
  assert.equal(wallet?.currency, 'USD')
})

test('a ready read returns the wallet and the observation time', async () => {
  const reader = createBalanceReader({
    resolveKey: async () => 'sk-test',
    now: () => 1_000,
    fetchImpl: async () =>
      response(
        200,
        payload([
          {
            currency: 'CNY',
            total_balance: '12.34',
            granted_balance: '2.00',
            topped_up_balance: '10.34',
          },
        ]),
      ),
  })
  assert.deepEqual(await reader.read(), {
    status: 'ready',
    wallet: { currency: 'CNY', total: '12.34', granted: '2.00', toppedUp: '10.34' },
    at: 1_000,
  })
})

test('the Bearer header carries the resolved key', async () => {
  let seen: { url: string; authorization?: string } | undefined
  const fetchImpl: FetchLike = async (url, init) => {
    seen = { url, authorization: init.headers.authorization }
    return response(200, payload([{ currency: 'CNY', total_balance: '1.00' }]))
  }
  const reader = createBalanceReader({ resolveKey: async () => 'sk-secret', fetchImpl })
  await reader.read()
  assert.equal(seen?.authorization, 'Bearer sk-secret')
  assert.equal(seen?.url, 'https://api.deepseek.com/user/balance')
})

test('an HTTP failure maps to its status code', async () => {
  const reader = createBalanceReader({
    resolveKey: async () => 'sk-test',
    fetchImpl: async () => response(401, { error: 'unauthorized' }),
  })
  assert.deepEqual(await reader.read(), { status: 'error', code: 'http-401' })
})

test('a timeout is reported separately from a network error', async () => {
  const timeout = createBalanceReader({
    resolveKey: async () => 'sk-test',
    fetchImpl: async () => {
      const error = new Error('aborted')
      error.name = 'TimeoutError'
      throw error
    },
  })
  assert.deepEqual(await timeout.read(), { status: 'error', code: 'timeout' })

  const offline = createBalanceReader({
    resolveKey: async () => 'sk-test',
    fetchImpl: async () => {
      throw new Error('ECONNREFUSED')
    },
  })
  assert.deepEqual(await offline.read(), { status: 'error', code: 'network' })
})

test('a body without wallets is malformed, not a zero balance', async () => {
  const empty = createBalanceReader({
    resolveKey: async () => 'sk-test',
    fetchImpl: async () => response(200, payload([])),
  })
  assert.deepEqual(await empty.read(), { status: 'error', code: 'malformed' })

  const notJson = createBalanceReader({
    resolveKey: async () => 'sk-test',
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('unexpected token')
      },
    }),
  })
  assert.deepEqual(await notJson.read(), { status: 'error', code: 'malformed' })
})

test('reads reuse the cache, force bypasses it, and the TTL expires', async () => {
  let calls = 0
  let clock = 1_000
  const reader = createBalanceReader({
    resolveKey: async () => 'sk-test',
    now: () => clock,
    ttlMs: 60_000,
    fetchImpl: async () => {
      calls += 1
      return response(200, payload([{ currency: 'CNY', total_balance: String(calls) }]))
    },
  })

  assert.equal((await reader.read()).status, 'ready')
  assert.equal((await reader.read()).status, 'ready')
  assert.equal(calls, 1, 'a second read inside the TTL is served from cache')

  await reader.read(true)
  assert.equal(calls, 2, 'force reads again')

  clock += 60_000
  await reader.read()
  assert.equal(calls, 3, 'the TTL expired')
})
