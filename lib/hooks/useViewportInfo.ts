'use client'

import { useEffect, useMemo, useState } from 'react'

type ViewportInfo = {
  now: number
  devicePixelRatio: number
  windowInnerWidth: number
  windowInnerHeight: number
  documentClientWidth: number
  documentClientHeight: number
  visualViewportWidth: number | null
  visualViewportHeight: number | null
  visualViewportScale: number | null
  visualViewportOffsetTop: number | null
  visualViewportOffsetLeft: number | null
  safeAreaTop: string
  safeAreaRight: string
  safeAreaBottom: string
  safeAreaLeft: string
  appHeight: string
}

function readCssVar(name: string): string {
  if (typeof window === 'undefined') return ''
  const v = getComputedStyle(document.documentElement).getPropertyValue(name)
  return v.trim()
}

function snapshot(): ViewportInfo {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null
  const de = typeof document !== 'undefined' ? document.documentElement : null

  return {
    now: Date.now(),
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio ?? 1 : 1,
    windowInnerWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
    windowInnerHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    documentClientWidth: de?.clientWidth ?? 0,
    documentClientHeight: de?.clientHeight ?? 0,
    visualViewportWidth: vv?.width ?? null,
    visualViewportHeight: vv?.height ?? null,
    visualViewportScale: vv?.scale ?? null,
    visualViewportOffsetTop: vv?.offsetTop ?? null,
    visualViewportOffsetLeft: vv?.offsetLeft ?? null,
    safeAreaTop: readCssVar('--safe-top'),
    safeAreaRight: readCssVar('--safe-right'),
    safeAreaBottom: readCssVar('--safe-bottom'),
    safeAreaLeft: readCssVar('--safe-left'),
    appHeight: readCssVar('--app-height'),
  }
}

export function useViewportInfo() {
  const [info, setInfo] = useState<ViewportInfo>(() => snapshot())

  useEffect(() => {
    if (typeof window === 'undefined') return

    const update = () => setInfo(snapshot())
    update()

    const vv = window.visualViewport

    window.addEventListener('resize', update, { passive: true })
    window.addEventListener('orientationchange', update, { passive: true } as AddEventListenerOptions)
    vv?.addEventListener('resize', update, { passive: true })
    vv?.addEventListener('scroll', update, { passive: true })

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update as EventListener)
      vv?.removeEventListener('resize', update as EventListener)
      vv?.removeEventListener('scroll', update as EventListener)
    }
  }, [])

  // Keep appHeight fresh even if only CSS var changes.
  const appHeight = useMemo(() => readCssVar('--app-height'), [info.now])
  return { ...info, appHeight }
}


