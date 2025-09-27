'use client'

import { motion, useMotionValue, useTransform } from 'framer-motion'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

type Props = {
  quote: string
  name: string
  role: string
  company: string
  avatar: string
  rating?: number
}

export default function TestimonialCard({ quote, name, role, company, avatar, rating = 5 }: Props) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useTransform(y, [-50, 50], [8, -8])
  const rotateY = useTransform(x, [-50, 50], [-8, 8])

  const onMouseMove = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const posX = e.clientX - rect.left - rect.width / 2
    const posY = e.clientY - rect.top - rect.height / 2
    x.set(posX)
    y.set(posY)
  }

  const onMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className="[perspective:1000px]"
    >
      <Card className="relative overflow-hidden border-border/60 bg-card/70 backdrop-blur-sm">
        <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-tr from-blue-600/20 to-purple-600/20 blur-2xl" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-gradient-to-tr from-purple-600/20 to-blue-600/20 blur-2xl" />
        </div>
        <CardContent className="p-6">
          <blockquote className="text-foreground text-base leading-relaxed">
            “{quote}”
          </blockquote>
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-full ring-1 ring-border">
                <Image src={avatar} alt={`${name} avatar`} fill sizes="48px" />
              </div>
              <div>
                <div className="font-semibold text-foreground">{name}</div>
                <div className="text-sm text-muted-foreground">{role} · {company}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-yellow-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < rating ? 'fill-yellow-500' : 'opacity-30'}`} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}


