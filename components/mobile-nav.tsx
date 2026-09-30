"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Grid3X3, Heart, Package } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const pathname = usePathname()

  // Hide on dashboard page
  if (pathname === "/dashboard") {
    return null
  }

  const links = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/shop", icon: Grid3X3, label: "Shop" },
    { href: "/bundles", icon: Package, label: "Bundles" },
    { href: "/testimonials", icon: Heart, label: "Reviews" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-border/50 md:hidden shadow-lg">
      <div className="flex items-center justify-around py-2 safe-area-pb">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 text-xs transition-all relative min-w-[60px]",
                isActive
                  ? "text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground active:scale-95",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
