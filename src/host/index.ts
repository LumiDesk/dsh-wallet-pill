/**
 * dsh-wallet-pill — Host half.
 *
 * Scaffold stage: one `GET /wallet-pill/status` endpoint proves the route, the
 * trust fence and the JSON envelope. Balance reading and the pricing payload
 * land in separate modules once feature work starts; nothing here writes to
 * disk and nothing here is configurable.
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

/** HTTP prefix this plugin owns. The Client half must use the same string. */
export const ROUTE_PATH = '/wallet-pill'

/** Loader entry name; also the display key under the Plugin Manager. */
export const name = 'wallet-pill'

/**
 * The subset of the two Host services this plugin uses. Declared locally until
 * a feature needs the upstream package types; importing every
 * `@deepseek-ai/dsh-*` package only to type two methods is not worth the
 * dependency weight.
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

export interface StatusPayload {
  ok: true
  value: {
    name: string
    stage: 'scaffold'
    route: string
  }
}

export interface ErrorEnvelope {
  ok: false
  error: { code: string; message: string }
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

/** `/wallet-pill/status` → `status`; anything else → `undefined`. */
export function endpointOf(url: string | undefined): string | undefined {
  const pathname = new URL(url ?? '/', 'http://localhost').pathname
  const prefix = `${ROUTE_PATH}/`
  if (!pathname.startsWith(prefix)) return undefined
  const endpoint = pathname.slice(prefix.length)
  if (endpoint.length === 0 || endpoint.includes('/')) return undefined
  return endpoint
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
      handler: (req, res) => {
        const rejection = connection.requestRejection(req)
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
        if (endpoint !== 'status') {
          sendError(res, 404, 'wallet/bad-request', `unknown endpoint ${JSON.stringify(endpoint)}`)
          return
        }
        const payload: StatusPayload = {
          ok: true,
          value: { name, stage: 'scaffold', route: ROUTE_PATH },
        }
        sendJson(res, 200, payload)
      },
    })

    webCtx.effect(() => dispose, 'wallet-pill: http route')
  })
}
