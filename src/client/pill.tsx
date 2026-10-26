/**
 * The composer-dock pill and its pricing panel.
 *
 * Data flow: one GET to the Host route on mount, then every 60 s while the page
 * is visible, plus a manual refresh from the panel. The pill is hidden entirely
 * when no API key is configured — there is nothing to show and no button to
 * press.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'

import { readState, type StatePayload } from './api'
import { formatClock, formatMoney, formatPrice, splitDuration } from './format'
import type { Translate } from './locales'

const POLL_INTERVAL_MS = 60_000
const PANEL_WIDTH = 320
const PANEL_MARGIN = 8

export interface WalletPillProps {
  t: Translate
}

interface WalletView {
  value?: StatePayload
  error?: string
  loading: boolean
}

interface Point {
  left: number
  top: number
}

/** Wallet glyph; monochrome so it follows the dock's own label colour. */
function WalletGlyph() {
  return (
    <svg
      className="wp-glyph"
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
  )
}

/** Poll the Host while the page is visible; expose a manual refresh. */
function useWalletState(): WalletView & { refresh: () => void } {
  const [view, setView] = useState<WalletView>({ loading: true })
  const latest = useRef<StatePayload>()
  const alive = useRef(true)
  const inflight = useRef<AbortController>()

  const load = useCallback((refresh: boolean) => {
    inflight.current?.abort()
    const controller = new AbortController()
    inflight.current = controller
    setView((previous) => ({ ...previous, loading: true }))

    readState(refresh, controller.signal)
      .then((value) => {
        if (!alive.current || controller.signal.aborted) return
        latest.current = value
        setView({ value, loading: false })
      })
      .catch((error: unknown) => {
        if (!alive.current || controller.signal.aborted) return
        const message = error instanceof Error ? error.message : String(error)
        setView({ value: latest.current, error: message, loading: false })
      })
  }, [])

  useEffect(() => {
    alive.current = true
    load(false)

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') load(false)
    }, POLL_INTERVAL_MS)
    const onVisibility = (): void => {
      if (document.visibilityState === 'visible') load(false)
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      alive.current = false
      inflight.current?.abort()
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [load])

  const refresh = useCallback(() => load(true), [load])
  return { ...view, refresh }
}

/** Place the portal above the pill, kept inside the viewport. */
function useAnchoredPosition(
  open: boolean,
  anchor: RefObject<HTMLElement>,
  panel: RefObject<HTMLElement>,
  resyncKey: unknown,
): Point | undefined {
  const [position, setPosition] = useState<Point>()

  useLayoutEffect(() => {
    if (!open) {
      setPosition(undefined)
      return
    }
    const place = (): void => {
      const anchorRect = anchor.current?.getBoundingClientRect()
      if (anchorRect === undefined) return
      const panelRect = panel.current?.getBoundingClientRect()
      const width = panelRect?.width ?? PANEL_WIDTH
      const height = panelRect?.height ?? 220
      const maxLeft = Math.max(PANEL_MARGIN, window.innerWidth - width - PANEL_MARGIN)
      const left = Math.min(
        Math.max(PANEL_MARGIN, anchorRect.left + anchorRect.width / 2 - width / 2),
        maxLeft,
      )
      const top = Math.max(PANEL_MARGIN, anchorRect.top - height - PANEL_MARGIN)
      setPosition((previous) =>
        previous !== undefined &&
        Math.abs(previous.left - left) < 0.5 &&
        Math.abs(previous.top - top) < 0.5
          ? previous
          : { left, top },
      )
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, anchor, panel, resyncKey])

  return position
}

/** Close on Escape or a pointer press outside the pill and panel. */
function useDismiss(
  open: boolean,
  pill: RefObject<HTMLElement>,
  panel: RefObject<HTMLElement>,
  close: () => void,
): void {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      close()
      pill.current?.focus()
    }
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as Node | null
      if (target === null) return
      if (panel.current?.contains(target) === true) return
      if (pill.current?.contains(target) === true) return
      close()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [open, pill, panel, close])
}

/** Milliseconds until the next zone edge, ticked once per second while open. */
function useCountdown(target: number | null): number | null {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (target === null) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [target])
  return target === null ? null : Math.max(0, target - now)
}

function formatCountdown(ms: number, t: Translate): string {
  const parts = splitDuration(ms)
  const label = (key: string, n: number): string => t(key, { n })
  if (parts.hours > 0) {
    return `${label('duration.hour', parts.hours)} ${label('duration.minute', parts.minutes)}`
  }
  if (parts.minutes > 0) {
    return `${label('duration.minute', parts.minutes)} ${label('duration.second', parts.seconds)}`
  }
  return label('duration.second', parts.seconds)
}

function balanceErrorText(code: string, t: Translate): string {
  if (code === 'timeout') return t('error.timeout')
  if (code === 'network') return t('error.network')
  if (code === 'malformed') return t('error.malformed')
  if (code === 'http-401' || code === 'http-403') return t('error.unauthorized')
  return t('error.generic', { code })
}

