/**
 * Wallet balance for the DeepSeek account route (browser sign-in).
 *
 * The account grant is Host-only state owned by the `deepseekAccount` service
 * from `@deepseek-ai/dsh-deepseek-account-platform`. This module never reads
 * the grant itself and never sees the token: it asks the service for one
 * balance reading and projects the two wallet lists onto the pill's single
 * recharge / granted / total shape.
 *
 * Service contract (Host Cordis API catalog):
 *
 *   getState(): Promise<{ status: 'signed-out' | 'credential-stored'; ... }>
 *   getBalance(client): Promise<
 *     | null                                             // signed out, or the grant changed
 *     | { status: 'failed' }                             // network / protocol failure
 *     | { status: 'ready'; value: AccountWallet[]; bonusWallets: AccountWallet[] }>
 *
 * `value` holds recharge wallets and `bonusWallets` holds granted ones; both
 * keep the provider's decimal strings. A rejected grant is cleared by the
 * provider itself, so `null` here means "nothing left to show", not an error.
 */
import type { BalanceWallet, WalletReading } from './balance.ts'

/**
 * Identity of the UI that asked for a balance, forwarded by the provider as the
 * five `x-client-*` Platform headers. The pill's own bundle supplies it.
 */
export interface AccountClientMetadata {
  version: string
  locale: string
  timezoneOffsetSeconds: number
}

export interface AccountWalletLike {
  /** Currency code reported by Platform; normally `CNY` or `USD`. */
  currency: string
  /** Decimal string, possibly with an exponent or trailing zeros. */
  balance: string
}

export interface AccountBalanceLike {
  status: 'ready'
  value: readonly AccountWalletLike[]
  bonusWallets: readonly AccountWalletLike[]
}

export type AccountResultLike = AccountBalanceLike | { status: 'failed' }

export interface AccountStateLike {
  status: 'signed-out' | 'credential-stored'
}

/** The subset of `deepseekAccount` this plugin uses. */
export interface AccountServiceLike {
  getState(): Promise<AccountStateLike>
  getBalance(client: AccountClientMetadata): Promise<AccountResultLike | null>
}

export interface AccountReaderDeps {
  /** Resolve the Host service, or `undefined` when the composition has none. */
  service: () => AccountServiceLike | undefined
  /** Injectable clock, in epoch milliseconds. */
  now?: () => number
}

export interface AccountReader {
  /** One live read; the caller owns caching and request folding. */
  read(client: AccountClientMetadata): Promise<WalletReading>
}

interface Totals {
  recharge: number
  granted: number
}

const DECIMAL_PLACES = 8

/**
 * Normalize a summed amount for the wire: `5.0000000000000000` and `0E-16`
 * both arrive from Platform, and floating addition can leave noise far below
 * the sub-cent digit the pill renders.
 */
function decimalText(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return String(Number(value.toFixed(DECIMAL_PLACES)))
}

function amountOf(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined
  const amount = Number(trimmed)
  return Number.isFinite(amount) ? amount : undefined
}

function currencyOf(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const code = value.trim().toUpperCase()
  return /^[A-Z]{3}$/.test(code) ? code : undefined
}

function collect(
  into: Map<string, Totals>,
  wallets: readonly AccountWalletLike[],
  field: keyof Totals,
): void {
  for (const wallet of wallets) {
    const currency = currencyOf(wallet.currency)
    const amount = amountOf(wallet.balance)
    if (currency === undefined || amount === undefined) continue
    const totals = into.get(currency) ?? { recharge: 0, granted: 0 }
    totals[field] += amount
    into.set(currency, totals)
  }
}

/**
 * Project Platform's per-currency wallets onto the one wallet a single-number
 * pill can show: a funded CNY wallet first, then any funded wallet, then any
 * CNY wallet, then whatever came back first — the same order the API-key route
 * uses. `total` is recharge plus granted, so the panel's two rows always add up.
 *
 * @returns the projected wallet, or `undefined` when neither list holds a valid
 *   amount (which is a malformed payload, not a zero balance).
 */
export function accountWallet(balance: AccountBalanceLike): BalanceWallet | undefined {
  const totals = new Map<string, Totals>()
  collect(totals, balance.value, 'recharge')
  collect(totals, balance.bonusWallets, 'granted')
  const entries = [...totals.entries()]
  const funded = (entry: [string, Totals]): boolean => entry[1].recharge + entry[1].granted > 0
  const picked =
    entries.find((entry) => entry[0] === 'CNY' && funded(entry)) ??
    entries.find(funded) ??
    entries.find((entry) => entry[0] === 'CNY') ??
    entries[0]
  if (picked === undefined) return undefined
  const [currency, values] = picked
  return {
    currency,
    total: decimalText(values.recharge + values.granted),
    granted: decimalText(values.granted),
    toppedUp: decimalText(values.recharge),
  }
}

/** Map a provider error to a stable wire code; its message may hold no secrets. */
function errorCodeOf(error: unknown): string {
  const code = (error as { code?: unknown } | null | undefined)?.code
  if (typeof code === 'string' && /^[a-z][a-z0-9-]{0,31}$/.test(code)) return `account-${code}`
  return 'account-failed'
}

/**
 * Build the account reader.
 *
 * `getState()` is a credential-store read, not a network call, so a signed-out
 * deployment costs nothing beyond the local lookup. A failed or missing method
 * is an error for this source; the caller still has the API-key route.
 */
export function createAccountReader(deps: AccountReaderDeps): AccountReader {
  const now = deps.now ?? Date.now

  return {
    async read(client: AccountClientMetadata): Promise<WalletReading> {
      const service = deps.service()
      if (service === undefined) return { kind: 'unavailable' }

      let state: AccountStateLike | undefined
      try {
        state = await service.getState()
      } catch {
        return { kind: 'error', code: 'account-storage' }
      }
      if (state?.status !== 'credential-stored') return { kind: 'unavailable' }

      let result: AccountResultLike | null
      try {
        result = await service.getBalance(client)
      } catch (error) {
        return { kind: 'error', code: errorCodeOf(error) }
      }
      // A null result means the grant was signed out or replaced mid-flight.
      if (result === null) return { kind: 'unavailable' }
      if (result.status === 'failed') return { kind: 'error', code: 'account-unavailable' }

      const wallet = accountWallet(result)
      if (wallet === undefined) return { kind: 'error', code: 'account-malformed' }
      return { kind: 'ready', wallet, at: now() }
    },
  }
}
