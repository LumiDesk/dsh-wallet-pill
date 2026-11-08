/**
 * Account balance for one DeepSeek API key.
 *
 * This is the API-key route only: the key comes from the Host credential seam
 * and never leaves the process, and the browser sees the aggregated numbers
 * through this plugin's own route. The one-minute cache and request folding
 * live one layer up in `wallet.ts`, because they are shared with the account
 * route.
 *
 * Endpoint: GET https://api.deepseek.com/user/balance
 * Response: { is_available, balance_infos: [{ currency, total_balance,
 *             granted_balance, topped_up_balance }] }
 */

export interface BalanceWallet {
  /** ISO currency code reported by the provider, e.g. `CNY`. */
  currency: string
  /** Total balance as a decimal string, already summed by the provider. */
  total: string
  /** Part of `total` that came from grants. */
  granted: string
  /** Part of `total` that was topped up. */
  toppedUp: string
}

/** What one wallet source reports before the reader picks a source. */
export type WalletReading =
  | { kind: 'ready'; wallet: BalanceWallet; at: number }
  /** No credential for this route: signed out, or no API key configured. */
  | { kind: 'unavailable' }
  | { kind: 'error'; code: string }

/** Minimal response shape, so tests can pass a plain object. */
export interface BalanceResponseLike {
  ok: boolean
  status: number
  json(): Promise<unknown>
}

export type FetchLike = (
  url: string,
  init: { headers: Record<string, string>; signal?: AbortSignal },
) => Promise<BalanceResponseLike>

export interface ApiKeyReaderDeps {
  /** Resolve the API key, or `undefined` when none is configured. */
  resolveKey: () => Promise<string | undefined>
  fetchImpl?: FetchLike
  /** Injectable clock, in epoch milliseconds. */
  now?: () => number
  endpoint?: string
  timeoutMs?: number
}

export interface ApiKeyReader {
  /** One live read; the caller owns caching and request folding. */
  read(): Promise<WalletReading>
}

const DEFAULT_ENDPOINT = 'https://api.deepseek.com/user/balance'
const DEFAULT_TIMEOUT_MS = 8_000

interface RawWallet {
  currency?: unknown
  total_balance?: unknown
  granted_balance?: unknown
  topped_up_balance?: unknown
}

function decimal(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined
  return Number.isFinite(Number(trimmed)) ? trimmed : undefined
}

function currencyOf(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const code = value.trim().toUpperCase()
  return /^[A-Z]{3}$/.test(code) ? code : undefined
}

function toWallet(raw: RawWallet): BalanceWallet | undefined {
  const currency = currencyOf(raw.currency)
  const total = decimal(raw.total_balance)
  if (currency === undefined || total === undefined) return undefined
  return {
    currency,
    total,
    granted: decimal(raw.granted_balance) ?? '0',
    toppedUp: decimal(raw.topped_up_balance) ?? '0',
  }
}

/**
 * Pick the wallet a single-number pill should show: a funded CNY wallet first,
 * then any funded wallet, then any CNY wallet, then whatever came back first.
 */
export function pickWallet(value: unknown): BalanceWallet | undefined {
  const infos = (value as { balance_infos?: unknown } | null | undefined)?.balance_infos
  if (!Array.isArray(infos)) return undefined
  const wallets = infos
    .map((entry) => (typeof entry === 'object' && entry !== null ? toWallet(entry) : undefined))
    .filter((wallet): wallet is BalanceWallet => wallet !== undefined)
  if (wallets.length === 0) return undefined
  const funded = (wallet: BalanceWallet): boolean => Number(wallet.total) > 0
  return (
    wallets.find((wallet) => wallet.currency === 'CNY' && funded(wallet)) ??
    wallets.find(funded) ??
    wallets.find((wallet) => wallet.currency === 'CNY') ??
    wallets[0]
  )
}

/**
 * Build one reader. Everything that touches the outside world is injected, so
 * the unit tests run without a network or a credential store.
 */
export function createApiKeyReader(deps: ApiKeyReaderDeps): ApiKeyReader {
  const fetchImpl: FetchLike = deps.fetchImpl ?? fetch
  const now = deps.now ?? Date.now
  const endpoint = deps.endpoint ?? DEFAULT_ENDPOINT
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS

  return {
    async read(): Promise<WalletReading> {
      let key: string | undefined
      try {
        key = await deps.resolveKey()
      } catch {
        key = undefined
      }
      if (key === undefined || key === '') return { kind: 'unavailable' }

      let response: BalanceResponseLike
      try {
        response = await fetchImpl(endpoint, {
          headers: { authorization: `Bearer ${key}`, accept: 'application/json' },
          signal: AbortSignal.timeout(timeoutMs),
        })
      } catch (error) {
        const name = (error as { name?: unknown } | null | undefined)?.name
        return { kind: 'error', code: name === 'TimeoutError' ? 'timeout' : 'network' }
      }

      if (!response.ok) return { kind: 'error', code: `http-${response.status}` }

      let body: unknown
      try {
        body = await response.json()
      } catch {
        return { kind: 'error', code: 'malformed' }
      }

      const wallet = pickWallet(body)
      if (wallet === undefined) return { kind: 'error', code: 'malformed' }
      return { kind: 'ready', wallet, at: now() }
    },
  }
}
