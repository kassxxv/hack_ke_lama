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
  const opacity = useTransform(x, [-120, 0, 120], [0.6, 1, 0.6])
  const constraintsRef = useRef(null)

  function handleDragEnd(_: unknown, info: { offset: { x: number }; velocity: { x: number } }) {
    const { offset, velocity } = info
    if (offset.x < -80 || velocity.x < -0.5) {
      if (onSwipeLeft) {
        animate(x, -400, { duration: 0.2 })
        setTimeout(() => { router.push(onSwipeLeft); x.set(0) }, 180)
      } else {
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 40 })
      }
    } else if (offset.x > 80 || velocity.x > 0.5) {
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
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        style={{ x, opacity }}
      >
        {children}
      </motion.div>
    </div>
  )
}
