import type { Product } from "@/lib/db"

export function generateProductSchema(product: Product) {
    const schema: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: product.images,
        sku: product.id.toString(),
        brand: {
            "@type": "Brand",
            name: "Maison Joie",
        },
        offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "KES",
            availability:
                (product.stock_quantity || 0) > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
            url: `${process.env.NEXT_PUBLIC_APP_URL}/product/${product.slug}`,
        },
    }

    // Add aggregate rating using the product's own precomputed review stats
    if (product.review_count && product.review_count > 0) {
        schema["aggregateRating"] = {
            "@type": "AggregateRating",
            ratingValue: Number(product.average_rating ?? 0).toFixed(1),
            reviewCount: product.review_count,
            bestRating: 5,
            worstRating: 1,
        }
    }

    return schema
}

export function generateOrganizationSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Maison Joie",
        description: "Premium perfumes and fragrances in Kenya",
        url: process.env.NEXT_PUBLIC_APP_URL,
        logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo2.png`,
        sameAs: [
            // Add social media links here
        ],
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "Customer Service",
            availableLanguage: ["English"],
        },
    }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    }
}
