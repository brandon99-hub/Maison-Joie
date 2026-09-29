"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/providers"
import { toast } from "sonner"

interface Bundle {
  id: number
  name: string
  description: string
  product_ids: number[]
  original_price: number
  bundle_price: number
  savings: number
  bundle_image?: string
  products?: { id: number; name: string; images: string[] }[]
}

export function BundleCard({ bundle }: { bundle: Bundle }) {
  const { addItem } = useCart()

  const handleAddBundle = async () => {
    try {
      // Fetch product details
      const response = await fetch(`/api/bundles/${bundle.id}/products`)
      if (!response.ok) throw new Error("Failed to fetch products")

      const { products } = await response.json()

      // Calculate discounted price per product
      const discountedPricePerProduct = Math.round(bundle.bundle_price / products.length)

      // Get bundle image or fall back to the first product's own image
      const bundleImage = bundle.bundle_image || products.find((p: any) => p.images?.[0])?.images?.[0] || ""

      // Add each product to cart with bundle price
      products.forEach((product: any) => {
        addItem({
          product_id: product.id,
          name: product.name,
          price: discountedPricePerProduct,
          image: bundleImage,
          quantity: 1,
          is_bundle: true,
        })
      })

      // Show success toast
      setTimeout(() => {
        toast.success(
          `${bundle.name} added to cart! 🎉`,
          {
            description: `${products.length} items • Save KES ${bundle.savings.toLocaleString()}`,
            action: {
              label: "View Cart",
              onClick: () => window.location.href = "/cart"
            }
          }
        )
      }, 100)
    } catch (error) {
      console.error("Error adding bundle to cart:", error)
      toast.error("Failed to add bundle to cart")
    }
  }

  // Get bundle image or fall back to the first product's own image
  const bundleImage = bundle.bundle_image || bundle.products?.find((p) => p.images?.[0])?.images?.[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Bundle Image */}
      <div className="relative w-full h-48 bg-gradient-to-br from-rose-50 to-pink-50">
        {bundleImage ? (
          <Image
            src={bundleImage}
            alt={bundle.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-rose-300" />
          </div>
        )}
        {/* Savings badge */}
        <div className="absolute top-3 right-3 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
          <Sparkles className="w-3 h-3" />
          Save KES {bundle.savings.toLocaleString()}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{bundle.name}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{bundle.description}</p>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl font-bold text-rose-500">KES {bundle.bundle_price.toLocaleString()}</span>
          <span className="text-sm line-through text-muted-foreground">KES {bundle.original_price.toLocaleString()}</span>
        </div>

        <Button onClick={handleAddBundle} className="w-full bg-rose-500 hover:bg-rose-600" size="sm">
          Add Bundle to Cart
        </Button>
      </div>
    </motion.div>
  )
}
