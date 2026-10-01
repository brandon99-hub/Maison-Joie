import { sql, type Product, type Testimonial } from "@/lib/db"
import { HomeClient } from "./home-client"
import { BundlesSection } from "@/components/bundles-section"
import { generateOrganizationSchema } from "@/lib/seo-schema"

export default async function HomePage() {
  let products: Product[] = []
  let testimonials: Testimonial[] = []
  let bundles: Array<{
    id: number
    name: string
    description: string
    bundle_price: number
    original_price: number
    savings: number
    bundle_image?: string
  }> = []

  try {
    const dbProducts = await sql`
      SELECT * FROM products 
      WHERE is_active = true AND is_secret = false 
      ORDER BY created_at DESC 
      LIMIT 6
    ` as unknown as Product[]

    if (dbProducts.length > 0) {
      products = dbProducts
    }

    const dbTestimonials = await sql`
      SELECT * FROM testimonials 
      WHERE is_active = true 
      ORDER BY created_at DESC
    ` as unknown as Testimonial[]

    if (dbTestimonials.length > 0) {
      testimonials = dbTestimonials
    }

    // Fetch active bundles for desktop hero
    const dbBundles = await sql`
      SELECT id, name, description, bundle_price, original_price, savings, bundle_image, product_ids
      FROM bundles 
      WHERE is_active = true 
      ORDER BY created_at DESC
      LIMIT 5
    `
    bundles = dbBundles as typeof bundles
  } catch {
    console.log("Database connection failed or empty")
  }

  const organizationJsonLd = generateOrganizationSchema()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <HomeClient
        products={products}
        testimonials={testimonials}
        bundles={bundles}
        bundlesSection={<BundlesSection />}
      />
    </>
  )
}
