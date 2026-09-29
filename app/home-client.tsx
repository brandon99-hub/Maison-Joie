"use client"

import type { Product, Testimonial } from "@/lib/db"
import { ShoppingBag } from "lucide-react"
import { HeroSection } from "@/components/hero-section"
import { CategoryGrid } from "@/components/category-grid"
import { ProductCard } from "@/components/product-card"
import { TestimonialsCarousel } from "@/components/testimonials-carousel"
import { SwipeNavigation } from "@/components/swipe-navigation"
import { DesktopHero } from "@/components/desktop-hero"
import { DesktopCategoryGrid } from "@/components/desktop-category-grid"

function EmptyProductsState() {
    return (
        <div className="text-center py-12">
            <ShoppingBag className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">New arrivals coming soon — check back shortly!</p>
        </div>
    )
}

interface HomeClientProps {
    products: Product[]
    testimonials: Testimonial[]
    bundles: Array<{
        id: number
        name: string
        description: string
        bundle_price: number
        original_price: number
        savings: number
        bundle_image?: string
    }>
    bundlesSection?: React.ReactNode
}

export function HomeClient({ products, testimonials, bundles, bundlesSection }: HomeClientProps) {
    return (
        <SwipeNavigation currentPage="home">
            <div>
                <div className="md:hidden">
                    <HeroSection />
                    <CategoryGrid />
                </div>

                <div className="hidden md:block">
                    <DesktopHero bundles={bundles} />
                    <DesktopCategoryGrid />
                </div>

                <div className="md:hidden">{bundlesSection}</div>

                {/* Featured Products - Mobile */}
                <section className="py-12 px-4 md:hidden">
                    <div className="container mx-auto">
                        <h2 className="text-2xl font-bold text-center mb-2">New Arrivals</h2>
                        <p className="text-muted-foreground text-center mb-8">Fresh drops you need in your life</p>
                        {products.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                                {products.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <EmptyProductsState />
                        )}
                    </div>
                </section>

                {/* Featured Products - Desktop */}
                <section className="hidden md:block py-20 px-8">
                    <div className="container mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold mb-4">New Arrivals</h2>
                            <p className="text-lg text-muted-foreground">Fresh drops you need in your life</p>
                        </div>
                        {products.length > 0 ? (
                            <div className="grid grid-cols-4 gap-8 max-w-7xl mx-auto">
                                {products.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <EmptyProductsState />
                        )}
                    </div>
                </section>

                {/* Testimonials */}
                {testimonials.length > 0 && (
                    <section className="py-12 px-4 bg-muted/30">
                        <div className="container mx-auto">
                            <h2 className="text-2xl font-bold text-center mb-2">The Love</h2>
                            <p className="text-muted-foreground text-center mb-4">What our girlies are saying</p>
                            <TestimonialsCarousel testimonials={testimonials} />
                        </div>
                    </section>
                )}

                {/* Gift Card Teaser */}
                <section className="py-12 px-4">
                    <div className="container mx-auto max-w-md text-center">
                        <div className="bg-gradient-to-br from-rose-100 to-amber-50 rounded-3xl p-8">
                            <span className="text-4xl mb-4 block">🎁</span>
                            <h2 className="text-xl font-bold mb-2">Free Gift Card</h2>
                            <p className="text-muted-foreground text-sm">
                                Every order comes with a surprise gift card reveal. Scratch to see your reward!
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </SwipeNavigation>
    )
}
