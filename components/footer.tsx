"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Phone } from "lucide-react"
import { useCategories } from "@/hooks/use-categories"
import { WHATSAPP_NUMBER } from "@/lib/whatsapp"

export function Footer() {
    const pathname = usePathname()
    const { categories } = useCategories()

    // Don't show footer on admin pages
    if (pathname?.startsWith("/admin")) {
        return null
    }

    return (
        <footer className="bg-muted/30 border-t border-border mt-auto">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="flex items-center mb-4">
                            <Image src="/logo2.png" alt="Maison Joie" width={158} height={33} className="h-8 w-auto object-contain" />
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Premium perfumes and fragrances with elegance. Based in Kenya 🇰🇪
                        </p>
                    </div>

                    {/* Shop and Stay Connected side-by-side on mobile */}
                    <div className="grid grid-cols-2 gap-8 md:col-span-2 md:grid-cols-2">
                        <div>
                            <h3 className="font-semibold mb-4">Shop</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <Link href="/shop" className="hover:text-primary transition-colors">All Products</Link>
                                </li>
                                {Array.isArray(categories) && categories.map(cat => (
                                    <li key={cat.id}>
                                        <Link href={`/shop?category=${cat.slug}`} className="hover:text-primary transition-colors">
                                            {cat.name}
                                        </Link>
                                    </li>
                                ))}
                                <li>
                                    <Link href="/bundles" className="hover:text-primary transition-colors">Bundles</Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-4">Stay Connected</h3>
                            <div className="flex gap-4 mb-4">
                                <a
                                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors"
                                >
                                    <Phone className="h-5 w-5" />
                                </a>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Follow us for new drops and styling tips!
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} MAISON JOIE. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
