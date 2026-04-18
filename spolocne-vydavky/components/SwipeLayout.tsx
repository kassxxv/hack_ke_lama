'use client'

import { useRouter } from 'next/navigation'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useRef } from 'react'

interface SwipeLayoutProps {
  children: React.ReactNode
  onSwipeLeft?: string
  onSwipeRight?: string
}

export default function SwipeLayout({ children, onSwipeLeft, onSwipeRight }: SwipeLayoutProps) {
  const router = useRouter()
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-150, 0, 150], [0.7, 1, 0.7])
  const constraintsRef = useRef(null)

  function handleDragEnd(_: unknown, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) {
    const { offset, velocity } = info

    // Only treat as horizontal swipe if x movement dominates y (not a scroll)
    const isHorizontal = Math.abs(offset.x) > Math.abs(offset.y) * 2.5 && Math.abs(offset.x) > 30

    if (!isHorizontal) {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 40 })
      return
    }

    if (offset.x < -100 || velocity.x < -0.8) {
      if (onSwipeLeft) {
        animate(x, -400, { duration: 0.2 })
        setTimeout(() => { router.push(onSwipeLeft); x.set(0) }, 180)
      } else {
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 40 })
      }
    } else if (offset.x > 100 || velocity.x > 0.8) {
      if (onSwipeRight) {
        animate(x, 400, { duration: 0.2 })
        setTimeout(() => { router.push(onSwipeRight); x.set(0) }, 180)
      } else {
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 40 })
      }
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 40 })
    }
  }

  return (
    <div ref={constraintsRef} className="overflow-hidden">
      <motion.div
        drag="x"
        dragConstraints={constraintsRef}
        dragElastic={0.08}
        dragDirectionLock
        onDragEnd={handleDragEnd}
        style={{ x, opacity }}
      >
        {children}
      </motion.div>
    </div>
  )
}
