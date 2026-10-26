/**
 * dsh-wallet-pill — Client half.
 *
 * Scaffold stage: registers the composer-dock entry with a static placeholder,
 * so the bundle wrapper, the slot wiring, the injected translator, the locale
 * namespace and the injected stylesheet are all verifiable end to end before
 * any feature exists. Balance fetching and the pricing panel replace the
 * placeholder later.
 */
import { STYLES } from './styles'

/** Locale namespace; also the slot id, so `data-composer-stat` matches the row. */
const NS = 'wallet-pill'

/** Slot the pill lives in: the ambient row under the composer card. */
const SLOT = 'conversation.composer.dock'

type Translate = (key: string, params?: Record<string, string | number>) => string

const dictionaries = {
  zh: {
    'pill.placeholder': '余额',
  },
  en: {
    'pill.placeholder': 'Balance',
  },
}

/**
 * Static placeholder pill. Monochrome and token-colored on purpose: the dock
 * renders pills in the host's own label color, so the glyph follows light/dark
 * without a hardcoded brand color. All presentation lives in `styles.ts`.
 */
function WalletPillPlaceholder({ t }: { t: Translate }) {
  return (
    <span data-wallet-pill="placeholder">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="6" width="18" height="13" rx="3.5" />
        <path d="M3 10.5h18" />
        <circle cx="17" cy="14.75" r="1.25" fill="currentColor" stroke="none" />
      </svg>
      <span>{t('pill.placeholder')}</span>
    </span>
  )
}

export interface ClientContext {
  slots: {
    inject(name: string, register: () => unknown): unknown
    register(options: Record<string, unknown>, component: unknown): unknown
  }
  locale: {
    register(ns: string, dicts: Record<string, Record<string, string>>): () => void
    bind(ns: string): Translate
  }
  effect(execute: () => () => unknown, label?: string): unknown
}

export interface ClientPlugin {
  inject: string[]
  apply(ctx: ClientContext): void
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

      ctx.slots.inject(SLOT, () =>
        ctx.slots.register(
          {
            name: SLOT,
            id: NS,
            order: 2,
            locale: NS,
            inject: () => ({ t }),
          },
          WalletPillPlaceholder,
        ),
      )
    },
  }
}
