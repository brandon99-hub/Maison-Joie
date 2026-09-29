"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BundleCarousel } from "@/components/bundle-carousel"
import { RotatingCategoryButton } from "@/components/rotating-category-button"

interface Bundle {
    id: number
    name: string
    description: string
    bundle_price: number
    original_price: number
    savings: number
    bundle_image?: string
    product_ids?: number[]
}

interface DesktopHeroProps {
    bundles?: Bundle[]
}

export function DesktopHero({ bundles = [] }: DesktopHeroProps) {
    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-amber-50 pt-6 pb-14 lg:pt-8 lg:pb-18">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-rose-100/30 -skew-x-12 transform translate-x-20" />

            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 gap-12 items-center">
                    {/* Left Column: Text */}
                    <div className="relative z-10">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className="inline-flex items-center gap-2 bg-rose-100 text-rose-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                                <Sparkles className="h-4 w-4" />
                                New Collection Just Dropped
                            </span>

                            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-4">
                                Shine brighter <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">Every Single Day.</span>
                            </h1>

                            <p className="text-lg text-muted-foreground mb-6 max-w-lg leading-relaxed">
                                Premium perfumes and fragrances designed for the modern aesthetic.
                                Elevate your signature scent with our curated collection.
                            </p>

                            <div className="flex items-center gap-4">
                                <Button asChild size="lg" className="h-12 px-8 text-base bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200">
                                    <Link href="/shop">
                                        Shop Collection <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                                <RotatingCategoryButton className="h-12 w-44 text-base" />
                            </div>

                            <div className="mt-12 flex items-center gap-8 text-sm text-muted-foreground">
                                <div className="flex -space-x-3">
                                    {/* Tiny social proof avatars */}
                                    {["/african-woman-avatar.jpg", "/young-woman-avatar.png", "/smiling-woman-avatar.png"].map((src, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden relative">
                                            <Image src={src} alt="User" fill className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <p>Loved by 1,000+ Kenyan babes 🇰🇪</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Bundle Carousel or Fallback Image */}
                    <div className="relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.7 }}
                            className="relative z-10"
                        >
                            {bundles.length > 0 ? (
                                <BundleCarousel bundles={bundles} />
                            ) : (
                                <>
                                    {/* Fallback: Main Hero Image */}
                                    <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white">
                                        <Image
                                            src="/gold-hair-claw-clip.jpg"
                                            alt="Hero Model"
                                            width={600}
                                            height={800}
                                            className="object-cover w-full h-[600px]"
                                            priority
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-rose-900/20 to-transparent" />
                                    </div>

                                    {/* Floating Cards */}
                                    <motion.div
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute -bottom-10 -left-10 bg-white p-4 rounded-2xl shadow-xl max-w-xs border border-rose-100"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl">✨</div>
                                            <div>
                                                <p className="font-bold text-gray-900">Premium Quality</p>
                                                <p className="text-xs text-muted-foreground">Gold-plated & durable materials</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </motion.div>

                        {/* Background Decoration */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-rose-200/30 to-amber-200/30 rounded-full blur-3xl -z-10" />
                    </div>
                </div>
            </div>
        </section>
    )
}

