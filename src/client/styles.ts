/**
 * Client styles, injected once as a `<style>` tag owned by this plugin.
 *
 * The pill copies `StatsPills.module.css` and the panel copies
 * `stat-dialog.module.css` from the host's own chat package, token for token,
 * so the plugin reads as one more control in the composer dock: menu surface
 * (`--dsw-specific-menu` + `--dsw-menu-backdrop-filter`), prominent elevation,
 * no border, and the label-primary / secondary / tertiary hierarchy.
 */
export const STYLES = `
[data-wallet-pill='pill'] {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  max-width: 100%;
  padding: 1px 8px;
  border: none;
  border-radius: var(--dsw-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font: inherit;
  font-size: calc(var(--dsh-content-font-size-secondary, 13px) - 1px);
  font-variant-numeric: tabular-nums;
  line-height: calc(20px + var(--dsh-content-font-delta-secondary, 0px));
  white-space: nowrap;
  cursor: pointer;
}

[data-wallet-pill='pill'] svg {
  width: 14px;
  height: 14px;
  flex: none;
}

@media (hover: hover) {
  [data-wallet-pill='pill']:hover {
    background: var(--dsw-alias-interactive-bg-hover);
    color: var(--dsw-alias-label-secondary);
  }
}

[data-wallet-pill='pill'][aria-expanded='true'] {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}

[data-wallet-pill='pill']:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));
  outline-offset: 2px;
}

.wp-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
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
  padding: 16px;
  border: 0;
  border-radius: var(--dsw-radius-lg);
  background: var(--dsw-specific-menu);
  backdrop-filter: var(--dsw-menu-backdrop-filter);
  --dsw-elevation-stroke-color: var(--dsw-alias-border-l1);
  box-shadow: var(--dsw-elevation-prominent);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
  cursor: default;
}

.wp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
  color: var(--dsw-alias-label-primary);
  font-weight: 500;
}

.wp-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.wp-title svg {
  width: 14px;
  height: 14px;
  flex: none;
}

.wp-amount {
  font: var(--dsw-font-m-18);
  font-variant-numeric: tabular-nums;
}

.wp-rows {
  display: grid;
  grid-template-columns: minmax(76px, auto) minmax(0, 1fr);
  gap: 6px 16px;
  margin: 0;
  color: var(--dsw-alias-label-tertiary);
}

.wp-rows dt,
.wp-rows dd {
  min-width: 0;
  margin: 0;
}

.wp-rows dd {
  color: var(--dsw-alias-label-secondary);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.wp-rule {
  margin: 10px 0;
  border-top: 0.5px solid var(--dsw-alias-border-l2);
}

.wp-zone {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wp-chip {
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  border: 0.5px solid currentColor;
  border-radius: var(--dsw-radius-sm);
  font-size: 11px;
  line-height: 17px;
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
  padding: 1px 8px;
  border: none;
  border-radius: var(--dsw-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font: inherit;
  cursor: pointer;
}

@media (hover: hover) {
  .wp-tab:hover {
    background: var(--dsw-alias-interactive-bg-hover);
    color: var(--dsw-alias-label-secondary);
  }
}

.wp-tab[data-active='true'] {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}

.wp-tab:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));
  outline-offset: 1px;
}

.wp-table {
  width: 100%;
  border-collapse: collapse;
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
}

.wp-table th {
  font-weight: 400;
  text-align: right;
}

.wp-table td {
  color: var(--dsw-alias-label-secondary);
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
  color: var(--dsw-alias-label-tertiary);
}

.wp-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  height: 28px;
  padding: 0 10px;
  border: none;
  border-radius: var(--dsw-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
}

@media (hover: hover) {
  .wp-refresh:hover:not(:disabled) {
    background: var(--dsw-alias-interactive-bg-hover);
  }
}

.wp-refresh:active:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-active);
}

.wp-refresh:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.wp-refresh:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));
  outline-offset: 2px;
}

.wp-error {
  margin: 8px 0 0;
  color: var(--dsw-alias-state-error-primary);
}

.wp-note {
  margin: 8px 0 0;
  color: var(--dsw-alias-label-tertiary);
}
`
