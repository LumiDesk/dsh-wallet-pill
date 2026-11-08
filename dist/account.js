const DECIMAL_PLACES = 8;
/**
 * Normalize a summed amount for the wire: `5.0000000000000000` and `0E-16`
 * both arrive from Platform, and floating addition can leave noise far below
 * the sub-cent digit the pill renders.
 */
function decimalText(value) {
    if (!Number.isFinite(value))
        return '0';
    return String(Number(value.toFixed(DECIMAL_PLACES)));
}
function amountOf(value) {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    if (trimmed.length === 0)
        return undefined;
    const amount = Number(trimmed);
    return Number.isFinite(amount) ? amount : undefined;
}
function currencyOf(value) {
    if (typeof value !== 'string')
        return undefined;
    const code = value.trim().toUpperCase();
    return /^[A-Z]{3}$/.test(code) ? code : undefined;
}
function collect(into, wallets, field) {
    for (const wallet of wallets) {
        const currency = currencyOf(wallet.currency);
        const amount = amountOf(wallet.balance);
        if (currency === undefined || amount === undefined)
            continue;
        const totals = into.get(currency) ?? { recharge: 0, granted: 0 };
        totals[field] += amount;
        into.set(currency, totals);
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
export function accountWallet(balance) {
    const totals = new Map();
    collect(totals, balance.value, 'recharge');
    collect(totals, balance.bonusWallets, 'granted');
    const entries = [...totals.entries()];
    const funded = (entry) => entry[1].recharge + entry[1].granted > 0;
    const picked = entries.find((entry) => entry[0] === 'CNY' && funded(entry)) ??
        entries.find(funded) ??
        entries.find((entry) => entry[0] === 'CNY') ??
        entries[0];
    if (picked === undefined)
        return undefined;
    const [currency, values] = picked;
    return {
        currency,
        total: decimalText(values.recharge + values.granted),
        granted: decimalText(values.granted),
        toppedUp: decimalText(values.recharge),
    };
}
/** Map a provider error to a stable wire code; its message may hold no secrets. */
function errorCodeOf(error) {
    const code = error?.code;
    if (typeof code === 'string' && /^[a-z][a-z0-9-]{0,31}$/.test(code))
        return `account-${code}`;
    return 'account-failed';
}
/**
 * Build the account reader.
 *
 * `getState()` is a credential-store read, not a network call, so a signed-out
 * deployment costs nothing beyond the local lookup. A failed or missing method
 * is an error for this source; the caller still has the API-key route.
 */
export function createAccountReader(deps) {
    const now = deps.now ?? Date.now;
    return {
        async read(client) {
            const service = deps.service();
            if (service === undefined)
                return { kind: 'unavailable' };
            let state;
            try {
                state = await service.getState();
            }
            catch {
                return { kind: 'error', code: 'account-storage' };
            }
            if (state?.status !== 'credential-stored')
                return { kind: 'unavailable' };
            let result;
            try {
                result = await service.getBalance(client);
            }
            catch (error) {
                return { kind: 'error', code: errorCodeOf(error) };
            }
            // A null result means the grant was signed out or replaced mid-flight.
            if (result === null)
                return { kind: 'unavailable' };
            if (result.status === 'failed')
                return { kind: 'error', code: 'account-unavailable' };
            const wallet = accountWallet(result);
            if (wallet === undefined)
                return { kind: 'error', code: 'account-malformed' };
            return { kind: 'ready', wallet, at: now() };
        },
    };
}
