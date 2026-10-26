/**
 * Account balance for one DeepSeek API key.
 *
 * The key never leaves the Host: the browser only ever sees the aggregated
 * numbers through this plugin's own route. Reads are cached for a minute so a
 * page refresh or a panel open does not hammer the billing endpoint, and
 * concurrent reads share one request.
 *
 * Endpoint: GET https://api.deepseek.com/user/balance
 * Response: { is_available, balance_infos: [{ currency, total_balance,
 *             granted_balance, topped_up_balance }] }
 */
const DEFAULT_ENDPOINT = 'https://api.deepseek.com/user/balance';
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_TTL_MS = 60_000;
function decimal(value) {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    if (trimmed.length === 0)
        return undefined;
    return Number.isFinite(Number(trimmed)) ? trimmed : undefined;
}
function currencyOf(value) {
    if (typeof value !== 'string')
        return undefined;
    const code = value.trim().toUpperCase();
    return /^[A-Z]{3}$/.test(code) ? code : undefined;
}
function toWallet(raw) {
    const currency = currencyOf(raw.currency);
    const total = decimal(raw.total_balance);
    if (currency === undefined || total === undefined)
        return undefined;
    return {
        currency,
        total,
        granted: decimal(raw.granted_balance) ?? '0',
        toppedUp: decimal(raw.topped_up_balance) ?? '0',
    };
}
/**
 * Pick the wallet a single-number pill should show: a funded CNY wallet first,
 * then any funded wallet, then any CNY wallet, then whatever came back first.
 */
export function pickWallet(value) {
    const infos = value?.balance_infos;
    if (!Array.isArray(infos))
        return undefined;
    const wallets = infos
        .map((entry) => (typeof entry === 'object' && entry !== null ? toWallet(entry) : undefined))
        .filter((wallet) => wallet !== undefined);
    if (wallets.length === 0)
        return undefined;
    const funded = (wallet) => Number(wallet.total) > 0;
    return (wallets.find((wallet) => wallet.currency === 'CNY' && funded(wallet)) ??
        wallets.find(funded) ??
        wallets.find((wallet) => wallet.currency === 'CNY') ??
        wallets[0]);
}
/**
 * Build one reader. Everything that touches the outside world is injected, so
 * the unit tests run without a network or a credential store.
 */
export function createBalanceReader(deps) {
    const fetchImpl = deps.fetchImpl ?? fetch;
    const now = deps.now ?? Date.now;
    const endpoint = deps.endpoint ?? DEFAULT_ENDPOINT;
    const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const ttlMs = deps.ttlMs ?? DEFAULT_TTL_MS;
    let cached;
    let inflight;
    async function load() {
        let key;
        try {
            key = await deps.resolveKey();
        }
        catch {
            key = undefined;
        }
        if (key === undefined || key === '')
            return { status: 'no-key' };
        let response;
        try {
            response = await fetchImpl(endpoint, {
                headers: { authorization: `Bearer ${key}`, accept: 'application/json' },
                signal: AbortSignal.timeout(timeoutMs),
            });
        }
        catch (error) {
            const name = error?.name;
            return { status: 'error', code: name === 'TimeoutError' ? 'timeout' : 'network' };
        }
        if (!response.ok)
            return { status: 'error', code: `http-${response.status}` };
        let body;
        try {
            body = await response.json();
        }
        catch {
            return { status: 'error', code: 'malformed' };
        }
        const wallet = pickWallet(body);
        if (wallet === undefined)
            return { status: 'error', code: 'malformed' };
        return { status: 'ready', wallet, at: now() };
    }
    return {
        async read(force = false) {
            if (!force) {
                if (cached !== undefined && now() - cached.at < ttlMs)
                    return cached.state;
                if (inflight !== undefined)
                    return inflight;
            }
            const request = load().then((state) => {
                cached = { at: now(), state };
                return state;
            });
            inflight = request;
            try {
                return await request;
            }
            finally {
                if (inflight === request)
                    inflight = undefined;
            }
        },
    };
}
