import { useState, useEffect, useRef } from 'react'

/**
 * Basit fixed-height satır virtualizer.
 * Sadece görünen satırları + overscan kadar ekstra satırı render eder.
 */
export function useVirtual({ count, rowHeight = 36, overscan = 8, scrollRef }) {
  const [range, setRange] = useState({ start: 0, end: 50 })
  const frameRef = useRef(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function recalc() {
      const { scrollTop, clientHeight } = el
      const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
      const end = Math.min(count - 1, Math.ceil((scrollTop + clientHeight) / rowHeight) + overscan)
      setRange(prev => (prev.start === start && prev.end === end ? prev : { start, end }))
    }

    function onScroll() {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      frameRef.current = requestAnimationFrame(recalc)
    }

    recalc()
    el.addEventListener('scroll', onScroll, { passive: true })
    const ro = new ResizeObserver(recalc)
    ro.observe(el)

    return () => {
      el.removeEventListener('scroll', onScroll)
      ro.disconnect()
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [scrollRef, count, rowHeight, overscan])

  // Scroll sayısı değişince range'i sıfırla
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = 0
    setRange({ start: 0, end: Math.min(count - 1, 50) })
  }, [count])

  const totalHeight = count * rowHeight
  const paddingTop = range.start * rowHeight
  const paddingBottom = Math.max(0, totalHeight - (range.end + 1) * rowHeight)

  return { start: range.start, end: range.end, paddingTop, paddingBottom, totalHeight }
}
