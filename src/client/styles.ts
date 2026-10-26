/**
 * Client styles, injected once as a `<style>` tag owned by this plugin.
 *
 * Colours come from the host theme tokens only. Radius and focus ring keep a
 * geometry fallback because those tokens are not in the theme's public list.
 */
export const STYLES = `
[data-wallet-pill='pill'] {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
}

[data-wallet-pill='pill']:hover {
  background: var(--dsw-alias-bg-layer-2);
}

[data-wallet-pill='pill']:focus-visible {
  outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));
  outline-offset: 2px;
}

[data-wallet-pill='pill'][data-stale='true'] {
  opacity: 0.72;
}

.wp-glyph {
  display: block;
  flex: none;
}

.wp-dot {
  flex: none;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--dsw-alias-state-warn-primary);
}

.wp-panel {
  position: fixed;
  z-index: 1100;
  box-sizing: border-box;
  width: 320px;
  max-width: calc(100vw - 24px);
  padding: 14px 16px 12px;
  border: 0.5px solid var(--dsw-alias-border-l1);
  border-radius: var(--dsw-radius-lg, 12px);
  background: var(--dsw-alias-bg-overlay);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
}

.wp-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.wp-title {
  color: var(--dsw-alias-label-primary);
  font-weight: 500;
}

.wp-amount {
  color: var(--dsw-alias-label-primary);
  font-size: 18px;
  line-height: 24px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.wp-rows {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px 12px;
  margin: 8px 0 0;
}

.wp-rows dt {
  color: var(--dsw-alias-label-secondary);
}

.wp-rows dd {
  margin: 0;
  text-align: right;
  color: var(--dsw-alias-label-primary);
  font-variant-numeric: tabular-nums;
}

.wp-rule {
  margin: 10px 0;
  border-top: 0.5px solid var(--dsw-alias-border-l1);
}

.wp-zone {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wp-chip {
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  border: 0.5px solid currentColor;
  border-radius: 999px;
  font-size: 11px;
  line-height: 18px;
}

.wp-chip[data-zone='peak'] {
  color: var(--dsw-alias-state-warn-primary);
}

.wp-chip[data-zone='off-peak'] {
  color: var(--dsw-alias-state-success-primary);
}

.wp-section-title {
  margin: 12px 0 6px;
  color: var(--dsw-alias-label-secondary);
  font-weight: 500;
}

.wp-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
}

.wp-tab {
  padding: 0 8px;
  border: 0.5px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 11px;
  line-height: 18px;
  cursor: pointer;
}

.wp-tab:hover {
  background: var(--dsw-alias-bg-layer-2);
}

.wp-tab[data-active='true'] {
  border-color: var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-primary);
}

.wp-tab:focus-visible {
  outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));
  outline-offset: 1px;
}

.wp-table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

.wp-table th {
  color: var(--dsw-alias-label-secondary);
  font-weight: 400;
  text-align: right;
}

.wp-table td {
  color: var(--dsw-alias-label-primary);
  text-align: right;
}

.wp-table th:first-child,
.wp-table td:first-child {
  text-align: left;
}

.wp-table th[data-active='true'] {
  color: var(--dsw-alias-brand-primary);
  font-weight: 500;
}

.wp-foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
}

.wp-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  color: var(--dsw-alias-label-secondary);
}

.wp-refresh {
  flex: none;
  padding: 0 10px;
  border: 0.5px solid var(--dsw-alias-border-l1);
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
  line-height: 22px;
  cursor: pointer;
}

.wp-refresh:hover:not(:disabled) {
  background: var(--dsw-alias-bg-layer-2);
}

.wp-refresh:disabled {
  opacity: 0.55;
  cursor: default;
}

.wp-refresh:focus-visible {
  outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));
  outline-offset: 2px;
}

.wp-error {
  margin: 8px 0 0;
  color: var(--dsw-alias-state-error-primary);
}

.wp-note {
  margin: 0;
  color: var(--dsw-alias-label-secondary);
  opacity: 0.8;
}
`
