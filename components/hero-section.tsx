"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RotatingCategoryButton } from "@/components/rotating-category-button"
import { WHATSAPP_NUMBER } from "@/lib/whatsapp"

export function HeroSection() {

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-rose-50 via-pink-50/30 to-background py-12 sm:py-16 md:py-24">
      {/* Decorative elements */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-6 sm:top-10 right-6 sm:right-10 text-rose-200"
      >
        <Sparkles className="h-6 w-6 sm:h-8 sm:w-8" />
      </motion.div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-16 sm:bottom-20 left-6 sm:left-10 text-rose-200"
      >
        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-600 text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6 shadow-sm">
            New drops every week <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-3xl sm:text-4xl md:text-6xl font-black mb-4 sm:mb-6 text-balance leading-tight px-2"
        >
          Fragrances
          <br />
          <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
            that hit different
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-muted-foreground text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-md mx-auto text-pretty px-4"
        >
          Stay iconic. Stay unforgettable. 💕
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0"
        >
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-200 h-12 sm:h-11 text-base font-bold rounded-xl"
          >
            <Link href="/shop">
              Shop Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          {/* Rotating Category Button */}
          <RotatingCategoryButton className="w-full sm:w-44 h-12 sm:h-11 text-base" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 sm:mt-8 text-xs sm:text-sm text-muted-foreground px-4"
        >
          WhatsApp us at{" "}
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-rose-500 hover:underline font-medium"
          >
            +{WHATSAPP_NUMBER}
          </a>
        </motion.p>
      </div>
    </section>
  )
}
