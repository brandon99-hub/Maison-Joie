"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingBag, Settings, UserCircle, ChevronDown, LayoutDashboard, LogOut } from "lucide-react"
import { useCart } from "@/providers"
import { useSession, signOut } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

export function Header() {
  const { totalItems, totalAmount } = useCart()
  const { data: session } = useSession()
  const [isAdmin, setIsAdmin] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    // Check if admin session exists
    const checkAdmin = () => {
      const cookies = document.cookie.split(';')
      const hasAdminSession = cookies.some(cookie => cookie.trim().startsWith('admin_session='))
      setIsAdmin(hasAdminSession)
    }
    checkAdmin()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.user-menu-container')) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/70 transition-all">
      <div className="container mx-auto px-4 md:px-8 py-2.5 flex items-center justify-between">
        {/* Logo - Left */}
        <Link href="/" className="flex items-center z-20">
          <Image src="/logo2.png" alt="Maison Joie" width={158} height={33} className="h-8 sm:h-9 w-auto object-contain" priority />
        </Link>

        {/* Navigation - Centered Absolute on Desktop */}
        <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8 bg-white/50 px-8 py-2 rounded-full border border-white/20 shadow-sm backdrop-blur-sm">
          <Link href="/shop" className="text-sm font-medium hover:text-primary transition-colors tracking-wide">
            Shop
          </Link>
          <Link href="/bundles" className="text-sm font-medium hover:text-primary transition-colors tracking-wide">
            Bundles
          </Link>
          <Link href="/testimonials" className="text-sm font-medium hover:text-primary transition-colors tracking-wide">
            Reviews
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 z-20">
          {/* Admin Settings - Only visible when logged in */}
          {isAdmin && (
            <Link href="/admin/settings" className="p-2.5 hover:bg-rose-50 rounded-full transition-colors group">
              <Settings className="h-5 w-5 text-gray-700 group-hover:text-rose-600 transition-colors" />
            </Link>
          )}

          {/* Cart - Now before user icon */}
          <Link href="/cart" className="relative flex items-center gap-2 p-2.5 md:px-3 hover:bg-rose-50 rounded-full transition-colors group">
            <span className="relative shrink-0">
              <ShoppingBag className="h-5 w-5 text-gray-700 group-hover:text-rose-600 transition-colors" />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="md:hidden absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-md ring-2 ring-white"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            {totalItems > 0 && (
              <span className="hidden md:inline text-xs font-semibold text-gray-700 group-hover:text-rose-600 transition-colors whitespace-nowrap">
                {totalItems} item{totalItems !== 1 ? "s" : ""} · KES {totalAmount.toLocaleString()}
              </span>
            )}
          </Link>

          {/* User Account - Now at far right with dropdown */}
          <div className="relative user-menu-container">
            {session?.user ? (
              <>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="relative p-2.5 hover:bg-rose-50 rounded-full transition-colors group flex items-center gap-1.5"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  {session.user.name && (
                    <span className="hidden md:inline text-xs font-semibold text-gray-700 group-hover:text-rose-600 transition-colors whitespace-nowrap">
                      {session.user.name.split(" ")[0]}
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 text-gray-700 group-hover:text-rose-600 transition-colors" />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
                    >
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-rose-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium">Dashboard</span>
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          signOut({ callbackUrl: "/" })
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-50 transition-colors text-left border-t"
                      >
                        <LogOut className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Link href="/login" className="p-2.5 rounded-full transition-colors group">
                <UserCircle className="h-5 w-5 text-gray-700 group-hover:text-rose-600 transition-colors" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
