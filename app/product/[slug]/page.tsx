import { notFound } from "next/navigation"
import { sql, type Product } from "@/lib/db"
import { ProductDetails } from "./product-details"
import type { Metadata } from "next"

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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description,
    sku: product.id.toString(),
    brand: {
      "@type": "Brand",
      name: "MAISON JOIE",
    },
    offers: {
      "@type": "Offer",
      url: `${process.env.NEXT_PUBLIC_APP_URL}/product/${product.slug}`,
      priceCurrency: "KES",
      price: product.price,
      availability: (product.stock_quantity || 0) > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetails product={product} />
    </>
  )
}
