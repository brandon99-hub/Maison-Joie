"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ShoppingBag } from "lucide-react"
import type { Product } from "@/lib/db"
import { WishlistButton } from "@/components/wishlist-button"
import { useCart } from "@/providers"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { optimizeCloudinaryUrl } from "@/lib/cloudinary"

interface ProductWithStock extends Product {
  stock_quantity?: number
}

export function ProductCard({ product, priority = false }: { product: ProductWithStock; priority?: boolean }) {
  const isLowStock = product.stock_quantity !== undefined && product.stock_quantity <= 5 && product.stock_quantity > 0
  const isOutOfStock = product.stock_quantity !== undefined && product.stock_quantity === 0
  const { addItem } = useCart()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation
    e.stopPropagation()

    if (isOutOfStock) return

    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images[0] || "/placeholder.svg",
    })

    toast.success(`${product.name} added to cart!`, {
      description: "View cart to checkout",
      action: {
        label: "View Cart",
        onClick: () => window.location.href = "/cart",
      },
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="relative group"
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className="aspect-square rounded-2xl overflow-hidden bg-muted mb-3 relative">
          <Image
            src={optimizeCloudinaryUrl(product.images[0] || "/placeholder.svg?height=400&width=400")}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Desktop: Hover overlay with Add to Cart */}
          <div className="hidden md:flex absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 items-center justify-center">
            <Button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="bg-white text-black hover:bg-gradient-to-r hover:from-rose-500 hover:to-pink-500 hover:text-white transition-all duration-300"
              size="lg"
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              {isOutOfStock ? "Sold Out" : "Add to Cart"}
            </Button>
          </div>

          {isLowStock && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-medium z-10"
            >
              Only {product.stock_quantity} left!
            </motion.span>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <span className="bg-background text-foreground text-sm px-3 py-1.5 rounded-full font-medium">
                Sold Out
              </span>
            </div>
          )}
          {product.is_secret && (
            <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full z-10">
              Secret
            </span>
          )}
        </div>

        <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">
          {product.name}
        </h3>
        <p className="text-primary font-semibold">KES {product.price.toLocaleString()}</p>
      </Link>

      {/* Mobile: Always visible Add to Cart button */}
      <div className="md:hidden mt-2">
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          size="sm"
          className="w-full"
          variant={isOutOfStock ? "secondary" : "default"}
        >
          <ShoppingBag className="mr-1 h-4 w-4" />
          {isOutOfStock ? "Sold Out" : "Add to Cart"}
        </Button>
      </div>

      {/* Wishlist button - positioned absolutely */}
      <div className="absolute top-2 right-2 z-20">
        <WishlistButton productId={product.id} variant="icon" />
      </div>
    </motion.div>
  )
}
