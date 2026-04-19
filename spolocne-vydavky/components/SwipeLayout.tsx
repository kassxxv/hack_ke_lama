'use client'

import { useRouter } from 'next/navigation'
import { motion, useMotionValue, animate } from 'framer-motion'

interface SwipeLayoutProps {
  children: React.ReactNode
  onSwipeLeft?: string
  onSwipeRight?: string
}

export default function SwipeLayout({ children, onSwipeLeft, onSwipeRight }: SwipeLayoutProps) {
  const router = useRouter()
  const x = useMotionValue(0)

  function handleDragEnd(_: unknown, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) {
    const { offset, velocity } = info

    // Only fire if horizontal movement clearly dominates vertical
    const isHorizontalGesture = Math.abs(offset.x) > Math.abs(offset.y) * 1.5

    const swipedLeft = isHorizontalGesture && (offset.x < -80 || velocity.x < -0.5)
    const swipedRight = isHorizontalGesture && (offset.x > 80 || velocity.x > 0.5)

    if (swipedLeft && onSwipeLeft) {
      animate(x, -window.innerWidth, { duration: 0.2 })
      setTimeout(() => { router.push(onSwipeLeft); x.set(0) }, 200)
    } else if (swipedRight && onSwipeRight) {
      animate(x, window.innerWidth, { duration: 0.2 })
      setTimeout(() => { router.push(onSwipeRight); x.set(0) }, 200)
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 })
    }
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: -100, right: 100 }}
      dragElastic={0.3}
      onDragEnd={handleDragEnd}
      style={{ x, touchAction: 'pan-y' }}
    >
      {children}
    </motion.div>
  )
}
