/**
 * Wire types for the Host's read-only surface. The Host declares the same shapes
 * in `src/host/index.ts` and `src/host/wallet.ts`; keep them in sync when a
 * field changes.
 */

export interface BalanceWalletPayload {
  currency: string
  total: string
  granted: string
  toppedUp: string
}

/** Which DeepSeek route the balance belongs to. */
export type WalletSourcePayload = 'account' | 'api-key'

export type BalancePayload =
  | { status: 'ready'; source: WalletSourcePayload; wallet: BalanceWalletPayload; at: number }
  /** Neither route has a credential; the pill hides itself. */
  | { status: 'unconfigured' }
  | { status: 'error'; source: WalletSourcePayload; code: string }

export type PriceZone = 'peak' | 'off-peak'

export interface ModelPricePayload {
  id: string
  label: string
  /** `[off-peak, peak]`, CNY per million tokens. */
  hit: readonly [number, number]
  miss: readonly [number, number]
  out: readonly [number, number]
}

export interface StatePayload {
  balance: BalancePayload
  pricing: {
    zone: PriceZone
    nextChangeAt: number | null
    tableVersion: string
    currency: string
    models: readonly ModelPricePayload[]
  }
  now: number
}

/** Route the Host serves; kept identical to `ROUTE_PATH` on the Host side. */
export const STATE_ROUTE = '/wallet-pill/state'

interface StateEnvelope {
  ok?: boolean
  value?: StatePayload
  error?: { code?: string; message?: string }
}

export interface StateRequest {
  /** Bypass the Host cache (the panel's refresh button). */
  refresh: boolean
  /** Active UI language, forwarded to the account balance call. */
  locale: string
  /** Aborts the request when the component unmounts or polls again. */
  signal?: AbortSignal
}

/**
 * Read one state payload.
 *
 * @param request - cache intent, UI language and abort signal.
 */
export async function readState(request: StateRequest): Promise<StatePayload> {
  const params = new URLSearchParams({
    refresh: request.refresh ? '1' : '0',
    locale: request.locale,
    tz: String(-new Date().getTimezoneOffset() * 60),
    v: __WALLET_PILL_VERSION__,
  })
  const response = await fetch(`${STATE_ROUTE}?${params.toString()}`, {
    signal: request.signal,
    headers: { accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`state ${response.status}`)
  const body = (await response.json()) as StateEnvelope
  if (body.ok !== true || body.value === undefined) {
    throw new Error(body.error?.code ?? 'bad payload')
  }
  return body.value
}
