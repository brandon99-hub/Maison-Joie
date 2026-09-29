"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useCategories } from "@/hooks/use-categories"

interface RotatingCategoryButtonProps {
  className?: string
  size?: "default" | "sm" | "lg"
}

export function RotatingCategoryButton({ className, size = "lg" }: RotatingCategoryButtonProps) {
  const { categories } = useCategories()
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)

  useEffect(() => {
    if (categories.length === 0) return

    const interval = setInterval(() => {
      setCurrentCategoryIndex((prev) => (prev + 1) % categories.length)
    }, 2500)

    return () => clearInterval(interval)
  }, [categories.length])

  if (categories.length === 0) return null

  const currentCategory = categories[currentCategoryIndex % categories.length]

  return (
    <Button
      asChild
      size={size}
      variant="outline"
      className={cn(
        "h-12 border-2 border-rose-200 hover:bg-rose-50/80 text-foreground font-semibold rounded-xl overflow-hidden relative text-center shadow-xs transition-colors shrink-0",
        className
      )}
    >
      <Link href={`/shop?category=${currentCategory.slug}`} className="inline-flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.span
            key={currentCategoryIndex}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="inline-block whitespace-nowrap"
          >
            {currentCategory.name}
          </motion.span>
        </AnimatePresence>
      </Link>
    </Button>
  )
}
