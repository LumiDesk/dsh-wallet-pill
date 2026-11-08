import { createAccountReader, } from "./account.js";
import { createApiKeyReader } from "./balance.js";
import { clientMetadataOf } from "./metadata.js";
import { MODELS, PRICE_TABLE_VERSION, nextZoneChangeAt, zoneAt, } from "./pricing.js";
import { createWalletReader } from "./wallet.js";
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
/** Host-local offset east of UTC, in seconds. */
function serverOffsetSeconds() {
    return -new Date().getTimezoneOffset() * 60;
}
/**
 * Assemble the Client payload. Pure so the route and the tests share it.
 *
 * @param balance - the wallet reading, from either source.
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
 * @param deps - wallet reader, trust fence and clocks.
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
            const client = clientMetadataOf(req.url, (deps.offsetSeconds ?? serverOffsetSeconds)());
            const balance = await deps.wallet.read({ force: wantsRefresh(req.url), client });
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
 * Resolve the account service, or `undefined` when this DSH build has no
 * account route. Older compositions simply keep the API-key behaviour.
 */
function accountServiceOf(ctx) {
    const service = ctx.get('deepseekAccount');
    if (service === undefined)
        return undefined;
    if (typeof service.getState !== 'function' || typeof service.getBalance !== 'function') {
        return undefined;
    }
    return service;
}
/**
 * Read the provider id of the current default model. Sessions can override the
 * default selection, so this is the documented approximation the pill uses to
 * decide which wallet it is spending from.
 */
function providerOf(ctx) {
    const model = ctx.get('agentDefaultModel');
    if (model === undefined || typeof model.currentSelection !== 'function')
        return undefined;
    try {
        const provider = model.currentSelection()?.provider;
        return typeof provider === 'string' && provider.length > 0 ? provider : undefined;
    }
    catch {
        return undefined;
    }
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
 * The wallet sources are resolved lazily inside the handler (`ctx.get`), so a
 * composition without the account service still registers the route.
 *
 * @param ctx - plugin context; every registration made through it is disposed
 *   when the plugin unloads.
 */
export function apply(ctx) {
    const wallet = createWalletReader({
        apiKey: createApiKeyReader({ resolveKey: () => resolveApiKey(ctx) }),
        account: createAccountReader({ service: () => accountServiceOf(ctx) }),
        provider: () => providerOf(ctx),
    });
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
                wallet,
                rejection: (request) => connection.requestRejection(request),
            }),
        });
        webCtx.effect(() => dispose, 'wallet-pill: http route');
    });
}
