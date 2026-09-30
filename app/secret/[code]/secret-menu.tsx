"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Lock, Clock, ShoppingBag, Check, Gift, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/providers"
import type { SecretCode, Product } from "@/lib/db"
import { toast } from "sonner"
import { CountdownTimer } from "@/components/countdown-timer"

function SecretRevealAnimation({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500),  // Lock spinning (faster)
      setTimeout(() => setStep(2), 1200), // Unlock (faster)
      setTimeout(() => setStep(3), 1800), // Sparkles explosion (faster)
      setTimeout(() => onComplete(), 2600), // Complete (faster - removed text step)
    ]
    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="lock"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="text-rose-500"
          >
            <Lock className="w-24 h-24" />
          </motion.div>
        )}
        {step === 1 && (
          <motion.div
            key="unlock"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-amber-400"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Sparkles className="w-24 h-24" />
            </motion.div>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div
            key="sparkles"
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.5, 1.2] }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <Sparkles className="w-32 h-32 text-amber-400" />
            {/* Particle effect simulation */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * Math.PI) / 4) * 100,
                  y: Math.sin((i * Math.PI) / 4) * 100,
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute top-1/2 left-1/2 w-2 h-2 bg-amber-400 rounded-full"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function SecretMenuPage({
  secretCode,
  products,
  isExpired,
  alreadyScanned,
}: {
  secretCode: SecretCode
  products: Product[]
  isExpired: boolean
  alreadyScanned: boolean
}) {
  const router = useRouter()
  const [showReveal, setShowReveal] = useState(true)
  const [revealed, setRevealed] = useState(false)
  const { addItem, totalItems } = useCart()
  const [addedProducts, setAddedProducts] = useState<Set<number>>(new Set())

  // Each secret product carries its own discount rate, falling back to the
  // code's default rate (set from app_settings at generation time) if unset.
  const getDiscountPercent = (product: Product) =>
    product.secret_discount_percent ?? secretCode.discount_percent ?? 0

  // Calculate total potential savings
  const totalSavings = products.reduce((sum, product) => {
    return sum + (product.price * getDiscountPercent(product) / 100)
  }, 0)

  // Store secret code in localStorage for checkout tracking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_secret_code', secretCode.code)
    }
  }, [secretCode.code])

  const handleAddToCart = (product: Product) => {
    addItem({
      product_id: product.id,
      name: product.name,
      quantity: 1,
      price: product.price * (1 - getDiscountPercent(product) / 100), // Apply this product's own discount
      image: product.images[0] || "/placeholder.svg?height=100&width=100",
    })
    toast.success(`${product.name} added to cart! 🎉`)
    setAddedProducts((prev) => new Set(prev).add(product.id))
    setTimeout(() => {
      setAddedProducts((prev) => {
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
    }, 2000)
  }

  // Premium Error State - Expired
  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-black via-rose-950 to-black text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 10 }}
            className="mb-6"
          >
            <Clock className="w-20 h-20 text-amber-500 mx-auto" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-3">Time's Up</h1>
          <p className="text-white/60 mb-6">
            This secret code has expired. Each code has a limited time to maintain exclusivity.
          </p>
          <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
            <p className="text-sm text-white/80 mb-2">Want another secret code?</p>
            <p className="text-xs text-white/60">
              Make a purchase and you'll get a new secret code with your order!
            </p>
          </div>
          <Button
            onClick={() => router.push('/shop')}
            className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600"
          >
            Browse Regular Shop
          </Button>
        </motion.div>
      </div>
    )
  }

  // Premium Error State - Already Used
  if (secretCode.is_used) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-black via-rose-950 to-black text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 10 }}
            className="mb-6"
          >
            <Lock className="w-20 h-20 text-rose-500 mx-auto" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-3">Already Redeemed</h1>
          <p className="text-white/60 mb-6">
            This secret code has already been used. Each code can only be redeemed once to maintain exclusivity.
          </p>
          <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
            <p className="text-sm text-white/80 mb-2">🎁 Good news!</p>
            <p className="text-xs text-white/60">
              Every purchase comes with a new secret code. Shop now to get your next exclusive access!
            </p>
          </div>
          <Button
            onClick={() => router.push('/shop')}
            className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600"
          >
            Browse Regular Shop
          </Button>
        </motion.div>
      </div>
    )
  }

  // Premium Error State - Already Scanned
  if (alreadyScanned) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-black via-rose-950 to-black text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 10 }}
            className="mb-6"
          >
            <Lock className="w-20 h-20 text-amber-500 mx-auto" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-3">Already Unlocked</h1>
          <p className="text-white/60 mb-4">
            This QR code has already been scanned once.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-400 mb-2">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              One-time scan policy
            </p>
            <p className="text-xs text-white/60">
              Each secret code can only be scanned once to maintain exclusivity.
              If you scanned this code, you should have already seen the secret products!
            </p>
          </div>
          <Button
            onClick={() => router.push('/shop')}
            className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600"
          >
            Browse Regular Shop
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      {showReveal && !revealed && (
        <SecretRevealAnimation
          onComplete={() => {
            setRevealed(true)
            setShowReveal(false)
          }}
        />
      )}

      <div className="min-h-screen bg-gradient-to-b from-black via-rose-950 to-black text-white">
        {/* Consolidated Top Navbar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-white/10"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
            {/* Row 1: Title + Timer */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  Insider Access
                </h1>
                <p className="text-[10px] text-white/40 mt-0.5">One-time use · {secretCode.code}</p>
              </div>
              {secretCode.expires_at && (
                <div className="bg-black/40 border border-amber-500/30 rounded-full px-3 py-1 shrink-0">
                  <CountdownTimer expiresAt={secretCode.expires_at} />
                </div>
              )}
            </div>

            {/* Row 2: Savings + Actions */}
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-amber-500 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                <Gift className="w-3.5 h-3.5" /> Save up to KES {Math.round(totalSavings).toLocaleString()}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <Link href="/shop" className="text-white/60 text-xs md:text-sm hover:text-white transition-colors">
                  Regular Shop
                </Link>
                <Link href="/cart">
                  <Button size="sm" className="bg-rose-500 hover:bg-rose-600 h-8">
                    <ShoppingBag className="w-3.5 h-3.5 mr-1.5" /> Cart{totalItems > 0 ? ` (${totalItems})` : ""}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Products with Optimized Hover */}
        <div className="px-4 pb-12">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-base md:text-lg font-semibold mb-4 text-white/80">Exclusive Drops</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product, i) => {
                const discountedPrice = Math.round(product.price * (1 - getDiscountPercent(product) / 100))
                const savings = product.price - discountedPrice
                const isLowStock = (product.stock_quantity ?? 0) <= 5 && (product.stock_quantity ?? 0) > 0

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="bg-white/5 backdrop-blur rounded-2xl overflow-hidden border border-white/10 hover:border-rose-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/20 will-change-transform"
                    whileHover={{ y: -8 }}
                  >
                    <div className="aspect-square relative group overflow-hidden">
                      <Image
                        src={product.images[0] || "/placeholder.svg?height=300&width=300"}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 will-change-transform group-hover:scale-110"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className="bg-rose-500 text-xs px-2 py-1 rounded-full animate-pulse">✨ Exclusive</span>
                        {isLowStock && (
                          <span className="bg-amber-500 text-xs px-2 py-1 rounded-full font-semibold">
                            Only {product.stock_quantity} left!
                          </span>
                        )}
                      </div>
                      {/* Glow overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-rose-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                      <div className="mb-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-rose-400 font-bold text-sm md:text-base">
                            KES {discountedPrice.toLocaleString()}
                          </span>
                          <span className="text-white/40 text-xs line-through">KES {product.price.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-green-400 mt-1">Save KES {savings.toLocaleString()}</p>
                      </div>
                      <Button
                        onClick={() => handleAddToCart(product)}
                        size="sm"
                        className="w-full bg-white text-black hover:bg-white/90"
                        disabled={(product.stock_quantity ?? 0) === 0}
                      >
                        <AnimatePresence mode="wait">
                          {(product.stock_quantity ?? 0) === 0 ? (
                            <span className="text-red-500">Sold Out</span>
                          ) : addedProducts.has(product.id) ? (
                            <motion.span
                              key="added"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center"
                            >
                              <Check className="w-4 h-4 mr-1" /> Added
                            </motion.span>
                          ) : (
                            <motion.span
                              key="add"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center"
                            >
                              <ShoppingBag className="w-4 h-4 mr-1" /> Add
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Button>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {products.length === 0 && (
              <div className="text-center py-12 text-white/60">
                <p>No secret items available right now</p>
                <p className="text-sm mt-2">Check back soon for new drops!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
