"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, ShoppingCart, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/providers"
import { toast } from "sonner"

interface BundleCarouselProps {
    bundles: Array<{
        id: number
        name: string
        description: string
        bundle_price: number
        original_price: number
        savings: number
        bundle_image?: string
        product_ids?: number[]
    }>
}

export function BundleCarousel({ bundles }: BundleCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const { addItem } = useCart()
    const [isAdding, setIsAdding] = useState(false)

    // Auto-advance carousel
    useEffect(() => {
        if (bundles.length === 0) return
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % bundles.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [bundles.length])

    if (bundles.length === 0) return null

    const currentBundle = bundles[currentIndex]
    const bundleImage = currentBundle.bundle_image

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + bundles.length) % bundles.length)
    }

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % bundles.length)
    }

    const handleAddToCart = async () => {
        const bundle = currentBundle
        if (!bundle.product_ids || bundle.product_ids.length === 0) {
            toast.error("This bundle has no products")
            return
        }

        setIsAdding(true)
        try {
            // Fetch product details
            const response = await fetch(`/api/bundles/${bundle.id}/products`)
            if (!response.ok) throw new Error("Failed to fetch products")

            const { products } = await response.json()

            // Calculate discounted price per product
            const discountedPricePerProduct = Math.round(bundle.bundle_price / products.length)

            // Add each product to cart with bundle price (already discounted)
            products.forEach((product: any) => {
                addItem({
                    product_id: product.id,
                    name: product.name,
                    price: discountedPricePerProduct, // Use bundle price divided by number of products
                    image: bundle.bundle_image || "",
                    quantity: 1,
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
        } finally {
            setIsAdding(false)
        }
    }

    return (
        <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl border-8 border-white">
            {/* Static container with fixed height */}
            <div className="relative h-[600px] w-full">
                <AnimatePresence initial={false}>
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.8,
                            ease: "easeInOut"
                        }}
                        className="absolute inset-0"
                    >
                        {bundleImage ? (
                            <Image
                                src={bundleImage}
                                alt={currentBundle.name}
                                fill
                                className="object-cover"
                                priority={currentIndex === 0}
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center">
                                <Sparkles className="h-16 w-16 text-white/60" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        {/* Bundle Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                            <div className="inline-block bg-rose-500 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                                Save KES {currentBundle.savings.toLocaleString()}
                            </div>
                            <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-rose-200 to-white bg-clip-text text-transparent">
                                {currentBundle.name}
                            </h3>
                            <p className="text-white/90 mb-4 max-w-md">{currentBundle.description}</p>
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-2xl font-bold">KES {currentBundle.bundle_price.toLocaleString()}</span>
                                <span className="text-lg line-through text-white/60">
                                    KES {currentBundle.original_price.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={isAdding}
                                    size="lg"
                                    className="bg-rose-500 text-white hover:bg-rose-600 shadow-lg hover:shadow-rose-500/50 transition-all"
                                >
                                    <ShoppingCart className="h-5 w-5 mr-2" />
                                    {isAdding ? "Adding..." : "Add to Cart"}
                                </Button>
                                <Button asChild size="lg" className="bg-white/20 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-black transition-all shadow-lg">
                                    <Link href="/bundles">View All Bundles</Link>
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Arrows */}
            {bundles.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-rose-500 hover:text-white p-2 rounded-full shadow-lg transition-all z-10"
                        aria-label="Previous bundle"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-rose-500 hover:text-white p-2 rounded-full shadow-lg transition-all z-10"
                        aria-label="Next bundle"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            {bundles.length > 1 && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {bundles.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`h-2 rounded-full transition-all ${index === currentIndex ? "w-8 bg-rose-500" : "w-2 bg-gray-300 hover:bg-rose-300"
                                }`}
                            aria-label={`Go to bundle ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
