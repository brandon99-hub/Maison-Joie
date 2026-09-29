"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Package, MessageSquare, Gift, QrCode, LogOut, Sparkles, Menu, X, PackageOpen, Tag, Settings, Layers, Bell, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { adminLogout } from "@/app/admin/login/actions"
import { getTotalWaitlistCount } from "@/app/admin/waitlist/actions"

const navItems = [
  { href: "/admin/orders", icon: Package, label: "Orders" },
  { href: "/admin/products", icon: Tag, label: "Products" },
  { href: "/admin/categories", icon: Layers, label: "Categories" },
  { href: "/admin/bundles", icon: PackageOpen, label: "Bundles" },
  { href: "/admin/testimonials", icon: MessageSquare, label: "Testimonials" },
  { href: "/admin/waitlist", icon: Bell, label: "Waitlist", hasBadge: true },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/qr-codes", icon: QrCode, label: "QR Codes" },
  { href: "/admin/secret-page-link", icon: Sparkles, label: "Secret Page", isExternal: true },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [waitlistCount, setWaitlistCount] = useState(0)

  // Fetch waitlist count
  useEffect(() => {
    getTotalWaitlistCount().then(count => setWaitlistCount(count))
  }, [])

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileOpen])

  const handleLogout = async () => {
    await adminLogout()
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <>
      {/* Mobile toggle - positioned to not overlap logo */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 right-4 z-50 md:hidden bg-background border border-border rounded-lg shadow-lg hover:shadow-xl transition-all active:scale-95"
        style={{ minWidth: '44px', minHeight: '44px' }}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        <div className="flex items-center justify-center w-full h-full">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </div>
      </button>

      {/* Overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-14 px-6 border-b border-border/70 flex items-center">
          <Link href="/admin" className="flex items-center gap-2.5 font-semibold tracking-tight text-foreground hover:opacity-90 transition-opacity">
            <Image
              src="/logo2.png"
              alt="Maison Joie"
              width={132}
              height={28}
              className="h-6 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const showBadge = item.hasBadge && waitlistCount > 0
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
                {showBadge && (
                  <span className="ml-auto bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {waitlistCount > 9 ? "9+" : waitlistCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 pb-20 md:pb-4 border-t border-border">
          <div className="flex gap-2">
            <Link
              href="/admin/settings"
              onClick={() => setMobileOpen(false)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-h-[44px]"
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-h-[44px]"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
