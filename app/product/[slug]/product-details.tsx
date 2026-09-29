"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, Minus, Plus, ShoppingBag, Check, Heart, Share2, ShieldCheck, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCart, useWishlist } from "@/providers"
import type { Product } from "@/lib/db"
import { toast } from "sonner"

export function ProductDetails({ product }: { product: Product }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist: checkWishlist } = useWishlist()

  const isInWishlist = checkWishlist(product.id)
  const inStock = (product.stock_quantity || 0) > 0
  const lowStock = (product.stock_quantity || 0) > 0 && (product.stock_quantity || 0) <= 5

  const handleAddToCart = () => {
    if (!inStock) {
      toast.error("This product is out of stock")
      return
    }

    addItem({
      product_id: product.id,
      name: product.name,
      quantity,
      price: product.price,
      image: product.images[0] || "/placeholder.svg?height=100&width=100",
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleWishlist = () => {
    if (isInWishlist) {
      removeFromWishlist(product.id)
      toast.success("Removed from wishlist")
    } else {
      addToWishlist(product.id)
      toast.success("Added to wishlist")
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        })
      } catch (err) {
        console.log("Share cancelled")
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard!")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/shop"
            className="inline-flex items-center text-sm hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Shop
          </Link>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleWishlist}
              className={`p-2 rounded-full transition-all ${isInWishlist ? "bg-rose-100 text-rose-600" : "bg-muted hover:bg-muted/80"
                }`}
            >
              <Heart className={`h-5 w-5 ${isInWishlist ? "fill-current" : ""}`} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <Share2 className="h-5 w-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content - Side by Side */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-7xl mx-auto">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted"
            >
              <Image
                src={product.images[selectedImage] || "/placeholder.svg?height=800&width=800"}
                alt={product.name}
                fill
                className="object-contain p-8"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />

              {/* Out of Stock Overlay */}
              {!inStock && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <Badge variant="destructive" className="text-lg px-6 py-3 mb-2">
                      Out of Stock
                    </Badge>
                    <p className="text-white text-sm">Notify me when available</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedImage(i)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === selectedImage
                      ? "border-primary shadow-lg scale-105"
                      : "border-muted opacity-60 hover:opacity-100"
                      }`}
                  >
                    <Image src={img || "/placeholder.svg"} alt={`View ${i + 1}`} fill className="object-cover" />
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details */}
          <div className="flex flex-col">
            {/* Category & Stock Status */}
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="capitalize">
                {product.category.replace("-", " ")}
              </Badge>
              {lowStock && inStock && (
                <Badge variant="outline" className="text-amber-600 border-amber-600 animate-pulse">
                  🔥 Only {product.stock_quantity} left
                </Badge>
              )}
            </div>

            {/* Title & Price */}
            <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{product.name}</h1>

            {/* Price Display */}
            <div className="mb-6">
              <div className="flex items-baseline gap-3">
                <p className="text-4xl md:text-5xl font-bold text-primary">
                  KES {(product.price * quantity).toLocaleString()}
                </p>
                {quantity > 1 && (
                  <p className="text-lg text-muted-foreground">
                    KES {product.price.toLocaleString()} × {quantity}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-muted/50 rounded-xl p-4 mb-6">
              <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="flex items-center gap-2 text-sm bg-primary/5 rounded-lg p-3">
                <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="font-medium">100% Authentic</span>
              </div>
              <div className="flex items-center gap-2 text-sm bg-primary/5 rounded-lg p-3">
                <Truck className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="font-medium">Pickup ready</span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between mb-6 bg-muted/30 rounded-xl p-4">
              <span className="font-medium">Quantity</span>
              <div className="flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full bg-background flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50 shadow-sm"
                  disabled={!inStock}
                >
                  <Minus className="h-4 w-4" />
                </motion.button>
                <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuantity(Math.min(product.stock_quantity || 1, quantity + 1))}
                  className="w-10 h-10 rounded-full bg-background flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50 shadow-sm"
                  disabled={!inStock}
                >
                  <Plus className="h-4 w-4" />
                </motion.button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <motion.div whileTap={{ scale: inStock ? 0.98 : 1 }} className="mt-auto">
              <Button
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg"
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                <AnimatePresence mode="wait">
                  {added ? (
                    <motion.span
                      key="added"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center"
                    >
                      <Check className="h-5 w-5 mr-2" /> Added to cart!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="add"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center"
                    >
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      {inStock ? "Add to Cart" : "Out of Stock"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Spacing for Mobile Nav */}
      <div className="h-24 md:h-8" />
    </div>
  )
}
