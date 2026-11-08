/**
 * dsh-wallet-pill — Client half.
 *
 * Registers one composer-dock entry that renders the balance pill and its
 * pricing panel. All presentation lives in `styles.ts`; all copy goes through
 * the locale namespace so the host's language switch applies immediately.
 */
import { dictionaries } from './locales'
import { WalletPill } from './pill'
import { STYLES } from './styles'

/** Locale namespace; also the slot id, so `data-composer-stat` matches the row. */
const NS = 'wallet-pill'

/** Slot the pill lives in: the ambient row under the composer card. */
const SLOT = 'conversation.composer.dock'

export interface ClientContext {
  slots: {
    inject(name: string, register: () => unknown): unknown
    register(options: Record<string, unknown>, component: unknown): unknown
  }
  locale: {
    register(ns: string, dicts: Record<string, Record<string, string>>): () => void
    bind(ns: string): (key: string, params?: Record<string, string | number>) => string
    /** Active UI language; absent on older client compositions. */
    getSnapshot?(): { active: string }
  }
  effect(execute: () => () => unknown, label?: string): unknown
}

export interface ClientPlugin {
  inject: string[]
  apply(ctx: ClientContext): void
}

/**
 * The UI language the account balance call reports. The locale service owns the
 * active language; the navigator is only a fallback for a composition without
 * its snapshot, and `en-US` is the last resort.
 */
function activeLocaleOf(ctx: ClientContext): string {
  const snapshot = ctx.locale.getSnapshot?.()
  if (typeof snapshot?.active === 'string' && snapshot.active.length > 0) return snapshot.active
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.language === 'string' &&
    navigator.language.length > 0
  ) {
    return navigator.language
  }
  return 'en-US'
}

/**
 * Entry point the esbuild footer calls: `return __dshWalletPill.create(require)`.
 * The factory stays free of side effects; everything is registered in `apply`.
 */
export function create(_require: (id: string) => unknown): ClientPlugin {
  return {
    inject: ['slots', 'locale'],
    apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, dictionaries), 'wallet-pill: dictionaries')

      ctx.effect(() => {
        // The browser is the only place this half runs; the guard keeps the
        // module importable from a non-DOM test runner.
        if (typeof document === 'undefined') return () => undefined
        const tag = document.createElement('style')
        tag.dataset.plugin = NS
        tag.dataset.pluginCss = `${NS}/pill.css`
        tag.textContent = STYLES
        document.head.appendChild(tag)
        return () => tag.remove()
      }, 'wallet-pill: pill styles')

      const t = ctx.locale.bind(NS)
      const locale = (): string => activeLocaleOf(ctx)

      ctx.slots.inject(SLOT, () =>
        ctx.slots.register(
          {
            name: SLOT,
            id: NS,
            order: 2,
            locale: NS,
            inject: () => ({ t, locale }),
          },
          WalletPill,
        ),
      )
    },
  }
}
