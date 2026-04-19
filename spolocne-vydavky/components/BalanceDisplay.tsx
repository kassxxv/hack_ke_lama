'use client'

import { useEffect, useRef } from 'react'
import { animate } from 'framer-motion'

interface Props {
  value: number
  fallback: string
}

export default function BalanceDisplay({ value, fallback }: Props) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate(v) {
        const formatted = v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')
        node.textContent = formatted
      },
    })
    return () => controls.stop()
  }, [value])

  return <span ref={ref}>{fallback}</span>
}
