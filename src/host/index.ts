/**
 * dsh-wallet-pill — Host half.
 *
 * Serves one read-only JSON surface for the Client half:
 *
 *   GET /wallet-pill/state[?refresh=1]  balance + current billing zone + prices
 *   GET /wallet-pill/status             health probe
 *
 * Nothing is written to disk and nothing is configurable: the API key comes
 * from the Host credential seam, the price table is compiled in, and the cache
 * lives in memory for one minute.
 *
 * Transport note: the plugin registers its own prefix route instead of using
 * `connection.rpc.handle()`. That helper registers through the Connection
 * service's own context, which cannot read `webServer` in a composed profile
 * (observed: `cannot get property "webServer" without inject`), so a plain route
 * plus `connection.requestRejection()` is the same authorization path the
 * shipped host plugins use.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'

import type { Context } from '@deepseek-ai/cordis'

import { createBalanceReader, type BalanceReader, type BalanceState } from './balance.ts'
import {
  MODELS,
  PRICE_TABLE_VERSION,
  nextZoneChangeAt,
  zoneAt,
  type ModelPrice,
  type PriceZone,
} from './pricing.ts'

/** HTTP prefix this plugin owns. The Client half must use the same string. */
export const ROUTE_PATH = '/wallet-pill'

/** Loader entry name; also the display key under the Plugin Manager. */
export const name = 'wallet-pill'

/** Credential reference the Host resolves on our behalf. */
export const CREDENTIAL_KEY = 'DEEPSEEK_API_KEY'

/**
 * The subset of the Host services this plugin uses. Declared locally until a
 * feature needs the upstream package types; importing every `@deepseek-ai/dsh-*`
 * package only to type two methods is not worth the dependency weight.
 */
interface WebServerLike {
  register(route: {
    kind: 'prefix'
    path: string
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
  }): () => void
}

interface ConnectionLike {
  requestRejection(request: IncomingMessage): number | undefined
}

interface CredentialsLike {
  resolve(ref: string): Promise<{ value?: string } | undefined>
}

export interface PricingPayload {
  zone: PriceZone
  /** Next zone edge in epoch milliseconds, or `null` when unknown. */
  nextChangeAt: number | null
  tableVersion: string
  currency: 'CNY'
  models: readonly ModelPrice[]
}

export interface WalletStatePayload {
  ok: true
  value: {
    balance: BalanceState
    pricing: PricingPayload
    /** Server clock at payload build time, so the Client can age the reading. */
    now: number
  }
}

export interface StatusPayload {
  ok: true
  value: {
    name: string
    stage: 'ready'
    route: string
  }
}

export interface ErrorEnvelope {
  ok: false
  error: { code: string; message: string }
}

/** Everything the route needs, so it can be exercised without a Host. */
export interface RouteDeps {
  reader: Pick<BalanceReader, 'read'>
  /**
   * The Host's trust fence for this request: a status code rejects it, and
   * `undefined` lets it through.
   */
  rejection: (req: IncomingMessage) => number | undefined
  now?: () => number
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(body))
}

function sendError(res: ServerResponse, status: number, code: string, message: string): void {
  const envelope: ErrorEnvelope = { ok: false, error: { code, message } }
  sendJson(res, status, envelope)
}

/** `/wallet-pill/state` → `state`; anything else → `undefined`. */
export function endpointOf(url: string | undefined): string | undefined {
  const pathname = new URL(url ?? '/', 'http://localhost').pathname
  const prefix = `${ROUTE_PATH}/`
  if (!pathname.startsWith(prefix)) return undefined
  const endpoint = pathname.slice(prefix.length)
  if (endpoint.length === 0 || endpoint.includes('/')) return undefined
  return endpoint
}

/** Whether the request asked for a cache-bypassing read (`?refresh=1`). */
export function wantsRefresh(url: string | undefined): boolean {
  return new URL(url ?? '/', 'http://localhost').searchParams.get('refresh') === '1'
}

