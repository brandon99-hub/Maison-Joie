"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
    Package, MapPin, User, LogOut, Trash2, Plus, Store,
    ShoppingBag, Clock, CheckCircle, Truck, Star,
    AlertCircle, Loader2, RefreshCcw, Heart, Bell, Phone
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signOut } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import type { Order, CustomerAddress } from "@/lib/db"
import {
    updateCustomerProfile,
    addCustomerAddress,
    updateCustomerAddress,
    deleteCustomerAddress,
    reorderItems,
    deleteCustomerAccount,
    getCustomerWaitlist,
    removeFromWaitlist,
} from "./actions"
import { RecommendationsSection } from "@/components/recommendations-section"
import { useWishlist, useCart } from "@/providers"
import type { Product } from "@/lib/db"
import { toast } from "sonner"
import { DashboardBottomNav } from "@/components/dashboard-bottom-nav"
import dynamic from "next/dynamic"
import { getPickupLocations } from "./actions"
import type { PickupMtaaniLocation } from "@/lib/db"
import { Search, Map as MapIcon, ChevronRight, Info } from "lucide-react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { AgentSelectionModal, sanitizeDescription } from "@/components/agent-selection-modal"

const LocationPicker = dynamic(() => import("@/components/location-picker").then(mod => mod.LocationPicker), {
    ssr: false,
    loading: () => <div className="h-64 sm:h-80 w-full bg-rose-50/50 animate-pulse rounded-2xl border-2 border-dashed border-rose-200 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-rose-300 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Loading Smart Map...</p>
        </div>
    </div>
})

type WaitlistItem = {
    id: number
    product_id: number
    name: string
    slug: string
    price: number
    images: string[]
    stock_quantity: number
    is_active: boolean
    created_at: string
    notified: boolean
}

type DashboardClientProps = {
    orders: Order[]
    customer: {
        id: number
        email: string
        name: string | null
        phone_number: string | null
        created_at: string
    }
    addresses: CustomerAddress[]
}

const statusConfig = {
    pending: { label: "Payment Pending", icon: Clock, color: "text-yellow-600 bg-yellow-50" },
    paid: { label: "Confirmed", icon: CheckCircle, color: "text-blue-600 bg-blue-50" },
    packed: { label: "Ready/On the Way", icon: Truck, color: "text-purple-600 bg-purple-50" },
    collected: { label: "Delivered", icon: CheckCircle, color: "text-green-600 bg-green-50" },
}

