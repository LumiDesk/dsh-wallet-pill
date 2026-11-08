/**
 * The pill's one balance reading, assembled from two wallet routes.
 *
 * DeepSeek bills through whichever route the current model uses:
 *
 * - `deepseek-account` — the browser sign-in wallet, read through the Host-only
 *   `deepseekAccount` service;
 * - `deepseek-official` — the `DEEPSEEK_API_KEY` wallet.
 *
 * The default model selection decides which one the pill shows, with the other
 * as a fallback only when the preferred route has no credential at all. A route
 * that has a credential but fails stays an error: silently swapping wallets
 * would show a balance the user is not spending.
 *
 * Caching is per source, so switching the provider back and forth does not
 * serve one wallet's number under the other's label. Concurrent reads of the
 * same source share one request; `?refresh=1` bypasses both.
 */
import type { AccountClientMetadata } from './account.ts'
import type { BalanceWallet, WalletReading } from './balance.ts'

export type WalletSource = 'account' | 'api-key'

export type BalanceState =
  | { status: 'ready'; source: WalletSource; wallet: BalanceWallet; at: number }
  /** Neither route has a credential: there is nothing to show or press. */
  | { status: 'unconfigured' }
  | { status: 'error'; source: WalletSource; code: string }

export interface WalletReadInput {
  /** Skip this source's cache (the panel's refresh button). */
  force?: boolean
  /** Identity of the browser UI, forwarded to Platform for account reads. */
  client: AccountClientMetadata
}

export interface WalletReader {
  read(input: WalletReadInput): Promise<BalanceState>
}

export interface WalletReaderDeps {
  account: { read(client: AccountClientMetadata): Promise<WalletReading> }
  apiKey: { read(): Promise<WalletReading> }
  /** Provider id of the current default model, or `undefined` when unknown. */
  provider?: () => string | undefined
  /** Injectable clock, in epoch milliseconds. */
  now?: () => number
  ttlMs?: number
  /** Soft deadline for one account read; the Platform call itself keeps running. */
  accountTimeoutMs?: number
}

const DEFAULT_TTL_MS = 60_000
const DEFAULT_ACCOUNT_TIMEOUT_MS = 8_000

/**
 * Map a model provider id to the wallet that pays for it.
 *
 * @param provider - `ModelSelection.provider` from the default model service.
 * @returns the wallet route, or `undefined` for any other provider.
 */
export function sourceOfProvider(provider: string | undefined): WalletSource | undefined {
  if (provider === 'deepseek-account') return 'account'
  if (provider === 'deepseek-official') return 'api-key'
  return undefined
}

/** Settle a read within a deadline without cancelling the underlying call. */
function bounded(
  reading: Promise<WalletReading>,
  ms: number,
  code: string,
): Promise<WalletReading> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ kind: 'error', code }), ms)
    void reading.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      () => {
        clearTimeout(timer)
        resolve({ kind: 'error', code })
      },
    )
  })
}

/**
 * Build the reader. Both source readers are expected to resolve rather than
 * throw; a rejection is still mapped to a stable code so one bad source cannot
 * take the route down.
 */
export function createWalletReader(deps: WalletReaderDeps): WalletReader {
  const now = deps.now ?? Date.now
  const ttlMs = deps.ttlMs ?? DEFAULT_TTL_MS
  const accountTimeoutMs = deps.accountTimeoutMs ?? DEFAULT_ACCOUNT_TIMEOUT_MS
  const cache = new Map<WalletSource, { at: number; reading: WalletReading }>()
  const inflight = new Map<WalletSource, Promise<WalletReading>>()

  /** Read one source through its cache, folding concurrent callers onto one request. */
  function load(
    source: WalletSource,
    client: AccountClientMetadata,
    force: boolean,
  ): Promise<WalletReading> {
    const cached = cache.get(source)
    if (!force && cached !== undefined && now() - cached.at < ttlMs) {
      return Promise.resolve(cached.reading)
    }
    const pending = inflight.get(source)
    if (!force && pending !== undefined) return pending

    const live = source === 'account' ? deps.account.read(client) : deps.apiKey.read()
    const request = live.then(
      (reading) => {
        // "Unavailable" is a local credential lookup; caching it would keep the
        // pill dark for a minute after the user signs in or stores a key.
        if (reading.kind !== 'unavailable') cache.set(source, { at: now(), reading })
        return reading
      },
      (): WalletReading => ({
        kind: 'error',
        code: source === 'account' ? 'account-failed' : 'network',
      }),
    )
    inflight.set(source, request)
    void request.finally(() => {
      if (inflight.get(source) === request) inflight.delete(source)
    })
    return request
  }

  function readSource(
    source: WalletSource,
    client: AccountClientMetadata,
    force: boolean,
  ): Promise<WalletReading> {
    const reading = load(source, client, force)
    // Platform's own balance timeout is 30 s; the pill should not hold the dock
    // that long. The late result still lands in the cache for the next poll.
    return source === 'account' ? bounded(reading, accountTimeoutMs, 'account-timeout') : reading
  }

  return {
    async read({ force = false, client }: WalletReadInput): Promise<BalanceState> {
      const preferred = sourceOfProvider(deps.provider?.())
      const order: readonly WalletSource[] =
        preferred === 'api-key' ? ['api-key', 'account'] : ['account', 'api-key']

      for (const source of order) {
        const reading = await readSource(source, client, force)
        if (reading.kind === 'unavailable') continue
        if (reading.kind === 'error') return { status: 'error', source, code: reading.code }
        return { status: 'ready', source, wallet: reading.wallet, at: reading.at }
      }
      return { status: 'unconfigured' }
    },
  }
}
