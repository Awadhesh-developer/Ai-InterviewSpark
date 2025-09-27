'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import TestimonialCard from './TestimonialCard'
import { testimonials } from '@/data/testimonials'

export default function Testimonials() {
  const [isMobile, setIsMobile] = useState(false)
  const [emblaRef] = useEmblaCarousel({ loop: true, align: 'start' }, [Autoplay({ delay: 3500 })])

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.08, duration: 0.5 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  return (
    <section aria-label="User testimonials" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">Loved by Candidates Everywhere</h2>
          <p className="text-lg text-muted-foreground">Real stories from users who leveled up their interview game</p>
        </div>

        {/* Desktop grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {testimonials.map((t) => (
            <motion.div key={t.id} variants={itemVariants}>
              <TestimonialCard
                quote={t.quote}
                name={t.name}
                role={t.role}
                company={t.company}
                avatar={t.avatar}
                rating={t.rating}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Mobile carousel */}
        <div className="md:hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {testimonials.map((t) => (
              <div key={t.id} className="min-w-0 flex-[0_0_85%]">
                <TestimonialCard
                  quote={t.quote}
                  name={t.name}
                  role={t.role}
                  company={t.company}
                  avatar={t.avatar}
                  rating={t.rating}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}


