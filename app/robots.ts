import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/dashboard/', '/cart', '/wishlist'],
        },
        sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://maison-joie.vercel.app'}/sitemap.xml`,
    }
}
