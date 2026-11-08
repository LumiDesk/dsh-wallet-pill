/** Version reported when the request carries none; a route user may not be the pill. */
const DEFAULT_VERSION = '0.0.0';
/** Neutral default; the provider reduces it to `zh_CN` or `en_US` anyway. */
const DEFAULT_LOCALE = 'en-US';
/** A real UTC offset never exceeds ±14 h; anything larger is a bad request. */
const MAX_OFFSET_SECONDS = 86_400;
const LOCALE_PATTERN = /^[a-z]{2,3}(?:[-_][a-z0-9]{2,8}){0,3}$/i;
const VERSION_PATTERN = /^[0-9a-z][0-9a-z.+-]{0,31}$/i;
function versionOf(value) {
    return value !== null && VERSION_PATTERN.test(value) ? value : DEFAULT_VERSION;
}
function localeOf(value) {
    return value !== null && LOCALE_PATTERN.test(value) ? value : DEFAULT_LOCALE;
}
function offsetOf(value, fallbackSeconds) {
    const parsed = value === null || value.trim() === '' ? Number.NaN : Number(value);
    const offset = Math.trunc(Number.isFinite(parsed) ? parsed : fallbackSeconds);
    return Math.max(-MAX_OFFSET_SECONDS, Math.min(MAX_OFFSET_SECONDS, offset));
}
/**
 * @param url - the state request URL, or `undefined` when the request has none.
 * @param fallbackOffsetSeconds - Host-local offset east of UTC, used when the
 *   browser sent no usable `tz`.
 * @returns validated metadata safe to hand to the account service.
 */
export function clientMetadataOf(url, fallbackOffsetSeconds) {
    const params = new URL(url ?? '/', 'http://localhost').searchParams;
    return {
        version: versionOf(params.get('v')),
        locale: localeOf(params.get('locale')),
        timezoneOffsetSeconds: offsetOf(params.get('tz'), fallbackOffsetSeconds),
    };
}
