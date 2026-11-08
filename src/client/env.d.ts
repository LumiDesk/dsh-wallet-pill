/**
 * Version of this client bundle, replaced at build time by
 * `scripts/build-client.mjs` from `package.json`.
 *
 * The value is sent with each state request and forwarded to Platform as
 * `x-client-version` for account balance reads: the UI that asks is this pill,
 * so it reports its own build rather than impersonating the DSH shell.
 */
declare const __WALLET_PILL_VERSION__: string
