import { sql, type Product } from "@/lib/db"
import { SwipeNavigation } from "@/components/swipe-navigation"
import { ShopClient } from "./shop-client"
import { Suspense } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shop All Fragrances | MAISON JOIE",
  description: "Browse our full collection of premium perfumes and fragrances. Elegant scents for every occasion, delivered across Kenya.",
}

export default async function ShopPage() {
  let products: Product[] = []
  let maxPrice = 5000

  try {
    // Fetch all active products
    products = (await sql`
      SELECT * FROM products 
      WHERE is_active = true AND is_secret = false
      ORDER BY created_at DESC
    `) as unknown as Product[]

    // Calculate max price for filter
    if (products.length > 0) {
      maxPrice = Math.max(...products.map((p) => p.price))
      // Round up to nearest 100
      maxPrice = Math.ceil(maxPrice / 100) * 100
    }
  } catch (error) {
    console.error("Error fetching products:", error)
  }

  return (
    <SwipeNavigation currentPage="shop">
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            </div>
          </div>
        }
      >
        <ShopClient initialProducts={products} maxPrice={maxPrice} />
      </Suspense>
    </SwipeNavigation>
  )
}
