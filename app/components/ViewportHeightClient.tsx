'use client'

import { useEffect } from 'react'

function getBestViewportHeightPx(): number {
  if (typeof window === 'undefined') return 0

  // Prefer VisualViewport when available (tracks address bar / keyboard changes better).
  const vv = window.visualViewport
  if (vv?.height && Number.isFinite(vv.height)) return Math.round(vv.height)

  if (Number.isFinite(window.innerHeight)) return Math.round(window.innerHeight)
  return 0
}

export default function ViewportHeightClient() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const apply = () => {
      const h = getBestViewportHeightPx()
      if (h > 0) document.documentElement.style.setProperty('--app-height', `${h}px`)
    }

    apply()

    const vv = window.visualViewport
    const onResize = () => apply()

    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('orientationchange', onResize, { passive: true } as AddEventListenerOptions)

    // VisualViewport can change on scroll (address bar collapse) and keyboard open.
    vv?.addEventListener('resize', onResize, { passive: true })
    vv?.addEventListener('scroll', onResize, { passive: true })

    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize as EventListener)
      vv?.removeEventListener('resize', onResize as EventListener)
      vv?.removeEventListener('scroll', onResize as EventListener)
    }
  }, [])

  return null
}


