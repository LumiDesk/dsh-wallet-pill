/**
 * Client styles, injected once as a `<style>` tag owned by this plugin.
 *
 * Every value that can follow the host theme goes through a `--dsw-*` token;
 * the only literals are geometry the host's own pills use as well (6px gap,
 * 12px label, 18px line box). No component writes a `style` attribute.
 */
export const STYLES = `
[data-wallet-pill] {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
}

[data-wallet-pill] > svg {
  display: block;
  flex: none;
}
`