export function DashboardClient({ orders, customer, addresses }: DashboardClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialTab = searchParams.get('tab') as "orders" | "wishlist" | "waitlist" | "profile" || "orders"
    const [activeTab, setActiveTab] = useState<"orders" | "wishlist" | "waitlist" | "profile">(initialTab)
    const [loading, setLoading] = useState(false)
    const [editingProfile, setEditingProfile] = useState(false)
    const [addingAddress, setAddingAddress] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(false)
    const [wishlistProducts, setWishlistProducts] = useState<Product[]>([])
    const [loadingWishlist, setLoadingWishlist] = useState(false)
    const { wishlistItems, removeFromWishlist: removeFromWishlistContext } = useWishlist()
    const { addItem } = useCart()
    const [waitlistItems, setWaitlistItems] = useState<WaitlistItem[]>([])
    const [loadingWaitlist, setLoadingWaitlist] = useState(false)
    const [addressType, setAddressType] = useState<"door_to_door" | "pickup_mtaani">("door_to_door")
    const [pickupLocations, setPickupLocations] = useState<PickupMtaaniLocation[]>([])
    const [geocodedData, setGeocodedData] = useState<{
        locationName: string;
        lat: number;
        lng: number;
        estate?: string;
    } | null>(null)
    const [selectedAgent, setSelectedAgent] = useState<PickupMtaaniLocation | null>(null)
    const [isAgentModalOpen, setIsAgentModalOpen] = useState(false)
    const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null)

    useEffect(() => {
        if (activeTab === "profile" && pickupLocations.length === 0) {
            getPickupLocations().then(res => {
                if (res.success && res.locations) {
                    setPickupLocations(res.locations)
                }
            })
        }
    }, [activeTab, pickupLocations.length])

    const handleLogout = async () => {
        await signOut({ redirect: true, callbackUrl: "/" })
    }

    const handleReorder = async (orderId: number) => {
        setLoading(true)
        const result = await reorderItems(orderId)

        if (result.success && result.items) {
            // Store items and order details in localStorage
            localStorage.setItem("reorder_items", JSON.stringify(result.items))
            localStorage.setItem("reorder_location", result.pickupLocation || "")
            localStorage.setItem("reorder_phone", result.phoneNumber || "")
            localStorage.setItem("reorder_location_id", result.pickupMtaaniLocation?.toString() || "")
            router.push("/cart?reorder=true")
        }
        setLoading(false)
    }

    const handleDeleteAccount = async () => {
        if (!deleteConfirm) {
            setDeleteConfirm(true)
            return
        }

        setLoading(true)
        const result = await deleteCustomerAccount()

        if (result.success) {
            await signOut({ redirect: true, callbackUrl: "/" })
        }
        setLoading(false)
    }

    // Fetch wishlist products when wishlist tab is active
    useEffect(() => {
        if (activeTab === "wishlist" && wishlistItems.length > 0) {
            setLoadingWishlist(true)
            fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productIds: wishlistItems })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.products) {
                        setWishlistProducts(data.products)
                    }
                })
                .catch(err => console.error('Failed to fetch wishlist:', err))
                .finally(() => setLoadingWishlist(false))
        }
    }, [activeTab, wishlistItems])

    const handleRemoveFromWishlist = (productId: number) => {
        removeFromWishlistContext(productId)
        setWishlistProducts(prev => prev.filter(p => p.id !== productId))
        toast.success("Removed from wishlist")
    }

    const handleRemoveFromWaitlist = async (productId: number) => {
        const result = await removeFromWaitlist(productId)
        if (result.success) {
            setWaitlistItems(prev => prev.filter(item => item.product_id !== productId))
            toast.success("Removed from waitlist")
        } else {
            toast.error("Failed to remove from waitlist")
        }
    }

    // Fetch waitlist products when waitlist tab is active
    useEffect(() => {
        if (activeTab === "waitlist") {
            setLoadingWaitlist(true)
            getCustomerWaitlist()
                .then(result => {
                    if (result.success && result.waitlistItems) {
                        setWaitlistItems(result.waitlistItems as WaitlistItem[])
                    }
                })
                .catch(err => console.error('Failed to fetch waitlist:', err))
                .finally(() => setLoadingWaitlist(false))
        }
    }, [activeTab])

    const handleAddToCartFromWishlist = (product: Product) => {
        addItem({
            product_id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.images[0] || "",
        })
        toast.success(`${product.name} added to cart!`, {
            action: {
                label: "View Cart",
                onClick: () => router.push("/cart"),
            },
        })
    }

    const getDeliveryEstimate = (order: Order) => {
        if (order.status === "packed") {
            const packedTime = new Date(order.updated_at)
            const estimatedDelivery = new Date(packedTime)

            if (order.delivery_method === "pickup") {
                estimatedDelivery.setHours(18, 0, 0)
                return {
                    message: "Ready for pickup today",
                    time: estimatedDelivery.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
                }
            } else {
                estimatedDelivery.setDate(estimatedDelivery.getDate() + 1)
                estimatedDelivery.setHours(14, 0, 0)
                return {
                    message: "Delivery expected",
                    time: estimatedDelivery.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                }
            }
        }
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-white">
            {/* Header */}
            <div className="bg-white/90 backdrop-blur-xl border-b border-white/40 shadow-sm">
                <div className="container mx-auto px-4 py-4 sm:py-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-1">
                                My Dashboard
                            </h1>
                            <p className="text-sm sm:text-base text-muted-foreground font-medium">
                                Welcome back, <span className="text-rose-600">{customer.name || "Fragrance Lover"}</span>! ✨
                            </p>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Link href="/" className="w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-sm h-11 border-2 border-rose-200 hover:bg-rose-50 font-semibold rounded-xl"
                                >
                                    <ShoppingBag className="w-4 h-4 mr-2" />
                                    Continue Shopping
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 sm:py-8 pb-24 md:pb-8">
                {/* Desktop Tab Navigation */}
                <div className="hidden md:flex gap-2 mb-8 justify-center">
                    <button
                        onClick={() => setActiveTab("orders")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "orders"
                            ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg"
                            : "bg-white/60 text-muted-foreground hover:bg-white border border-white/40"
                            }`}
                    >
                        <Package className="w-4 h-4" />
                        Orders ({orders.filter(o => o.status !== "collected").length})
                    </button>
                    <button
                        onClick={() => setActiveTab("wishlist")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "wishlist"
                            ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg"
                            : "bg-white/60 text-muted-foreground hover:bg-white border border-white/40"
                            }`}
                    >
                        <Heart className="w-4 h-4" />
                        Wishlist ({wishlistItems.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("waitlist")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "waitlist"
                            ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg"
                            : "bg-white/60 text-muted-foreground hover:bg-white border border-white/40"
                            }`}
                    >
                        <Bell className="w-4 h-4" />
                        Waitlist ({waitlistItems.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("profile")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "profile"
                            ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg"
                            : "bg-white/60 text-muted-foreground hover:bg-white border border-white/40"
                            }`}
                    >
                        <User className="w-4 h-4" />
                        Profile
                    </button>
                </div>

                {/* Mobile Bottom Navigation */}
                <DashboardBottomNav
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    counts={{
                        orders: orders.filter(o => o.status !== "collected").length,
                        wishlist: wishlistItems.length,
                        waitlist: waitlistItems.length,
                    }}
                />

                {/* Orders Tab */}
                {activeTab === "orders" && (
                    <div className="space-y-4">
                        {orders.length === 0 ? (
                            <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20">
                                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                                <p className="text-muted-foreground mb-4">Start shopping to see your orders here!</p>
                                <Link href="/">
                                    <Button className="bg-gradient-to-r from-rose-500 to-pink-500">
                                        Browse Products
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            orders.map((order) => {
                                const status = statusConfig[order.status]
                                const StatusIcon = status.icon
                                const estimate = getDeliveryEstimate(order)

                                return (
                                    <div
                                        key={order.id}
                                        className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border-2 border-white/40 hover:shadow-xl hover:border-rose-200 transition-all"
                                    >
                                        <div className="flex items-center justify-between gap-4 mb-5">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-base sm:text-lg text-gray-900 font-black mb-1">
                                                    {new Date(order.created_at).toLocaleDateString("en-US", {
                                                        month: "long",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </p>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {order.secret_code && order.secret_code.trim() !== "" && (
                                                        <span className="bg-rose-500 text-[9px] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                                                            ㊙️ SECRET
                                                        </span>
                                                    )}
                                                    {order.has_bundle && (
                                                        <span className="bg-blue-500 text-[9px] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                                                            🎁 BUNDLE
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm ${status.color} border-current/10`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest leading-none">{status.label}</span>
                                            </div>
                                        </div>

                                        {/* Order Items */}
                                        <div className="space-y-3 mb-6 bg-white/40 rounded-xl p-3 sm:p-0 sm:bg-transparent">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 sm:hidden px-1">Items</p>
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-3 group">
                                                    {item.image ? (
                                                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-white/60 shadow-sm transition-transform group-hover:scale-105">
                                                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center border border-white/60 shadow-sm">
                                                            <Package className="w-6 h-6 text-muted-foreground/40" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm truncate text-gray-800">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground font-medium">
                                                            Qty: {item.quantity} × KES {item.price.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/40">
                                            <div className="flex items-center justify-between sm:block">
                                                <p className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest">Total Amount</p>
                                                <p className="text-xl sm:text-2xl font-black bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                                                    KES {order.total_amount.toLocaleString()}
                                                </p>
                                            </div>
                                            <Button
                                                onClick={() => handleReorder(order.id)}
                                                disabled={loading}
                                                variant="outline"
                                                className="w-full sm:w-auto gap-2 h-11 sm:h-auto rounded-xl font-bold transition-all hover:bg-white active:scale-95 shadow-sm border-white/60"
                                            >
                                                {loading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <RefreshCcw className="w-4 h-4 text-rose-500" />
                                                        REORDER ITEMS
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })
                        )}

                        {/* Recommendations */}
                        {orders.length > 0 && <RecommendationsSection />}
                    </div>
                )}

                {/* Wishlist Tab */}
                {activeTab === "wishlist" && (
                    <div className="space-y-6">
                        {loadingWishlist ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="bg-white/40 rounded-2xl h-64 sm:h-80 animate-pulse border border-white/20" />
                                ))}
                            </div>
                        ) : wishlistItems.length === 0 ? (
                            <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20">
                                <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
                                <p className="text-muted-foreground mb-4">Save products you love to buy them later!</p>
                                <Link href="/shop">
                                    <Button className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl h-12 px-8 font-bold shadow-lg shadow-rose-200">
                                        Browse Products
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                                {wishlistProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className="bg-white/60 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:shadow-xl transition-all group flex flex-col"
                                    >
                                        <Link href={`/product/${product.slug}`} className="block relative aspect-[4/5] bg-muted overflow-hidden">
                                            {product.images[0] && (
                                                <Image
                                                    src={product.images[0]}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            )}
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent h-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Link>
                                        <div className="p-3 sm:p-4 flex-1 flex flex-col">
                                            <Link href={`/product/${product.slug}`} className="block mb-2 flex-1">
                                                <h3 className="font-bold text-xs sm:text-base line-clamp-2 hover:text-rose-600 transition-colors leading-tight">
                                                    {product.name}
                                                </h3>
                                            </Link>
                                            <div className="mb-4">
                                                <p className="text-sm sm:text-xl font-black bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                                                    KES {product.price.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleAddToCartFromWishlist(product)}
                                                    size="sm"
                                                    className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 h-9 sm:h-11 rounded-xl font-bold shadow-sm active:scale-95 text-[10px] sm:text-xs"
                                                >
                                                    <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                                                    ADD
                                                </Button>
                                                <Button
                                                    onClick={() => handleRemoveFromWishlist(product.id)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-9 sm:h-11 w-9 sm:w-11 rounded-xl p-0 border-white/60 hover:bg-white active:scale-95 text-muted-foreground hover:text-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Waitlist Tab */}
                {activeTab === "waitlist" && (
                    <div className="space-y-6">
                        {loadingWaitlist ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="bg-white/40 rounded-2xl h-64 sm:h-80 animate-pulse border border-white/20" />
                                ))}
                            </div>
                        ) : waitlistItems.length === 0 ? (
                            <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20">
                                <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-lg font-semibold mb-2">No items on waitlist</h3>
                                <p className="text-muted-foreground mb-4">Join waitlists for out-of-stock products to get notified when they're back!</p>
                                <Link href="/shop">
                                    <Button className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl h-12 px-8 font-bold shadow-lg shadow-rose-200">
                                        Browse Products
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                {/* Back in Stock Banner */}
                                {waitlistItems.some(item => item.stock_quantity > 0) && (
                                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl p-4 sm:p-6 border-2 border-green-400 shadow-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                                                <CheckCircle className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">Good News! 🎉</h3>
                                                <p className="text-sm text-white/90">
                                                    {waitlistItems.filter(item => item.stock_quantity > 0).length} {waitlistItems.filter(item => item.stock_quantity > 0).length === 1 ? 'product is' : 'products are'} back in stock!
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                                    {/* Sort: In-stock items first, then out-of-stock */}
                                    {[...waitlistItems].sort((a, b) => {
                                        if (a.stock_quantity > 0 && b.stock_quantity === 0) return -1
                                        if (a.stock_quantity === 0 && b.stock_quantity > 0) return 1
                                        return 0
                                    }).map((item) => (
                                        <div
                                            key={item.id}
                                            className={`bg-white/60 backdrop-blur-lg rounded-2xl overflow-hidden border-2 hover:shadow-xl transition-all group flex flex-col ${item.stock_quantity > 0
                                                ? 'border-green-300 shadow-lg shadow-green-100'
                                                : 'border-white/20'
                                                }`}
                                        >
                                            <Link href={`/product/${item.slug}`} className="block relative aspect-[4/5] bg-muted overflow-hidden">
                                                {item.images[0] && (
                                                    <Image
                                                        src={item.images[0]}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                )}
                                                {item.stock_quantity > 0 && (
                                                    <div className="absolute inset-0 bg-gradient-to-t from-green-500/20 to-transparent pointer-events-none" />
                                                )}
                                                {item.stock_quantity > 0 && (
                                                    <div className="absolute top-2 left-2 right-2">
                                                        <div className="bg-green-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                            BACK IN STOCK!
                                                        </div>
                                                    </div>
                                                )}
                                                {item.notified && (
                                                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                                                        📧 NOTIFIED
                                                    </div>
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent h-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </Link>
                                            <div className="p-3 sm:p-4 flex-1 flex flex-col">
                                                <Link href={`/product/${item.slug}`} className="block mb-2 flex-1">
                                                    <h3 className="font-bold text-xs sm:text-base line-clamp-2 hover:text-rose-600 transition-colors leading-tight">
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                                        Joined {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                    </p>
                                                </Link>
                                                <div className="mb-4">
                                                    <p className="text-sm sm:text-xl font-black bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                                                        KES {item.price.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {item.stock_quantity > 0 ? (
                                                        <Link href={`/product/${item.slug}`} className="flex-1">
                                                            <Button
                                                                size="sm"
                                                                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 h-9 sm:h-11 rounded-xl font-bold shadow-sm active:scale-95 text-[10px] sm:text-xs hover:shadow-lg hover:shadow-green-200"
                                                            >
                                                                <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                                                                SHOP NOW
                                                            </Button>
                                                        </Link>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            disabled
                                                            className="flex-1 h-9 sm:h-11 rounded-xl font-bold text-[10px] sm:text-xs"
                                                        >
                                                            OUT OF STOCK
                                                        </Button>
                                                    )}
                                                    <Button
                                                        onClick={() => handleRemoveFromWaitlist(item.product_id)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-9 sm:h-11 w-9 sm:w-11 rounded-xl p-0 border-white/60 hover:bg-white active:scale-95 text-muted-foreground hover:text-red-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Profile Tab */}
                {activeTab === "profile" && (
                    <div className="max-w-2xl mx-auto space-y-8">
                        <div className="bg-white/60 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-white/20 shadow-xl">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                        Profile Details
                                    </h2>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1">Personal Info</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingProfile(!editingProfile)}
                                    className="rounded-xl border-white/60 shadow-sm bg-white/40 font-bold"
                                >
                                    {editingProfile ? "Cancel" : "Edit Info"}
                                </Button>
                            </div>

                            {editingProfile ? (
                                <form
                                    action={async (formData) => {
                                        const result = await updateCustomerProfile(formData)
                                        if (result.success) {
                                            setEditingProfile(false)
                                            router.refresh()
                                        }
                                    }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            defaultValue={customer.name || ""}
                                            required
                                            className="h-12 rounded-xl bg-white/40 border-white/60 shadow-sm focus:ring-rose-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            defaultValue={customer.phone_number || ""}
                                            required
                                            className="h-12 rounded-xl bg-white/40 border-white/60 shadow-sm focus:ring-rose-500"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 font-bold shadow-lg shadow-rose-100 transition-all active:scale-95">
                                        SAVE CHANGES
                                    </Button>
                                </form>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Full Name</p>
                                        <p className="font-bold text-gray-800 text-base">{customer.name || "Not set"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email Address</p>
                                        <p className="font-bold text-gray-800 text-base truncate">{customer.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Phone Number</p>
                                        <p className="font-bold text-gray-800 text-base">{customer.phone_number || "Not set"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Member Since</p>
                                        <p className="font-bold text-gray-800 text-base">
                                            {new Date(customer.created_at).toLocaleDateString("en-US", {
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Addresses Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                    Saved Addresses
                                </h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-white/60 px-3 py-1 rounded-full border border-white/20">
                                    {addresses.length} SAVED
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {addresses.map((address) => (
                                    <div key={address.id}>
                                        <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-4 sm:p-5 border border-white/40 flex items-center justify-between group hover:shadow-lg transition-all">
                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                <div className="p-3 bg-rose-50 rounded-xl group-hover:bg-rose-100 transition-colors">
                                                    <MapPin className="w-5 h-5 text-rose-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-800 truncate">{address.location}</p>
                                                    {address.estate_name && (
                                                        <p className="text-xs text-muted-foreground mt-0.5">Estate: {address.estate_name}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border shadow-sm flex items-center gap-1 ${address.address_type === 'pickup_mtaani'
                                                            ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                            : 'bg-blue-50 text-blue-700 border-blue-100'
                                                            }`}>
                                                            {address.address_type === 'pickup_mtaani' ? (
                                                                <><Store className="w-2.5 h-2.5" /> Pickup Mtaani</>
                                                            ) : (
                                                                <><Truck className="w-2.5 h-2.5" /> Door to Door</>
                                                            )}
                                                        </span>
                                                        {address.is_default && (
                                                            <span className="text-[9px] bg-green-100 text-green-700 font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-green-200">
                                                                DEFAULT
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {address.address_type === 'door_to_door' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setEditingAddress(editingAddress?.id === address.id ? null : address)}
                                                        className="h-10 px-3 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95"
                                                    >
                                                        <span className="text-xs font-bold">{editingAddress?.id === address.id ? 'Cancel' : 'Edit'}</span>
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={async () => {
                                                        await deleteCustomerAddress(address.id)
                                                        toast.success("Address deleted successfully", {
                                                            style: { background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48' }
                                                        })
                                                        router.refresh()
                                                    }}
                                                    className="h-10 w-10 p-0 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-95"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Edit Form for Door-to-Door Addresses */}
                                        {editingAddress?.id === address.id && address.address_type === 'door_to_door' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-4 bg-blue-50/50 rounded-2xl p-5 border border-blue-100"
                                            >
                                                <form
                                                    action={async (formData) => {
                                                        // Add address ID to form data
                                                        formData.append('addressId', address.id.toString())
                                                        const result = await updateCustomerAddress(formData)
                                                        if (result.success) {
                                                            toast.success("Address updated! ✨", {
                                                                style: { background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48' }
                                                            })
                                                            setEditingAddress(null)
                                                            router.refresh()
                                                        } else {
                                                            toast.error(result.error || "Failed to update address")
                                                        }
                                                    }}
                                                    className="space-y-4"
                                                >
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Info className="w-4 h-4 text-blue-600" />
                                                        <p className="text-xs font-bold text-blue-900">Edit Optional Details</p>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Estate / Area Name</Label>
                                                            <Input
                                                                name="estateName"
                                                                defaultValue={address.estate_name || ''}
                                                                placeholder="e.g., Kilimani Estate"
                                                                className="h-11 rounded-xl bg-white border-blue-200 focus:ring-blue-500 mt-1"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">House Number</Label>
                                                            <Input
                                                                name="houseNumber"
                                                                defaultValue={address.house_number || ''}
                                                                placeholder="e.g., B12"
                                                                className="h-11 rounded-xl bg-white border-blue-200 focus:ring-blue-500 mt-1"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Landmark</Label>
                                                        <Input
                                                            name="landmark"
                                                            defaultValue={address.landmark || ''}
                                                            placeholder="e.g., Near Naivas Supermarket"
                                                            className="h-11 rounded-xl bg-white border-blue-200 focus:ring-blue-500 mt-1"
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-3 pt-2">
                                                        <Button
                                                            type="submit"
                                                            className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                                        >
                                                            Save Changes
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => setEditingAddress(null)}
                                                            className="h-11 px-6 rounded-xl border-blue-200 hover:bg-blue-50"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </form>
                                            </motion.div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Add Address Form */}
                            <div className="bg-white/40 backdrop-blur-lg rounded-3xl p-6 border border-white/40 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-100">
                                        <Plus className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="font-black text-gray-800">Add New Address</h3>
                                </div>

                                <form
                                    action={async (formData) => {
                                        const result = await addCustomerAddress(formData)
                                        if (result.success) {
                                            toast.success("New address saved! ✨", {
                                                style: { background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48' }
                                            })
                                            router.refresh()
                                            setGeocodedData(null)
                                            setSelectedAgent(null)
                                        } else {
                                            toast.error(result.error || "Failed to add address")
                                        }
                                    }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Address Category</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <label className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all hover:bg-rose-50 ${addressType === 'door_to_door' ? 'border-rose-500 bg-rose-50' : 'border-white/60 bg-white/20'} group`}>
                                                <input
                                                    type="radio"
                                                    name="addressType"
                                                    value="door_to_door"
                                                    checked={addressType === 'door_to_door'}
                                                    onChange={() => setAddressType("door_to_door")}
                                                    className="sr-only"
                                                />
                                                <Truck className={`w-5 h-5 ${addressType === 'door_to_door' ? 'text-rose-600' : 'text-muted-foreground'} transition-colors`} />
                                                <span className={`text-[10px] font-black uppercase tracking-tight ${addressType === 'door_to_door' ? 'text-rose-900' : 'text-muted-foreground'}`}>Door To Door</span>
                                                <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border-2 ${addressType === 'door_to_door' ? 'border-rose-500 bg-rose-500' : 'border-muted'} flex items-center justify-center`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full bg-white transition-opacity ${addressType === 'door_to_door' ? 'opacity-100' : 'opacity-0'}`} />
                                                </div>
                                            </label>
                                            <label className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all hover:bg-purple-50 ${addressType === 'pickup_mtaani' ? 'border-purple-500 bg-purple-50' : 'border-white/60 bg-white/20'} group`}>
                                                <input
                                                    type="radio"
                                                    name="addressType"
                                                    value="pickup_mtaani"
                                                    checked={addressType === 'pickup_mtaani'}
                                                    onChange={() => setAddressType("pickup_mtaani")}
                                                    className="sr-only"
                                                />
                                                <Store className={`w-5 h-5 ${addressType === 'pickup_mtaani' ? 'text-purple-600' : 'text-muted-foreground'} transition-colors`} />
                                                <span className={`text-[10px] font-black uppercase tracking-tight ${addressType === 'pickup_mtaani' ? 'text-purple-900' : 'text-muted-foreground'}`}>Pickup Agent</span>
                                                <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border-2 ${addressType === 'pickup_mtaani' ? 'border-purple-500 bg-purple-500' : 'border-muted'} flex items-center justify-center`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full bg-white transition-opacity ${addressType === 'pickup_mtaani' ? 'opacity-100' : 'opacity-0'}`} />
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Conditional Form Fields */}
                                    <div className="space-y-4">
                                        {addressType === 'door_to_door' ? (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Pin Your Area</Label>
                                                    <LocationPicker
                                                        onLocationSelect={(data) => {
                                                            setGeocodedData(data)
                                                        }}
                                                    />
                                                    <input type="hidden" name="location" value={geocodedData?.locationName || ""} />
                                                    <input type="hidden" name="locationName" value={geocodedData?.locationName || ""} />
                                                    <input type="hidden" name="latitude" value={geocodedData?.lat || ""} />
                                                    <input type="hidden" name="longitude" value={geocodedData?.lng || ""} />
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="estateName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Estate / Area Name</Label>
                                                        <Input
                                                            id="estateName"
                                                            name="estateName"
                                                            defaultValue={geocodedData?.estate || ""}
                                                            placeholder="e.g. Gardenia Apartments"
                                                            required
                                                            className="h-11 rounded-xl bg-white/40 border-white/60 focus:ring-rose-500"
                                                        />
                                                    </div>

                                                    <Accordion type="single" collapsible className="w-full">
                                                        <AccordionItem value="additional" className="border-none bg-white/40 rounded-2xl px-4 border border-white/60">
                                                            <AccordionTrigger className="hover:no-underline py-4">
                                                                <div className="flex items-center gap-3 text-left">
                                                                    <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                                                                        <Info className="h-4 w-4" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">More Details</p>
                                                                        <p className="text-xs font-bold leading-none text-gray-500">House, Landmark, Alt Phone (Optional)</p>
                                                                    </div>
                                                                </div>
                                                            </AccordionTrigger>
                                                            <AccordionContent className="pb-5 pt-1 space-y-4">
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="houseNumber" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">House / Room / Office</Label>
                                                                    <Input
                                                                        id="houseNumber"
                                                                        name="houseNumber"
                                                                        placeholder="e.g. House 4B, 2nd Floor"
                                                                        className="h-11 rounded-xl bg-white border-white focus:ring-rose-500"
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label htmlFor="landmark" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Nearby Landmark (Detailed)</Label>
                                                                    <Input
                                                                        id="landmark"
                                                                        name="landmark"
                                                                        placeholder="e.g. Near Shell Station or opposite Quickmart"
                                                                        className="h-11 rounded-xl bg-white border-white focus:ring-rose-500"
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Alternative Phone (Receiving Delivery)</Label>
                                                                    <div className="relative">
                                                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                        <Input
                                                                            id="phone"
                                                                            name="phone"
                                                                            type="tel"
                                                                            placeholder="07XX XXX XXX"
                                                                            className="h-11 pl-10 rounded-xl bg-white border-white shadow-sm focus:ring-rose-500"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    </Accordion>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Select Collection Point</Label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsAgentModalOpen(true)}
                                                        className={cn(
                                                            "w-full flex items-center justify-between bg-white/40 border-white/60 p-4 rounded-xl border-2 transition-all text-left",
                                                            selectedAgent ? "border-rose-500 bg-rose-50/30" : "hover:border-rose-400"
                                                        )}
                                                    >
                                                        {selectedAgent ? (
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                                                                    <Store className="h-5 w-5" />
                                                                </div>
                                                                <div className="truncate">
                                                                    <p className="font-bold text-sm truncate">{selectedAgent.name}</p>
                                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{selectedAgent.area}</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-3 text-muted-foreground">
                                                                <div className="w-10 h-10 rounded-xl bg-white/40 flex items-center justify-center shrink-0">
                                                                    <Search className="h-5 w-5" />
                                                                </div>
                                                                <span className="text-sm font-medium">Find Pickup Agent...</span>
                                                            </div>
                                                        )}
                                                        <ChevronRight className={cn("h-4 w-4 shrink-0 opacity-30 transition-transform", isAgentModalOpen && "rotate-90")} />
                                                    </button>

                                                    <AgentSelectionModal
                                                        isOpen={isAgentModalOpen}
                                                        onOpenChange={setIsAgentModalOpen}
                                                        locations={pickupLocations}
                                                        selectedLocation={selectedAgent}
                                                        onSelect={(loc) => {
                                                            setSelectedAgent(loc)
                                                            setIsAgentModalOpen(false)
                                                        }}
                                                    />

                                                    {selectedAgent && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Store className="w-4 h-4 text-rose-600" />
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-rose-900/40">Agent Instructions</p>
                                                            </div>
                                                            <p className="text-xs text-rose-800 font-medium leading-relaxed italic">
                                                                {sanitizeDescription(selectedAgent.description)}
                                                            </p>
                                                            <input type="hidden" name="pickupMtaaniId" value={selectedAgent.id} />
                                                            <input type="hidden" name="location" value={`${selectedAgent.area} - ${selectedAgent.name}`} />
                                                            <input type="hidden" name="locationName" value={selectedAgent.name} />
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    </div>

                                    <div className="flex items-center gap-3 px-1 pt-2">
                                        <input
                                            type="checkbox"
                                            id="isDefault"
                                            name="isDefault"
                                            className="w-5 h-5 rounded-md border-white/60 bg-white/40 text-rose-500 focus:ring-rose-500 cursor-pointer"
                                        />
                                        <Label htmlFor="isDefault" className="text-sm font-bold text-gray-600 cursor-pointer">
                                            Set as my primary delivery address
                                        </Label>
                                    </div>

                                    <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-gray-900 to-gray-700 text-white font-bold shadow-lg transition-all active:scale-95 group">
                                        ADD DELIVERY ADDRESS
                                        <Plus className="w-4 h-4 ml-2 group-hover:rotate-90 transition-transform" />
                                    </Button>
                                </form>
                            </div>

                            {/* Danger Zone */}
                            <div className="bg-red-50/50 backdrop-blur-sm border border-red-100 rounded-3xl p-6 sm:p-8 mt-12 flex flex-col sm:flex-row items-center gap-6">
                                <div className="p-4 bg-red-100 rounded-2xl flex-shrink-0">
                                    <AlertCircle className="w-8 h-8 text-red-600" />
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <h3 className="text-lg font-black text-red-900 mb-1 uppercase tracking-tight">Danger Zone</h3>
                                    <p className="text-sm text-red-800/80 font-medium">
                                        Deleting your account is permanent and cannot be undone. All your orders and data will be erased.
                                    </p>
                                </div>
                                <div className="w-full sm:w-auto">
                                    {deleteConfirm ? (
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                variant="destructive"
                                                onClick={handleDeleteAccount}
                                                disabled={loading}
                                                className="rounded-xl font-bold h-12 px-6 animate-pulse"
                                            >
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "YES, DELETE PERMANENTLY"}
                                            </Button>
                                            <Button variant="outline" onClick={() => setDeleteConfirm(false)} className="rounded-xl font-bold border-red-200">
                                                Cancel
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="destructive"
                                            onClick={() => setDeleteConfirm(true)}
                                            className="w-full sm:w-auto h-12 rounded-xl font-bold px-8 shadow-lg shadow-red-100 transition-all active:scale-95"
                                        >
                                            DELETE ACCOUNT
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    )
}
