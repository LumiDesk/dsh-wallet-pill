const DEFAULT_TTL_MS = 60_000;
const DEFAULT_ACCOUNT_TIMEOUT_MS = 8_000;
/**
 * Map a model provider id to the wallet that pays for it.
 *
 * @param provider - `ModelSelection.provider` from the default model service.
 * @returns the wallet route, or `undefined` for any other provider.
 */
export function sourceOfProvider(provider) {
    if (provider === 'deepseek-account')
        return 'account';
    if (provider === 'deepseek-official')
        return 'api-key';
    return undefined;
}
/** Settle a read within a deadline without cancelling the underlying call. */
function bounded(reading, ms, code) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => resolve({ kind: 'error', code }), ms);
        void reading.then((value) => {
            clearTimeout(timer);
            resolve(value);
        }, () => {
            clearTimeout(timer);
            resolve({ kind: 'error', code });
        });
    });
}
/**
 * Build the reader. Both source readers are expected to resolve rather than
 * throw; a rejection is still mapped to a stable code so one bad source cannot
 * take the route down.
 */
export function createWalletReader(deps) {
    const now = deps.now ?? Date.now;
    const ttlMs = deps.ttlMs ?? DEFAULT_TTL_MS;
    const accountTimeoutMs = deps.accountTimeoutMs ?? DEFAULT_ACCOUNT_TIMEOUT_MS;
    const cache = new Map();
    const inflight = new Map();
    /** Read one source through its cache, folding concurrent callers onto one request. */
    function load(source, client, force) {
        const cached = cache.get(source);
        if (!force && cached !== undefined && now() - cached.at < ttlMs) {
            return Promise.resolve(cached.reading);
        }
        const pending = inflight.get(source);
        if (!force && pending !== undefined)
            return pending;
        const live = source === 'account' ? deps.account.read(client) : deps.apiKey.read();
        const request = live.then((reading) => {
            // "Unavailable" is a local credential lookup; caching it would keep the
            // pill dark for a minute after the user signs in or stores a key.
            if (reading.kind !== 'unavailable')
                cache.set(source, { at: now(), reading });
            return reading;
        }, () => ({
            kind: 'error',
            code: source === 'account' ? 'account-failed' : 'network',
        }));
        inflight.set(source, request);
        void request.finally(() => {
            if (inflight.get(source) === request)
                inflight.delete(source);
        });
        return request;
    }
    function readSource(source, client, force) {
        const reading = load(source, client, force);
        // Platform's own balance timeout is 30 s; the pill should not hold the dock
        // that long. The late result still lands in the cache for the next poll.
        return source === 'account' ? bounded(reading, accountTimeoutMs, 'account-timeout') : reading;
    }
    return {
        async read({ force = false, client }) {
            const preferred = sourceOfProvider(deps.provider?.());
            const order = preferred === 'api-key' ? ['api-key', 'account'] : ['account', 'api-key'];
            for (const source of order) {
                const reading = await readSource(source, client, force);
                if (reading.kind === 'unavailable')
                    continue;
                if (reading.kind === 'error')
                    return { status: 'error', source, code: reading.code };
                return { status: 'ready', source, wallet: reading.wallet, at: reading.at };
            }
            return { status: 'unconfigured' };
        },
    };
}
