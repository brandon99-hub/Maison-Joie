"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Sparkles, Copy, Check, Share2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Order, GiftCard } from "@/lib/db"

// Confetti component
function Confetti() {
  const colors = ["#f43f5e", "#fbbf24", "#a855f7", "#3b82f6", "#10b981"]

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{
            opacity: 1,
            x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 400),
            y: -20,
            rotate: 0,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            opacity: 0,
            y: (typeof window !== "undefined" ? window.innerHeight : 800) + 20,
            rotate: Math.random() * 360,
          }}
          transition={{
            duration: Math.random() * 2 + 2,
            delay: Math.random() * 0.5,
            ease: "easeOut",
          }}
          className="absolute w-3 h-3 rounded-sm"
          style={{ backgroundColor: colors[i % colors.length] }}
        />
      ))}
    </div>
  )
}

// Scratch card component
function ScratchCard({ onReveal, giftValue }: { onReveal: () => void; giftValue: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScratching, setIsScratching] = useState(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw scratch overlay
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, "#f43f5e")
    gradient.addColorStop(0.5, "#ec4899")
    gradient.addColorStop(1, "#f97316")

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add sparkle pattern
    ctx.fillStyle = "rgba(255,255,255,0.3)"
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fill()
    }

    // Add text
    ctx.fillStyle = "white"
    ctx.font = "bold 18px system-ui"
    ctx.textAlign = "center"
    ctx.fillText("Scratch to reveal!", canvas.width / 2, canvas.height / 2)
  }, [])

  const scratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (revealed) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    let x, y

    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    ctx.globalCompositeOperation = "destination-out"
    ctx.beginPath()
    ctx.arc(x, y, 25, 0, Math.PI * 2)
    ctx.fill()

    // Calculate scratched percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let transparent = 0
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparent++
    }
    const percent = (transparent / (imageData.data.length / 4)) * 100

    if (percent > 50 && !revealed) {
      setRevealed(true)
      onReveal()
    }
  }

  return (
    <div className="relative w-full max-w-xs mx-auto">
      {/* Gift card content underneath */}
      <div className="bg-gradient-to-br from-amber-100 to-rose-100 rounded-2xl p-6 text-center">
        <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-1">Your gift card value</p>
        <p className="text-4xl font-bold text-foreground">KES {giftValue}</p>
      </div>

      {/* Scratch overlay */}
      {!revealed && (
        <canvas
          ref={canvasRef}
          width={280}
          height={140}
          className="absolute inset-0 w-full h-full rounded-2xl cursor-pointer touch-none"
          onMouseDown={() => setIsScratching(true)}
          onMouseUp={() => setIsScratching(false)}
          onMouseLeave={() => setIsScratching(false)}
          onMouseMove={(e) => isScratching && scratch(e)}
          onTouchStart={() => setIsScratching(true)}
          onTouchEnd={() => setIsScratching(false)}
          onTouchMove={scratch}
        />
      )}
    </div>
  )
}

export function GiftCardReveal({ order, giftCard }: { order: Order; giftCard: GiftCard | null }) {
  const [revealed, setRevealed] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleReveal = () => {
    setRevealed(true)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }

  const copyCode = () => {
    if (giftCard) {
      navigator.clipboard.writeText(giftCard.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareOrder = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "I just got a gift card from MAISON JOIE!",
          text: `Just ordered some goodies and got a KES ${giftCard?.value} gift card!`,
          url: window.location.href,
        })
      } catch (err) {
        console.log("Share cancelled")
      }
    }
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-b from-rose-50 to-background">
      {showConfetti && <Confetti />}

      <div className="container mx-auto max-w-lg text-center">
        {/* Success header with actual gift card image */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
          <Image
            src="/gift-card.jpeg"
            alt="Thank You Bestie"
            width={400}
            height={300}
            className="rounded-2xl shadow-lg mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold mb-2">Thank you, {order.customer_name}!</h1>
          <p className="text-muted-foreground">Your order has been confirmed</p>
        </motion.div>

        {/* Gift card section */}
        {giftCard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-xl font-semibold mb-4">You got a gift!</h2>

            <AnimatePresence mode="wait">
              {!revealed ? (
                <motion.div key="scratch" exit={{ opacity: 0, scale: 0.9 }}>
                  <ScratchCard onReveal={handleReveal} giftValue={giftCard.value} />
                  <p className="text-sm text-muted-foreground mt-4">Scratch the card to reveal your reward</p>
                </motion.div>
              ) : (
                <motion.div
                  key="revealed"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  {/* Revealed gift card */}
                  <div className="bg-gradient-to-br from-amber-100 via-rose-100 to-pink-100 rounded-2xl p-6 shadow-lg border border-rose-200">
                    <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">You won</p>
                    <p className="text-4xl font-bold text-foreground mb-4">KES {giftCard.value}</p>

                    <div className="bg-white/60 rounded-xl p-3 mb-4">
                      <p className="text-xs text-muted-foreground mb-1">Gift Code</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-mono font-bold text-lg tracking-wider">{giftCard.code}</span>
                        <button onClick={copyCode} className="p-1 hover:bg-white rounded transition-colors">
                          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">Use this on your next order</p>
                  </div>

                  {/* Share button */}
                  <Button
                    variant="outline"
                    onClick={shareOrder}
                    className="w-full bg-transparent border-rose-200 text-rose-600 hover:bg-rose-50"
                  >
                    <Share2 className="w-4 h-4 mr-2" /> Share your win
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Order summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-muted rounded-xl p-4 text-left mb-6"
        >
          <h3 className="font-semibold mb-3">Order Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order</span>
              <span className="font-mono">#{order.reference_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="text-green-600 font-medium">Confirmed</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pickup</span>
              <span>{order.pickup_location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Paid</span>
              <span className="font-semibold">KES {order.total_amount.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        {/* What's next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-left mb-8"
        >
          <h3 className="font-semibold mb-3">What&apos;s next?</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </span>
              <p className="text-sm text-muted-foreground">We&apos;re packing your order with love</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </span>
              <p className="text-sm text-muted-foreground">
                You&apos;ll get a WhatsApp message when it&apos;s ready for pickup
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </span>
              <p className="text-sm text-muted-foreground">Look for a QR code in your bag for secret menu access!</p>
            </div>
          </div>
        </motion.div>

        <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90">
          <Link href="/shop">
            Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
