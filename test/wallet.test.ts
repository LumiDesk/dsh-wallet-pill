/**
 * Wallet selection: which DeepSeek route pays for the default model, when to
 * fall back to the other one, and how the per-source caches behave when the
 * provider flips. Both source readers are stubs; no network is touched.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { AccountClientMetadata } from '../src/host/account.ts'
import type { BalanceWallet, WalletReading } from '../src/host/balance.ts'
import { createWalletReader, sourceOfProvider } from '../src/host/wallet.ts'

const CLIENT: AccountClientMetadata = {
  version: '1.1.0',
  locale: 'zh-CN',
  timezoneOffsetSeconds: 28_800,
}

const ACCOUNT_WALLET: BalanceWallet = {
  currency: 'CNY',
  total: '12.34',
  granted: '2',
  toppedUp: '10.34',
}
const KEY_WALLET: BalanceWallet = { currency: 'CNY', total: '6.19', granted: '0', toppedUp: '6.19' }

const accountReady = (): WalletReading => ({ kind: 'ready', wallet: ACCOUNT_WALLET, at: 1 })
const keyReady = (): WalletReading => ({ kind: 'ready', wallet: KEY_WALLET, at: 1 })
const unavailable = (): WalletReading => ({ kind: 'unavailable' })
const failed = (code: string): WalletReading => ({ kind: 'error', code })

interface AccountStub {
  calls: AccountClientMetadata[]
  read(client: AccountClientMetadata): Promise<WalletReading>
}

interface KeyStub {
  readonly calls: number
  read(): Promise<WalletReading>
}

function accountStub(read: () => Promise<WalletReading>): AccountStub {
  const calls: AccountClientMetadata[] = []
  return {
    calls,
    read: async (client) => {
      calls.push(client)
      return read()
    },
  }
}

function keyStub(read: () => Promise<WalletReading>): KeyStub {
  let calls = 0
  return {
    get calls(): number {
      return calls
    },
    read: async () => {
      calls += 1
      return read()
    },
  }
}

interface BuildOptions {
  account?: () => Promise<WalletReading>
  apiKey?: () => Promise<WalletReading>
  provider?: () => string | undefined
  now?: () => number
  ttlMs?: number
  accountTimeoutMs?: number
}

function build(options: BuildOptions = {}) {
  const account = accountStub(options.account ?? (async () => unavailable()))
  const apiKey = keyStub(options.apiKey ?? (async () => unavailable()))
  const reader = createWalletReader({
    account,
    apiKey,
    provider: options.provider,
    now: options.now,
    ttlMs: options.ttlMs,
    accountTimeoutMs: options.accountTimeoutMs,
  })
  return { reader, account, apiKey }
}

test('provider ids map to their wallet route', () => {
  assert.equal(sourceOfProvider('deepseek-account'), 'account')
  assert.equal(sourceOfProvider('deepseek-official'), 'api-key')
  assert.equal(sourceOfProvider('some-custom-provider'), undefined)
  assert.equal(sourceOfProvider(undefined), undefined)
})

test('the account provider reads the account wallet only', async () => {
  const { reader, account, apiKey } = build({
    account: async () => accountReady(),
    apiKey: async () => keyReady(),
    provider: () => 'deepseek-account',
  })
  assert.deepEqual(await reader.read({ client: CLIENT }), {
    status: 'ready',
    source: 'account',
    wallet: ACCOUNT_WALLET,
    at: 1,
  })
  assert.equal(account.calls.length, 1)
  assert.equal(apiKey.calls, 0)
})

test('the official provider reads the API-key wallet only', async () => {
  const { reader, account, apiKey } = build({
    account: async () => accountReady(),
    apiKey: async () => keyReady(),
    provider: () => 'deepseek-official',
  })
  assert.deepEqual(await reader.read({ client: CLIENT }), {
    status: 'ready',
    source: 'api-key',
    wallet: KEY_WALLET,
    at: 1,
  })
  assert.equal(account.calls.length, 0)
  assert.equal(apiKey.calls, 1)
})

test('an unknown provider keeps the account wallet first', async () => {
  const { reader, account } = build({
    account: async () => accountReady(),
    apiKey: async () => keyReady(),
    provider: () => 'some-custom-provider',
  })
  assert.equal((await reader.read({ client: CLIENT })).status, 'ready')
  const state = await reader.read({ client: CLIENT })
  assert.equal(state.status === 'ready' ? state.source : undefined, 'account')
  assert.equal(account.calls.length, 1, 'the second read is served from the account cache')
})

test('a signed-out account falls back to the API key', async () => {
  const { reader, apiKey } = build({
    account: async () => unavailable(),
    apiKey: async () => keyReady(),
    provider: () => 'deepseek-account',
  })
  assert.deepEqual(await reader.read({ client: CLIENT }), {
    status: 'ready',
    source: 'api-key',
    wallet: KEY_WALLET,
    at: 1,
  })
  assert.equal(apiKey.calls, 1)
})

test('a missing API key falls back to a signed-in account', async () => {
  const { reader } = build({
    account: async () => accountReady(),
    apiKey: async () => unavailable(),
    provider: () => 'deepseek-official',
  })
  assert.deepEqual(await reader.read({ client: CLIENT }), {
    status: 'ready',
    source: 'account',
    wallet: ACCOUNT_WALLET,
    at: 1,
  })
})

test('a failing preferred route does not silently switch wallets', async () => {
  const { reader, account } = build({
    account: async () => accountReady(),
    apiKey: async () => failed('network'),
    provider: () => 'deepseek-official',
  })
  assert.deepEqual(await reader.read({ client: CLIENT }), {
    status: 'error',
    source: 'api-key',
    code: 'network',
  })
  assert.equal(account.calls.length, 0)
})

test('an account failure stays an account error even when a key exists', async () => {
  const { reader, apiKey } = build({
    account: async () => failed('account-unavailable'),
    apiKey: async () => keyReady(),
    provider: () => 'deepseek-account',
  })
  assert.deepEqual(await reader.read({ client: CLIENT }), {
    status: 'error',
    source: 'account',
    code: 'account-unavailable',
  })
  assert.equal(apiKey.calls, 0)
})

test('neither route configured leaves the pill unconfigured', async () => {
  const { reader } = build({
    account: async () => unavailable(),
    apiKey: async () => unavailable(),
  })
  assert.deepEqual(await reader.read({ client: CLIENT }), { status: 'unconfigured' })
})

test('reads reuse the per-source cache until it expires or a refresh forces it', async () => {
  let clock = 0
  const { reader, account } = build({
    account: async () => accountReady(),
    provider: () => 'deepseek-account',
    now: () => clock,
    ttlMs: 1_000,
  })

  await reader.read({ client: CLIENT })
  await reader.read({ client: CLIENT })
  assert.equal(account.calls.length, 1, 'a second read inside the TTL is served from cache')

  await reader.read({ client: CLIENT, force: true })
  assert.equal(account.calls.length, 2, 'a forced read goes to the source again')

  clock = 1_000
  await reader.read({ client: CLIENT })
  assert.equal(account.calls.length, 3, 'the TTL expired')
})

test('each source keeps its own cache across provider flips', async () => {
  let provider = 'deepseek-account'
  const { reader, account, apiKey } = build({
    account: async () => accountReady(),
    apiKey: async () => keyReady(),
    provider: () => provider,
  })

  await reader.read({ client: CLIENT })
  provider = 'deepseek-official'
  const official = await reader.read({ client: CLIENT })
  provider = 'deepseek-account'
  const back = await reader.read({ client: CLIENT })

  assert.equal(official.status === 'ready' ? official.source : undefined, 'api-key')
  assert.equal(back.status === 'ready' ? back.source : undefined, 'account')
  assert.equal(account.calls.length, 1, 'the account wallet was not refetched')
  assert.equal(apiKey.calls, 1)
})

test('concurrent reads share one request per source', async () => {
  let release!: (reading: WalletReading) => void
  const gate = new Promise<WalletReading>((resolve) => {
    release = resolve
  })
  const { reader, account } = build({
    account: () => gate,
    provider: () => 'deepseek-account',
  })

  const first = reader.read({ client: CLIENT })
  const second = reader.read({ client: CLIENT })
  release(accountReady())
  const [a, b] = await Promise.all([first, second])

  assert.equal(account.calls.length, 1)
  assert.equal(a.status, 'ready')
  assert.equal(b.status, 'ready')
})

test('the browser identity reaches the account reader', async () => {
  const { reader, account } = build({
    account: async () => accountReady(),
    provider: () => 'deepseek-account',
  })
  await reader.read({ client: CLIENT })
  assert.deepEqual(account.calls, [CLIENT])
})

test('a slow account read yields one soft timeout instead of holding the dock', async () => {
  const { reader, apiKey } = build({
    account: () => new Promise<WalletReading>(() => undefined),
    apiKey: async () => keyReady(),
    provider: () => 'deepseek-account',
    accountTimeoutMs: 5,
  })
  assert.deepEqual(await reader.read({ client: CLIENT }), {
    status: 'error',
    source: 'account',
    code: 'account-timeout',
  })
  assert.equal(apiKey.calls, 0, 'a timeout is not a missing credential')
})
