import { createBalanceReader } from "./balance.js";
import { MODELS, PRICE_TABLE_VERSION, nextZoneChangeAt, zoneAt, } from "./pricing.js";
/** HTTP prefix this plugin owns. The Client half must use the same string. */
export const ROUTE_PATH = '/wallet-pill';
/** Loader entry name; also the display key under the Plugin Manager. */
export const name = 'wallet-pill';
/** Credential reference the Host resolves on our behalf. */
export const CREDENTIAL_KEY = 'DEEPSEEK_API_KEY';
function sendJson(res, status, body) {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify(body));
}
function sendError(res, status, code, message) {
    const envelope = { ok: false, error: { code, message } };
    sendJson(res, status, envelope);
}
/** `/wallet-pill/state` → `state`; anything else → `undefined`. */
export function endpointOf(url) {
    const pathname = new URL(url ?? '/', 'http://localhost').pathname;
    const prefix = `${ROUTE_PATH}/`;
    if (!pathname.startsWith(prefix))
        return undefined;
    const endpoint = pathname.slice(prefix.length);
    if (endpoint.length === 0 || endpoint.includes('/'))
        return undefined;
    return endpoint;
}
/** Whether the request asked for a cache-bypassing read (`?refresh=1`). */
export function wantsRefresh(url) {
    return new URL(url ?? '/', 'http://localhost').searchParams.get('refresh') === '1';
}
/**
 * Assemble the Client payload. Pure so the route and the tests share it.
 *
 * @param balance - latest balance reading, cached or fresh.
 * @param nowMs - epoch milliseconds used for the billing zone.
 */
export function buildState(balance, nowMs) {
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
    };
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
export async function handleRequest(req, res, deps) {
    const rejection = deps.rejection(req);
    if (rejection !== undefined) {
        res.statusCode = rejection;
        res.end();
        return;
    }
    if (req.method !== 'GET') {
        res.setHeader('allow', 'GET');
        res.statusCode = 405;
        res.end();
        return;
    }
    const endpoint = endpointOf(req.url);
    if (endpoint === undefined) {
        sendError(res, 404, 'wallet/bad-request', 'unknown endpoint');
        return;
    }
    if (endpoint === 'status') {
        const payload = {
            ok: true,
            value: { name, stage: 'ready', route: ROUTE_PATH },
        };
        sendJson(res, 200, payload);
        return;
    }
    if (endpoint === 'state') {
        try {
            const balance = await deps.reader.read(wantsRefresh(req.url));
            sendJson(res, 200, buildState(balance, (deps.now ?? Date.now)()));
        }
        catch {
            sendError(res, 502, 'wallet/balance-failed', 'balance read failed');
        }
        return;
    }
    sendError(res, 404, 'wallet/bad-request', `unknown endpoint ${JSON.stringify(endpoint)}`);
}
/**
 * Resolve the API key through the Host seam. The key is only ever read inside
 * this process; it never reaches the browser or the response body.
 */
async function resolveApiKey(ctx) {
    const credentials = ctx.get('credentials');
    if (credentials === undefined || typeof credentials.resolve !== 'function')
        return undefined;
    const hit = await credentials.resolve(CREDENTIAL_KEY);
    return hit?.value;
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
export function apply(ctx) {
    const reader = createBalanceReader({ resolveKey: () => resolveApiKey(ctx) });
    ctx.inject(['webServer', 'connection'], (webCtx) => {
        let webServer;
        let connection;
        try {
            // The injected context resolves services as properties; the local
            // interface keeps that contract without the upstream service types.
            const deps = webCtx;
            webServer = deps.webServer;
            connection = deps.connection;
        }
        catch {
            return;
        }
        const dispose = webServer.register({
            kind: 'prefix',
            path: ROUTE_PATH,
            handler: (req, res) => handleRequest(req, res, {
                reader,
                rejection: (request) => connection.requestRejection(request),
            }),
        });
        webCtx.effect(() => dispose, 'wallet-pill: http route');
    });
}