interface PanelProps {
  value: StatePayload
  error?: string
  loading: boolean
  onRefresh: () => void
  t: Translate
}

function WalletPanel({ value, error, loading, onRefresh, t }: PanelProps) {
  const models = value.pricing.models
  const [selectedModel, setSelectedModel] = useState<string>(models[0]?.id ?? '')
  const model = models.find((entry) => entry.id === selectedModel) ?? models[0]
  const remaining = useCountdown(value.pricing.nextChangeAt)
  const zone = value.pricing.zone
  const balance = value.balance

  const money =
    balance.status === 'ready' ? formatMoney(balance.wallet.total, balance.wallet.currency) : '—'

  return (
    <>
      <div className="wp-head">
        <span className="wp-title">{t('panel.title')}</span>
        <span className="wp-amount" data-wallet-balance={balance.status}>
          {money}
        </span>
      </div>

      {balance.status === 'ready' ? (
        <dl className="wp-rows">
          <dt>{t('panel.toppedUp')}</dt>
          <dd>{formatMoney(balance.wallet.toppedUp, balance.wallet.currency)}</dd>
          <dt>{t('panel.granted')}</dt>
          <dd>{formatMoney(balance.wallet.granted, balance.wallet.currency)}</dd>
        </dl>
      ) : null}

      {balance.status === 'error' ? (
        <p className="wp-error">{balanceErrorText(balance.code, t)}</p>
      ) : null}

      {error !== undefined ? (
        <p className="wp-note">
          {t('panel.stale')} · {error}
        </p>
      ) : null}

      <div className="wp-rule" aria-hidden="true" />

      <div className="wp-zone">
        <span className="wp-chip" data-zone={zone}>
          {zone === 'peak' ? t('panel.zone.peak') : t('panel.zone.offPeak')}
        </span>
        <span>
          {remaining === null
            ? t('panel.zone.flat')
            : t('panel.zone.switchIn', { time: formatCountdown(remaining, t) })}
        </span>
      </div>

      <div className="wp-section-title">{t('panel.prices')}</div>

      {models.length > 1 ? (
        <div className="wp-tabs" role="tablist" aria-label={t('panel.price.model')}>
          {models.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              className="wp-tab"
              data-active={entry.id === model?.id}
              aria-selected={entry.id === model?.id}
              onClick={() => setSelectedModel(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>
      ) : null}

      {model !== undefined ? (
        <table className="wp-table">
          <thead>
            <tr>
              <th scope="col">{t('panel.price.model')}</th>
              <th scope="col" data-active={zone === 'off-peak'}>
                {t('panel.price.offPeak')}
              </th>
              <th scope="col" data-active={zone === 'peak'}>
                {t('panel.price.peak')}
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: t('panel.price.hit'), range: model.hit },
              { label: t('panel.price.miss'), range: model.miss },
              { label: t('panel.price.out'), range: model.out },
            ].map((row) => {
              const [offPeak, peak] = row.range
              return (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{formatPrice(offPeak)}</td>
                  <td>{formatPrice(peak)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : null}

      <div className="wp-foot">
        <span className="wp-meta">
          <span>
            {balance.status === 'ready'
              ? t('panel.updated', { time: formatClock(balance.at) })
              : '—'}
          </span>
          <span>{t('panel.tableVersion', { version: value.pricing.tableVersion })}</span>
        </span>
        <button type="button" className="wp-refresh" disabled={loading} onClick={onRefresh}>
          {loading ? t('panel.refreshing') : t('panel.refresh')}
        </button>
      </div>
    </>
  )
}

export function WalletPill({ t }: WalletPillProps) {
  const { value, error, loading, refresh } = useWalletState()
  const [open, setOpen] = useState(false)
  const pillRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const position = useAnchoredPosition(open, pillRef, panelRef, value)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, pillRef, panelRef, close)

  // Nothing to show until the first read lands, and nothing to show at all when
  // the deployment has no API key.
  if (value === undefined) return null
  if (value.balance.status === 'no-key') return null

  const stale = error !== undefined || value.balance.status === 'error'
  const label =
    value.balance.status === 'ready'
      ? `${t('pill.balance')} ${formatMoney(value.balance.wallet.total, value.balance.wallet.currency)}`
      : `${t('pill.balance')} —`

  return (
    <>
      <button
        ref={pillRef}
        type="button"
        className="wp-pill"
        data-wallet-pill="pill"
        data-stale={stale}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <WalletGlyph />
        <span>{label}</span>
        {stale ? <span className="wp-dot" aria-hidden="true" /> : null}
      </button>

      {open
        ? createPortal(
            <div
              ref={panelRef}
              className="wp-panel"
              role="dialog"
              aria-label={t('panel.title')}
              // Geometry only: a portal cannot be positioned from the stylesheet.
              style={{
                left: position?.left ?? -9999,
                top: position?.top ?? -9999,
                visibility: position === undefined ? 'hidden' : 'visible',
              }}
            >
              <WalletPanel
                value={value}
                error={error}
                loading={loading}
                onRefresh={refresh}
                t={t}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
