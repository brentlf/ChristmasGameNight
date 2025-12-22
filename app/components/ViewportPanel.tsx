'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo } from 'react'
import { useViewportInfo } from '@/lib/hooks/useViewportInfo'

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 py-1.5 border-b border-white/10 last:border-b-0">
      <div className="text-white/70 text-sm">{k}</div>
      <div className="text-white font-mono text-sm tabular-nums text-right">{v}</div>
    </div>
  )
}

export default function ViewportPanel({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const info = useViewportInfo()

  const pretty = useMemo(() => {
    const vv = info.visualViewportHeight != null && info.visualViewportWidth != null
    const vvStr = vv
      ? `${Math.round(info.visualViewportWidth!)}×${Math.round(info.visualViewportHeight!)}`
      : 'n/a'
    return {
      windowStr: `${info.windowInnerWidth}×${info.windowInnerHeight}`,
      docStr: `${info.documentClientWidth}×${info.documentClientHeight}`,
      vvStr,
    }
  }, [info])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Close viewport details"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="absolute left-2 right-2 sm:left-4 sm:right-auto sm:top-4 top-2 max-w-[min(560px,calc(100vw-1rem))]">
        <div className="rounded-2xl border border-white/20 bg-black/55 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/15">
            <div className="font-black tracking-wide">Viewport</div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-3 py-1.5 text-sm font-semibold bg-white/10 hover:bg-white/15 border border-white/15"
            >
              Close
            </button>
          </div>

          <div className="px-4 py-3">
            <Row k="window.inner" v={pretty.windowStr} />
            <Row k="documentElement.client" v={pretty.docStr} />
            <Row k="visualViewport" v={pretty.vvStr} />
            <Row k="visualViewport.scale" v={info.visualViewportScale ?? 'n/a'} />
            <Row
              k="visualViewport.offset"
              v={
                info.visualViewportOffsetTop != null && info.visualViewportOffsetLeft != null
                  ? `${Math.round(info.visualViewportOffsetLeft)} / ${Math.round(info.visualViewportOffsetTop)}`
                  : 'n/a'
              }
            />
            <Row k="devicePixelRatio" v={info.devicePixelRatio} />
            <Row k="--app-height" v={info.appHeight || 'n/a'} />
            <Row
              k="safe-area (t r b l)"
              v={`${info.safeAreaTop || '0'} ${info.safeAreaRight || '0'} ${info.safeAreaBottom || '0'} ${info.safeAreaLeft || '0'}`}
            />
          </div>

          <div className="px-4 pb-4 text-xs text-white/60">
            Tip: on mobile, “visualViewport” is the visible area (after address bar/keyboard), and
            this app sizes to it via <span className="font-mono">--app-height</span>.
          </div>
        </div>
      </div>
    </div>
  )
}


