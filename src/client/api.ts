/**
 * Wire types for the Host's read-only surface. The Host declares the same shapes
 * in `src/host/index.ts`; keep the two in sync when a field changes.
 */

export interface BalanceWalletPayload {
  currency: string
  total: string
  granted: string
  toppedUp: string
}

export type BalancePayload =
  | { status: 'ready'; wallet: BalanceWalletPayload; at: number }
  | { status: 'no-key' }
  | { status: 'error'; code: string }

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

/**
 * Read one state payload.
 *
 * @param refresh - bypass the Host cache (the panel's refresh button).
 * @param signal - aborts the request when the component unmounts.
 */
export async function readState(refresh: boolean, signal?: AbortSignal): Promise<StatePayload> {
  const url = `${STATE_ROUTE}?refresh=${refresh ? '1' : '0'}`
  const response = await fetch(url, { signal, headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`state ${response.status}`)
  const body = (await response.json()) as StateEnvelope
  if (body.ok !== true || body.value === undefined) {
    throw new Error(body.error?.code ?? 'bad payload')
  }
  return body.value
}
