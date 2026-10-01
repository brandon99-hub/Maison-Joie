import { notFound } from "next/navigation"
import { sql, type Product } from "@/lib/db"
import { ProductDetails } from "./product-details"
import type { Metadata } from "next"
import { generateProductSchema, generateBreadcrumbSchema } from "@/lib/seo-schema"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const products = await sql`
    SELECT * FROM products WHERE slug = ${slug} AND is_active = true
  ` as unknown as Product[]

  if (!products.length) return { title: "Product Not Found" }

  const product = products[0]
  const ogImage = product.images && product.images.length > 0 ? product.images[0] : "/logo2.png"

  return {
    title: `${product.name} | MAISON JOIE`,
    description: product.description.substring(0, 160),
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: ogImage }],
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const products = await sql`
    SELECT * FROM products 
    WHERE slug = ${slug} AND is_active = true
  ` as unknown as Product[]

  if (!products.length) {
    notFound()
  }

  const product = products[0]

  // Don't show secret products on regular pages
  if (product.is_secret) {
    notFound()
  }

  // Structured Data (JSON-LD)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://maison-joie.vercel.app'
  const jsonLd = generateProductSchema(product)
  const breadcrumbJsonLd = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Shop", url: `${baseUrl}/shop` },
    { name: product.name, url: `${baseUrl}/product/${product.slug}` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetails product={product} />
    </>
  )
}
