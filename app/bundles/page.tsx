import { sql } from "@/lib/db"
import { BundleCard } from "@/components/bundle-card"
import { CustomBundleBuilder } from "@/components/custom-bundle-builder"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
    title: "Perfume Bundles & Deals | MAISON JOIE",
    description: "Save more when you bundle! Mix and match your favorite fragrances or build your own custom perfume bundle and save up to 20%.",
}

interface Bundle {
    id: number
    name: string
    description: string
    product_ids: number[]
    original_price: number
    bundle_price: number
    savings: number
    bundle_image?: string
    is_active: boolean
}

interface Product {
    id: number
    name: string
    price: number
    images: string[]
    category: string
    stock_quantity: number
    is_secret: boolean
    is_active: boolean
}

async function getBundles() {
    try {
        const bundles = await sql`
      SELECT * FROM bundles 
      WHERE is_active = true 
      ORDER BY created_at DESC
    ` as unknown as Bundle[]
        return bundles
    } catch {
        return []
    }
}

async function getProducts() {
    try {
        const products = await sql`
      SELECT id, name, price, images, category, stock_quantity, is_secret, is_active
      FROM products 
      WHERE is_active = true 
      AND is_secret = false
      AND stock_quantity > 0
      ORDER BY name
    ` as unknown as Product[]
        return products
    } catch {
        return []
    }
}

export default async function BundlesPage() {
    const [bundles, products] = await Promise.all([getBundles(), getProducts()])

    return (
        <div className="min-h-screen pb-20 md:pb-8">
            {/* Header */}
            <div className="hidden md:block px-4 pt-4">
                <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 py-10 px-4 relative overflow-hidden rounded-3xl">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-700/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

                    <div className="container mx-auto max-w-6xl relative z-10">
                        <div className="text-center">
                            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">
                                Bundle Deals 🎁
                            </h1>
                            <p className="text-white/90 text-base md:text-lg max-w-2xl mx-auto">
                                Save more when you bundle! Mix and match your favorites or build your own custom bundle.
                            </p>
                            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-white/80 text-xs md:text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">💰</span>
                                    <span>Save up to 20%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">✨</span>
                                    <span>Mix categories</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🎨</span>
                                    <span>Custom combos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-6xl px-4 py-8 space-y-12">
                {/* Custom Bundle Builder - Now First */}
                <section>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold mb-2">Build Your Own Bundle</h2>
                        <p className="text-muted-foreground">
                            Create a custom bundle and save up to 20%! Mix categories or stick to your favorites.
                        </p>
                    </div>
                    <CustomBundleBuilder products={products} />
                </section>

                {/* Pre-made Bundles - Now Second */}
                {bundles.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold mb-6">Our Curated Bundles</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {bundles.map((bundle) => (
                                <BundleCard key={bundle.id} bundle={bundle} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}