/**
 * Assemble the Client payload. Pure so the route and the tests share it.
 *
 * @param balance - latest balance reading, cached or fresh.
 * @param nowMs - epoch milliseconds used for the billing zone.
 */
export function buildState(balance: BalanceState, nowMs: number): WalletStatePayload {
  return {
    ok: true,
    value: {
      balance,
      pricing: {
        zone: zoneAt(nowMs),
        nextChangeAt: nextZoneChangeAt(nowMs),
        tableVersion: PRICE_TABLE_VERSION,
        currency: 'CNY',
        models: MODELS,
      },
      now: nowMs,
    },
  }
}

/**
 * Handle one request under this plugin's prefix.
 *
 * Order matters: trust fence first (a rejected request learns nothing about the
 * route), then method, then endpoint. Every response is JSON except the bare
 * status codes the fence and the method guard produce.
 *
 * @param req - the incoming request.
 * @param res - the response to write.
 * @param deps - balance reader, trust fence and clock.
 */
export async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  deps: RouteDeps,
): Promise<void> {
  const rejection = deps.rejection(req)
  if (rejection !== undefined) {
    res.statusCode = rejection
    res.end()
    return
  }

  if (req.method !== 'GET') {
    res.setHeader('allow', 'GET')
    res.statusCode = 405
    res.end()
    return
  }

  const endpoint = endpointOf(req.url)
  if (endpoint === undefined) {
    sendError(res, 404, 'wallet/bad-request', 'unknown endpoint')
    return
  }

  if (endpoint === 'status') {
    const payload: StatusPayload = {
      ok: true,
      value: { name, stage: 'ready', route: ROUTE_PATH },
    }
    sendJson(res, 200, payload)
    return
  }

  if (endpoint === 'state') {
    try {
      const balance = await deps.reader.read(wantsRefresh(req.url))
      sendJson(res, 200, buildState(balance, (deps.now ?? Date.now)()))
    } catch {
      sendError(res, 502, 'wallet/balance-failed', 'balance read failed')
    }
    return
  }

  sendError(res, 404, 'wallet/bad-request', `unknown endpoint ${JSON.stringify(endpoint)}`)
}

/**
 * Resolve the API key through the Host seam. The key is only ever read inside
 * this process; it never reaches the browser or the response body.
 */
async function resolveApiKey(ctx: Context): Promise<string | undefined> {
  const credentials = ctx.get('credentials') as CredentialsLike | undefined
  if (credentials === undefined || typeof credentials.resolve !== 'function') return undefined
  const hit = await credentials.resolve(CREDENTIAL_KEY)
  return hit?.value
}

/**
 * Register the plugin's Host surface.
 *
 * A profile bundle can be mounted into a running process, so the Web server is
 * reached through a deferred injection rather than a property read at apply
 * time. Both services are injected together: the route needs the server, the
 * handler needs the trust check, and `webServer` alone can activate while
 * `connection` is still booting.
 *
 * @param ctx - plugin context; every registration made through it is disposed
 *   when the plugin unloads.
 */
export function apply(ctx: Context): void {
  const reader = createBalanceReader({ resolveKey: () => resolveApiKey(ctx) })

  ctx.inject(['webServer', 'connection'], (webCtx) => {
    let webServer: WebServerLike
    let connection: ConnectionLike
    try {
      // The injected context resolves services as properties; the local
      // interface keeps that contract without the upstream service types.
      const deps = webCtx as unknown as {
        webServer: WebServerLike
        connection: ConnectionLike
      }
      webServer = deps.webServer
      connection = deps.connection
    } catch {
      return
    }

    const dispose = webServer.register({
      kind: 'prefix',
      path: ROUTE_PATH,
      handler: (req, res) =>
        handleRequest(req, res, {
          reader,
          rejection: (request) => connection.requestRejection(request),
        }),
    })

    webCtx.effect(() => dispose, 'wallet-pill: http route')
  })
}
